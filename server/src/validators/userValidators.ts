import { body } from 'express-validator';

export const changePasswordValidator = [
  body('currentPassword').isString().isLength({ min: 1 }).withMessage('Current password is required'),
  body('newPassword').isString().isLength({ min: 8, max: 100 }).withMessage('New password must be between 8 and 100 characters'),
];

export const assignNurseToDoctorValidator = [
  body('nurseId').isInt().withMessage('Nurse ID must be an integer'),
];

