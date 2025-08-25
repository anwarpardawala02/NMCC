-- Drop existing function
DROP FUNCTION IF EXISTS check_player_password(p_email text, p_password text);

-- Create updated function using login_name
CREATE OR REPLACE FUNCTION check_player_password(p_login_name text, p_password text)
RETURNS TABLE (
  id uuid,
  full_name text,
  email text,
  is_admin boolean,
  role text,
  login_name text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.email,
    p.is_admin,
    p.role,
    p.login_name
  FROM 
    players p
  WHERE 
    p.login_name = p_login_name
    AND p.password_hash = crypt(p_password, p.password_hash)
    AND p.active = true;
    
  -- Update last login time if successful
  UPDATE players 
  SET last_login = now() 
  WHERE login_name = p_login_name 
    AND password_hash = crypt(p_password, password_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
