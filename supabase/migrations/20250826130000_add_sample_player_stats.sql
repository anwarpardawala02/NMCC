-- Add sample player statistics for testing
-- Using the existing player_statistics table

-- Set up some initial skill values if they don't exist to make data more interesting
UPDATE players SET skill = 'batsman' WHERE skill IS NULL AND random() < 0.5;
UPDATE players SET skill = 'bowler' WHERE skill IS NULL AND random() < 0.5;
UPDATE players SET skill = 'all-rounder' WHERE skill IS NULL;

-- Insert sample match details if they don't exist
INSERT INTO match_details (
  date, 
  opposition, 
  venue, 
  result,
  player_id,
  player_name,
  batting_runs,
  batting_balls,
  batting_4s,
  batting_6s,
  batting_how_out,
  bowling_overs,
  bowling_maidens,
  bowling_runs,
  bowling_wickets,
  fielding_catches,
  fielding_stumpings,
  fielding_runouts
)
SELECT 
  '2025-07-15'::date,
  'Oxford CC',
  'Home Ground',
  'Won by 45 runs',
  id,
  full_name,
  CASE 
    WHEN skill = 'batsman' THEN FLOOR(RANDOM() * 80) + 20
    WHEN skill = 'all-rounder' THEN FLOOR(RANDOM() * 50) + 10
    ELSE FLOOR(RANDOM() * 30)
  END,
  CASE
    WHEN skill = 'batsman' THEN FLOOR(RANDOM() * 60) + 15
    WHEN skill = 'all-rounder' THEN FLOOR(RANDOM() * 40) + 10
    ELSE FLOOR(RANDOM() * 20)
  END,
  CASE 
    WHEN skill = 'batsman' THEN FLOOR(RANDOM() * 8) + 1
    ELSE FLOOR(RANDOM() * 4)
  END,
  CASE
    WHEN skill = 'batsman' THEN FLOOR(RANDOM() * 3)
    ELSE FLOOR(RANDOM() * 1)
  END,
  CASE FLOOR(RANDOM() * 5)
    WHEN 0 THEN 'bowled'
    WHEN 1 THEN 'caught'
    WHEN 2 THEN 'lbw'
    WHEN 3 THEN 'run out'
    ELSE 'stumped'
  END,
  CASE 
    WHEN skill = 'bowler' THEN RANDOM() * 8 + 2
    WHEN skill = 'all-rounder' THEN RANDOM() * 6 + 1
    ELSE RANDOM() * 2
  END,
  CASE
    WHEN skill = 'bowler' THEN FLOOR(RANDOM() * 3)
    WHEN skill = 'all-rounder' THEN FLOOR(RANDOM() * 2)
    ELSE 0
  END,
  CASE 
    WHEN skill = 'bowler' THEN FLOOR(RANDOM() * 30) + 10
    WHEN skill = 'all-rounder' THEN FLOOR(RANDOM() * 20) + 15
    ELSE FLOOR(RANDOM() * 15) + 20
  END,
  CASE
    WHEN skill = 'bowler' THEN FLOOR(RANDOM() * 4) + 1
    WHEN skill = 'all-rounder' THEN FLOOR(RANDOM() * 3) + 1
    ELSE FLOOR(RANDOM() * 1)
  END,
  FLOOR(RANDOM() * 3),
  CASE WHEN RANDOM() < 0.2 THEN 1 ELSE 0 END,
  CASE WHEN RANDOM() < 0.2 THEN 1 ELSE 0 END
FROM players
WHERE active = true
LIMIT 11
ON CONFLICT DO NOTHING;

