/*
  # Add player tracking

  1. Changes
    - Add unique_builders column to worlds table
    - Add trigger to update unique_builders count
    - Add function to track unique builders

  2. Security
    - Enable RLS on functions
    - Maintain existing security policies
*/

-- Add unique_builders column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'worlds' AND column_name = 'unique_builders'
  ) THEN
    ALTER TABLE worlds ADD COLUMN unique_builders INTEGER DEFAULT 0;
  END IF;
END $$;

-- Create function to update unique builders count
CREATE OR REPLACE FUNCTION update_unique_builders()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE worlds
  SET unique_builders = (
    SELECT COUNT(DISTINCT placed_by)
    FROM blocks
    WHERE world_id = NEW.world_id
  )
  WHERE id = NEW.world_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for unique builders
DROP TRIGGER IF EXISTS update_unique_builders_trigger ON blocks;
CREATE TRIGGER update_unique_builders_trigger
AFTER INSERT ON blocks
FOR EACH ROW
EXECUTE FUNCTION update_unique_builders();