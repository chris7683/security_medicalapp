import { Router } from 'express';
import { generate2FA, verify2FA, disable2FA, verify2FALogin } from '../controllers/twoFactorController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

// Generate 2FA secret and QR code (requires authentication)
router.post('/generate', authenticateJWT, generate2FA);

// Verify 2FA token and enable 2FA (requires authentication)
router.post('/verify', authenticateJWT, verify2FA);

// Disable 2FA (requires authentication)
router.post('/disable', authenticateJWT, disable2FA);

// Verify 2FA token during login (public endpoint)
router.post('/verify-login', verify2FALogin);

export default router;

