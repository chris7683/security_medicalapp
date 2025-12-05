# Database Encryption Setup Guide

## Overview

This application implements **two layers of database encryption**:

1. **Transport Encryption (SSL/TLS)** - Encrypts data in transit between the application and database
2. **Field-Level Encryption (AES-256-GCM)** - Encrypts sensitive data at rest in the database

## Encrypted Fields

The following fields are automatically encrypted:

- **Patient Model:**
  - `name` - Patient name
  - `condition` - Medical condition

- **Medication Model:**
  - `name` - Medication name
  - `dosage` - Dosage information
  - `instructions` - Medication instructions

- **MedicationTracking Model:**
  - `notes` - Tracking notes

**Note:** Passwords are hashed using bcrypt (not encrypted), which is the recommended approach for passwords.

## Setup Instructions

### Step 1: Generate Encryption Key

Generate a secure encryption key for field-level encryption:

```bash
cd server
npm run generate-encryption-key
```

This will output a 64-character hex string. **Copy this key** and add it to your `.env` file.

### Step 2: Update Environment Variables

Add the following to your `server/.env` file:

```bash
# Database Encryption Key (64-character hex string)
DATABASE_ENCRYPTION_KEY=your_generated_key_here

# Database SSL/TLS Configuration (Optional)
# For development: Leave DB_SSL unset or set to false
# For production: Set DB_SSL=true
DB_SSL=false
DB_SSL_REQUIRE=false
DB_SSL_REJECT_UNAUTHORIZED=false

# If using SSL certificates:
# DB_SSL_CA=/path/to/ca-certificate.crt
# DB_SSL_CERT=/path/to/client-certificate.crt
# DB_SSL_KEY=/path/to/client-key.key
```

### Step 3: Encrypt Existing Data

If you have existing data in the database, encrypt it:

```bash
cd server
npm run encrypt-data
```

This script will:
- Check all existing records
- Encrypt unencrypted fields
- Skip already encrypted fields
- Display progress and results

### Step 4: Enable SSL/TLS (Production)

For production environments, enable SSL/TLS connections:

1. **Configure PostgreSQL for SSL:**
   - Generate SSL certificates
   - Configure PostgreSQL to require SSL connections
   - Update `postgresql.conf` to enable SSL

2. **Update `.env` file:**
   ```bash
   DB_SSL=true
   DB_SSL_REQUIRE=true
   DB_SSL_REJECT_UNAUTHORIZED=true
   ```

3. **Provide SSL certificates:**
   ```bash
   DB_SSL_CA=/path/to/ca-certificate.crt
   DB_SSL_CERT=/path/to/client-certificate.crt
   DB_SSL_KEY=/path/to/client-key.key
   ```

## How It Works

### Field-Level Encryption

1. **Encryption:** When data is saved to the database, sensitive fields are automatically encrypted using AES-256-GCM before storage.

2. **Decryption:** When data is retrieved from the database, encrypted fields are automatically decrypted transparently.

3. **Encryption Algorithm:** AES-256-GCM (Advanced Encryption Standard with Galois/Counter Mode)
   - 256-bit key
   - Authenticated encryption (prevents tampering)
   - Each encryption uses a unique IV (Initialization Vector)

### Transport Encryption (SSL/TLS)

1. **Connection Encryption:** All database connections can be encrypted using SSL/TLS.

2. **Certificate Validation:** The application can validate SSL certificates to prevent man-in-the-middle attacks.

## Security Features

✅ **AES-256-GCM Encryption** - Industry-standard encryption algorithm  
✅ **Unique IV per Encryption** - Each encryption uses a random IV  
✅ **Authenticated Encryption** - Prevents data tampering  
✅ **Automatic Encryption/Decryption** - Transparent to application code  
✅ **SSL/TLS Support** - Encrypts data in transit  
✅ **Key Management** - Encryption key stored in environment variables  

## Important Security Notes

⚠️ **Encryption Key Security:**
- Never commit the encryption key to version control
- Store the key securely (use a secrets manager in production)
- Rotate the key periodically
- Backup the key securely (you need it to decrypt data)

⚠️ **Key Loss:**
- If you lose the encryption key, **encrypted data cannot be recovered**
- Always backup your encryption key securely
- Consider using a key management service (KMS) in production

⚠️ **Production Deployment:**
- Generate a new encryption key for production (don't use development key)
- Enable SSL/TLS for database connections
- Use strong SSL certificates
- Store encryption key in a secure secrets manager
- Enable database-level encryption at rest (if supported by your database)

## Troubleshooting

### Error: "DATABASE_ENCRYPTION_KEY environment variable is required"

**Solution:** Add `DATABASE_ENCRYPTION_KEY` to your `.env` file.

### Error: "Decryption failed"

**Possible causes:**
1. Wrong encryption key
2. Data corrupted
3. Data was encrypted with a different key

**Solution:** Verify the encryption key matches the one used to encrypt the data.

### Existing Data Not Encrypted

**Solution:** Run the migration script:
```bash
npm run encrypt-data
```

### Performance Impact

Field-level encryption has minimal performance impact:
- Encryption/decryption is fast (milliseconds)
- Only sensitive fields are encrypted
- Automatic hooks handle encryption transparently

## Testing

To test encryption:

1. **Create a new patient:**
   ```bash
   # Data will be automatically encrypted
   POST /api/patients
   ```

2. **Query the database directly:**
   ```sql
   SELECT name, condition FROM patients;
   -- You should see encrypted (base64) data
   ```

3. **Query through the API:**
   ```bash
   GET /api/patients
   -- Data will be automatically decrypted
   ```

## Migration from Unencrypted to Encrypted

1. **Backup your database** (critical!)

2. **Generate encryption key:**
   ```bash
   npm run generate-encryption-key
   ```

3. **Add key to `.env` file**

4. **Run encryption script:**
   ```bash
   npm run encrypt-data
   ```

5. **Verify encryption:**
   - Check database directly (should see encrypted data)
   - Check API responses (should see decrypted data)

## Production Checklist

- [ ] Generate strong encryption key
- [ ] Store key in secure secrets manager
- [ ] Enable SSL/TLS for database connections
- [ ] Configure SSL certificates
- [ ] Encrypt all existing data
- [ ] Test encryption/decryption
- [ ] Backup encryption key securely
- [ ] Document key location and access
- [ ] Set up key rotation schedule
- [ ] Enable database-level encryption at rest (if available)

## Support

For issues or questions:
1. Check this documentation
2. Review error messages
3. Verify encryption key is correct
4. Check database connection logs
5. Verify SSL certificates (if using SSL)

