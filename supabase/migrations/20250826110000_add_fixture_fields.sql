-- Update matches table to support fixtures
ALTER TABLE matches ADD COLUMN IF NOT EXISTS fixture_date date NOT NULL;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS fixture_time time;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS venue text NOT NULL;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS home_away text CHECK (home_away IN ('home', 'away')) NOT NULL;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS status text CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')) DEFAULT 'scheduled';
ALTER TABLE matches ADD COLUMN IF NOT EXISTS notes text;

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS matches_fixture_date_idx ON matches (fixture_date);
CREATE INDEX IF NOT EXISTS matches_status_idx ON matches (status);
