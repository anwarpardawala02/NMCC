-- Create a simplified register function with minimal fields
CREATE OR REPLACE FUNCTION simple_register(
  p_full_name text,
  p_email text,
  p_login_name text,
  p_password text
) 
RETURNS uuid AS $$
DECLARE
  new_player_id uuid;
BEGIN
  -- Insert new player with hashed password
  INSERT INTO players (
    full_name,
    email,
    login_name,
    password_hash,
    active,
    join_date
  ) VALUES (
    p_full_name,
    p_email,
    p_login_name,
    crypt(p_password, gen_salt('bf')),
    true,
    CURRENT_DATE
  )
  RETURNING id INTO new_player_id;
  
  RETURN new_player_id;
END;
$$ LANGUAGE plpgsql;
