import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const {
  DATABASE_URL,
  POSTGRES_DB,
  POSTGRES_USER,
  POSTGRES_PASSWORD,
  POSTGRES_HOST,
  POSTGRES_PORT,
  NODE_ENV,
} = process.env as Record<string, string | undefined>;

// Database connection configuration with SSL support
// For development: SSL is optional (can connect without SSL)
// For production: SSL should be enabled for encrypted connections
const dialectOptions: any = {
  ssl: process.env.DB_SSL === 'true',
};

// Enable SSL if explicitly configured or in production
if (dialectOptions.ssl || NODE_ENV === 'production') {
  dialectOptions.ssl = {
    require: process.env.DB_SSL_REQUIRE !== 'false',
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
  };
  
  // Add SSL certificate configuration if provided
  if (process.env.DB_SSL_CA) {
    dialectOptions.ssl.ca = process.env.DB_SSL_CA;
  }
  if (process.env.DB_SSL_CERT) {
    dialectOptions.ssl.cert = process.env.DB_SSL_CERT;
  }
  if (process.env.DB_SSL_KEY) {
    dialectOptions.ssl.key = process.env.DB_SSL_KEY;
  }
}

export const sequelize = DATABASE_URL
  ? new Sequelize(DATABASE_URL, {
      dialect: 'postgres',
      logging: NODE_ENV === 'development' ? console.log : false,
      dialectOptions,
      pool: {
        max: 10,
        min: 2,
        acquire: 30000,
        idle: 10000,
      },
    })
  : new Sequelize(
      POSTGRES_DB || 'healthcare',
      POSTGRES_USER || 'postgres',
      POSTGRES_PASSWORD || 'postgres',
      {
        host: POSTGRES_HOST || 'localhost',
        port: POSTGRES_PORT ? parseInt(POSTGRES_PORT, 10) : 5432,
        dialect: 'postgres',
        logging: NODE_ENV === 'development' ? console.log : false,
        dialectOptions,
        pool: {
          max: 10,
          min: 2,
          acquire: 30000,
          idle: 10000,
        },
      }
    );


