-- Fix foreign key constraint on refresh_tokens to allow CASCADE delete
-- This allows users to be deleted even if they have refresh tokens

-- Drop the existing constraint
ALTER TABLE refresh_tokens
DROP CONSTRAINT IF EXISTS refresh_tokens_user_id_fkey;

-- Recreate the constraint with ON DELETE CASCADE
ALTER TABLE refresh_tokens
ADD CONSTRAINT refresh_tokens_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES users(id)
ON UPDATE CASCADE
ON DELETE CASCADE;

