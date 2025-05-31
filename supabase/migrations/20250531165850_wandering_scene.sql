/*
  # Fix worlds table RLS policies

  1. Changes
    - Add RLS policy to allow public insertion of worlds
    - Remove conflicting policy that restricted world creation to service role

  2. Security
    - Enable public insertion of worlds for game functionality
    - Maintain existing read access policy
*/

-- Remove the restrictive policy that's causing the error
DROP POLICY IF EXISTS "Only service role can create worlds" ON worlds;

-- Create a new policy that allows anyone to insert worlds
CREATE POLICY "Anyone can insert worlds"
ON worlds
FOR INSERT
TO public
WITH CHECK (true);

-- Note: We're keeping the existing read policy:
-- "Anyone can read worlds" ON worlds FOR SELECT USING (true)