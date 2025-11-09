// Fix player statistics issue
// This function initializes empty statistics records for all players in the current season
// 1. Query all active players
// 2. For each player, check if they have a statistics record for the current season
// 3. If not, create a new statistics record with zero values

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Initialize Supabase client (uses service role key for admin access)
const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials')
  Deno.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  console.log('Starting to fix player statistics...')
  
  // Get current season
  const currentSeason = new Date().getFullYear().toString()
  console.log(`Current season: ${currentSeason}`)
  
  // Get all active players
  const { data: players, error: playersError } = await supabase
    .from('players')
    .select('id, full_name')
    .eq('active', true)
  
  if (playersError) {
    console.error('Error fetching players:', playersError.message)
    return
  }
  
  console.log(`Found ${players.length} active players`)
  
  // Get players with statistics for the current season
  const { data: existingStats, error: statsError } = await supabase
    .from('player_statistics')
    .select('player_id')
    .eq('season', currentSeason)
  
  if (statsError) {
    console.error('Error fetching statistics:', statsError.message)
    return
  }
  
  // Create a set of player IDs with statistics
  const playerIdsWithStats = new Set(existingStats.map(stat => stat.player_id))
  
  // Find players without statistics
  const playersWithoutStats = players.filter(player => !playerIdsWithStats.has(player.id))
  
  console.log(`Found ${playersWithoutStats.length} players without statistics for season ${currentSeason}`)
  
  // Create empty statistics for these players
  for (const player of playersWithoutStats) {
    console.log(`Creating statistics for ${player.full_name}`)
    
    const { data, error } = await supabase
      .from('player_statistics')
      .insert({
        player_id: player.id,
        player_name: player.full_name,
        season: currentSeason,
        games: 0,
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
      })
      .select('id')
    
    if (error) {
      console.error(`Error creating statistics for ${player.full_name}:`, error.message)
    } else {
      console.log(`Created statistics record with ID ${data[0].id}`)
    }
  }
  
  console.log('Completed creating missing statistics records')
  
  // Check if there are any name mismatches
  console.log('\nChecking for name mismatches...')
  
  const { data: allStats, error: allStatsError } = await supabase
    .from('player_statistics')
    .select('id, player_id, player_name')
    .eq('season', currentSeason)
  
  if (allStatsError) {
    console.error('Error fetching all statistics:', allStatsError.message)
    return
  }
  
  // Create player ID to name map
  const playerNameById = {}
  players.forEach(player => {
    playerNameById[player.id] = player.full_name
  })
  
  // Check for mismatches
  const mismatches = allStats.filter(stat => 
    stat.player_name !== playerNameById[stat.player_id]
  )
  
  if (mismatches.length > 0) {
    console.log(`Found ${mismatches.length} name mismatches. Fixing...`)
    
    for (const mismatch of mismatches) {
      const correctName = playerNameById[mismatch.player_id]
      console.log(`Fixing: "${mismatch.player_name}" -> "${correctName}"`)
      
      const { error: updateError } = await supabase
        .from('player_statistics')
        .update({ player_name: correctName })
        .eq('id', mismatch.id)
      
      if (updateError) {
        console.error(`Error updating name for ID ${mismatch.id}:`, updateError.message)
      }
    }
  } else {
    console.log('No name mismatches found.')
  }
  
  console.log('\nStatistics fix completed!')
}

// Run the main function
main().catch(e => {
  console.error('Unhandled error:', e)
  Deno.exit(1)
})