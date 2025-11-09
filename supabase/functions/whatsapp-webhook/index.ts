import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Get API key from query parameter or header for Twilio webhook
  const url = new URL(req.url)
  const apikey = url.searchParams.get('apikey') || req.headers.get('apikey')
  
  // Verify webhook token challenge (for Twilio verification)
  if (req.method === 'GET') {
    const hubChallenge = url.searchParams.get('hub.challenge')
    if (hubChallenge) {
      console.log('Webhook verification token received')
      return new Response(hubChallenge)
    }
  }

  if (req.method === 'POST') {
    try {
      // Twilio sends form-encoded data, not JSON
      const formData = await req.formData()
      const body: any = {}
      for (const [key, value] of formData.entries()) {
        body[key] = value
      }
      
      console.log('Webhook received:', JSON.stringify(body, null, 2))

      // Parse Twilio WhatsApp webhook data
      const from = body.From?.replace('whatsapp:', '') // Remove 'whatsapp:' prefix
      const messageText = body.Body?.toLowerCase() || ''
      const messageSid = body.MessageSid

      if (from && messageText) {
        const messages = [{ from, text: { body: messageText }, timestamp: Date.now() / 1000 }]
        const supabaseClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        for (const message of messages) {
          const msgFrom = message.from // Phone number in format 44xxxxxxxxxx
          const msgText = message?.text?.body?.toLowerCase() || ''
          const timestamp = message.timestamp

          console.log(`Message from ${msgFrom}: "${msgText}"`)

          // Parse availability status from message content
          let status = null
          if (msgText.includes('yes') || msgText.includes('available') || msgText.includes('going')) {
            status = 'Available'
          } else if (msgText.includes('no') || msgText.includes('not available') || msgText.includes('cannot')) {
            status = 'Not Available'
          } else if (msgText.includes('maybe') || msgText.includes('unsure') || msgText.includes('might')) {
            status = 'Maybe'
          }

          if (status) {
            try {
              // Format phone number for database lookup (add + if not present)
              const formattedPhone = msgFrom.startsWith('+') ? msgFrom : `+${msgFrom}`
              
              console.log(`Looking for player with phone: ${formattedPhone}`)

              // Find player by phone number
              const { data: player, error: playerError } = await supabaseClient
                .from('players')
                .select('id, full_name')
                .eq('phone', formattedPhone)
                .maybeSingle()

              if (player) {
                console.log(`Found player: ${player.full_name} (${player.id})`)

                // Find latest upcoming fixture (or most recent one)
                const { data: fixtures, error: fixtureError } = await supabaseClient
                  .from('fixtures')
                  .select('id, opponent, date')
                  .gt('date', new Date().toISOString())
                  .order('date', { ascending: true })
                  .limit(1)

                if (fixtures && fixtures.length > 0) {
                  const fixture = fixtures[0]
                  console.log(`Using fixture: ${fixture.opponent} on ${fixture.date}`)

                  // Update or insert availability
                  const { error: upsertError } = await supabaseClient
                    .from('availability')
                    .upsert({
                      fixture_id: fixture.id,
                      player_id: player.id,
                      status,
                      responded_on: new Date(timestamp * 1000).toISOString()
                    }, { 
                      onConflict: 'fixture_id,player_id',
                      ignoreDuplicates: false 
                    })

                  if (upsertError) {
                    console.error(`Failed to update availability: ${upsertError.message}`)
                  } else {
                    console.log(`Updated ${player.full_name} status to "${status}" for fixture ${fixture.id}`)
                  }
                } else if (!fixtureError) {
                  console.log('No upcoming fixtures found')
                }
              } else if (playerError) {
                console.error(`Database error looking up player: ${playerError.message}`)
              } else {
                console.log(`No player found with phone: ${formattedPhone}`)
              }
            } catch (error: any) {
              console.error(`Error processing message: ${error.message}`)
            }
          } else {
            console.log(`Could not determine status from message: "${msgText}"`)
          }
        }
      } else {
        console.log('No valid message data received from Twilio')
      }

      // Twilio expects an empty 200 response or TwiML for messaging webhooks
      return new Response('', {
        headers: { ...corsHeaders },
        status: 200
      })
    } catch (error: any) {
      console.error('Webhook error:', error)
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      })
    }
  }

  return new Response('Method not allowed', { status: 405 })
})
