/*
  # Enable anonymous authentication

  1. Changes
    - Enable anonymous authentication for the project
    - Update RLS policies to work with anonymous users
  
  2. Security
    - Anonymous users can read and create blocks
    - Anonymous users can read and create worlds
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read worlds" ON worlds;
DROP POLICY IF EXISTS "Anyone can create worlds" ON worlds;
DROP POLICY IF EXISTS "Anyone can read blocks" ON blocks;
DROP POLICY IF EXISTS "Users can place blocks with rate limit" ON blocks;

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