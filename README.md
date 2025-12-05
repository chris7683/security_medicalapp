Healthcare RBAC App (Angular + Node/Express + PostgreSQL)

Overview
Minimal, secure role-based healthcare web app with three roles: Doctor, Nurse, Patient. Backend provides JWT auth with refresh tokens, bcrypt password hashing, RBAC middleware, input validation, and secure headers. Frontend (Angular 17) includes guards, JWT interceptor, and Angular Material UI.

Prerequisites
- Node.js 18.x LTS
- npm 9+
- PostgreSQL 14+

Environment
Create a server/.env with:

PORT=4000
NODE_ENV=development
FRONTEND_ORIGIN=http://localhost:4200
ACCESS_TOKEN_SECRET=change_me_access
REFRESH_TOKEN_SECRET=change_me_refresh
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
POSTGRES_DB=healthcare
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# Email configuration for password reset (optional - if not set, emails will be logged to console)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

Install

Backend
cd server
npm install

Frontend
cd client
npm install

Run (Dev)
Backend (http://localhost:4000)
cd server
npm run dev

Frontend (http://localhost:4200)
cd client
npm start

Security Features
- bcrypt password hashing
- JWT auth with access/refresh tokens
- RBAC middleware (doctor, nurse, patient)
- Input validation (express-validator) and Angular reactive forms
- Helmet, CORS, dotenv
- Sequelize ORM with parameterized queries

API Endpoints
- POST /api/auth/signup
- POST /api/auth/login
- POST /api/auth/refresh
- POST /api/auth/logout
- POST /api/auth/forgot-password (request password reset OTP)
- POST /api/auth/reset-password (reset password with OTP)
- GET /api/patients (role: doctor all, nurse assigned, patient own)
- GET /api/patients/:id
- PUT /api/patients/:id (doctor: all fields; nurse: condition only)
- POST /api/users/:patientId/assign-nurse (role: doctor)

Database Setup
Run the SQL migration to create the password reset tokens table:
```bash
psql -U postgres -d healthcare -f server/create_password_reset_tokens_table.sql
```

Notes
- Patient users automatically get a matching patient record (id equals user id).
- For production, change secrets and enable SSL for Postgres.
- Password reset uses OTP (One-Time Password) sent via email. OTPs expire in 15 minutes.
- If email is not configured, password reset OTPs will be logged to the console for development purposes.


