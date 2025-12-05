# Admin Credentials

## Healthcare Portal Admin Access

Use these credentials to log in as an administrator:

**Email:** `admin@healthcare.com`  
**Password:** `Admin123!@#`  
**Role:** `Admin`

---

## Setup Instructions

### Option 1: Create Admin User via SQL (Recommended)

1. Run the SQL script to create the admin user:
   ```bash
   psql -U postgres -d healthcare -f /Users/apple/security/server/create_admin.sql
   ```

2. Hash the password:
   ```bash
   cd /Users/apple/security/server
   npm run hash-passwords
   ```

### Option 2: Create Admin User via Admin Dashboard

1. Log in with any existing account
2. Navigate to Admin Dashboard (if you have admin access)
3. Create a new user with role "Admin"

### Option 3: Manual SQL Creation

```sql
-- Update role constraint if needed
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'doctor', 'nurse', 'patient'));

-- Insert admin (password will need to be hashed)
INSERT INTO users (username, email, password, role) 
VALUES ('Admin', 'admin@healthcare.com', 'Admin123!@#', 'admin');
```

Then run:
```bash
cd /Users/apple/security/server
npm run hash-passwords
```

---

## Login Steps

1. Navigate to the login page
2. Select **Role: Admin** from the dropdown
3. Enter:
   - **Email:** `admin@healthcare.com`
   - **Password:** `Admin123!@#`
4. Click "Login"

---

## Admin Features

Once logged in as admin, you can:

- ✅ Create, view, and delete users (doctors, nurses, patients, admins)
- ✅ Assign doctors and nurses to patients
- ✅ Remove doctor/nurse assignments from patients
- ✅ Manage all user accounts

---

## Security Notes

- Change the default password after first login
- Keep admin credentials secure
- Only share with authorized personnel
- The password is hashed using bcrypt (salt rounds: 10)

