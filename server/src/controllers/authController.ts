import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import speakeasy from 'speakeasy';
import { validationResult } from 'express-validator';
import { User } from '../models/User';
import { Patient } from '../models/Patient';
import { RefreshToken } from '../models/RefreshToken';
import { PasswordResetToken } from '../models/PasswordResetToken';
import { LoginOTP } from '../models/LoginOTP';
import { Op } from 'sequelize';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { recordFailedLogin, clearFailedLogin } from '../middleware/accountLockout';
import { sanitizeUsername, validateEmail } from '../middleware/inputSanitizer';
import { sendPasswordResetOTP, sendLoginOTP } from '../utils/email';

export async function signup(req: Request, res: Response) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { username, email, password, role } = req.body as {
    username: string;
    email: string;
    password: string;
    role: 'doctor' | 'nurse' | 'patient' | 'admin';
  };

  // Only allow patient role for signup - doctors and nurses must be created by admin
  if (role !== 'patient') {
    return res.status(403).json({ message: 'Only patients can sign up. Doctors and nurses must be created by an admin.' });
  }

  // Validate and sanitize inputs
  if (!validateEmail(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  const emailNormalized = email.trim().toLowerCase();
  const sanitizedUsername = sanitizeUsername(username);

  // Check for existing user
  const existing = await User.findOne({
    where: {
      email: emailNormalized,
    },
  });
  if (existing) return res.status(409).json({ message: 'Email already in use' });

  // Check for existing username
  const existingUsername = await User.findOne({
    where: {
      username: sanitizedUsername,
    },
  });
  if (existingUsername) return res.status(409).json({ message: 'Username already in use' });

  // Hash password with higher cost factor
  const saltRounds = 12;
  const hashed = await bcrypt.hash(password, saltRounds);

  // Use transaction to ensure both user and patient are created together
  const transaction = await (User.sequelize as any).transaction();
  
  try {
    const user = await User.create({
      username: sanitizedUsername,
      email: emailNormalized,
      password: hashed,
      role,
    }, { transaction });

    // If patient, create a matching patient record with same id
    if (role === 'patient') {
      // Use raw query to insert with manual ID and update sequence
      try {
        await Patient.sequelize?.query(
          `INSERT INTO patients (id, name, age, condition) VALUES ($1, $2, $3, $4);
           SELECT setval('patients_id_seq', GREATEST((SELECT MAX(id) FROM patients), $1), true);`,
          {
            bind: [user.id, username, 0, 'N/A'],
            transaction,
          }
        );
      } catch (patientError: any) {
        // eslint-disable-next-line no-console
        console.error('Failed to create patient record:', patientError);
        await transaction.rollback();
        
        if (patientError?.code === '23505') { // Unique violation
          return res.status(409).json({ 
            message: 'Patient record already exists for this user.' 
          });
        }
        
        return res.status(500).json({ 
          message: 'Failed to create patient account. Please try again.',
          error: process.env.NODE_ENV === 'development' ? patientError?.message : undefined
        });
      }
    }

    // Commit transaction
    await transaction.commit();

    const accessToken = generateAccessToken(user as any);
    const refreshToken = generateRefreshToken(user as any);
    const refreshExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    try {
      await RefreshToken.create({ token: refreshToken, userId: (user as any).id, expiresAt: refreshExpiry });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Refresh token persistence skipped:', (e as Error).message);
    }

    return res.status(201).json({
      user: { id: user.id, username: user.username, email: user.email, role: user.role },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    await transaction.rollback();
    // eslint-disable-next-line no-console
    console.error('Signup error:', error);
    
    // Check for specific database errors
    if ((error as any).name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'Username or email already in use' });
    }
    
    return res.status(500).json({ 
      message: 'Failed to create user account. Please try again.' 
    });
  }
}

export async function login(req: Request, res: Response) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password, twoFactorToken } = req.body as { 
    email: string; 
    password: string; 
    twoFactorToken?: string;
  };
  const emailNormalized = email.trim().toLowerCase();

  // Use Sequelize instead of raw SQL to prevent SQL injection
  const user = await User.findOne({
    where: {
      email: emailNormalized,
    },
  });

  if (!user) {
    recordFailedLogin(emailNormalized);
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const storedPwd: string = user.password || '';
  const isHashed = storedPwd.startsWith('$2');
  let valid = false;
  if (isHashed) {
    valid = await bcrypt.compare(password, storedPwd);
  } else {
    // Legacy support for plain-text passwords (should be migrated)
    valid = password === storedPwd;
  }

  if (!valid) {
    recordFailedLogin(emailNormalized);
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // Password is valid - now send OTP via email for login verification
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Invalidate any existing unused OTPs for this user
  await LoginOTP.update(
    { used: true },
    { where: { userId: user.id, used: false } }
  );

  // Store OTP in database
  try {
    await LoginOTP.create({
      userId: user.id,
      email: emailNormalized,
      otp,
      expiresAt,
      used: false,
    });
  } catch (error) {
    console.error('Failed to create login OTP:', error);
    return res.status(500).json({ message: 'Failed to generate login code' });
  }

  // Send OTP via email
  try {
    await sendLoginOTP(emailNormalized, otp, user.username);
  } catch (error) {
    console.error('Failed to send login OTP email:', error);
    // Still return success - OTP is stored, user can check console logs if email fails
  }

  // Return response indicating OTP is required
  return res.json({
    requiresOTP: true,
    message: 'Login code sent to your email. Please check your inbox and enter the code to complete login.',
    email: emailNormalized, // Return email for frontend to use in verification
  });
}

export async function verifyLoginOTP(req: Request, res: Response) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, otp } = req.body as {
    email: string;
    otp: string;
  };

  const emailNormalized = email.trim().toLowerCase();

  // Find user
  const user = await User.findOne({
    where: {
      email: emailNormalized,
    },
  });

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // Find valid OTP for this user
  const loginOTP = await LoginOTP.findOne({
    where: {
      userId: user.id,
      email: emailNormalized,
      otp: otp.trim(),
      used: false,
      expiresAt: {
        [Op.gt]: new Date(), // Not expired
      },
    },
  });

  if (!loginOTP) {
    recordFailedLogin(emailNormalized);
    return res.status(401).json({ message: 'Invalid or expired login code' });
  }

  // Mark OTP as used
  await loginOTP.update({ used: true });

  // Clear failed login attempts on successful login
  clearFailedLogin(emailNormalized);

  // Generate tokens
  const accessToken = generateAccessToken(user as any);
  const refreshToken = generateRefreshToken(user as any);
  const refreshExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  try {
    await RefreshToken.create({ token: refreshToken, userId: user.id, expiresAt: refreshExpiry });
  } catch (e) {
    console.warn('Refresh token persistence skipped:', (e as Error).message);
  }

  return res.json({
    user: { id: user.id, username: user.username, email: user.email, role: user.role },
    accessToken,
    refreshToken,
  });
}

