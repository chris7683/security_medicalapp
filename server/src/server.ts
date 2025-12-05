import dotenv from 'dotenv';
import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import app from './app';
import { sequelize } from './config/database';
import './models';

dotenv.config();

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
const HTTPS_PORT = process.env.HTTPS_PORT ? parseInt(process.env.HTTPS_PORT, 10) : 4443;
const USE_HTTPS = process.env.USE_HTTPS === 'true' || process.env.NODE_ENV === 'production';

async function start() {
  try {
    await sequelize.authenticate();
    if (process.env.SYNC_DB !== 'false') {
      await sequelize.sync();
    }

    if (USE_HTTPS) {
      // HTTPS Configuration
      const certPath = process.env.SSL_CERT_PATH || path.join(__dirname, '../certs/server.crt');
      const keyPath = process.env.SSL_KEY_PATH || path.join(__dirname, '../certs/server.key');
      const caPath = process.env.SSL_CA_PATH; // Optional: for certificate chain

      // Check if certificate files exist
      if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
        console.error('❌ SSL certificate files not found!');
        console.error(`   Certificate: ${certPath}`);
        console.error(`   Key: ${keyPath}`);
        console.error('\n📝 To generate self-signed certificates for development, run:');
        console.error('   npm run generate-certs');
        console.error('\n📝 For production, obtain certificates from a CA (Let\'s Encrypt, etc.)');
        process.exit(1);
      }

      const httpsOptions: https.ServerOptions = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
        ...(caPath && fs.existsSync(caPath) ? { ca: fs.readFileSync(caPath) } : {}),
      };

      const httpsServer = https.createServer(httpsOptions, app);
      httpsServer.listen(HTTPS_PORT, () => {
        // eslint-disable-next-line no-console
        console.log(`🔒 HTTPS Server listening on https://localhost:${HTTPS_PORT}`);
        // eslint-disable-next-line no-console
        console.log(`   Certificate: ${certPath}`);
        // eslint-disable-next-line no-console
        console.log(`   Key: ${keyPath}`);
      });

      // In production, also redirect HTTP to HTTPS
      if (process.env.NODE_ENV === 'production') {
        const httpServer = http.createServer((req, res) => {
          res.writeHead(301, { Location: `https://${req.headers.host}${req.url}` });
          res.end();
        });
        httpServer.listen(PORT, () => {
          // eslint-disable-next-line no-console
          console.log(`🔄 HTTP Server redirecting to HTTPS on port ${PORT}`);
        });
      }
    } else {
      // HTTP only (development)
      app.listen(PORT, () => {
        // eslint-disable-next-line no-console
        console.log(`Server listening on http://localhost:${PORT}`);
        // eslint-disable-next-line no-console
        console.log('⚠️  Running in HTTP mode. Set USE_HTTPS=true to enable HTTPS.');
      });
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Unable to start server:', err);
    process.exit(1);
  }
}

start();


