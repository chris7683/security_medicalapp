import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import compression from 'compression';
import hpp from 'hpp';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
// @ts-ignore - xss-clean doesn't have type definitions
import xss from 'xss-clean';
import authRoutes from './routes/authRoutes';
import patientRoutes from './routes/patientRoutes';
import userRoutes from './routes/userRoutes';
import adminRoutes from './routes/adminRoutes';
import medicationRoutes from './routes/medicationRoutes';
import medicationTrackingRoutes from './routes/medicationTrackingRoutes';
import twoFactorRoutes from './routes/twoFactorRoutes';
import appointmentRoutes from './routes/appointmentRoutes';
import diagnosisRoutes from './routes/diagnosisRoutes';
import { apiLimiter, authLimiter, sensitiveLimiter } from './middleware/rateLimiter';
import { sanitizeInput } from './middleware/inputSanitizer';
import { generateCSRFToken, verifyCSRF } from './middleware/csrf';
import { additionalSecurityHeaders } from './middleware/securityHeaders';

dotenv.config();

const app = express();

// Trust proxy for accurate IP addresses (important for rate limiting)
app.set('trust proxy', 1);

// HTTP request logging with Morgan
// Use 'combined' format for production, 'dev' for development
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Additional security headers (before Helmet)
app.use(additionalSecurityHeaders);

// Security headers with enhanced Helmet configuration
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // TODO: Remove unsafe-inline in production
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false, // Allow embedding if needed
    crossOriginResourcePolicy: { policy: 'same-origin' },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    frameguard: { action: 'deny' },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  })
);

// HTTPS enforcement in production
if (process.env.NODE_ENV === 'production') {
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Check if request is secure (HTTPS)
    if (req.header('x-forwarded-proto') !== 'https' && req.secure !== true) {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

// Cookie parser for secure cookie handling
app.use(cookieParser(process.env.COOKIE_SECRET || 'change_me_cookie_secret'));

// Compression middleware
app.use(compression());

// Prevent HTTP Parameter Pollution
// Temporarily disabled due to Express 5 compatibility issue
// app.use(hpp());

// XSS protection - sanitize user input
// Temporarily disabled due to Express 5 compatibility issue
// app.use(xss());

// Request size limit (prevent DoS)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization (additional layer)
app.use(sanitizeInput);

// Global rate limiting
app.use('/api', apiLimiter);

const defaultOrigins = [
  'http://localhost:4200', 
  'http://127.0.0.1:4200',
  'https://localhost:4200',  // HTTPS frontend
  'https://127.0.0.1:4200'   // HTTPS frontend alternative
];
const configuredOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_ORIGIN || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const allowedOrigins = new Set<string>([...defaultOrigins, ...configuredOrigins]);

app.use(
  cors({
    origin: (origin, callback) => {
      try {
        if (!origin) {
          // mobile apps, curl, same-origin requests
          return callback(null, true);
        }
        
        // Check explicit allowed origins
        if (allowedOrigins.has(origin)) {
          return callback(null, true);
        }
        
        // Also allow localhost variations in dev (both HTTP and HTTPS)
        if (/^https?:\/\/(localhost|127\.0\.0\.1):\d{2,5}$/i.test(origin)) {
          return callback(null, true);
        }
        
        // Log for debugging
        console.warn(`CORS blocked origin: ${origin}`);
        return callback(new Error('Not allowed by CORS'));
      } catch (error) {
        console.error('CORS origin check error:', error);
        const corsError = error instanceof Error ? error : new Error(String(error));
        return callback(corsError);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-XSRF-TOKEN'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// CSRF token endpoint (before authentication routes)
app.get('/api/csrf-token', generateCSRFToken, (req: Request, res: Response) => {
  res.json({ csrfToken: res.locals.csrfToken });
});

// Apply rate limiting to specific routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/2fa', authLimiter, twoFactorRoutes);
app.use('/api/admin', sensitiveLimiter, adminRoutes);
app.use('/api/patients', verifyCSRF(true), patientRoutes); // Optional CSRF (JWT takes precedence)
app.use('/api/users', verifyCSRF(true), userRoutes);
app.use('/api/medications', verifyCSRF(true), medicationRoutes);
app.use('/api/medication-tracking', verifyCSRF(true), medicationTrackingRoutes);
app.use('/api/appointments', verifyCSRF(true), appointmentRoutes);
app.use('/api/diagnoses', verifyCSRF(true), diagnosisRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: 'Not Found' });
});

// Error handler - Enhanced security
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const error = err instanceof Error ? err : new Error(String(err));
  
  // Log error details server-side for debugging
  console.error('Error:', {
    message: error.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
    path: _req.path,
    method: _req.method,
    origin: _req.headers.origin,
    timestamp: new Date().toISOString(),
  });

  // Handle CORS errors specifically
  if (error.message.includes('CORS')) {
    return res.status(403).json({ 
      message: 'CORS policy: ' + error.message,
      origin: _req.headers.origin 
    });
  }

  // Hide internal errors in production to prevent information disclosure
  const isProduction = process.env.NODE_ENV === 'production';
  const status = 500;
  const message = isProduction ? 'Internal Server Error' : error.message;
  
  // Never expose stack traces or internal details in production
  res.status(status).json({ 
    message,
    ...(isProduction ? {} : { stack: error.stack }) // Only in development
  });
});

export default app;


