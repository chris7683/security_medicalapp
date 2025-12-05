-- Add 2FA fields to users table
-- This script adds two-factor authentication support to the users table

-- Add two_factor_secret column (stores the TOTP secret)
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255) NULL;

-- Add two_factor_enabled column (indicates if 2FA is enabled for the user)
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE;

-- Create index on two_factor_enabled for faster queries
CREATE INDEX IF NOT EXISTS idx_users_two_factor_enabled ON users(two_factor_enabled);

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('two_factor_secret', 'two_factor_enabled');

