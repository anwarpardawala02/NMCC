-- Fix register_player function to handle parameters correctly
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
    password_hash,
    active,
    join_date
  ) VALUES (
    p_full_name,
    p_email,
    p_phone,
    crypt(p_password, gen_salt('bf')),
    true,
    CURRENT_DATE
  )
  RETURNING id INTO new_player_id;
  
  RETURN new_player_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
