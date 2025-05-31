/*
  # Fix world creation permissions

  1. Changes
    - Drop all existing world policies
    - Create new policies that allow both authenticated and anonymous users to create worlds
    - Enable realtime for worlds table

  2. Security
    - Anyone can read worlds
    - Both authenticated and anonymous users can create worlds
*/

-- Drop all existing world policies
DROP POLICY IF EXISTS "Anyone can read worlds" ON worlds;
DROP POLICY IF EXISTS "Anyone can insert worlds" ON worlds;
DROP POLICY IF EXISTS "Anyone can create worlds" ON worlds;
DROP POLICY IF EXISTS "Only service role can create worlds" ON worlds;

-- Create new policies with correct permissions
CREATE POLICY "Anyone can read worlds"
ON worlds
FOR SELECT
USING (true);

CREATE POLICY "Anyone can create worlds"
ON worlds
FOR INSERT
WITH CHECK (true);

-- Enable realtime for worlds table if not already enabled
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE worlds;
  END IF;
END $$;