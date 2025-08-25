-- Create detailed match_details table for granular match-by-match stats
create table if not exists match_details (
  id bigint generated always as identity primary key,
  date date,
  opposition text,
  venue text,
  result text,
  player_id uuid references players(id),
  player_name text,
  batting_runs int,
  batting_balls int,
  batting_4s int,
  batting_6s int,
  batting_how_out text,
  bowling_overs numeric,
  bowling_maidens int,
  bowling_runs int,
  bowling_wickets int,
  fielding_catches int,
  fielding_stumpings int,
  fielding_runouts int,
  created_at timestamptz default now()
);

-- Create player_statistics summary table
create table if not exists player_statistics (
  id bigint generated always as identity primary key,
  player_id uuid references players(id),
  player_name text,
  games int,
  inns int,
  not_outs int,
  runs int,
  high_score int,
  high_score_not_out boolean,
  avg numeric,
  fifties int,
  hundreds int,
  strike_rate numeric,
  -- Bowling
  overs numeric,
  maidens int,
  bowling_runs int,
  wickets int,
  best_bowling text,
  five_wicket_haul int,
  economy_rate numeric,
  bowling_strike_rate numeric,
  bowling_average numeric,
  -- Fielding
  wk_catches int,
  stumpings int,
  total_wk_wickets int,
  fielding_catches int,
  run_outs int,
  total_fielding_wickets int,
  total_catches int,
  total_victims int
);

-- Upsert/refresh player_statistics from match_details (batting, bowling, fielding)
-- This is a template for a SQL function you can run after updating match_details
-- (You can run this as a scheduled job or after each match update)

create or replace function refresh_player_statistics() returns void as $$
begin
  -- Batting summary
  insert into player_statistics (
    player_id, player_name, games, inns, not_outs, runs, high_score, high_score_not_out, avg, fifties, hundreds, strike_rate
  )
  select
    player_id,
    player_name,
    count(distinct date) as games,
    count(*) as inns,
    sum(case when batting_how_out ilike '%not out%' then 1 else 0 end) as not_outs,
    sum(batting_runs) as runs,
    max(batting_runs) as high_score,
    bool_or(batting_how_out ilike '%not out%' and batting_runs = max(batting_runs) over (partition by player_id)) as high_score_not_out,
    round(avg(batting_runs::numeric),2) as avg,
    sum(case when batting_runs >= 50 and batting_runs < 100 then 1 else 0 end) as fifties,
    sum(case when batting_runs >= 100 then 1 else 0 end) as hundreds,
    round(avg(case when batting_balls > 0 then (batting_runs::numeric / batting_balls) * 100 else null end),2) as strike_rate
  from match_details
  where batting_runs is not null
  group by player_id, player_name
  on conflict (player_id) do update set
    games = excluded.games,
    inns = excluded.inns,
    not_outs = excluded.not_outs,
    runs = excluded.runs,
    high_score = excluded.high_score,
    high_score_not_out = excluded.high_score_not_out,
    avg = excluded.avg,
    fifties = excluded.fifties,
    hundreds = excluded.hundreds,
    strike_rate = excluded.strike_rate;

  -- Bowling summary
  update player_statistics ps set
    overs = sub.overs,
    maidens = sub.maidens,
    bowling_runs = sub.bowling_runs,
    wickets = sub.wickets,
    best_bowling = sub.best_bowling,
    five_wicket_haul = sub.five_wicket_haul,
    economy_rate = sub.economy_rate,
    bowling_strike_rate = sub.bowling_strike_rate,
    bowling_average = sub.bowling_average
  from (
    select
      player_id,
      sum(bowling_overs) as overs,
      sum(bowling_maidens) as maidens,
      sum(bowling_runs) as bowling_runs,
      sum(bowling_wickets) as wickets,
      max(concat(bowling_wickets, '/', bowling_runs)) as best_bowling,
      sum(case when bowling_wickets >= 5 then 1 else 0 end) as five_wicket_haul,
      round(sum(bowling_runs)::numeric / nullif(sum(bowling_overs),0),2) as economy_rate,
      round(sum(bowling_overs)*6 / nullif(sum(bowling_wickets),0),2) as bowling_strike_rate,
      round(sum(bowling_runs)::numeric / nullif(sum(bowling_wickets),0),2) as bowling_average
    from match_details
    where bowling_overs is not null
    group by player_id
  ) sub
  where ps.player_id = sub.player_id;

  -- Fielding summary
  update player_statistics ps set
    wk_catches = sub.wk_catches,
    stumpings = sub.stumpings,
    total_wk_wickets = sub.total_wk_wickets,
    fielding_catches = sub.fielding_catches,
    run_outs = sub.run_outs,
    total_fielding_wickets = sub.total_fielding_wickets,
    total_catches = sub.total_catches,
    total_victims = sub.total_victims
  from (
    select
      player_id,
      sum(fielding_catches) filter (where fielding_stumpings > 0) as wk_catches,
      sum(fielding_stumpings) as stumpings,
      sum(fielding_catches) filter (where fielding_stumpings > 0) + sum(fielding_stumpings) as total_wk_wickets,
      sum(fielding_catches) filter (where fielding_stumpings = 0 or fielding_stumpings is null) as fielding_catches,
      sum(fielding_runouts) as run_outs,
      sum(fielding_runouts) as total_fielding_wickets,
      sum(fielding_catches) + sum(fielding_stumpings) as total_catches,
      sum(fielding_catches) + sum(fielding_stumpings) + sum(fielding_runouts) as total_victims
    from match_details
    group by player_id
  ) sub
  where ps.player_id = sub.player_id;
end;
$$ language plpgsql;
