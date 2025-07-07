-- Create table for tracking verified burn transactions
CREATE TABLE verified_burns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_address TEXT NOT NULL,
    tx_hash TEXT NOT NULL UNIQUE,
    burn_amount BIGINT NOT NULL,
    block_number BIGINT NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_verified_burns_user_address ON verified_burns(user_address);
CREATE INDEX idx_verified_burns_tx_hash ON verified_burns(tx_hash);
CREATE INDEX idx_verified_burns_verified_at ON verified_burns(verified_at);

-- RLS (Row Level Security)
ALTER TABLE verified_burns ENABLE ROW LEVEL SECURITY;

-- Policy to allow service role full access
CREATE POLICY "Service role can manage verified_burns" ON verified_burns
    FOR ALL USING (auth.role() = 'service_role');

-- Policy to allow users to read their own burns
CREATE POLICY "Users can read own verified_burns" ON verified_burns
    FOR SELECT USING (user_address = auth.jwt() ->> 'sub');