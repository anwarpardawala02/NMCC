-- Add skill column to players table
ALTER TABLE players ADD COLUMN skill TEXT CHECK (skill IN ('batsman', 'bowler', 'all-rounder')) DEFAULT 'batsman';

-- Optionally, update existing players with their skill (example):
-- UPDATE players SET skill = 'bowler' WHERE full_name = 'John Doe';
-- UPDATE players SET skill = 'all-rounder' WHERE full_name = 'Jane Smith';
-- UPDATE players SET skill = 'batsman' WHERE full_name = 'Another Player';
