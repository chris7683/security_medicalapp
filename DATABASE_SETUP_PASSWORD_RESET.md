# Database Setup Commands for Password Reset Feature

## Prerequisites
Make sure PostgreSQL is running and you have access to the database.

## Step 1: Connect to PostgreSQL Database

### Option A: Using psql command line
```bash
psql -U postgres -d healthcare
```

### Option B: If you need to specify host and port
```bash
psql -h localhost -p 5432 -U postgres -d healthcare
```

### Option C: Using environment variables from .env
```bash
# From the server directory
cd server
psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d $POSTGRES_DB
```

## Step 2: Run the Migration Script

### Option A: From command line (without entering psql)
```bash
psql -U postgres -d healthcare -f server/create_password_reset_tokens_table.sql
```

### Option B: From the project root directory
```bash
psql -U postgres -d healthcare -f ./server/create_password_reset_tokens_table.sql
```

### Option C: If you're already in psql session
```sql
\i server/create_password_reset_tokens_table.sql
```

### Option D: Copy and paste the SQL directly
```bash
psql -U postgres -d healthcare << EOF
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  otp VARCHAR(10) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_otp ON password_reset_tokens(otp);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_otp_used ON password_reset_tokens(user_id, otp, used);
EOF
```

## Step 3: Verify the Table Was Created

### Check if table exists
```bash
psql -U postgres -d healthcare -c "\d password_reset_tokens"
```

### Or in psql session:
```sql
\d password_reset_tokens
```

### Check table structure
```bash
psql -U postgres -d healthcare -c "SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'password_reset_tokens' ORDER BY ordinal_position;"
```

### Verify indexes
```bash
psql -U postgres -d healthcare -c "\d+ password_reset_tokens"
```

## Step 4: Test the Table (Optional)

### Insert a test record (if you have a user with id=1)
```sql
INSERT INTO password_reset_tokens (user_id, otp, expires_at, used) 
VALUES (1, '123456', NOW() + INTERVAL '15 minutes', false);
```

### Query test record
```sql
SELECT * FROM password_reset_tokens WHERE user_id = 1;
```

### Clean up test record
```sql
DELETE FROM password_reset_tokens WHERE user_id = 1 AND otp = '123456';
```

## Troubleshooting

### If you get "permission denied" error:
```bash
# Make sure you're using the correct user
psql -U postgres -d healthcare
```

### If database doesn't exist:
```bash
# Create the database first
createdb -U postgres healthcare
```

### If you need to drop and recreate the table (CAUTION: This deletes all data):
```sql
DROP TABLE IF EXISTS password_reset_tokens CASCADE;
```
Then run the migration script again.

### Check PostgreSQL connection:
```bash
psql -U postgres -d healthcare -c "SELECT version();"
```

## Quick One-Liner (Recommended)

From the project root directory:
```bash
psql -U postgres -d healthcare -f server/create_password_reset_tokens_table.sql && echo "✅ Password reset tokens table created successfully!"
```

