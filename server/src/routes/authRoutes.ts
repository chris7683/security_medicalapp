import { Router } from 'express';
import { login, logout, refresh, signup, forgotPassword, resetPassword } from '../controllers/authController';
import { loginValidator, signupValidator, forgotPasswordValidator, resetPasswordValidator } from '../validators/authValidators';
import { checkAccountLockout } from '../middleware/accountLockout';
import { auditLog } from '../middleware/auditLogger';
import { passwordResetLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/signup', signupValidator, auditLog('user_signup'), signup);
router.post('/login', checkAccountLockout, loginValidator, auditLog('user_login'), login);
router.post('/refresh', auditLog('token_refresh'), refresh);
router.post('/logout', auditLog('user_logout'), logout);
router.post('/forgot-password', passwordResetLimiter, forgotPasswordValidator, auditLog('forgot_password'), forgotPassword);
router.post('/reset-password', passwordResetLimiter, resetPasswordValidator, auditLog('reset_password'), resetPassword);

export default router;


