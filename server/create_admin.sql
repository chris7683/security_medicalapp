-- Create Admin User
-- Password: Admin123!@#
-- new password: AdminAA123@
-- Email: admin@healthcare.com
-- Username: Admin

-- First, make sure the role constraint includes 'admin'
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'doctor', 'nurse', 'patient'));

-- Insert admin user (password is plain text, will be hashed by the application)
INSERT INTO users (username, email, password, role) 
VALUES ('Admin', 'admin@healthcare.com', 'Admin123!@#', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Note: After inserting, you need to hash the password using:
-- cd server && npm run hash-passwords

