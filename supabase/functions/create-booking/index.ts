// @ts-nocheck — Deno Edge Function, not processed by local TS
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BookingRequest {
  service_id: string
  date: string
  time_slot: string
  client_name: string
  client_email: string
  client_phone: string
  notes?: string
}

// Validation functions
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

function isValidDate(str: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(str)) return false
  const date = new Date(str)
  return !Number.isNaN(date.getTime())
}

function isValidTimeSlot(str: string): boolean {
  const timeRegex = /^\d{2}:\d{2}$/
  return timeRegex.test(str)
}

function isValidEmail(str: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(str) && str.length <= 255
}

function isValidPhone(str: string): boolean {
  // Allow various phone formats: +421..., 0905..., etc.
  const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/
  return phoneRegex.test(str.trim())
}

function sanitizeString(str: string, maxLength: number): string {
  return str.replaceAll(/[\r\n]/g, ' ').trim().slice(0, maxLength)
}

function getClientIP(req: Request): string | null {
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const realIP = req.headers.get('x-real-ip')?.trim()
  const cfIP = req.headers.get('cf-connecting-ip')?.trim()

  return forwarded || realIP || cfIP || null
}

async function sha256(input: string): Promise<string> {
  const encoded = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

async function buildRateLimitIdentifier(
  req: Request,
  clientUserId: string | null,
  body: Partial<BookingRequest>
): Promise<string> {
  if (clientUserId) {
    return `user:${clientUserId}`
  }

  const normalizedEmail = typeof body.client_email === 'string'
    ? body.client_email.trim().toLowerCase()
    : ''
  const normalizedPhone = typeof body.client_phone === 'string'
    ? body.client_phone.replaceAll(/\D/g, '')
    : ''
  const clientIP = getClientIP(req)

  if (normalizedEmail || normalizedPhone) {
    const fingerprint = await sha256(`${normalizedEmail}|${normalizedPhone}`)
    return clientIP
      ? `guest:${clientIP}:${fingerprint.slice(0, 24)}`
      : `guest:${fingerprint.slice(0, 24)}`
  }

  if (clientIP) {
    return `ip:${clientIP}`
  }

  const userAgent = req.headers.get('user-agent') || 'unknown'
  return `anonymous:${(await sha256(userAgent)).slice(0, 24)}`
}

// Rate limiting helper
async function checkRateLimit(
  supabase: ReturnType<typeof createClient>,
  identifier: string,
  endpoint: string,
  maxRequests: number,
  windowMinutes: number
): Promise<{ allowed: boolean; remaining: number }> {
  // Cleanup old entries periodically (1 in 10 chance)
  if (Math.random() < 0.1) {
    await supabase.rpc('cleanup_rate_limits').catch(() => { })
  }

  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString()

  const { count } = await supabase
    .from('rate_limits')
    .select('*', { count: 'exact', head: true })
    .eq('identifier', identifier)
    .eq('endpoint', endpoint)
    .gte('created_at', windowStart)

  const currentCount = count || 0

  if (currentCount >= maxRequests) {
    return { allowed: false, remaining: 0 }
  }

  // Record this request
  await supabase.from('rate_limits').insert({ identifier, endpoint })

  return { allowed: true, remaining: maxRequests - currentCount - 1 }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Try to extract logged-in user from auth header
    let clientUserId: string | null = null
    const authHeader = req.headers.get('authorization')
    if (authHeader) {
      try {
        const userClient = createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { Authorization: authHeader } }
        })
        const { data: { user } } = await userClient.auth.getUser()
        if (user) {
          clientUserId = user.id
          console.log('Booking by authenticated user:', clientUserId)
        }
      } catch {
        // Not authenticated, continue as guest
      }
    }

    let body: BookingRequest
    try {
      body = await req.json()
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Rate limit authenticated users by user id, otherwise by a hashed booking fingerprint with IP fallback.
    const rateLimitIdentifier = await buildRateLimitIdentifier(req, clientUserId, body)
    const rateCheck = await checkRateLimit(supabase, rateLimitIdentifier, 'create-booking', 10, 15)
    if (!rateCheck.allowed) {
      return new Response(
        JSON.stringify({ error: 'Too many requests, please try again later' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' } }
      )
    }

    console.log('Received booking request:', { ...body, client_email: '***', client_phone: '***' })

    // Validate all required fields
    const errors: string[] = []

    if (!body.service_id || !isValidUUID(body.service_id)) {
      errors.push('Invalid service_id')
    }

    if (!body.date || !isValidDate(body.date)) {
      errors.push('Invalid date format (expected YYYY-MM-DD)')
    } else {
      // Check date+time is at least 36h in the future
      const bookingDate = new Date(body.date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (bookingDate <= today) {
        errors.push('Booking date must be in the future')
      }

      // 36h lead time validation
      if (body.time_slot && isValidTimeSlot(body.time_slot)) {
        const [slotH, slotM] = body.time_slot.split(':').map(Number)
        const bookingDateTime = new Date(body.date)
        bookingDateTime.setHours(slotH, slotM, 0, 0)
        const minBookableTime = new Date(Date.now() + 36 * 60 * 60 * 1000)
        if (bookingDateTime < minBookableTime) {
          errors.push('Booking must be at least 36 hours in advance. For earlier appointments, call us for an Express booking.')
        }
      }
    }

    if (!body.time_slot || !isValidTimeSlot(body.time_slot)) {
      errors.push('Invalid time_slot format (expected HH:MM)')
    }

    if (!body.client_name || body.client_name.trim().length < 2) {
      errors.push('Client name must be at least 2 characters')
    }

    if (!body.client_email || !isValidEmail(body.client_email)) {
      errors.push('Invalid email address')
    }

    if (!body.client_phone || !isValidPhone(body.client_phone)) {
      errors.push('Invalid phone number')
    }

    if (errors.length > 0) {
      console.log('Validation errors:', errors)
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: errors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify service exists and is active
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('id, is_active, name_sk, name_en, duration')
      .eq('id', body.service_id)
      .maybeSingle()

    if (serviceError || !service) {
      console.log('Service not found:', body.service_id)
      return new Response(
        JSON.stringify({ error: 'Service not found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!service.is_active) {
      return new Response(
        JSON.stringify({ error: 'Service is not available' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calculate booking duration (round up to nearest 30 min)
    const bookingDuration = Math.ceil(service.duration / 30) * 30

    // Check if date is not blocked
    const { data: blockedDate } = await supabase
      .from('blocked_dates')
      .select('id')
      .eq('date', body.date)
      .maybeSingle()

    if (blockedDate) {
      return new Response(
        JSON.stringify({ error: 'Selected date is not available' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get active employee count for capacity check
    const { data: activeEmps } = await supabase
      .from('employees')
      .select('id')
      .eq('is_active', true)

    const totalCapacity = Math.max(activeEmps?.length || 1, 1)

    // Get all bookings for this date to check slot occupancy
    const { data: dateBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('time_slot, booking_duration')
      .eq('date', body.date)
      .neq('status', 'cancelled')

    if (bookingsError) {
      console.error('Error checking slot capacity:', bookingsError)
      return new Response(
        JSON.stringify({ error: 'Failed to check slot availability' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check all required consecutive slots
    const [slotH, slotM] = body.time_slot.split(':').map(Number)
    const slotStartMin = slotH * 60 + slotM
    const requiredSlots = bookingDuration / 30

    for (let i = 0; i < requiredSlots; i++) {
      const checkMin = slotStartMin + i * 30
      let occupiedCount = 0
      for (const b of (dateBookings || [])) {
        const [bH, bM] = b.time_slot.split(':').map(Number)
        const bStart = bH * 60 + bM
        const bEnd = bStart + (b.booking_duration || 30)
        if (checkMin >= bStart && checkMin < bEnd) {
          occupiedCount++
        }
      }
      if (occupiedCount >= totalCapacity) {
        const checkTimeStr = `${String(Math.floor(checkMin / 60)).padStart(2, '0')}:${String(checkMin % 60).padStart(2, '0')}`
        console.log('Slot occupied:', checkTimeStr, `${occupiedCount}/${totalCapacity}`)
        return new Response(
          JSON.stringify({ error: 'This time slot is fully booked' }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Auto-assign an available employee (round-robin by least bookings on that date)
    let assignedEmployeeId: string | null = null
    const { data: activeEmployees } = await supabase
      .from('employees')
      .select('id')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (activeEmployees && activeEmployees.length > 0) {
      // Find employee with fewest bookings on this date
      const { data: dateCounts } = await supabase
        .from('bookings')
        .select('employee_id')
        .eq('date', body.date)
        .neq('status', 'cancelled')
        .not('employee_id', 'is', null)

      const countMap: Record<string, number> = {}
      for (const emp of activeEmployees) {
        countMap[emp.id] = 0
      }
      if (dateCounts) {
        for (const b of dateCounts) {
          if (b.employee_id && countMap[b.employee_id] !== undefined) {
            countMap[b.employee_id]++
          }
        }
      }
      // Pick employee with least bookings
      assignedEmployeeId = activeEmployees.reduce((best, emp) =>
        (countMap[emp.id] ?? 0) < (countMap[best.id] ?? 0) ? emp : best
      ).id
      console.log('Auto-assigned employee:', assignedEmployeeId)
    }

    // Create the booking with sanitized data
    const bookingData = {
      service_id: body.service_id,
      date: body.date,
      time_slot: body.time_slot,
      client_name: sanitizeString(body.client_name, 100),
      client_email: sanitizeString(body.client_email.toLowerCase(), 255),
      client_phone: sanitizeString(body.client_phone, 20),
      notes: body.notes ? sanitizeString(body.notes, 1000) : null,
      status: 'confirmed',
      employee_id: assignedEmployeeId,
      booking_duration: bookingDuration,
      client_user_id: clientUserId,
    }

    const { data: booking, error: insertError } = await supabase
      .from('bookings')
      .insert(bookingData)
      .select('id, date, time_slot, status, cancellation_token')
      .single()

    if (insertError) {
      console.error('Failed to create booking:', insertError)
      return new Response(
        JSON.stringify({ error: 'Failed to create booking' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Booking created successfully:', booking.id)

    // Send confirmation email to client (fire-and-forget, non-blocking)
    const emailPromise = fetch(`${supabaseUrl}/functions/v1/send-booking-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        to: bookingData.client_email,
        clientName: bookingData.client_name,
        serviceName: service.name_sk,
        date: bookingData.date,
        time: bookingData.time_slot,
        cancellationToken: booking.cancellation_token,
        language: 'sk',
      }),
    }).then(res => {
      if (!res.ok) console.error('Failed to send confirmation email')
      else console.log('Confirmation email sent successfully')
    }).catch(err => console.error('Error sending confirmation email:', err))

    // Send admin notification email (fire-and-forget)
    const adminEmail = 'booking@fyzioafit.sk'
    const adminEmailPromise = fetch(`${supabaseUrl}/functions/v1/send-booking-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        to: adminEmail,
        clientName: 'Admin',
        serviceName: service.name_sk,
        date: bookingData.date,
        time: bookingData.time_slot,
        cancellationToken: booking.cancellation_token,
        language: 'sk',
        template: 'admin-notification',
        adminData: {
          clientName: bookingData.client_name,
          clientEmail: bookingData.client_email,
          clientPhone: bookingData.client_phone,
          notes: bookingData.notes,
        },
      }),
    }).then(res => {
      if (!res.ok) console.error('Failed to send admin notification email')
      else console.log('Admin notification email sent successfully')
    }).catch(err => console.error('Error sending admin notification email:', err))

    // Send push notification to client if authenticated (fire-and-forget)
    let pushPromise = Promise.resolve()
    if (clientUserId) {
      pushPromise = fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          user_id: clientUserId,
          payload: {
            title: 'Rezervácia potvrdená',
            body: `${service.name_sk} — ${bookingData.date} o ${bookingData.time_slot}`,
            url: '/portal',
          },
        }),
      }).then(res => {
        if (!res.ok) console.error('Failed to send booking confirmation push')
        else console.log('Booking confirmation push sent')
      }).catch(err => console.error('Error sending booking confirmation push:', err))
    }

    // Use waitUntil if available (Deno Deploy), otherwise just let it run
    if (typeof (globalThis as any).EdgeRuntime?.waitUntil === 'function') {
      (globalThis as any).EdgeRuntime.waitUntil(Promise.all([emailPromise, adminEmailPromise, pushPromise]))
    }

    return new Response(
      JSON.stringify({ success: true, booking }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
