-- Add password support and authentication fields to players table
ALTER TABLE players ADD COLUMN password_hash text;
ALTER TABLE players ADD COLUMN password_reset_token text;
ALTER TABLE players ADD COLUMN password_reset_expires timestamptz;
ALTER TABLE players ADD COLUMN last_login timestamptz;

-- Ensure players have proper indexes for authentication
CREATE INDEX IF NOT EXISTS players_email_idx ON players (email);
CREATE INDEX IF NOT EXISTS players_role_idx ON players (role);

-- Function to check player password
CREATE OR REPLACE FUNCTION check_player_password(p_email text, p_password text)
RETURNS TABLE (
  id uuid,
  full_name text,
  email text,
  is_admin boolean,
  role text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.email,
    p.is_admin,
    p.role
  FROM 
    players p
  WHERE 
    p.email = p_email
    AND p.password_hash = crypt(p_password, p.password_hash)
    AND p.active = true;
    
  -- Update last login time if successful
  UPDATE players 
  SET last_login = now() 
  WHERE email = p_email 
    AND password_hash = crypt(p_password, p.password_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to register a new player
CREATE OR REPLACE FUNCTION register_player(
  p_full_name text,
  p_email text,
  p_phone text,
  p_password text
) 
RETURNS uuid AS $$
DECLARE
  new_player_id uuid;
BEGIN
  -- Check if email already exists
  IF EXISTS (SELECT 1 FROM players WHERE email = p_email) THEN
    RAISE EXCEPTION 'A player with this email already exists';
  END IF;
  
  -- Insert new player with hashed password
  INSERT INTO players (
    full_name,
    email,
    phone,
    password_hash
  ) VALUES (
    p_full_name,
    p_email,
    p_phone,
    crypt(p_password, gen_salt('bf'))
  )
  RETURNING id INTO new_player_id;
  
  RETURN new_player_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to change player password
CREATE OR REPLACE FUNCTION change_player_password(
  p_player_id uuid,
  p_old_password text,
  p_new_password text
)
RETURNS boolean AS $$
DECLARE
  password_matches boolean;
BEGIN
  -- Check if old password matches
  SELECT EXISTS (
    SELECT 1 
    FROM players 
    WHERE id = p_player_id 
      AND password_hash = crypt(p_old_password, password_hash)
  ) INTO password_matches;
  
  -- If old password matches, update to new password
  IF password_matches THEN
    UPDATE players
    SET password_hash = crypt(p_new_password, gen_salt('bf'))
    WHERE id = p_player_id;
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a password reset token
CREATE OR REPLACE FUNCTION create_password_reset_token(p_email text)
RETURNS text AS $$
DECLARE
  reset_token text;
BEGIN
  -- Generate a random token
  reset_token := encode(gen_random_bytes(32), 'hex');
  
  -- Check if email exists
  IF NOT EXISTS (SELECT 1 FROM players WHERE email = p_email AND active = true) THEN
    RETURN NULL;
  END IF;
  
  -- Set the reset token and expiration (24 hours from now)
  UPDATE players
  SET 
    password_reset_token = reset_token,
    password_reset_expires = now() + interval '24 hours'
  WHERE 
    email = p_email
    AND active = true;
    
  RETURN reset_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset password using token
CREATE OR REPLACE FUNCTION reset_password_with_token(
  p_token text,
  p_new_password text
)
RETURNS boolean AS $$
BEGIN
  -- Check if token exists and is not expired
  IF EXISTS (
    SELECT 1 
    FROM players 
    WHERE 
      password_reset_token = p_token
      AND password_reset_expires > now()
      AND active = true
  ) THEN
    -- Update password and clear token
    UPDATE players
    SET 
      password_hash = crypt(p_new_password, gen_salt('bf')),
      password_reset_token = NULL,
      password_reset_expires = NULL
    WHERE 
      password_reset_token = p_token
      AND password_reset_expires > now();
      
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
