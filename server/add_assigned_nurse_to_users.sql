-- Add assigned_nurse_id column to users table for doctor-nurse association
ALTER TABLE users ADD COLUMN IF NOT EXISTS assigned_nurse_id INTEGER;
ALTER TABLE users ADD CONSTRAINT fk_user_assigned_nurse FOREIGN KEY (assigned_nurse_id) REFERENCES users(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_assigned_nurse_id ON users(assigned_nurse_id);

