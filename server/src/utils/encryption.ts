import crypto from 'crypto';

const algorithm = 'aes-256-gcm';
const keyLength = 32; // 256 bits
const ivLength = 16; // 128 bits
const saltLength = 64; // 64 bytes
const tagLength = 16; // 128 bits
const tagPosition = saltLength + ivLength;
const encryptedPosition = tagPosition + tagLength;

// Get encryption key from environment variable or generate a default (for development only)
function getEncryptionKey(): Buffer {
  const key = process.env.DATABASE_ENCRYPTION_KEY;
  
  if (!key) {
    // In development, warn about missing key
    if (process.env.NODE_ENV !== 'production') {
      console.warn('⚠️  DATABASE_ENCRYPTION_KEY not set. Using default key for development. DO NOT USE IN PRODUCTION!');
      // Default key for development (32 bytes)
      return Buffer.from('a'.repeat(32));
    }
    throw new Error('DATABASE_ENCRYPTION_KEY environment variable is required in production');
  }
  
  // Convert hex string to buffer, or use the key directly if it's base64
  try {
    if (key.length === 64) {
      // Assume hex string
      return Buffer.from(key, 'hex');
    } else if (key.length === 44) {
      // Assume base64 string
      return Buffer.from(key, 'base64');
    } else {
      // Derive key from string using PBKDF2
      return crypto.pbkdf2Sync(key, 'healthcare_salt', 100000, keyLength, 'sha256');
    }
  } catch (error) {
    throw new Error(`Invalid DATABASE_ENCRYPTION_KEY format: ${error}`);
  }
}

/**
 * Encrypts a string value using AES-256-GCM
 * @param text - The plain text to encrypt
 * @returns Encrypted string in format: salt + iv + tag + encryptedData (all base64 encoded)
 */
export function encrypt(text: string | null | undefined): string | null {
  if (!text || text === '') {
    return null;
  }
  
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(ivLength);
    const salt = crypto.randomBytes(saltLength);
    
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    cipher.setAAD(salt); // Additional authenticated data
    
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    const tag = cipher.getAuthTag();
    
    // Combine salt + iv + tag + encrypted data
    const combined = Buffer.concat([
      salt,
      iv,
      tag,
      Buffer.from(encrypted, 'base64')
    ]);
    
    return combined.toString('base64');
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error(`Encryption failed: ${error}`);
  }
}

/**
 * Decrypts an encrypted string
 * @param encryptedText - The encrypted string to decrypt
 * @returns Decrypted plain text string
 */
export function decrypt(encryptedText: string | null | undefined): string | null {
  if (!encryptedText || encryptedText === '') {
    return null;
  }
  
  try {
    const key = getEncryptionKey();
    const combined = Buffer.from(encryptedText, 'base64');
    
    // Extract components
    const salt = combined.subarray(0, saltLength);
    const iv = combined.subarray(saltLength, tagPosition);
    const tag = combined.subarray(tagPosition, encryptedPosition);
    const encrypted = combined.subarray(encryptedPosition);
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(tag);
    decipher.setAAD(salt);
    
    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    // If decryption fails, it might be plain text (for migration purposes)
    // Return null to indicate decryption failure
    return null;
  }
}

/**
 * Checks if a string is encrypted (has the expected format)
 * @param text - The text to check
 * @returns True if the text appears to be encrypted
 */
export function isEncrypted(text: string | null | undefined): boolean {
  if (!text || text === '') {
    return false;
  }
  
  try {
    const buffer = Buffer.from(text, 'base64');
    // Encrypted data should be at least salt + iv + tag length
    return buffer.length >= encryptedPosition;
  } catch {
    return false;
  }
}

/**
 * Generates a secure encryption key (for initial setup)
 * @returns A hex-encoded encryption key
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(keyLength).toString('hex');
}

