-- Add role column to players table
ALTER TABLE players ADD COLUMN role TEXT DEFAULT 'player';

-- Optionally, update existing admins to have role 'admin'
UPDATE players SET role = 'admin' WHERE is_admin = true;

-- Example: set secretary and treasurer manually (replace emails with real ones)
-- UPDATE players SET role = 'secretary' WHERE email = 'secretary@email.com';
-- UPDATE players SET role = 'treasurer' WHERE email = 'treasurer@email.com';
