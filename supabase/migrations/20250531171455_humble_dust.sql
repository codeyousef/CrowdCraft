/*
  # Fix schema for block placement

  1. Changes
    - Make placed_by TEXT instead of UUID since we're using usernames
    - Add missing indexes for performance
    - Update RLS policies for anonymous access
*/

-- Drop existing tables if they exist
DROP TABLE IF EXISTS blocks;
DROP TABLE IF EXISTS worlds;

-- Create worlds table
CREATE TABLE worlds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  reset_at TIMESTAMPTZ NOT NULL,
  snapshot_url TEXT,
  total_blocks INTEGER DEFAULT 0,
  unique_builders INTEGER DEFAULT 0
);

-- Create blocks table
CREATE TABLE blocks (
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  block_type TEXT NOT NULL CHECK (block_type IN ('grass', 'water', 'stone', 'wood', 'house', 'tree')),
  placed_by TEXT NOT NULL,
  placed_at TIMESTAMPTZ DEFAULT now(),
  world_id UUID REFERENCES worlds(id) ON DELETE CASCADE,
  PRIMARY KEY (x, y, world_id)
);

-- Create index for block queries
CREATE INDEX idx_blocks_world_id ON blocks(world_id);
CREATE INDEX idx_blocks_placed_by_placed_at ON blocks(placed_by, placed_at);

-- Enable RLS
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE worlds ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read blocks"
  ON blocks FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert blocks"
  ON blocks FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read worlds"
  ON worlds FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create worlds"
  ON worlds FOR INSERT
  WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE blocks;