export async function refresh(req: Request, res: Response) {
  const { refreshToken } = req.body as { refreshToken?: string };
  if (!refreshToken) return res.status(400).json({ message: 'Missing refreshToken' });

  try {
    const payload = verifyRefreshToken(refreshToken);
    let storedOk = true;
    try {
      const stored = await RefreshToken.findOne({ where: { token: refreshToken, userId: payload.sub as any } });
      storedOk = !!stored;
    } catch {
      // If table missing, allow JWT-only validation in dev
      storedOk = true;
    }
    if (!storedOk) return res.status(401).json({ message: 'Invalid refresh token' });
    const user = await User.findByPk(payload.sub as any);
    if (!user) return res.status(401).json({ message: 'User not found' });
    const accessToken = generateAccessToken(user as any);
    return res.json({ accessToken });
  } catch {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
}

export async function logout(req: Request, res: Response) {
  const { refreshToken } = req.body as { refreshToken?: string };
  if (!refreshToken) return res.status(400).json({ message: 'Missing refreshToken' });
  await RefreshToken.destroy({ where: { token: refreshToken } });
  return res.json({ message: 'Logged out' });
}

/**
 * Generate a 6-digit OTP
 */
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Forgot password - Request OTP via email
 */
export async function forgotPassword(req: Request, res: Response) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email } = req.body as { email: string };
  const emailNormalized = email.trim().toLowerCase();

  // Find user by email
  const user = await User.findOne({
    where: {
      email: emailNormalized,
    },
  });

  // Always return success to prevent email enumeration attacks
  // But only send email if user exists
  if (user) {
    // Invalidate any existing unused OTPs for this user
    await PasswordResetToken.update(
      { used: true },
      { where: { userId: user.id, used: false } }
    );

    // Generate 6-digit OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

    // Store OTP in database
    await PasswordResetToken.create({
      userId: user.id,
      otp,
      expiresAt,
      used: false,
    });

    // Send OTP via email
    try {
      await sendPasswordResetOTP(user.email, otp, user.username);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to send password reset email:', error);
      // Still return success to prevent email enumeration
    }
  }

  // Always return the same response regardless of whether user exists
  return res.json({
    message: 'If an account with that email exists, a password reset OTP has been sent.',
  });
}

/**
 * Reset password - Verify OTP and reset password
 */
export async function resetPassword(req: Request, res: Response) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, otp, newPassword } = req.body as {
    email: string;
    otp: string;
    newPassword: string;
  };

  const emailNormalized = email.trim().toLowerCase();

  // Find user by email
  const user = await User.findOne({
    where: {
      email: emailNormalized,
    },
  });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Find valid, unused OTP for this user
  const resetToken = await PasswordResetToken.findOne({
    where: {
      userId: user.id,
      otp: otp.trim(),
      used: false,
    },
    order: [['id', 'DESC']],
  });

  if (!resetToken) {
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }

  // Check if OTP has expired
  if (resetToken.expiresAt < new Date()) {
    await PasswordResetToken.update(
      { used: true },
      { where: { id: resetToken.id } }
    );
    return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
  }

  // Hash new password
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

  // Update user password
  await user.update({ password: hashedPassword });

  // Mark OTP as used
  await PasswordResetToken.update(
    { used: true },
    { where: { id: resetToken.id } }
  );

  // Invalidate all refresh tokens for this user (force re-login)
  await RefreshToken.destroy({ where: { userId: user.id } });

  return res.json({
    message: 'Password has been reset successfully. Please login with your new password.',
  });
}


