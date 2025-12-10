-- Create login_otps table for storing OTP codes during login
CREATE TABLE IF NOT EXISTS login_otps (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  otp VARCHAR(10) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email and otp for faster lookups
CREATE INDEX IF NOT EXISTS idx_login_otps_email ON login_otps(email);
CREATE INDEX IF NOT EXISTS idx_login_otps_otp ON login_otps(otp);
CREATE INDEX IF NOT EXISTS idx_login_otps_user_id ON login_otps(user_id);

-- Create index on expires_at for cleanup of expired OTPs
CREATE INDEX IF NOT EXISTS idx_login_otps_expires_at ON login_otps(expires_at);

-- Add comment
COMMENT ON TABLE login_otps IS 'Stores temporary OTP codes sent via email during login process';

