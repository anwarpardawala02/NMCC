-- Create a very basic direct player insert function for testing
CREATE OR REPLACE FUNCTION direct_player_insert(
  p_full_name text,
  p_email text,
  p_phone text
) 
RETURNS uuid AS $$
DECLARE
  new_player_id uuid;
BEGIN
  -- Insert player with minimal fields - stick to the known columns from the schema
  INSERT INTO players (
    full_name,
    email,
    phone,
    active,
    join_date,
    role,
    is_admin
  ) VALUES (
    p_full_name,
    p_email,
    p_phone,
    true,
    CURRENT_DATE,
    'player',
    false
  )
  RETURNING id INTO new_player_id;
  
  RETURN new_player_id;
END;
$$ LANGUAGE plpgsql;
