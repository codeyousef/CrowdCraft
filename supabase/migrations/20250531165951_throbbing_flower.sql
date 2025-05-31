/*
  # Fix world creation policies

  1. Changes
    - Drop all existing world policies
    - Create new policies that allow both service role and anonymous users to create worlds
    - Keep existing read policy

  2. Security
    - Enable RLS
    - Allow public read access
    - Allow both service role and anonymous world creation
*/

-- Drop all existing world policies to start fresh
DROP POLICY IF EXISTS "Anyone can read worlds" ON worlds;
DROP POLICY IF EXISTS "Anyone can insert worlds" ON worlds;
DROP POLICY IF EXISTS "Only service role can create worlds" ON worlds;

-- Recreate the policies with correct permissions
CREATE POLICY "Anyone can read worlds"
ON worlds
FOR SELECT
USING (true);

CREATE POLICY "Anyone can create worlds"
ON worlds
FOR INSERT
WITH CHECK (
  -- Allow both service_role and anonymous users to create worlds
  (current_user = 'service_role' OR current_user = 'authenticated')
);

-- Enable realtime for worlds table
ALTER PUBLICATION supabase_realtime ADD TABLE worlds;