-- Insert another match for more data
INSERT INTO match_details (
  date, 
  opposition, 
  venue, 
  result,
  player_id,
  player_name,
  batting_runs,
  batting_balls,
  batting_4s,
  batting_6s,
  batting_how_out,
  bowling_overs,
  bowling_maidens,
  bowling_runs,
  bowling_wickets,
  fielding_catches,
  fielding_stumpings,
  fielding_runouts
)
SELECT 
  '2025-08-01'::date,
  'Cambridge CC',
  'Away Ground',
  'Lost by 20 runs',
  id,
  full_name,
  CASE 
    WHEN skill = 'batsman' THEN FLOOR(RANDOM() * 70) + 15
    WHEN skill = 'all-rounder' THEN FLOOR(RANDOM() * 45) + 5
    ELSE FLOOR(RANDOM() * 25)
  END,
  CASE
    WHEN skill = 'batsman' THEN FLOOR(RANDOM() * 50) + 10
    WHEN skill = 'all-rounder' THEN FLOOR(RANDOM() * 35) + 5
    ELSE FLOOR(RANDOM() * 15)
  END,
  CASE 
    WHEN skill = 'batsman' THEN FLOOR(RANDOM() * 6) + 1
    ELSE FLOOR(RANDOM() * 3)
  END,
  CASE
    WHEN skill = 'batsman' THEN FLOOR(RANDOM() * 2)
    ELSE FLOOR(RANDOM() * 1)
  END,
  CASE FLOOR(RANDOM() * 5)
    WHEN 0 THEN 'bowled'
    WHEN 1 THEN 'caught'
    WHEN 2 THEN 'lbw'
    WHEN 3 THEN 'run out'
    ELSE 'stumped'
  END,
  CASE 
    WHEN skill = 'bowler' THEN RANDOM() * 7 + 2
    WHEN skill = 'all-rounder' THEN RANDOM() * 5 + 1
    ELSE RANDOM() * 2
  END,
  CASE
    WHEN skill = 'bowler' THEN FLOOR(RANDOM() * 2)
    WHEN skill = 'all-rounder' THEN FLOOR(RANDOM() * 1)
    ELSE 0
  END,
  CASE 
    WHEN skill = 'bowler' THEN FLOOR(RANDOM() * 25) + 10
    WHEN skill = 'all-rounder' THEN FLOOR(RANDOM() * 30) + 15
    ELSE FLOOR(RANDOM() * 20) + 20
  END,
  CASE
    WHEN skill = 'bowler' THEN FLOOR(RANDOM() * 3) + 1
    WHEN skill = 'all-rounder' THEN FLOOR(RANDOM() * 2) 
    ELSE FLOOR(RANDOM() * 1)
  END,
  FLOOR(RANDOM() * 2),
  CASE WHEN RANDOM() < 0.15 THEN 1 ELSE 0 END,
  CASE WHEN RANDOM() < 0.15 THEN 1 ELSE 0 END
FROM players
WHERE active = true
LIMIT 11
ON CONFLICT DO NOTHING;

