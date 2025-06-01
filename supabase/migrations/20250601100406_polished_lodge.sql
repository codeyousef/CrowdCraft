/*
  # Add started_at column to worlds table

  1. Changes
    - Add `started_at` column to `worlds` table to track when the first block was placed
    - Make `reset_at` nullable since it will be set when the first block is placed
    - Update existing worlds to have consistent timing

  2. Security
    - No changes to RLS policies needed
*/

-- Add started_at column
ALTER TABLE worlds
ADD COLUMN started_at timestamptz DEFAULT NULL;

-- Make reset_at nullable
ALTER TABLE worlds
ALTER COLUMN reset_at DROP NOT NULL;