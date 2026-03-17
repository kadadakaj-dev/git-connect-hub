// @ts-nocheck — Deno Edge Function, not processed by local TS
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CancelRequest {
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

    // Rate limit: 20 cancel attempts per IP per 15 minutes
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const windowStart = new Date(Date.now() - 15 * 60 * 1000).toISOString()
    const { count } = await supabase
      .from('rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('identifier', clientIP)
      .eq('endpoint', 'cancel-booking')
      .gte('created_at', windowStart)
    if ((count || 0) >= 20) {
      return new Response(
        JSON.stringify({ error: 'Too many requests, please try again later' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' } }
      )
    }
    await supabase.from('rate_limits').insert({ identifier: clientIP, endpoint: 'cancel-booking' })

    const body: CancelRequest = await req.json()
    console.log('Received cancellation request for token:', body.token?.substring(0, 8) + '...')

    // Validate token
    if (!body.token || !isValidUUID(body.token)) {
      return new Response(
        JSON.stringify({ error: 'Invalid cancellation token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Find booking by cancellation token
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('id, status, date, time_slot, client_name, client_email, client_user_id, service_id')
      .eq('cancellation_token', body.token)
      .maybeSingle()

    if (fetchError) {
      console.error('Error fetching booking:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Failed to find booking' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!booking) {
      return new Response(
        JSON.stringify({ error: 'Booking not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if already cancelled
    if (booking.status === 'cancelled') {
      return new Response(
        JSON.stringify({ error: 'Booking is already cancelled', booking }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if booking is within 12 hours
    const [hours, minutes] = booking.time_slot.split(':').map(Number)
    const bookingDateTime = new Date(booking.date)
    bookingDateTime.setHours(hours, minutes, 0, 0)
    const now = new Date()
    const hoursUntilBooking = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)

    if (hoursUntilBooking < 0) {
      return new Response(
        JSON.stringify({ error: 'Cannot cancel past bookings' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (hoursUntilBooking < 12) {
      return new Response(
        JSON.stringify({ error: 'TOO_LATE_TO_CANCEL', message: 'Rezerváciu je možné zrušiť online len do 12 hodín pred termínom. Kontaktujte nás telefonicky: +421 905 307 198' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get service info for response
    const { data: service } = await supabase
      .from('services')
      .select('name_sk, name_en')
      .eq('id', booking.service_id)
      .single()

    // Update booking status to cancelled
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', booking.id)

    if (updateError) {
      console.error('Error cancelling booking:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to cancel booking' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Booking cancelled successfully:', booking.id)

    // Send push notification about cancellation (fire-and-forget)
    if (booking.client_user_id) {
      fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          user_id: booking.client_user_id,
          payload: {
            title: 'Rezervácia zrušená',
            body: `${service?.name_sk || 'Služba'} — ${booking.date} o ${booking.time_slot}`,
            url: '/portal',
          },
        }),
      }).catch(err => console.error('Error sending cancellation push:', err))
    }

    return new Response(
      JSON.stringify({
        success: true,
        booking: {
          ...booking,
          status: 'cancelled',
          service_name_sk: service?.name_sk,
          service_name_en: service?.name_en
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
