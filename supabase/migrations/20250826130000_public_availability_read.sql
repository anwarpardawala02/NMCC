-- Read-only helper to expose availability with player names safely
-- Allows viewing fixture availability without direct SELECT on players table

CREATE OR REPLACE FUNCTION public.get_fixture_availability(p_fixture_id uuid)
RETURNS TABLE (
  id uuid,
  fixture_id uuid,
  player_id uuid,
  status text,
  responded_on timestamp,
  player_full_name text,
  player_photo_url text
) AS $$
  SELECT a.id,
         a.fixture_id,
         a.player_id,
         a.status,
         a.responded_on,
         p.full_name AS player_full_name,
         p.photo_url AS player_photo_url
  FROM public.availability a
  JOIN public.players p ON p.id = a.player_id
  WHERE a.fixture_id = p_fixture_id
$$ LANGUAGE sql SECURITY DEFINER;

-- Allow both anon and authenticated to execute (view-only)
GRANT EXECUTE ON FUNCTION public.get_fixture_availability(uuid) TO anon, authenticated;
