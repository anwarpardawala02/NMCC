/*
  # Complete Schema for Northolt Manor Cricket Club

  1. New Tables
    - `players` - Player registration and information
    - `photos` - Gallery photos with metadata
    - `blogs` - Blog posts for club news
    - `sponsors` - Club sponsors information
    - `categories` - Financial transaction categories
    - `transactions` - Financial records
    - `matches` - Scheduled matches
    - `match_availability` - Player availability for matches
    - `player_statistics` - Player performance statistics
    - `polls` - General polls for club decisions

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for each table
    - Ensure proper access control

  3. Storage
    - Create buckets for photos and logos
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Players table
CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text NOT NULL,
  photo_url text,
  join_date date DEFAULT CURRENT_DATE,
  active boolean DEFAULT true,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Photos table for gallery
CREATE TABLE IF NOT EXISTS photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  url text NOT NULL,
  description text,
  uploaded_by uuid REFERENCES players(id),
  uploaded_at timestamptz DEFAULT now()
);

-- Blog posts
CREATE TABLE IF NOT EXISTS blogs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  excerpt text,
  featured_image text,
  author_id uuid REFERENCES players(id),
  published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Sponsors
CREATE TABLE IF NOT EXISTS sponsors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  website_url text,
  description text,
  tier text CHECK (tier IN ('platinum', 'gold', 'silver', 'bronze')) DEFAULT 'bronze',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Financial categories
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  kind text CHECK (kind IN ('revenue', 'expense')) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Financial transactions
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid REFERENCES players(id),
  category_id uuid REFERENCES categories(id) NOT NULL,
  kind text CHECK (kind IN ('revenue', 'expense')) NOT NULL,
  amount decimal(10,2) NOT NULL,
  occurred_on date NOT NULL,
  notes text,
  created_by uuid REFERENCES players(id),
  created_at timestamptz DEFAULT now()
);

-- Matches
CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opponent text NOT NULL,
  match_date date NOT NULL,
  match_time time,
  venue text NOT NULL,
  match_type text CHECK (match_type IN ('league', 'friendly', 'cup', 'tournament')) DEFAULT 'league',
  home_away text CHECK (home_away IN ('home', 'away')) NOT NULL,
  status text CHECK (status IN ('scheduled', 'completed', 'cancelled')) DEFAULT 'scheduled',
  created_at timestamptz DEFAULT now()
);

-- Match availability
CREATE TABLE IF NOT EXISTS match_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid REFERENCES matches(id) ON DELETE CASCADE,
  player_id uuid REFERENCES players(id) ON DELETE CASCADE,
  available boolean NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(match_id, player_id)
);

-- Player statistics
CREATE TABLE IF NOT EXISTS player_statistics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid REFERENCES players(id) ON DELETE CASCADE,
  season text NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::text,
  matches_played integer DEFAULT 0,
  runs_scored integer DEFAULT 0,
  balls_faced integer DEFAULT 0,
  fours integer DEFAULT 0,
  sixes integer DEFAULT 0,
  wickets_taken integer DEFAULT 0,
  overs_bowled decimal(4,1) DEFAULT 0,
  runs_conceded integer DEFAULT 0,
  catches integer DEFAULT 0,
  stumpings integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(player_id, season)
);

-- General polls
CREATE TABLE IF NOT EXISTS polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  options jsonb NOT NULL, -- Array of poll options
  votes jsonb DEFAULT '{}', -- Object mapping player_id to selected option
  created_by uuid REFERENCES players(id),
  expires_at timestamptz,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Insert default categories
INSERT INTO categories (name, kind) VALUES
  ('Membership Fees', 'revenue'),
  ('Match Fees', 'revenue'),
  ('Fundraising', 'revenue'),
  ('Sponsorship', 'revenue'),
  ('Equipment', 'expense'),
  ('Ground Maintenance', 'expense'),
  ('Travel', 'expense'),
  ('Refreshments', 'expense'),
  ('Insurance', 'expense'),
  ('League Fees', 'expense')
ON CONFLICT DO NOTHING;

-- Enable Row Level Security
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Players policies
CREATE POLICY "Players can read all player data" ON players FOR SELECT TO authenticated USING (true);
CREATE POLICY "Players can update own data" ON players FOR UPDATE TO authenticated USING (auth.uid()::text = id::text);
CREATE POLICY "Anyone can register as player" ON players FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Admins can manage players" ON players FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM players WHERE id::text = auth.uid()::text AND is_admin = true)
);

-- Photos policies
CREATE POLICY "Anyone can view photos" ON photos FOR SELECT TO anon USING (true);
CREATE POLICY "Authenticated users can upload photos" ON photos FOR INSERT TO authenticated WITH CHECK (
  uploaded_by::text = auth.uid()::text
);
CREATE POLICY "Users can update own photos" ON photos FOR UPDATE TO authenticated USING (
  uploaded_by::text = auth.uid()::text
);

-- Blogs policies
CREATE POLICY "Anyone can read published blogs" ON blogs FOR SELECT TO anon USING (published = true);
CREATE POLICY "Authenticated users can read all blogs" ON blogs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authors can manage own blogs" ON blogs FOR ALL TO authenticated USING (
  author_id::text = auth.uid()::text
);
CREATE POLICY "Admins can manage all blogs" ON blogs FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM players WHERE id::text = auth.uid()::text AND is_admin = true)
);

-- Sponsors policies
CREATE POLICY "Anyone can view active sponsors" ON sponsors FOR SELECT TO anon USING (active = true);
CREATE POLICY "Admins can manage sponsors" ON sponsors FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM players WHERE id::text = auth.uid()::text AND is_admin = true)
);

-- Categories policies
CREATE POLICY "Anyone can view categories" ON categories FOR SELECT TO anon USING (true);
CREATE POLICY "Admins can manage categories" ON categories FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM players WHERE id::text = auth.uid()::text AND is_admin = true)
);

-- Transactions policies
CREATE POLICY "Admins can manage transactions" ON transactions FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM players WHERE id::text = auth.uid()::text AND is_admin = true)
);

-- Matches policies
CREATE POLICY "Anyone can view matches" ON matches FOR SELECT TO anon USING (true);
CREATE POLICY "Admins can manage matches" ON matches FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM players WHERE id::text = auth.uid()::text AND is_admin = true)
);

-- Match availability policies
CREATE POLICY "Players can view match availability" ON match_availability FOR SELECT TO authenticated USING (true);
CREATE POLICY "Players can manage own availability" ON match_availability FOR ALL TO authenticated USING (
  player_id::text = auth.uid()::text
);
CREATE POLICY "Admins can manage all availability" ON match_availability FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM players WHERE id::text = auth.uid()::text AND is_admin = true)
);

-- Player statistics policies
CREATE POLICY "Anyone can view statistics" ON player_statistics FOR SELECT TO anon USING (true);
CREATE POLICY "Admins can manage statistics" ON player_statistics FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM players WHERE id::text = auth.uid()::text AND is_admin = true)
);

-- Polls policies
CREATE POLICY "Authenticated users can view polls" ON polls FOR SELECT TO authenticated USING (active = true);
CREATE POLICY "Authenticated users can vote" ON polls FOR UPDATE TO authenticated USING (active = true);
CREATE POLICY "Admins can manage polls" ON polls FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM players WHERE id::text = auth.uid()::text AND is_admin = true)
);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('club-photos', 'club-photos', true),
  ('logos', 'logos', true),
  ('blog-images', 'blog-images', true)
ON CONFLICT DO NOTHING;

-- Storage policies
CREATE POLICY "Anyone can view club photos" ON storage.objects FOR SELECT USING (bucket_id = 'club-photos');
CREATE POLICY "Authenticated users can upload club photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'club-photos');

CREATE POLICY "Anyone can view logos" ON storage.objects FOR SELECT USING (bucket_id = 'logos');
CREATE POLICY "Admins can upload logos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'logos' AND 
  EXISTS (SELECT 1 FROM players WHERE id::text = auth.uid()::text AND is_admin = true)
);

CREATE POLICY "Anyone can view blog images" ON storage.objects FOR SELECT USING (bucket_id = 'blog-images');
CREATE POLICY "Authenticated users can upload blog images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'blog-images');