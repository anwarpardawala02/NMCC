-- Add login_name column to players table
ALTER TABLE players ADD COLUMN login_name text UNIQUE;

-- Create index for login_name
CREATE INDEX IF NOT EXISTS players_login_name_idx ON players (login_name);

-- Update the check_player_password function to use login_name
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
    AND password_hash = crypt(p_password, p.password_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the register_player function to use login_name
CREATE OR REPLACE FUNCTION register_player(
  p_full_name text,
  p_email text,
  p_phone text,
  p_login_name text,
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
  
  -- Check if login_name already exists
  IF EXISTS (SELECT 1 FROM players WHERE login_name = p_login_name) THEN
    RAISE EXCEPTION 'This username is already taken';
  END IF;
  
  -- Insert new player with hashed password
  INSERT INTO players (
    full_name,
    email,
    phone,
    login_name,
    password_hash,
    active,
    join_date
  ) VALUES (
    p_full_name,
    p_email,
    p_phone,
    p_login_name,
    crypt(p_password, gen_salt('bf')),
    true,
    CURRENT_DATE
  )
  RETURNING id INTO new_player_id;
  
  RETURN new_player_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update password reset functions to use login_name
CREATE OR REPLACE FUNCTION create_password_reset_token(p_login_name text) 
RETURNS text AS $$
DECLARE
  v_token text;
BEGIN
  -- Generate a random token
  v_token := encode(gen_random_bytes(32), 'hex');
  
  -- Store the token and set expiration (24 hours)
  UPDATE players
  SET 
    password_reset_token = v_token,
    password_reset_expires = now() + interval '24 hours'
  WHERE 
    login_name = p_login_name
    AND active = true;
    
  -- Check if player was found and updated
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active player found with that login name';
  END IF;
  
  RETURN v_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update reset_password_with_token function
CREATE OR REPLACE FUNCTION reset_password_with_token(p_token text, p_new_password text)
RETURNS boolean AS $$
BEGIN
  -- Update password if token is valid and not expired
  UPDATE players
  SET 
    password_hash = crypt(p_new_password, gen_salt('bf')),
    password_reset_token = null,
    password_reset_expires = null
  WHERE 
    password_reset_token = p_token
    AND password_reset_expires > now()
    AND active = true;
    
  -- Check if a row was updated
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired token';
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the change_password function
CREATE OR REPLACE FUNCTION change_player_password(
  p_player_id uuid,
  p_old_password text,
  p_new_password text
)
RETURNS boolean AS $$
BEGIN
  -- Check if old password is correct and update if it is
  UPDATE players
  SET password_hash = crypt(p_new_password, gen_salt('bf'))
  WHERE 
    id = p_player_id
    AND password_hash = crypt(p_old_password, password_hash);
    
  -- Check if a player was found and updated
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
