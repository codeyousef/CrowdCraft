-- Fix missing INSERT policy for world_snapshots table
-- This allows snapshot data to be saved during world resets

CREATE POLICY "Anyone can insert world snapshots"
ON world_snapshots
FOR INSERT
WITH CHECK (true);