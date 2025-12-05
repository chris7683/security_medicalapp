import { Request, Response } from 'express';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { User } from '../models/User';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth';

/**
 * Generate 2FA secret and QR code for user
 */
export async function generate2FA(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Healthcare App (${user.email})`,
      issuer: 'Healthcare App',
    });

    // Save secret (but don't enable 2FA yet)
    await user.update({
      twoFactorSecret: secret.base32,
      twoFactorEnabled: false,
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || '');

    return res.json({
      secret: secret.base32,
      qrCode: qrCodeUrl,
      manualEntryKey: secret.base32,
    });
  } catch (error) {
    console.error('2FA generation error:', error);
    return res.status(500).json({ message: 'Failed to generate 2FA secret' });
  }
}

/**
 * Verify 2FA token and enable 2FA for user
 */
export async function verify2FA(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const { token } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }

    const user = await User.findByPk(userId);
    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({ message: '2FA not set up for this user' });
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 time steps (60 seconds) of tolerance
    });

    if (!verified) {
      return res.status(400).json({ message: 'Invalid token' });
    }

    // Enable 2FA
    await user.update({
      twoFactorEnabled: true,
    });

    return res.json({
      message: '2FA enabled successfully',
      enabled: true,
    });
  } catch (error) {
    console.error('2FA verification error:', error);
    return res.status(500).json({ message: 'Failed to verify 2FA token' });
  }
}

/**
 * Disable 2FA for user
 */
export async function disable2FA(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Disable 2FA and clear secret
    await user.update({
      twoFactorEnabled: false,
      twoFactorSecret: null,
    });

    return res.json({
      message: '2FA disabled successfully',
      enabled: false,
    });
  } catch (error) {
    console.error('2FA disable error:', error);
    return res.status(500).json({ message: 'Failed to disable 2FA' });
  }
}

/**
 * Verify 2FA token during login
 */
export async function verify2FALogin(req: Request, res: Response) {
  try {
    const { email, token } = req.body;

    if (!email || !token) {
      return res.status(400).json({ message: 'Email and token are required' });
    }

    const user = await User.findOne({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return res.status(400).json({ message: '2FA not enabled for this user' });
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 time steps (60 seconds) of tolerance
    });

    if (!verified) {
      return res.status(400).json({ message: 'Invalid 2FA token' });
    }

    return res.json({
      message: '2FA token verified',
      verified: true,
    });
  } catch (error) {
    console.error('2FA login verification error:', error);
    return res.status(500).json({ message: 'Failed to verify 2FA token' });
  }
}

