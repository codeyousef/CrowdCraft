/*
  # Initial schema setup for CrowdCraft

  1. Tables
    - `worlds`
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `reset_at` (timestamp)
      - `snapshot_url` (text)
      - `total_blocks` (integer)
      - `unique_builders` (integer)
    - `blocks`
      - `x` (integer)
      - `y` (integer)
      - `block_type` (text)
      - `placed_by` (text)
      - `placed_at` (timestamp)
      - `world_id` (uuid, foreign key)

  2. Security
    - Enable RLS on both tables
    - Add policies for reading and inserting blocks
    - Add policies for reading and inserting worlds
*/

-- Create worlds table
CREATE TABLE worlds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reset_at TIMESTAMP WITH TIME ZONE NOT NULL,
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
  placed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  world_id UUID REFERENCES worlds(id) ON DELETE CASCADE,
  PRIMARY KEY (x, y, world_id)
);

-- Create index for blocks table to optimize queries by placed_by and placed_at
CREATE INDEX idx_blocks_placed_by_placed_at ON blocks (placed_by, placed_at);

-- Enable RLS
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE worlds ENABLE ROW LEVEL SECURITY;

-- Policies for blocks table
CREATE POLICY "Anyone can read blocks" ON blocks 
  FOR SELECT USING (true);

CREATE POLICY "Users can place blocks with rate limit" ON blocks 
  FOR INSERT 
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 
      FROM blocks blocks_1 
      WHERE blocks_1.placed_by = CURRENT_USER 
        AND blocks_1.placed_at > (now() - '00:00:01'::interval)
      GROUP BY blocks_1.placed_by 
      HAVING count(*) >= 10
    )
  );

-- Policies for worlds table
CREATE POLICY "Anyone can read worlds" ON worlds 
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert worlds" ON worlds 
  FOR INSERT 
  WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE blocks;