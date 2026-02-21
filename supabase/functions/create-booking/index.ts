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
  return !isNaN(date.getTime())
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
  const phoneRegex = /^[\+]?[0-9\s\-\(\)]{7,20}$/
  return phoneRegex.test(str.trim())
}

function sanitizeString(str: string, maxLength: number): string {
  return str.trim().slice(0, maxLength)
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const body: BookingRequest = await req.json()
    console.log('Received booking request:', { ...body, client_email: '***', client_phone: '***' })

    // Validate all required fields
    const errors: string[] = []

    if (!body.service_id || !isValidUUID(body.service_id)) {
      errors.push('Invalid service_id')
    }

    if (!body.date || !isValidDate(body.date)) {
      errors.push('Invalid date format (expected YYYY-MM-DD)')
    } else {
      // Check date is in the future
      const bookingDate = new Date(body.date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (bookingDate <= today) {
        errors.push('Booking date must be in the future')
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
      .select('id, is_active, name_sk, name_en')
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

    // Count existing bookings for this slot
    const { data: slotBookings, error: slotError } = await supabase
      .from('bookings')
      .select('id')
      .eq('date', body.date)
      .eq('time_slot', body.time_slot)
      .neq('status', 'cancelled')

    if (slotError) {
      console.error('Error checking slot capacity:', slotError)
      return new Response(
        JSON.stringify({ error: 'Failed to check slot availability' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get active employee count for capacity check
    const { data: activeEmps } = await supabase
      .from('employees')
      .select('id')
      .eq('is_active', true)

    const totalCapacity = Math.max(activeEmps?.length || 1, 1)
    const currentBookings = slotBookings?.length || 0

    if (currentBookings >= totalCapacity) {
      console.log('Time slot at full capacity:', body.date, body.time_slot, `${currentBookings}/${totalCapacity}`)
      return new Response(
        JSON.stringify({ error: 'This time slot is fully booked' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
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
      status: 'pending',
      employee_id: assignedEmployeeId
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

    // Send confirmation email (non-blocking)
    try {
      const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-booking-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          to: bookingData.client_email,
          clientName: bookingData.client_name,
          serviceName: service.name_sk, // Default to Slovak
          date: bookingData.date,
          time: bookingData.time_slot,
          cancellationToken: booking.cancellation_token,
          language: 'sk',
        }),
      })
      
      if (!emailResponse.ok) {
        console.error('Failed to send confirmation email:', await emailResponse.text())
      } else {
        console.log('Confirmation email sent successfully')
      }
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError)
      // Don't fail the booking if email fails
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