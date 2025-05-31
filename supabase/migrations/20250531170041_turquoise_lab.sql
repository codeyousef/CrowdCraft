/*
  # Fix world policies

  1. Changes
    - Drop existing world policies
    - Create new policies for read and insert access
    
  2. Security
    - Allow public read access
    - Allow public insert access
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
WITH CHECK ((CURRENT_USER = 'service_role'::name) OR (CURRENT_USER = 'authenticated'::name));