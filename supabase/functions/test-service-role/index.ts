// test-service-role.ts - Simple test edge function to verify service role key
// @ts-ignore - Deno supports URL imports but TypeScript doesn't recognize them
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { corsHeaders } from '../_shared/cors.ts'

// Main function
// @ts-ignore - Deno global not recognized by TypeScript
Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a client with service role to bypass RLS
    const supabase = createClient(
      // @ts-ignore - Deno global not recognized by TypeScript
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore - Deno global not recognized by TypeScript
      Deno.env.get('SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } }
    )

    // Try a simple insert to test if service role works
    const testData = {
      name: 'Test Player',
      email: 'test@example.com',
      created_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('players')
      .insert(testData)
      .select()

    if (error) {
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
          code: error.code
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Service role key is working correctly',
        data: data
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
