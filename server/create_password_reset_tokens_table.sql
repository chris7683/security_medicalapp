-- Create password_reset_tokens table
-- This table stores OTPs for password reset functionality

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  otp VARCHAR(10) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);

-- Create index on otp for faster verification
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_otp ON password_reset_tokens(otp);

-- Create index on expires_at to help with cleanup of expired tokens
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- Create composite index for common query pattern (user_id + otp + used)
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_otp_used ON password_reset_tokens(user_id, otp, used);

-- Verify the table was created
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'password_reset_tokens'
ORDER BY ordinal_position;

