/*
  # Update database schema with existence checks

  1. Tables
    - Check if tables exist before creating
    - Add blocks and worlds tables if they don't exist
    - Add necessary indexes and constraints
  
  2. Security
    - Enable RLS on both tables
    - Add policies for read and write access
    - Configure rate limiting for block placement
*/

-- Only create tables if they don't exist
DO $$ 
BEGIN
  -- Create worlds table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'worlds') THEN
    CREATE TABLE worlds (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      reset_at TIMESTAMP WITH TIME ZONE NOT NULL,
      snapshot_url TEXT,
      total_blocks INTEGER DEFAULT 0,
      unique_builders INTEGER DEFAULT 0
    );
  END IF;

  -- Create blocks table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'blocks') THEN
    CREATE TABLE blocks (
      x INTEGER NOT NULL,
      y INTEGER NOT NULL,
      block_type TEXT NOT NULL CHECK (block_type IN ('grass', 'water', 'stone', 'wood', 'house', 'tree')),
      placed_by TEXT NOT NULL,
      placed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      world_id UUID REFERENCES worlds(id) ON DELETE CASCADE,
      PRIMARY KEY (x, y, world_id)
    );
  END IF;
END $$;

-- Create index if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_blocks_placed_by_placed_at'
  ) THEN
    CREATE INDEX idx_blocks_placed_by_placed_at ON blocks (placed_by, placed_at);
  END IF;
END $$;

-- Enable RLS (idempotent operations, safe to run multiple times)
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE worlds ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DO $$
BEGIN
  -- Blocks policies
  DROP POLICY IF EXISTS "Anyone can read blocks" ON blocks;
  DROP POLICY IF EXISTS "Users can place blocks with rate limit" ON blocks;
  
  -- Worlds policies
  DROP POLICY IF EXISTS "Anyone can read worlds" ON worlds;
  DROP POLICY IF EXISTS "Anyone can insert worlds" ON worlds;
END $$;

-- Create policies
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

CREATE POLICY "Anyone can read worlds" ON worlds 
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert worlds" ON worlds 
  FOR INSERT 
  WITH CHECK (true);

-- Enable realtime if publication exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE blocks;
  END IF;
END $$;