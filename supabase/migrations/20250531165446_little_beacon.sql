/*
  # Initial Schema Setup

  1. Tables
    - `worlds` table for tracking 30-minute world cycles
    - `blocks` table for storing placed blocks
  
  2. Security
    - Enable RLS on both tables
    - Policies for reading and writing blocks
    - Service-role only world creation
*/

-- Create worlds table
CREATE TABLE IF NOT EXISTS worlds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP DEFAULT NOW(),
  reset_at TIMESTAMP NOT NULL,
  snapshot_url TEXT,
  total_blocks INTEGER DEFAULT 0,
  unique_builders INTEGER DEFAULT 0
);

-- Create blocks table
CREATE TABLE IF NOT EXISTS blocks (
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  block_type TEXT NOT NULL CHECK (block_type IN ('grass', 'water', 'stone', 'wood', 'house', 'tree')),
  placed_by TEXT NOT NULL,
  placed_at TIMESTAMP DEFAULT NOW(),
  world_id UUID REFERENCES worlds(id) ON DELETE CASCADE,
  PRIMARY KEY (x, y, world_id)
);

-- Enable RLS
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE worlds ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read blocks and worlds
CREATE POLICY "Anyone can read blocks"
  ON blocks FOR SELECT
  USING (true);

CREATE POLICY "Anyone can read worlds"
  ON worlds FOR SELECT
  USING (true);

-- Allow block placement with rate limiting
CREATE POLICY "Users can place blocks with rate limit"
  ON blocks FOR INSERT
  WITH CHECK (
    -- Check if user hasn't exceeded rate limit (10 blocks per second)
    NOT EXISTS (
      SELECT 1 FROM blocks
      WHERE placed_by = COALESCE(auth.uid()::text, request.headers()->>'x-anonymous-id')
      AND placed_at > NOW() - INTERVAL '1 second'
      GROUP BY placed_by
      HAVING COUNT(*) >= 10
    )
  );

-- Allow world creation (for admin functions only)
CREATE POLICY "Only service role can create worlds"
  ON worlds FOR INSERT
  WITH CHECK (auth.role() = 'service_role');