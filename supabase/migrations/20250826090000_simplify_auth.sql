-- Drop existing function
DROP FUNCTION IF EXISTS check_player_password;

-- Create a simpler password check function
CREATE OR REPLACE FUNCTION check_player_password(p_login_name text, p_password text)
RETURNS boolean AS $$
DECLARE
  v_count integer;
BEGIN
  -- Check if the login credentials are valid
  SELECT COUNT(*)
  INTO v_count
  FROM players p
  WHERE p.login_name = p_login_name
    AND p.password_hash = crypt(p_password, p.password_hash)
    AND p.active = true;

  -- Update last login time if successful
  IF v_count > 0 THEN
    UPDATE players 
    SET last_login = now() 
    WHERE login_name = p_login_name;
  END IF;

  RETURN v_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
