#!/usr/bin/env node
/**
 * Generate secure random secrets for JWT tokens and other sensitive values
 * Usage: node generate-secrets.js
 */

const crypto = require('crypto');

function generateSecret(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

console.log('# Secure secrets generated on', new Date().toISOString());
console.log('# Copy these to your .env file\n');
console.log(`ACCESS_TOKEN_SECRET=${generateSecret()}`);
console.log(`REFRESH_TOKEN_SECRET=${generateSecret()}`);
console.log(`\n# Optional: Generate a secure database password`);
console.log(`# POSTGRES_PASSWORD=${generateSecret(32)}`);

