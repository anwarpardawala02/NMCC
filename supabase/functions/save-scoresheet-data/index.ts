// save-scoresheet-data.ts - Supabase Edge Function for saving processed scoresheet data
// @ts-ignore - Deno supports URL imports but TypeScript doesn't recognize them
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { corsHeaders } from '../_shared/cors.ts'

// Types matching our frontend
interface BattingStat {
  name: string;
  runs: number;
  minutes: number;
  balls: number;
  dismissal: string;
  bowler: string;
  isNMCC: boolean;
}

interface BowlingStat {
  name: string;
  overs: number;
  maidens: number;
  runs: number;
  wickets: number;
  isNMCC: boolean;
}

interface MatchInfo {
  opponent: string;
  venue: string;
  date: string;
  toss: string;
  result: string;
}

interface ParsedScoresheet {
  match: MatchInfo;
  batting: BattingStat[];
  bowling: BowlingStat[];
  filePath: string;
  rawText?: string;
}

// Main function to save the processed scoresheet data
// @ts-ignore - Deno global not recognized by TypeScript
Deno.serve(async (req) => {
  console.log('🔥 FUNCTION CALLED: save-scoresheet-data')
  console.log('Request method:', req.method)
  console.log('Request headers:', Object.fromEntries(req.headers.entries()))

  // Handle CORS
  if (req.method === 'OPTIONS') {
    console.log('CORS preflight request handled')
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Processing main request...')
    // Get request data
    const { parsedData, filePath } = await req.json()
    console.log('Request data received:', { hasParsedData: !!parsedData, hasFilePath: !!filePath })

    // Create a client with service role to bypass RLS for all operations
    // Hardcode the service role key for testing
    const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpyaGFleWt0bXlib2VzenBhcWJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQ1NDQ5NiwiZXhwIjoyMDcxMDMwNDk2fQ.OqkC_7zBLXJoASlyOXgC2ypQL155BizLn4BQJUU81zc'
    const supabase = createClient(
      // @ts-ignore - Deno global not recognized by TypeScript
      Deno.env.get('SUPABASE_URL') ?? '',
      SERVICE_ROLE_KEY
    )
    
    // 1. Create or find opponent team
    const { data: opponentTeam, error: opponentError } = await supabase
      .from('opponent_teams')
      .select('id')
      .eq('name', parsedData.match.opponent)
      .maybeSingle()
    
    if (opponentError) {
      console.error('Opponent team query error:', opponentError)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to query opponent team',
          details: opponentError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
    let opponentTeamId = opponentTeam?.id
    
    if (!opponentTeamId) {
      const { data: newTeam, error: newTeamError } = await supabase
        .from('opponent_teams')
        .insert({ name: parsedData.match.opponent })
        .select('id')
        .single()
      
      if (newTeamError) throw newTeamError
      opponentTeamId = newTeam.id
    }
    
    // 2. We'll handle individual match_details entries when processing player stats
    const matchDate = new Date(parsedData.match.date)
    const formattedDate = matchDate.toISOString().split('T')[0]
    
    // Store the match date and details for later use when creating player match records
    const matchDetails = {
      opposition: parsedData.match.opponent,
      date: formattedDate,
      venue: parsedData.match.venue,
      result: parsedData.match.result
    }
    
    // 3. Update the scoresheet record to mark as processed
    await supabase
      .from('scoresheets')
      .update({
        approved: true,
        processed: true
      })
      .eq('file_path', filePath)
    
    // 4. Process players and statistics
    const playerPromises: Promise<any>[] = []
    
    // Process batting stats
    for (const batStat of parsedData.batting) {
      if (batStat.isNMCC) {
        // For NMCC players
        const playerPromise = processNMCCPlayer(supabase, batStat.name, matchDetails, {
          runs: batStat.runs,
          balls: batStat.balls,
          dismissal: batStat.dismissal,
          bowler: batStat.bowler
        })
        playerPromises.push(playerPromise)
      } else {
        // For opponent players
        const playerPromise = processOpponentPlayer(supabase, batStat.name, opponentTeamId, matchDetails, {
          runs: batStat.runs,
          balls: batStat.balls
        })
        playerPromises.push(playerPromise)
      }
    }
    
    // Process bowling stats
    for (const bowlStat of parsedData.bowling) {
      if (bowlStat.isNMCC) {
        // For NMCC players
        const playerPromise = processNMCCPlayer(supabase, bowlStat.name, matchDetails, {
          overs: bowlStat.overs,
          maidens: bowlStat.maidens,
          runs_conceded: bowlStat.runs,
          wickets: bowlStat.wickets
        })
        playerPromises.push(playerPromise)
      } else {
        // For opponent players
        const playerPromise = processOpponentPlayer(supabase, bowlStat.name, opponentTeamId, matchDetails, {
          overs: bowlStat.overs,
          wickets: bowlStat.wickets
        })
        playerPromises.push(playerPromise)
      }
    }
    
    // Wait for all player processing to complete
    const results = await Promise.all(playerPromises)
    
    // Return success
    return new Response(
      JSON.stringify({ success: true, processedRecords: results.length }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

// Helper function to process NMCC player
async function processNMCCPlayer(supabase, playerName, matchDetails, stats) {
  // 1. Find or create the player
  const { data: player, error: playerError } = await supabase
    .from('players')
    .select('id')
    .ilike('full_name', `%${playerName}%`)
    .eq('active', true)
    .maybeSingle()
  
  let playerId = player?.id
  
  if (!playerId) {
    // Create the player if not found
    const { data: newPlayer, error: newPlayerError } = await supabase
      .from('players')
      .insert({
        full_name: playerName,
        active: true,
        join_date: new Date().toISOString().split('T')[0]
      })
      .select('id')
      .single()
    
    if (newPlayerError) throw newPlayerError
    playerId = newPlayer.id
  }
  
  // 2. Create a new match_details entry for this player
  const { data: matchDetail, error: matchDetailError } = await supabase
    .from('match_details')
    .insert({
      player_id: playerId,
      player_name: playerName,
      date: matchDetails.date,
      opposition: matchDetails.opposition,
      venue: matchDetails.venue,
      result: matchDetails.result,
      ...createMatchDetails(stats)
    })
    .select('id')
    .single()
    
  if (matchDetailError) throw matchDetailError
  
  // 3. Update player statistics
  const season = new Date().getFullYear().toString()
  
  // Get existing stats for the player this season
  const { data: existingStats, error: statsError } = await supabase
    .from('player_statistics')
    .select('*')
    .eq('player_id', playerId)
    .eq('season', season)
    .maybeSingle()
  
  if (existingStats) {
    // Update existing stats
    await supabase
      .from('player_statistics')
      .update(updatePlayerStatistics(existingStats, stats))
      .eq('id', existingStats.id)
  } else {
    // Create new stats
    await supabase
      .from('player_statistics')
      .insert({
        player_id: playerId,
        player_name: playerName,
        season,
        ...createInitialPlayerStatistics(stats)
      })
  }
  
  return { playerId }
}

// Helper function to process opponent player
async function processOpponentPlayer(supabase, playerName, opponentTeamId, matchDetails, stats) {
  // Find or create the opponent player
  const { data: player, error: playerError } = await supabase
    .from('opponent_players')
    .select('id')
    .ilike('full_name', `%${playerName}%`)
    .eq('opponent_team_id', opponentTeamId)
    .maybeSingle()
  
  let playerId = player?.id
  
  if (!playerId) {
    // Create the player if not found
    const { data: newPlayer, error: newPlayerError } = await supabase
      .from('opponent_players')
      .insert({
        full_name: playerName,
        opponent_team_id: opponentTeamId
      })
      .select('id')
      .single()
    
    if (newPlayerError) throw newPlayerError
    playerId = newPlayer.id
  }
  
  // We don't track detailed statistics for opponent players in our system
  // but we could add this in the future if needed
  
  return { playerId }
}

// Helper function to create match details object from stats
function createMatchDetails(stats: any) {
  const details: Record<string, any> = {}
  
  // Batting details
  if (stats.runs !== undefined) details.batting_runs = stats.runs
  if (stats.balls !== undefined) details.batting_balls = stats.balls
  if (stats.dismissal !== undefined) details.batting_how_out = stats.dismissal
  if (stats.bowler !== undefined) details.bowled_by = stats.bowler
  
  // Bowling details
  if (stats.overs !== undefined) details.bowling_overs = stats.overs
  if (stats.maidens !== undefined) details.bowling_maidens = stats.maidens
  if (stats.wickets !== undefined) details.bowling_wickets = stats.wickets
  if (stats.runs_conceded !== undefined) details.bowling_runs = stats.runs_conceded
  
  return details
}

// Helper function to create initial player statistics
function createInitialPlayerStatistics(stats) {
  const newStats = {
    games: 1,
    inns: 0,
    not_outs: 0,
    runs: 0,
    high_score: 0,
    high_score_not_out: false,
    avg: 0,
    fifties: 0,
    hundreds: 0,
    strike_rate: 0,
    overs: 0,
    maidens: 0,
    bowling_runs: 0,
    wickets: 0,
    best_bowling: '0/0',
    five_wicket_haul: 0,
    economy_rate: 0,
    bowling_strike_rate: 0,
    bowling_average: 0,
    wk_catches: 0,
    stumpings: 0,
    total_wk_wickets: 0,
    fielding_catches: 0,
    run_outs: 0,
    total_fielding_wickets: 0,
    total_catches: 0,
    total_victims: 0
  }
  
  // Update with batting stats if present
  if (stats.runs !== undefined) {
    newStats.inns = 1
    newStats.runs = stats.runs
    newStats.high_score = stats.runs
    
    // Check if not out
    if (stats.dismissal && stats.dismissal.toLowerCase().includes('not out')) {
      newStats.not_outs = 1
      newStats.high_score_not_out = true
    }
    
    // Calculate average
    if (newStats.inns > newStats.not_outs) {
      newStats.avg = newStats.runs / (newStats.inns - newStats.not_outs)
    }
    
    // Check for fifty or hundred
    if (stats.runs >= 50 && stats.runs < 100) newStats.fifties = 1
    if (stats.runs >= 100) newStats.hundreds = 1
    
    // Calculate strike rate if balls faced is available
    if (stats.balls) {
      newStats.strike_rate = (stats.runs / stats.balls) * 100
    }
  }
  
  // Update with bowling stats if present
  if (stats.overs !== undefined) {
    newStats.overs = stats.overs
    
    if (stats.maidens !== undefined) newStats.maidens = stats.maidens
    if (stats.runs_conceded !== undefined) newStats.bowling_runs = stats.runs_conceded
    if (stats.wickets !== undefined) {
      newStats.wickets = stats.wickets
      
      // Set best bowling
      if (stats.wickets > 0) {
        newStats.best_bowling = `${stats.wickets}/${stats.runs_conceded}`
      }
      
      // Check for five wicket haul
      if (stats.wickets >= 5) newStats.five_wicket_haul = 1
    }
    
    // Calculate economy rate
    if (stats.overs > 0 && stats.runs_conceded !== undefined) {
      newStats.economy_rate = stats.runs_conceded / stats.overs
    }
    
    // Calculate bowling strike rate
    if (stats.overs > 0 && stats.wickets > 0) {
      newStats.bowling_strike_rate = (stats.overs * 6) / stats.wickets
    }
    
    // Calculate bowling average
    if (stats.wickets > 0 && stats.runs_conceded !== undefined) {
      newStats.bowling_average = stats.runs_conceded / stats.wickets
    }
  }
  
  return newStats
}

// Helper function to update existing player statistics
function updatePlayerStatistics(existing, newStats) {
  const updated = { ...existing }
  
  // Always increment games played
  updated.games += 1
  
  // Update batting stats
  if (newStats.runs !== undefined) {
    updated.inns += 1
    updated.runs += newStats.runs
    
    // Check if not out
    if (newStats.dismissal && newStats.dismissal.toLowerCase().includes('not out')) {
      updated.not_outs += 1
    }
    
    // Check if new high score
    if (newStats.runs > existing.high_score) {
      updated.high_score = newStats.runs
      updated.high_score_not_out = newStats.dismissal && 
                                 newStats.dismissal.toLowerCase().includes('not out')
    }
    
    // Recalculate average
    if (updated.inns > updated.not_outs) {
      updated.avg = updated.runs / (updated.inns - updated.not_outs)
    }
    
    // Check for fifty or hundred
    if (newStats.runs >= 50 && newStats.runs < 100) updated.fifties += 1
    if (newStats.runs >= 100) updated.hundreds += 1
  }
  
  // Update bowling stats
  if (newStats.overs !== undefined) {
    updated.overs += newStats.overs
    
    if (newStats.maidens !== undefined) updated.maidens += newStats.maidens
    if (newStats.runs_conceded !== undefined) updated.bowling_runs += newStats.runs_conceded
    if (newStats.wickets !== undefined) {
      updated.wickets += newStats.wickets
      
      // Check if new best bowling
      if (newStats.wickets > 0) {
        const currentBest = existing.best_bowling.split('/');
        const currentWickets = parseInt(currentBest[0], 10);
        const currentRuns = parseInt(currentBest[1], 10);
        
        // Better bowling = more wickets OR same wickets with fewer runs
        if (
          newStats.wickets > currentWickets || 
          (newStats.wickets === currentWickets && newStats.runs_conceded < currentRuns)
        ) {
          updated.best_bowling = `${newStats.wickets}/${newStats.runs_conceded}`
        }
      }
      
      // Check for five wicket haul
      if (newStats.wickets >= 5) updated.five_wicket_haul += 1
    }
    
    // Recalculate bowling stats
    if (updated.overs > 0) {
      updated.economy_rate = updated.bowling_runs / updated.overs
      
      if (updated.wickets > 0) {
        updated.bowling_strike_rate = (updated.overs * 6) / updated.wickets
        updated.bowling_average = updated.bowling_runs / updated.wickets
      }
    }
  }
  
  return updated
}
