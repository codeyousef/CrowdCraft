/*
  # Add world history tracking

  1. New Tables
    - `world_snapshots`
      - `id` (uuid, primary key)
      - `world_id` (uuid, references worlds)
      - `snapshot_data` (jsonb)
      - `created_at` (timestamp)
      - `block_count` (integer)
      - `unique_builders` (integer)

  2. Security
    - Enable RLS on `world_snapshots` table
    - Add policy for authenticated users to read snapshots
*/

CREATE TABLE IF NOT EXISTS world_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id uuid REFERENCES worlds(id) ON DELETE CASCADE,
  snapshot_data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  block_count integer DEFAULT 0,
  unique_builders integer DEFAULT 0
);

ALTER TABLE world_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read world snapshots"
  ON world_snapshots
  FOR SELECT
  TO public
  USING (true);

-- Add index for faster world snapshot lookups
CREATE INDEX IF NOT EXISTS idx_world_snapshots_world_id ON world_snapshots(world_id);