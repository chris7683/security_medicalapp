import { Router } from 'express';
import { login, logout, refresh, signup, forgotPassword, resetPassword, verifyLoginOTP } from '../controllers/authController';
import { loginValidator, signupValidator, forgotPasswordValidator, resetPasswordValidator, verifyLoginOTPValidator } from '../validators/authValidators';
import { checkAccountLockout } from '../middleware/accountLockout';
import { auditLog } from '../middleware/auditLogger';
import { passwordResetLimiter, authLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/signup', signupValidator, auditLog('user_signup'), signup);
router.post('/login', checkAccountLockout, loginValidator, auditLog('user_login'), login);
router.post('/verify-login-otp', authLimiter, verifyLoginOTPValidator, auditLog('verify_login_otp'), verifyLoginOTP);
router.post('/refresh', auditLog('token_refresh'), refresh);
router.post('/logout', auditLog('user_logout'), logout);
router.post('/forgot-password', passwordResetLimiter, forgotPasswordValidator, auditLog('forgot_password'), forgotPassword);
router.post('/reset-password', passwordResetLimiter, resetPasswordValidator, auditLog('reset_password'), resetPassword);

export default router;


