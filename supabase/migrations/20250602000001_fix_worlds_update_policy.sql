-- Fix missing UPDATE policy for worlds table
-- This allows timelapses to be saved by updating the snapshot_url field

CREATE POLICY "Anyone can update worlds"
ON worlds
FOR UPDATE
USING (true)
WITH CHECK (true);