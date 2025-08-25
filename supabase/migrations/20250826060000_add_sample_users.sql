-- Clear any existing data
TRUNCATE TABLE players CASCADE;

-- Insert sample players with proper password hashing
INSERT INTO players (
  full_name,
  email,
  phone,
  role,
  login_name,
  password_hash,
  active
)
VALUES 
(
  'Anwar Pardawala',
  'anwar@example.com',
  '1234567890',
  'admin',
  'anwar_pardawala',
  crypt('password123', gen_salt('bf')),
  true
),
(
  'John Smith',
  'john@example.com',
  '2345678901',
  'player',
  'john_smith',
  crypt('password123', gen_salt('bf')),
  true
),
(
  'Mike Johnson',
  'mike@example.com',
  '3456789012',
  'player',
  'mike_johnson',
  crypt('password123', gen_salt('bf')),
  true
)
ON CONFLICT (login_name) DO NOTHING;
