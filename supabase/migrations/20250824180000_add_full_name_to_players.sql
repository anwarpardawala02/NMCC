-- Add full_name column to players table
ALTER TABLE players ADD COLUMN full_name TEXT NOT NULL DEFAULT '';
ALTER TABLE players DROP COLUMN name;
