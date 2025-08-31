-- Create tables for scoresheet upload functionality

-- Create opponent_teams table if not exists
CREATE TABLE IF NOT EXISTS opponent_teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create opponent_players table
CREATE TABLE IF NOT EXISTS opponent_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  opponent_team_id UUID REFERENCES opponent_teams(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add is_nmcc_player to players table if it doesn't exist
ALTER TABLE players ADD COLUMN IF NOT EXISTS is_nmcc_player BOOLEAN DEFAULT true;

-- Create scoresheets table to track uploaded scoresheets
CREATE TABLE IF NOT EXISTS scoresheets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_path TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  match_date DATE,
  opposition TEXT,
  venue TEXT,
  processed BOOLEAN DEFAULT false,
  approved BOOLEAN DEFAULT false,
  raw_ocr_data JSONB,
  processed_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Update match_details table if needed
ALTER TABLE match_details ADD COLUMN IF NOT EXISTS scoresheet_id UUID REFERENCES scoresheets(id);

-- Update players table to support fixture_manager role
ALTER TABLE players 
DROP CONSTRAINT IF EXISTS players_role_check;

ALTER TABLE players 
ADD CONSTRAINT players_role_check 
CHECK (role IN ('player', 'secretary', 'treasurer', 'admin', 'fixture_manager'));

-- RLS Policies

-- Enable RLS on all tables
ALTER TABLE opponent_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE opponent_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoresheets ENABLE ROW LEVEL SECURITY;

-- Opponent teams policies
CREATE POLICY "Anyone can view opponent teams" 
  ON opponent_teams FOR SELECT 
  USING (true);

CREATE POLICY "Only admins and fixture managers can insert opponent teams" 
  ON opponent_teams FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM players 
      WHERE id::text = auth.uid()::text 
      AND role IN ('admin', 'fixture_manager')
    )
  );

CREATE POLICY "Only admins and fixture managers can update opponent teams" 
  ON opponent_teams FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM players 
      WHERE id::text = auth.uid()::text 
      AND role IN ('admin', 'fixture_manager')
    )
  );

-- Opponent players policies
CREATE POLICY "Anyone can view opponent players" 
  ON opponent_players FOR SELECT 
  USING (true);

CREATE POLICY "Only admins and fixture managers can insert opponent players" 
  ON opponent_players FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM players 
      WHERE id::text = auth.uid()::text 
      AND role IN ('admin', 'fixture_manager')
    )
  );

CREATE POLICY "Only admins and fixture managers can update opponent players" 
  ON opponent_players FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM players 
      WHERE id::text = auth.uid()::text 
      AND role IN ('admin', 'fixture_manager')
    )
  );

-- Scoresheets policies
CREATE POLICY "Anyone can view approved scoresheets" 
  ON scoresheets FOR SELECT 
  USING (approved = true);

CREATE POLICY "Uploader can view their own scoresheets" 
  ON scoresheets FOR SELECT 
  USING (auth.uid() = uploaded_by);

CREATE POLICY "Only admins and fixture managers can view all scoresheets" 
  ON scoresheets FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM players 
      WHERE id::text = auth.uid()::text 
      AND role IN ('admin', 'fixture_manager')
    )
  );

CREATE POLICY "Only admins and fixture managers can insert scoresheets" 
  ON scoresheets FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM players 
      WHERE id::text = auth.uid()::text 
      AND role IN ('admin', 'fixture_manager')
    )
  );

CREATE POLICY "Only admins and fixture managers can update scoresheets" 
  ON scoresheets FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM players 
      WHERE id::text = auth.uid()::text 
      AND role IN ('admin', 'fixture_manager')
    )
  );

-- Storage bucket policies
INSERT INTO storage.buckets (id, name, public) 
VALUES ('scoresheets', 'scoresheets', false) 
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can view scoresheet files" 
  ON storage.objects FOR SELECT 
  USING (
    auth.role() = 'authenticated' AND bucket_id = 'scoresheets'
  );

CREATE POLICY "Only admins and fixture managers can upload scoresheet files" 
  ON storage.objects FOR INSERT 
  WITH CHECK (
    auth.role() = 'authenticated' AND 
    bucket_id = 'scoresheets' AND
    EXISTS (
      SELECT 1 FROM players 
      WHERE id::text = auth.uid()::text 
      AND role IN ('admin', 'fixture_manager')
    )
  );
