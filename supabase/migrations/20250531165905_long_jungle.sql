/*
  # Fix worlds table policies

  1. Changes
    - Drop existing insert policy
    - Create new insert policy with public access
  
  2. Security
    - Maintains public read access
    - Allows public insert access
*/

-- First drop the existing policy
DROP POLICY IF EXISTS "Anyone can insert worlds" ON worlds;

-- Create the insert policy again
CREATE POLICY "Anyone can insert worlds"
ON worlds
FOR INSERT
TO public
WITH CHECK (true);