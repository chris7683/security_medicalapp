import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Generate self-signed SSL certificates for development
 * 
 * WARNING: These certificates are for DEVELOPMENT ONLY!
 * For production, use certificates from a trusted CA (Let's Encrypt, etc.)
 */

const certsDir = path.join(__dirname, '../certs');
const keyPath = path.join(certsDir, 'server.key');
const certPath = path.join(certsDir, 'server.crt');

console.log('🔐 Generating self-signed SSL certificates for development...\n');

// Create certs directory if it doesn't exist
if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir, { recursive: true });
  console.log(`✅ Created directory: ${certsDir}`);
}

// Check if certificates already exist
if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
  console.log('⚠️  Certificates already exist!');
  console.log(`   Key: ${keyPath}`);
  console.log(`   Cert: ${certPath}`);
  console.log('\n   To regenerate, delete these files first.\n');
  process.exit(0);
}

try {
  // Generate private key
  console.log('1. Generating private key...');
  execSync(
    `openssl genrsa -out "${keyPath}" 2048`,
    { stdio: 'inherit' }
  );
  console.log('   ✅ Private key generated\n');

  // Generate certificate signing request and self-signed certificate
  console.log('2. Generating self-signed certificate...');
  execSync(
    `openssl req -new -x509 -key "${keyPath}" -out "${certPath}" -days 365 -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"`,
    { stdio: 'inherit' }
  );
  console.log('   ✅ Certificate generated\n');

  // Set appropriate permissions (read-only for key)
  if (process.platform !== 'win32') {
    fs.chmodSync(keyPath, 0o600); // Read/write for owner only
    fs.chmodSync(certPath, 0o644); // Read for all, write for owner
  }

  console.log('✅ SSL certificates generated successfully!\n');
  console.log('📁 Certificate files:');
  console.log(`   Private Key: ${keyPath}`);
  console.log(`   Certificate: ${certPath}\n`);
  console.log('⚠️  IMPORTANT:');
  console.log('   - These are SELF-SIGNED certificates for DEVELOPMENT ONLY');
  console.log('   - Your browser will show a security warning');
  console.log('   - For production, use certificates from a trusted CA\n');
  console.log('📝 Next steps:');
  console.log('   1. Set USE_HTTPS=true in your .env file');
  console.log('   2. Restart your server');
  console.log('   3. Access your app at https://localhost:4443');
  console.log('   4. Accept the security warning in your browser\n');
} catch (error) {
  console.error('❌ Failed to generate certificates:', error);
  console.error('\n💡 Make sure OpenSSL is installed:');
  console.error('   - macOS: Already installed');
  console.error('   - Linux: sudo apt-get install openssl');
  console.error('   - Windows: Install from https://slproweb.com/products/Win32OpenSSL.html\n');
  process.exit(1);
}

