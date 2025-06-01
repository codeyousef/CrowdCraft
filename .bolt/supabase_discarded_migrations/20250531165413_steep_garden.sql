/*
  # Set up authorization policies

  1. Security
    - Enable RLS on `blocks` and `worlds` tables
    - Add policies for authenticated and anonymous users
    - Set up rate limiting for block placement

  2. Changes
    - Add policies for block placement and reading
    - Add policies for world access
*/

-- Enable RLS
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE worlds ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read blocks and worlds
CREATE POLICY "Anyone can read blocks"
  ON blocks FOR SELECT
  USING (true);

CREATE POLICY "Anyone can read worlds"
  ON worlds FOR SELECT
  USING (true);

-- Allow block placement with rate limiting
CREATE POLICY "Users can place blocks with rate limit"
  ON blocks FOR INSERT
  WITH CHECK (
    -- Check if user hasn't exceeded rate limit (10 blocks per second)
    NOT EXISTS (
      SELECT 1 FROM blocks
      WHERE placed_by = COALESCE(auth.uid()::text, request.headers()->>'x-anonymous-id')
      AND placed_at > NOW() - INTERVAL '1 second'
      GROUP BY placed_by
      HAVING COUNT(*) >= 10
    )
  );

-- Allow world creation (for admin functions only)
CREATE POLICY "Only service role can create worlds"
  ON worlds FOR INSERT
  WITH CHECK (auth.role() = 'service_role');