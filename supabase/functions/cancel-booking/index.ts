// Improved type safety for Deno Edge Runtime
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

type EdgeRequest = Request;

// @ts-expect-error: Deno module imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0'
// @ts-expect-error: Deno module imports
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

interface CancelRequest {
  token: string
}

function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

serve(async (req: EdgeRequest) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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

    // Call the atomic secure cancellation RPC
    const { data: results, error: rpcError } = await supabase.rpc('cancel_secure_booking', {
      p_cancellation_token: body.token
    })

    if (rpcError) {
      console.error('RPC Error:', rpcError)
      if (rpcError.message?.includes('INVALID_CANCELLATION_TOKEN')) {
        return new Response(
          JSON.stringify({ error: 'Booking not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      return new Response(
        JSON.stringify({ error: 'Failed to cancel booking', details: rpcError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const booking = results?.[0]
    if (!booking) {
      return new Response(
        JSON.stringify({ error: 'Unexpected empty response from database' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Handle business logic rejections (persisted in logs)
    if (booking.error_code === 'TOO_LATE_TO_CANCEL') {
      return new Response(
        JSON.stringify({ 
          error: 'TOO_LATE_TO_CANCEL', 
          message: 'Menej ako 10 hodín pred termínom je zrušenie možné len telefonicky: +421 905 307 198, pričom bude účtovaný storno poplatok 10 €.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (booking.was_already_cancelled) {
      console.log('Booking was already cancelled. Skipping notifications:', booking.booking_id)
      return new Response(
        JSON.stringify({ success: true, booking, already_processed: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Booking cancelled successfully via RPC:', booking.booking_id)

    // Send cancellation admin email notification (fire-and-forget)
    const adminEmailPromise = fetch(`${supabaseUrl}/functions/v1/send-booking-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        to: 'booking@fyzioafit.sk',
        clientName: booking.client_name,
        serviceName: booking.service_name_sk || 'Služba',
        serviceDescription: booking.service_description_sk || undefined,
        date: booking.date,
        time: booking.time_slot,
        cancellationToken: '',
        language: 'sk',
        template: 'cancellation-admin',
        adminData: {
          clientName: booking.client_name,
          clientEmail: booking.client_email,
          clientPhone: booking.client_phone || '',
          notes: booking.notes,
        },
      }),
    }).then(res => {
      if (!res.ok) console.error('Failed to send cancellation admin email')
    }).catch(err => console.error('Error sending cancellation admin email:', err))

    // Send cancellation confirmation to client (fire-and-forget)
    const clientEmailPromise = fetch(`${supabaseUrl}/functions/v1/send-booking-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        to: booking.client_email,
        clientName: booking.client_name,
        serviceName: booking.service_name_sk || 'Služba',
        serviceDescription: booking.service_description_sk || undefined,
        date: booking.date,
        time: booking.time_slot,
        cancellationToken: '',
        language: booking.language || 'sk',
        template: 'cancellation-client',
      }),
    }).then(res => {
      if (!res.ok) console.error('Failed to send cancellation client email')
    }).catch(err => console.error('Error sending cancellation client email:', err))

    // Send push notification about cancellation (fire-and-forget)
    let pushPromise = Promise.resolve()
    if (booking.client_user_id) {
      pushPromise = fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          user_id: booking.client_user_id,
          payload: {
            title: 'Rezervácia zrušená',
            body: `${booking.service_name_sk || 'Služba'} — ${booking.date} o ${booking.time_slot}`,
            url: '/portal',
          },
        }),
      }).then(res => {
        if (!res.ok) console.error('Failed to send cancellation push')
      }).catch(err => console.error('Error sending cancellation push:', err))
    }

    // Use waitUntil if available (Deno Deploy), otherwise just let it run
    const runtime = (globalThis as unknown as { EdgeRuntime?: { waitUntil: (p: Promise<unknown>) => void } }).EdgeRuntime
    if (typeof runtime?.waitUntil === 'function') {
      runtime.waitUntil(Promise.all([adminEmailPromise, clientEmailPromise, pushPromise]))
    }

    return new Response(
      JSON.stringify({
        success: true,
        booking: {
          ...booking,
          status: 'cancelled',
          service_name_sk: booking.service_name_sk,
          service_name_en: booking.service_name_en
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
