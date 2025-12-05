import dotenv from 'dotenv';
import { generateEncryptionKey } from '../utils/encryption';

dotenv.config();

console.log('\n🔑 Generating encryption key...\n');
const key = generateEncryptionKey();
console.log('Add this to your .env file:');
console.log(`DATABASE_ENCRYPTION_KEY=${key}\n`);
console.log('⚠️  Keep this key secure and never commit it to version control!\n');

