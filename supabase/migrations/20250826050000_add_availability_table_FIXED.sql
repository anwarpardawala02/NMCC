-- Add availability table for player responses to fixtures
CREATE TABLE IF NOT EXISTS availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_id UUID REFERENCES fixtures(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('Available', 'Not Available')),
  responded_on TIMESTAMP DEFAULT now(),
  UNIQUE(fixture_id, player_id)
);

-- Add RLS policies for availability
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;

-- Anyone can read availability data
CREATE POLICY availability_read_policy 
  ON availability
  FOR SELECT 
  USING (true);

-- Players can update their own availability
CREATE POLICY availability_insert_policy 
  ON availability 
  FOR INSERT 
  WITH CHECK (true);

-- Players can update their own availability
-- Dev-friendly: allow updates for anyone so upsert works without Supabase Auth (tighten for prod)
DROP POLICY IF EXISTS availability_update_policy ON availability;
CREATE POLICY availability_update_policy_dev 
  ON availability 
  FOR UPDATE 
  USING (true)
  WITH CHECK (true);

-- Create a trigger to add match fees when a player marks as "Available"
CREATE OR REPLACE FUNCTION add_match_fee_on_available() 
RETURNS TRIGGER AS $$
BEGIN
  -- Only insert match fee if player status is "Available"
  IF NEW.status = 'Available' THEN
    -- Check if fee already exists to prevent duplicates
    IF NOT EXISTS (
      SELECT 1 FROM public.club_fees 
      WHERE player_id = NEW.player_id 
      AND fixture_id = NEW.fixture_id
      AND category = 'Match Fee'
    ) THEN
      -- Get fixture details for reference
      INSERT INTO public.club_fees (
        player_id,
        fixture_id,
        category,
        amount,
        paid_on,
        notes
      )
      VALUES (
        NEW.player_id,
        NEW.fixture_id,
        'Match Fee',
        25.00,  -- Default match fee amount, update as needed
        NULL,
        (
          SELECT 'Match fee for ' || f.opponent || ' (' || NEW.fixture_id || ')'
          FROM public.fixtures f
          WHERE f.id = NEW.fixture_id
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER add_match_fee_trigger
AFTER INSERT OR UPDATE ON availability
FOR EACH ROW
WHEN (NEW.status = 'Available')
EXECUTE FUNCTION add_match_fee_on_available();

-- Create a function to look up a player by login_name (for auth purposes)
CREATE OR REPLACE FUNCTION lookup_player_by_login(p_login_name TEXT)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  email TEXT,
  login_name TEXT,
  role TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    players.id,
    players.full_name,
    players.email,
    players.login_name,
    players.role
  FROM players
  WHERE players.login_name = p_login_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
