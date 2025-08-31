-- Create or replace the refresh_player_statistics function to fix the window function error
CREATE OR REPLACE FUNCTION refresh_player_statistics()
RETURNS void AS $$
BEGIN
  -- First, create a temporary table with high scores
  CREATE TEMP TABLE temp_high_scores AS
  SELECT 
    player_id,
    max(batting_runs) as high_score
  FROM match_details
  WHERE batting_runs IS NOT NULL
  GROUP BY player_id;

  -- Then use this to determine if high score was not out
  CREATE TEMP TABLE temp_high_score_not_out AS
  SELECT 
    md.player_id,
    bool_or(md.batting_how_out ILIKE '%not out%' AND md.batting_runs = ths.high_score) as high_score_not_out
  FROM match_details md
  JOIN temp_high_scores ths ON md.player_id = ths.player_id
  GROUP BY md.player_id;

  -- Update batting statistics
  INSERT INTO player_statistics (
    player_id, player_name, games, inns, not_outs, runs, high_score, high_score_not_out, 
    avg, fifties, hundreds, strike_rate
  )
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
    sum(CASE WHEN md.batting_runs >= 100 THEN 1 ELSE 0 END) AS hundreds,
    ROUND(
      CASE 
        WHEN sum(md.batting_balls) > 0 
        THEN (sum(md.batting_runs)::numeric / sum(md.batting_balls)) * 100 
        ELSE NULL 
      END, 2
    ) AS strike_rate
  FROM match_details md
  JOIN temp_high_score_not_out hsno ON md.player_id = hsno.player_id
  WHERE md.batting_runs IS NOT NULL
  GROUP BY md.player_id, md.player_name, hsno.high_score_not_out
  ON CONFLICT (player_id) DO UPDATE SET
    games = EXCLUDED.games,
    inns = EXCLUDED.inns,
    not_outs = EXCLUDED.not_outs,
    runs = EXCLUDED.runs,
    high_score = EXCLUDED.high_score,
    high_score_not_out = EXCLUDED.high_score_not_out,
    avg = EXCLUDED.avg,
    fifties = EXCLUDED.fifties,
    hundreds = EXCLUDED.hundreds,
    strike_rate = EXCLUDED.strike_rate;

  -- Update bowling statistics
  UPDATE player_statistics ps
  SET
    overs = subquery.overs,
    maidens = subquery.maidens,
    bowling_runs = subquery.bowling_runs,
    wickets = subquery.wickets,
    best_bowling = subquery.best_bowling,
    five_wicket_haul = subquery.five_wicket_haul,
    economy_rate = subquery.economy_rate,
    bowling_strike_rate = subquery.bowling_strike_rate,
    bowling_average = subquery.bowling_average
  FROM (
    SELECT
      player_id,
      sum(bowling_overs) AS overs,
      sum(bowling_maidens) AS maidens,
      sum(bowling_runs) AS bowling_runs,
      sum(bowling_wickets) AS wickets,
      array_to_string(ARRAY[max(bowling_wickets)::text, min(CASE WHEN bowling_wickets = (
        SELECT max(bowling_wickets) FROM match_details md2 WHERE md2.player_id = md.player_id AND md2.bowling_wickets IS NOT NULL
      ) THEN bowling_runs ELSE NULL END)::text], '/') AS best_bowling,
      sum(CASE WHEN bowling_wickets >= 5 THEN 1 ELSE 0 END) AS five_wicket_haul,
      ROUND(
        CASE 
          WHEN sum(bowling_overs) > 0 
          THEN sum(bowling_runs) / sum(bowling_overs) 
          ELSE NULL 
        END, 2
      ) AS economy_rate,
      ROUND(
        CASE 
          WHEN sum(bowling_wickets) > 0 
          THEN (sum(bowling_overs) * 6) / sum(bowling_wickets) 
          ELSE NULL 
        END, 2
      ) AS bowling_strike_rate,
      ROUND(
        CASE 
          WHEN sum(bowling_wickets) > 0 
          THEN sum(bowling_runs)::numeric / sum(bowling_wickets) 
          ELSE NULL 
        END, 2
      ) AS bowling_average
    FROM match_details md
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
    wk_catches = subquery.wk_catches,
    total_wk_wickets = subquery.total_wk_wickets,
    total_fielding_wickets = subquery.total_fielding_wickets,
    total_catches = subquery.total_catches,
    total_victims = subquery.total_victims
  FROM (
    SELECT
      player_id,
      sum(CASE WHEN fielding_catches > 0 AND fielding_stumpings = 0 THEN fielding_catches ELSE 0 END) AS fielding_catches,
      sum(fielding_runouts) AS run_outs,
      sum(fielding_stumpings) AS stumpings,
      sum(CASE WHEN fielding_stumpings > 0 THEN fielding_catches ELSE 0 END) AS wk_catches,
      sum(CASE WHEN fielding_stumpings > 0 THEN fielding_catches + fielding_stumpings ELSE 0 END) AS total_wk_wickets,
      sum(CASE WHEN fielding_stumpings = 0 THEN fielding_catches + fielding_runouts ELSE 0 END) AS total_fielding_wickets,
      sum(fielding_catches) AS total_catches,
      sum(fielding_catches + fielding_stumpings + fielding_runouts) AS total_victims
    FROM match_details
    WHERE fielding_catches IS NOT NULL OR fielding_stumpings IS NOT NULL OR fielding_runouts IS NOT NULL
    GROUP BY player_id
  ) AS subquery
  WHERE ps.player_id = subquery.player_id;

  -- Drop temporary tables
  DROP TABLE IF EXISTS temp_high_scores;
  DROP TABLE IF EXISTS temp_high_score_not_out;
END;
$$ LANGUAGE plpgsql;
