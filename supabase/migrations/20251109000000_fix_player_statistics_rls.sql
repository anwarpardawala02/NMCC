-- Fix RLS policies on player_statistics table
-- This migration ensures authenticated users can read player statistics

-- First, check if RLS is enabled and disable if needed for public read access
-- Or add appropriate policies

-- Enable RLS if not already enabled
ALTER TABLE player_statistics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read" ON player_statistics;
DROP POLICY IF EXISTS "Allow anon to read" ON player_statistics;
DROP POLICY IF EXISTS "Public read access" ON player_statistics;

-- Create policy for authenticated users to read all player statistics
CREATE POLICY "Allow authenticated read"
  ON player_statistics
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Create policy for anon users to read all player statistics
CREATE POLICY "Allow anon read"
  ON player_statistics
  FOR SELECT
  USING (auth.role() = 'anon');

-- Alternative: Allow public access (if you prefer)
-- CREATE POLICY "Public read access"
--   ON player_statistics
--   FOR SELECT
--   USING (true);