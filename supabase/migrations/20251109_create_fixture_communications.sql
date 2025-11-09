-- Create table for tracking WhatsApp communications
CREATE TABLE IF NOT EXISTS fixture_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_id UUID NOT NULL REFERENCES fixtures(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL, -- Phone number or player ID
  message_type VARCHAR(50) NOT NULL DEFAULT 'whatsapp', -- 'whatsapp', 'sms', etc
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed'
  twilio_message_sid TEXT UNIQUE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_fixture_communications_fixture 
ON fixture_communications(fixture_id);

CREATE INDEX IF NOT EXISTS idx_fixture_communications_player 
ON fixture_communications(player_id);

CREATE INDEX IF NOT EXISTS idx_fixture_communications_status 
ON fixture_communications(status);

CREATE INDEX IF NOT EXISTS idx_fixture_communications_created 
ON fixture_communications(created_at);

-- Enable Row Level Security
ALTER TABLE fixture_communications ENABLE ROW LEVEL SECURITY;

-- Create policies for fixture_communications
-- Allow anyone to read (for viewing poll status)
CREATE POLICY "Allow read access to fixture_communications" 
ON fixture_communications 
FOR SELECT 
USING (true);

-- Allow service role to insert
CREATE POLICY "Allow service role to insert fixture_communications" 
ON fixture_communications 
FOR INSERT 
WITH CHECK (true);

-- Allow service role to update
CREATE POLICY "Allow service role to update fixture_communications" 
ON fixture_communications 
FOR UPDATE 
USING (true);