-- Create a temporary function that avoids the window function error
CREATE OR REPLACE FUNCTION temp_update_player_statistics()
RETURNS void AS $$
BEGIN
  -- Create a temp table for high scores first
  CREATE TEMP TABLE temp_high_scores AS
  SELECT 
    player_id,
    max(batting_runs) as high_score
  FROM match_details
  WHERE batting_runs IS NOT NULL
  GROUP BY player_id;
  
  -- Process each player's high score not out status
  CREATE TEMP TABLE temp_high_score_not_out AS
  SELECT 
    md.player_id,
    bool_or(md.batting_how_out ILIKE '%not out%' AND md.batting_runs = ths.high_score) as high_score_not_out
  FROM match_details md
  JOIN temp_high_scores ths ON md.player_id = ths.player_id
  GROUP BY md.player_id;
  
  -- First, create temp table with aggregated stats
  CREATE TEMP TABLE player_batting_stats AS
  SELECT
    md.player_id,
    md.player_name,
    count(DISTINCT md.date) AS games,
    count(*) AS inns,
    sum(CASE WHEN md.batting_how_out ILIKE '%not out%' THEN 1 ELSE 0 END) AS not_outs,
    sum(md.batting_runs) AS runs,
    max(md.batting_runs) AS high_score,
    hsno.high_score_not_out,
    ROUND(sum(md.batting_runs)::numeric / NULLIF((count(*) - sum(CASE WHEN md.batting_how_out ILIKE '%not out%' THEN 1 ELSE 0 END)), 0), 2) AS avg,
    sum(CASE WHEN md.batting_runs >= 50 AND md.batting_runs < 100 THEN 1 ELSE 0 END) AS fifties,
    sum(CASE WHEN md.batting_runs >= 100 THEN 1 ELSE 0 END) AS hundreds
  FROM match_details md
  JOIN temp_high_score_not_out hsno ON md.player_id = hsno.player_id
  WHERE md.batting_runs IS NOT NULL
  GROUP BY md.player_id, md.player_name, hsno.high_score_not_out;
  
  -- For new players without stats, insert new records
  INSERT INTO player_statistics (
    player_id, player_name, season, games, inns, not_outs, runs, high_score, high_score_not_out,
    avg, fifties, hundreds
  )
  SELECT 
    pbs.player_id, 
    pbs.player_name, 
    '2025', 
    pbs.games, 
    pbs.inns, 
    pbs.not_outs, 
    pbs.runs, 
    pbs.high_score, 
    pbs.high_score_not_out, 
    pbs.avg, 
    pbs.fifties, 
    pbs.hundreds
  FROM player_batting_stats pbs
  WHERE NOT EXISTS (
    SELECT 1 FROM player_statistics ps 
    WHERE ps.player_id = pbs.player_id
  );
  
  -- For existing players, update their records
  UPDATE player_statistics ps
  SET
    games = pbs.games,
    inns = pbs.inns,
    not_outs = pbs.not_outs,
    runs = pbs.runs,
    high_score = pbs.high_score,
    high_score_not_out = pbs.high_score_not_out,
    avg = pbs.avg,
    fifties = pbs.fifties,
    hundreds = pbs.hundreds
  FROM player_batting_stats pbs
  WHERE ps.player_id = pbs.player_id;

  -- Update bowling statistics  
  UPDATE player_statistics ps
  SET
    overs = subquery.overs,
    maidens = subquery.maidens,
    bowling_runs = subquery.bowling_runs,
    wickets = subquery.wickets
  FROM (
    SELECT
      player_id,
      sum(bowling_overs) AS overs,
      sum(bowling_maidens) AS maidens,
      sum(bowling_runs) AS bowling_runs,
      sum(bowling_wickets) AS wickets
    FROM match_details
    WHERE bowling_overs IS NOT NULL
    GROUP BY player_id
  ) AS subquery
  WHERE ps.player_id = subquery.player_id;
  
  -- Update fielding statistics
  UPDATE player_statistics ps
  SET
    fielding_catches = subquery.fielding_catches,
    run_outs = subquery.run_outs,
    stumpings = subquery.stumpings,
    total_catches = subquery.total_catches
  FROM (
    SELECT
      player_id,
      sum(fielding_catches) AS fielding_catches,
      sum(fielding_runouts) AS run_outs,
      sum(fielding_stumpings) AS stumpings,
      sum(fielding_catches) AS total_catches
    FROM match_details
    WHERE fielding_catches IS NOT NULL OR fielding_stumpings IS NOT NULL OR fielding_runouts IS NOT NULL
    GROUP BY player_id
  ) AS subquery
  WHERE ps.player_id = subquery.player_id;
  
  -- Calculate and update total victims (catches + stumpings + run outs)
  UPDATE player_statistics
  SET total_victims = COALESCE(fielding_catches, 0) + COALESCE(stumpings, 0) + COALESCE(run_outs, 0)
  WHERE player_id IN (SELECT DISTINCT player_id FROM match_details);
  
  -- Clean up temp tables
  DROP TABLE temp_high_scores;
  DROP TABLE temp_high_score_not_out;
  DROP TABLE player_batting_stats;
END;
$$ LANGUAGE plpgsql;

-- Call the temporary function to update player statistics
SELECT temp_update_player_statistics();

-- Clean up the temporary function
DROP FUNCTION temp_update_player_statistics();
