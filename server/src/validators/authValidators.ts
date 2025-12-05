import { body } from 'express-validator';

// Password strength requirements
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

export const signupValidator = [
  body('username')
    .trim()
    .isString()
    .isLength({ min: 3, max: 50 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must contain only letters, numbers, and underscores'),
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage('Invalid email format'),
  body('password')
    .isString()
    .isLength({ min: 8, max: 100 })
    .withMessage('Password must be at least 8 characters'),
  body('role')
    .equals('patient')
    .withMessage('Only patients can sign up. Doctors and nurses must be created by an admin.'),
];

export const loginValidator = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email format'),
  body('password')
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('Password is required'),
];

export const forgotPasswordValidator = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email format'),
];

export const resetPasswordValidator = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email format'),
  body('otp')
    .trim()
    .isString()
    .isLength({ min: 6, max: 6 })
    .matches(/^\d+$/)
    .withMessage('OTP must be a 6-digit number'),
  body('newPassword')
    .isString()
    .isLength({ min: 8, max: 100 })
    .withMessage('Password must be at least 8 characters'),
];


