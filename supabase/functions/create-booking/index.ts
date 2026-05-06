// Improved type safety for Deno Edge Runtime
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

type EdgeRequest = Request;
// @ts-expect-error: Deno module imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
// @ts-expect-error: Deno module imports
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-expect-error: Deno module imports
import { DateTime } from 'https://esm.sh/luxon@3.4.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

interface BookingRequest {
  service_id: string
  date: string
  time_slot: string
  client_name: string
  client_email: string
  client_phone: string
  notes?: string
  client_request_id?: string
  employee_id?: string
}

interface WorkingHoursConfigRow {
  id?: string
  start_time: string
  end_time: string
  is_active: boolean
  updated_at?: string
}

function selectLatestWorkingHoursConfig(configs: WorkingHoursConfigRow[]): WorkingHoursConfigRow | null {
  if (configs.length === 0) return null

  const sorted = [...configs].sort((a, b) => {
    const updatedAtCompare = (b.updated_at || '').localeCompare(a.updated_at || '')
    if (updatedAtCompare !== 0) return updatedAtCompare
    return (b.id || '').localeCompare(a.id || '')
  })

  return sorted[0] ?? null
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

serve(async (req: EdgeRequest) => {
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

    // Input validation (Simple sanity checks, core logic is in DB)
    const errors: string[] = []

    if (!body.service_id || !isValidUUID(body.service_id)) {
      errors.push('Invalid service_id')
    }

    if (!body.date || !isValidDate(body.date)) {
      errors.push('Invalid date format (expected YYYY-MM-DD)')
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

    // Business Rules: 36h Lead Time + Dynamic Operating Hours (from time_slots_config)
    try {
      const [hours, minutes] = body.time_slot.split(':').map(Number);
      const [year, month, day] = body.date.split('-').map(Number);

      // Parse the requested date/time in the Bratislava zone
      const targetDateTime = DateTime.fromObject({
        year, month, day, hour: hours, minute: minutes, second: 0, millisecond: 0
      }, { zone: 'Europe/Bratislava' });

      if (!targetDateTime.isValid) {
        return new Response(
          JSON.stringify({ error: 'Invalid date or time format' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const now = DateTime.now().setZone('Europe/Bratislava');

      // Rule: 36h Minimum Lead Time
      if (targetDateTime < now.plus({ hours: 36 })) {
        return new Response(
          JSON.stringify({ error: 'BUSINESS_RULE_VIOLATION: Advance booking required (min 36h)' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Fetch service — must exist; no silent duration fallback
      const { data: serviceRes, error: serviceError } = await supabase
        .from('services')
        .select('duration, is_active')
        .eq('id', body.service_id)
        .single()

      if (serviceError || !serviceRes) {
        return new Response(
          JSON.stringify({ error: 'Service not found' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!serviceRes.is_active) {
        return new Response(
          JSON.stringify({ error: 'Service is not available' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const duration = serviceRes.duration;
      const endDateTime = targetDateTime.plus({ minutes: duration });

      // Fetch dynamic operating hours from time_slots_config.
      // Luxon weekday: 1=Mon..7=Sun; PostgreSQL DOW: 0=Sun..6=Sat → convert via % 7
      const dayOfWeek = targetDateTime.weekday % 7;

      const { data: configRows, error: configError } = await supabase
        .from('time_slots_config')
        .select('id, start_time, end_time, is_active, updated_at')
        .eq('day_of_week', dayOfWeek)
      const configRes = selectLatestWorkingHoursConfig(configRows || [])

      if ((configRows?.length || 0) > 1) {
        console.warn('Multiple time_slots_config rows found for day_of_week:', dayOfWeek, 'selected config id:', configRes?.id ?? 'unknown')
      }

      if (configError || !configRes) {
        return new Response(
          JSON.stringify({ error: 'BUSINESS_RULE_VIOLATION: No working hours configuration found for this day' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!configRes.is_active) {
        return new Response(
          JSON.stringify({ error: 'BUSINESS_RULE_VIOLATION: The clinic is closed on this day' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Parse configured start/end (stored as "HH:MM:SS" TIME by Supabase)
      const [confStartH, confStartM] = configRes.start_time.split(':').map(Number);
      const [confEndH, confEndM] = configRes.end_time.split(':').map(Number);
      const configStart = DateTime.fromObject(
        { year, month, day, hour: confStartH, minute: confStartM, second: 0 },
        { zone: 'Europe/Bratislava' }
      )
      const configEnd = DateTime.fromObject(
        { year, month, day, hour: confEndH, minute: confEndM, second: 0 },
        { zone: 'Europe/Bratislava' }
      )

      // Rule: Start time must be within opening hours
      if (targetDateTime < configStart) {
        return new Response(
          JSON.stringify({ error: `BUSINESS_RULE_VIOLATION: Booking before opening hours (${configRes.start_time.slice(0, 5)}) is not allowed` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Rule: End time (start + service duration) must not exceed closing time
      if (endDateTime > configEnd) {
        return new Response(
          JSON.stringify({ error: `BUSINESS_RULE_VIOLATION: Booking must end by ${configRes.end_time.slice(0, 5)}. Your session ends at ${endDateTime.toFormat('HH:mm')}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    } catch (e) {
      console.error('Error validating business rules:', e);
      return new Response(
        JSON.stringify({ error: 'Business rule validation failed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    interface Booking {
      id: string;
      client_name: string;
      client_email: string;
      service_title_sk: string;
      service_title_en: string;
      date: string;
      time_slot: string;
      staff_id: string;
      cancellation_token?: string;
      [key: string]: unknown;
    }

    interface SecureBookingResponse {
      success: boolean;
      error?: string;
      message?: string;
      booking?: Booking;
      idempotent?: boolean;
    }

    // Call the atomic secure booking RPC
    const { data: rpcResult, error: rpcError } = await (supabase.rpc as (name: string, args: Record<string, unknown>) => Promise<{ data: SecureBookingResponse; error: { message: string } | null }>)('create_secure_booking', {
      p_service_id: body.service_id,
      p_date: body.date,
      p_time_slot: body.time_slot,
      p_client_name: sanitizeString(body.client_name, 100),
      p_client_email: sanitizeString(body.client_email.toLowerCase(), 255),
      p_client_phone: sanitizeString(body.client_phone, 20),
      p_notes: body.notes ? sanitizeString(body.notes, 1000) : null,
      p_client_user_id: (clientUserId && isValidUUID(clientUserId)) ? clientUserId : null,
      p_client_request_id: (body.client_request_id && isValidUUID(body.client_request_id)) ? body.client_request_id : null,
      p_employee_id: (body.employee_id && isValidUUID(body.employee_id)) ? body.employee_id : null
    })

    if (rpcError || !rpcResult?.success) {
      console.error('RPC Error/Failure:', rpcError || rpcResult?.error)
      const errorMsg = rpcResult?.error || rpcError?.message || 'Failed to create booking'
      
      // Handle business logic rejections (lead time, capacity, etc) from DB
      let status = 500
      if (errorMsg.includes('Advance') || errorMsg.includes('future') || errorMsg.includes('booked') || errorMsg.includes('available')) {
        status = 400
      }

      return new Response(
        JSON.stringify({ error: errorMsg }),
        { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { booking, idempotent } = rpcResult
    if (idempotent && booking) {
      console.log('Idempotent request detected. Returning existing booking:', booking.id)
      return new Response(
        JSON.stringify({ success: true, booking, queued: false }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!booking) {
      return new Response(
        JSON.stringify({ error: 'Booking data missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Booking created successfully via RPC:', booking.id)

    // Fetch service info for the email
    const { data: serviceData } = await supabase
      .from('services')
      .select('name_sk, duration, description_sk')
      .eq('id', body.service_id)
      .single()

    const serviceName = serviceData?.name_sk || 'Fyzioterapia'
    const serviceDuration = serviceData?.duration || 60
    const serviceDescription = serviceData?.description_sk || undefined

    // Send confirmation email to client (fire-and-forget, non-blocking)
    const emailPromise = fetch(`${supabaseUrl}/functions/v1/send-booking-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        to: body.client_email,
        clientName: body.client_name,
        serviceName: `${serviceName} (${serviceDuration} min)`,
        serviceDescription,
        date: body.date,
        time: body.time_slot,
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
        serviceName: `${serviceName} (${serviceDuration} min)`,
        serviceDescription,
        date: body.date,
        time: body.time_slot,
        cancellationToken: booking.cancellation_token,
        language: 'sk',
        template: 'admin-notification',
        adminData: {
          clientName: body.client_name,
          clientEmail: body.client_email,
          clientPhone: body.client_phone,
          notes: body.notes,
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
            body: `${body.date} o ${body.time_slot}`,
            url: '/portal',
          },
        }),
      }).then(res => {
        if (!res.ok) console.error('Failed to send booking confirmation push')
        else console.log('Booking confirmation push sent')
      }).catch(err => console.error('Error sending booking confirmation push:', err))
    }

    // Use waitUntil if available (Deno Deploy), otherwise just let it run
    const runtime = (globalThis as unknown as { EdgeRuntime?: { waitUntil: (p: Promise<unknown>) => void } }).EdgeRuntime
    if (typeof runtime?.waitUntil === 'function') {
      runtime.waitUntil(Promise.all([emailPromise, adminEmailPromise, pushPromise]))
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
