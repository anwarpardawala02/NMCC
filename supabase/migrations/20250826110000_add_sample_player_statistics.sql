-- Insert sample player statistics
-- Execute this SQL in your Supabase SQL editor to add sample stats

-- First, get some player IDs to link stats to
WITH player_list AS (
  SELECT id FROM players LIMIT 10
)
-- Insert stats for these players
INSERT INTO player_statistics 
(player_id, season, matches_played, runs_scored, balls_faced, fours, sixes, 
 wickets_taken, overs_bowled, runs_conceded, catches, stumpings)
SELECT 
  id, 
  '2025',  -- Current season
  floor(random() * 15)::int + 5,  -- matches_played: 5-20 games
  floor(random() * 500)::int + 50,  -- runs_scored: 50-550 runs
  floor(random() * 600)::int + 100,  -- balls_faced: 100-700 balls
  floor(random() * 20)::int + 5,  -- fours: 5-25 fours
  floor(random() * 10)::int,  -- sixes: 0-10 sixes
  floor(random() * 30)::int,  -- wickets_taken: 0-30 wickets
  (floor(random() * 60)::int + 10)::numeric,  -- overs_bowled: 10-70 overs
  floor(random() * 350)::int + 50,  -- runs_conceded: 50-400 runs conceded
  floor(random() * 15)::int,  -- catches: 0-15 catches
  floor(random() * 5)::int  -- stumpings: 0-5 stumpings
FROM player_list
-- Avoid duplicates in case this is run multiple times
ON CONFLICT (player_id, season) DO UPDATE SET
  matches_played = EXCLUDED.matches_played,
  runs_scored = EXCLUDED.runs_scored,
  balls_faced = EXCLUDED.balls_faced,
  fours = EXCLUDED.fours,
  sixes = EXCLUDED.sixes,
  wickets_taken = EXCLUDED.wickets_taken,
  overs_bowled = EXCLUDED.overs_bowled,
  runs_conceded = EXCLUDED.runs_conceded,
  catches = EXCLUDED.catches,
  stumpings = EXCLUDED.stumpings;

-- Update the updated_at timestamp
UPDATE player_statistics
SET updated_at = NOW();
