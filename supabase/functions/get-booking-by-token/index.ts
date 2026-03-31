// @ts-nocheck — Deno Edge Function, not processed by local TS
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

interface TokenRequest {
  token: string
}

function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
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

    // Rate limit: 30 token lookups per IP per 15 minutes
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const windowStart = new Date(Date.now() - 15 * 60 * 1000).toISOString()
    const { count } = await supabase
      .from('rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('identifier', clientIP)
      .eq('endpoint', 'get-booking-by-token')
      .gte('created_at', windowStart)
    if ((count || 0) >= 30) {
      return new Response(
        JSON.stringify({ success: false, error: 'Too many requests, please try again later' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' } }
      )
    }
    await supabase.from('rate_limits').insert({ identifier: clientIP, endpoint: 'get-booking-by-token' })

    const body: TokenRequest = await req.json()
    console.log('Looking up booking by token:', body.token?.substring(0, 8) + '...')

    // Validate token
    if (!body.token || !isValidUUID(body.token)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Find booking by cancellation token
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('id, status, date, time_slot, client_name, client_email, service_id')
      .eq('cancellation_token', body.token)
      .maybeSingle()

    if (fetchError) {
      console.error('Error fetching booking:', fetchError)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to find booking' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!booking) {
      return new Response(
        JSON.stringify({ success: false, error: 'Booking not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get service info
    const { data: service } = await supabase
      .from('services')
      .select('name_sk, name_en')
      .eq('id', booking.service_id)
      .single()

    // Check if already cancelled
    if (booking.status === 'cancelled') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Booking is already cancelled',
          booking: {
            ...booking,
            service_name_sk: service?.name_sk,
            service_name_en: service?.name_en
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if within 10 hours of appointment (or past)
    const [slotHours, slotMinutes] = booking.time_slot.split(':').map(Number)
    const bookingDateTime = new Date(booking.date)
    bookingDateTime.setHours(slotHours, slotMinutes, 0, 0)

    const now = new Date()
    const tenHoursBefore = new Date(bookingDateTime.getTime() - 10 * 60 * 60 * 1000)

    if (now >= tenHoursBefore) {
      return new Response(
        JSON.stringify({ success: false, error: 'TOO_LATE_TO_CANCEL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Booking found:', booking.id)

    return new Response(
      JSON.stringify({
        success: true,
        booking: {
          ...booking,
          service_name_sk: service?.name_sk,
          service_name_en: service?.name_en
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
