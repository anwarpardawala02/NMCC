-- Create a simple debug version of register_player to identify issues
CREATE OR REPLACE FUNCTION debug_register(
  p_full_name text,
  p_email text,
  p_phone text,
  p_login_name text,
  p_password text
) 
RETURNS text AS $$
BEGIN
  -- Return a simple debug message with all parameters
  RETURN 'Debug: ' || p_full_name || ', ' || p_email || ', ' || p_phone || ', ' || p_login_name || ', ' || p_password;
END;
$$ LANGUAGE plpgsql;

-- Make sure pgcrypto extension is installed
CREATE EXTENSION IF NOT EXISTS pgcrypto;
