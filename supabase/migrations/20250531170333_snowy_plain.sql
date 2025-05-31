/*
  # Fix block policies and UUID type

  1. Changes
    - Drop existing policies for clean slate
    - Update placed_by column to UUID type
    - Recreate policies with correct UUID comparison
  
  2. Security
    - Maintain RLS policies for blocks and worlds
    - Keep rate limiting functionality
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read worlds" ON worlds;
DROP POLICY IF EXISTS "Anyone can create worlds" ON worlds;
DROP POLICY IF EXISTS "Anyone can read blocks" ON blocks;
DROP POLICY IF EXISTS "Users can place blocks with rate limit" ON blocks;

-- Update placed_by column to UUID type if not already UUID
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'blocks' 
    AND column_name = 'placed_by' 
    AND data_type = 'text'
  ) THEN
    ALTER TABLE blocks ALTER COLUMN placed_by TYPE uuid USING placed_by::uuid;
  END IF;
END $$;

-- Recreate policies to work with anonymous users
CREATE POLICY "Anyone can read worlds"
ON worlds
FOR SELECT
USING (true);

CREATE POLICY "Anyone can create worlds"
ON worlds
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can read blocks"
ON blocks
FOR SELECT
USING (true);

CREATE POLICY "Users can place blocks with rate limit"
ON blocks
FOR INSERT
WITH CHECK (
  NOT EXISTS (
    SELECT 1
    FROM blocks blocks_1
    WHERE blocks_1.placed_by = auth.uid()
      AND blocks_1.placed_at > (now() - '00:00:01'::interval)
    GROUP BY blocks_1.placed_by
    HAVING count(*) >= 10
  )
);