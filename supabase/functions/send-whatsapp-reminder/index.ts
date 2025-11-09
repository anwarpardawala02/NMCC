import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { fixture_id } = await req.json()

    // Validate inputs
    if (!fixture_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: fixture_id' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get Twilio credentials from environment
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    const twilioWhatsappNumber = Deno.env.get('TWILIO_WHATSAPP_NUMBER')

    if (!accountSid || !authToken || !twilioWhatsappNumber) {
      console.error('Missing Twilio configuration')
      return new Response(
        JSON.stringify({ error: 'Twilio credentials not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get fixture details
    const { data: fixture, error: fixtureError } = await supabaseClient
      .from('fixtures')
      .select('id, opponent, date, ground')
      .eq('id', fixture_id)
      .single()

    if (fixtureError || !fixture) {
      return new Response(
        JSON.stringify({ error: 'Fixture not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Get all active players with phone numbers
    const { data: allPlayers, error: playersError } = await supabaseClient
      .from('players')
      .select('id, full_name, phone')
      .eq('active', true)

    if (playersError || !allPlayers) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch players' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Get players who have already responded
    const { data: responses, error: responsesError } = await supabaseClient
      .from('availability')
      .select('player_id')
      .eq('fixture_id', fixture_id)

    if (responsesError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch responses' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const respondedPlayerIds = new Set(responses?.map(r => r.player_id) || [])

    // Filter players who have not responded and have phone numbers
    const playersToRemind = allPlayers.filter(p => 
      p.phone && 
      p.phone.trim() && 
      !respondedPlayerIds.has(p.id)
    )

    if (playersToRemind.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'All players have already responded',
          reminded_count: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    console.log(`Sending reminders to ${playersToRemind.length} players who haven't responded`)

    // Create reminder message
    const fixtureDate = new Date(fixture.date).toLocaleDateString('en-GB', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    // Send reminders to each player
    const results = await Promise.all(
      playersToRemind.map(async (player) => {
        try {
          const formattedPhone = `whatsapp:${player.phone}`
          
          const messageBody = `⏰ REMINDER: Hi ${player.full_name}! 🏏

We haven't received your response yet for:

📍 *${fixture.opponent}* vs Northolt Manor CC
📅 ${fixtureDate}
🏟️ ${fixture.ground}

*Please Reply:*
• YES - If you're available
• NO - If you're not available
• MAYBE - If you're unsure

Your response helps us plan the team! 🙌

(Reminder from NMCC Fixture System)`

          const auth = btoa(`${accountSid}:${authToken}`)
          const params = new URLSearchParams()
          params.append('From', twilioWhatsappNumber)
          params.append('To', formattedPhone)
          params.append('Body', messageBody)

          const response = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
              },
              body: params.toString()
            }
          )

          const data = await response.json()

          if (!response.ok) {
            console.error(`Failed to send reminder to ${player.full_name}:`, data)
            return {
              player: player.full_name,
              phone: player.phone,
              success: false,
              error: data.message || 'Unknown error'
            }
          }

          console.log(`Reminder sent to ${player.full_name}: ${data.sid}`)
          return {
            player: player.full_name,
            phone: player.phone,
            success: true,
            message_sid: data.sid
          }
        } catch (error: any) {
          console.error(`Error sending reminder to ${player.full_name}:`, error)
          return {
            player: player.full_name,
            phone: player.phone,
            success: false,
            error: error.message
          }
        }
      })
    )

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Reminders sent to ${successCount} players${failureCount > 0 ? ` (${failureCount} failed)` : ''}`,
        reminded_count: successCount,
        failed_count: failureCount,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: any) {
    console.error('Error sending reminders:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
