/*
  # Add snapshot_url column to worlds table

  1. Changes
    - Add snapshot_url column to worlds table
    - Update existing worlds to have NULL snapshot_url
  
  2. Security
    - No changes to RLS policies needed
    - Maintains existing security model
*/

-- Add snapshot_url column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'worlds' AND column_name = 'snapshot_url'
  ) THEN
    ALTER TABLE worlds ADD COLUMN snapshot_url text;
  END IF;
END $$;