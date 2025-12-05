import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { sequelize } from '../config/database';

dotenv.config();

async function run() {
  try {
    await sequelize.authenticate();
    const [results] = await sequelize.query('SELECT id, email, password FROM users');
    const rows = results as Array<{ id: string | number; email: string; password: string }>;
    for (const row of rows) {
      const pwd = row.password || '';
      if (!pwd.startsWith('$2')) {
        const hashed = await bcrypt.hash(pwd, 12);
        await sequelize.query('UPDATE users SET password = :hashed WHERE id = :id', {
          replacements: { hashed, id: row.id },
        });
        // eslint-disable-next-line no-console
        console.log(`Hashed password for user ${row.email}`);
      }
    }
    // eslint-disable-next-line no-console
    console.log('Password hashing complete.');
    process.exit(0);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Hashing failed:', e);
    process.exit(1);
  }
}

run();


