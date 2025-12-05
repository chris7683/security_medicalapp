-- Fix foreign key constraint on password_reset_tokens to allow CASCADE delete
-- This allows users to be deleted even if they have password reset tokens

-- Drop the existing constraint
ALTER TABLE password_reset_tokens
DROP CONSTRAINT IF EXISTS password_reset_tokens_user_id_fkey;

-- Recreate the constraint with ON DELETE CASCADE
ALTER TABLE password_reset_tokens
ADD CONSTRAINT password_reset_tokens_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES users(id)
ON UPDATE CASCADE
ON DELETE CASCADE;

