-- Drop existing function
DROP FUNCTION IF EXISTS check_player_password;

-- Create updated auth function
CREATE OR REPLACE FUNCTION check_player_password(p_login_name text, p_password text)
RETURNS TABLE (
  id uuid,
  full_name text,
  email text,
  role text,
  login_name text
) AS $$
DECLARE
  v_player record;
BEGIN
  -- Check if the login credentials are valid and get player details
  SELECT 
    p.id,
    p.full_name,
    p.email,
    p.role,
    p.login_name
  INTO v_player
  FROM players p
  WHERE p.login_name = p_login_name
    AND p.password_hash = crypt(p_password, p.password_hash)
    AND p.active = true;

  -- If we found a player, return their details and update last login
  IF v_player.id IS NOT NULL THEN
    UPDATE players 
    SET last_login = now() 
    WHERE id = v_player.id;

    RETURN QUERY 
    SELECT 
      v_player.id,
      v_player.full_name,
      v_player.email,
      v_player.role,
      v_player.login_name;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update security policies
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable access to active users"
  ON players
  FOR ALL
  TO authenticated
  USING (active = true);

CREATE POLICY "Allow update own profile"
  ON players
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON FUNCTION check_player_password TO anon, authenticated;
