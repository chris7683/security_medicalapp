import { body, param } from 'express-validator';

export const createUserValidator = [
  body('username').isString().isLength({ min: 3, max: 100 }),
  body('email').isEmail(),
  body('password').isString().isLength({ min: 8, max: 100 }),
  body('role').isIn(['admin', 'doctor', 'nurse', 'patient']),
];

export const userIdParam = [param('id').isInt()];

export const assignValidator = [
  body('patientId').isInt(),
  body('doctorId').optional().isInt(),
  body('nurseId').optional().isInt(),
];

