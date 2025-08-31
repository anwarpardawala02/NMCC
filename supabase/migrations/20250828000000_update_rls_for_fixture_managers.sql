-- Migration to update RLS policies for fixture managers
-- This will allow fixture managers to write to match_details and player_statistics tables

-- Note: We're using Supabase's built-in role system (authenticated, anon, etc.)
-- and checking against our app's roles table for permissions

-- Update or create RLS policies for match_details table
DROP POLICY IF EXISTS "Fixture Managers can insert match details" ON public.match_details;
CREATE POLICY "Fixture Managers can insert match details" 
ON public.match_details 
FOR INSERT 
TO authenticated 
WITH CHECK (
    auth.uid() IN (
        SELECT user_id FROM public.roles 
        WHERE role_name = 'fixture_manager' OR role_name = 'admin'
    )
);

DROP POLICY IF EXISTS "Fixture Managers can update match details" ON public.match_details;
CREATE POLICY "Fixture Managers can update match details" 
ON public.match_details 
FOR UPDATE 
TO authenticated 
USING (
    auth.uid() IN (
        SELECT user_id FROM public.roles 
        WHERE role_name = 'fixture_manager' OR role_name = 'admin'
    )
);

-- Update or create RLS policies for player_statistics table
DROP POLICY IF EXISTS "Fixture Managers can insert player statistics" ON public.player_statistics;
CREATE POLICY "Fixture Managers can insert player statistics" 
ON public.player_statistics 
FOR INSERT 
TO authenticated 
WITH CHECK (
    auth.uid() IN (
        SELECT user_id FROM public.roles 
        WHERE role_name = 'fixture_manager' OR role_name = 'admin'
    )
);

DROP POLICY IF EXISTS "Fixture Managers can update player statistics" ON public.player_statistics;
CREATE POLICY "Fixture Managers can update player statistics" 
ON public.player_statistics 
FOR UPDATE 
TO authenticated 
USING (
    auth.uid() IN (
        SELECT user_id FROM public.roles 
        WHERE role_name = 'fixture_manager' OR role_name = 'admin'
    )
);

-- Add policies for any other tables that might need to be accessed by the edge function
-- For example, teams, players, etc.

-- Enable RLS on tables if not already enabled
ALTER TABLE IF EXISTS public.match_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.player_statistics ENABLE ROW LEVEL SECURITY;
