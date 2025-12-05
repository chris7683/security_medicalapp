-- Security: Create a dedicated database user for the application
-- This user should have only the minimum required permissions

-- Step 1: Create the application user
CREATE USER healthcare_app WITH PASSWORD 'CHANGE_THIS_TO_STRONG_PASSWORD';

-- Step 2: Grant connection privilege
GRANT CONNECT ON DATABASE healthcare TO healthcare_app;

-- Step 3: Grant schema usage
GRANT USAGE ON SCHEMA public TO healthcare_app;

-- Step 4: Grant table permissions (for existing tables)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO healthcare_app;

-- Step 5: Grant sequence permissions (for auto-increment IDs)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO healthcare_app;

-- Step 6: Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO healthcare_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT USAGE, SELECT ON SEQUENCES TO healthcare_app;

-- Step 7: Revoke unnecessary permissions (if any)
-- The user should NOT have:
-- - CREATE privileges (prevents table creation)
-- - DROP privileges (prevents table deletion)
-- - ALTER privileges (prevents schema changes)
-- - SUPERUSER or CREATEDB privileges

-- Verify the user was created
SELECT usename, usecreatedb, usesuper 
FROM pg_user 
WHERE usename = 'healthcare_app';

-- To use this user, update your .env file:
-- POSTGRES_USER=healthcare_app
-- POSTGRES_PASSWORD=CHANGE_THIS_TO_STRONG_PASSWORD







