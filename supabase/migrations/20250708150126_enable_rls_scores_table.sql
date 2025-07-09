-- Enable Row Level Security on scores table
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies (in case they exist)
DROP POLICY IF EXISTS "Public read access for leaderboard" ON public.scores;
DROP POLICY IF EXISTS "Service role insert access" ON public.scores;

-- Policy: Allow public read access for leaderboard functionality
-- This allows anyone (including unauthenticated users) to view scores
CREATE POLICY "Public read access for leaderboard"
ON public.scores
FOR SELECT
TO public
USING (true);

-- Policy: Only service role can insert scores
-- This prevents direct client insertions and ensures scores only come through the API
CREATE POLICY "Service role insert access"
ON public.scores
FOR INSERT
TO service_role
WITH CHECK (true);

-- No update or delete policies - scores should be immutable once created