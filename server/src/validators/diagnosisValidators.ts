import { body, param } from 'express-validator';

export const createDiagnosisValidator = [
  body('appointmentId').isInt().withMessage('Appointment ID must be an integer'),
  body('diagnosis').isString().isLength({ min: 1, max: 5000 }).withMessage('Diagnosis must be a string between 1 and 5000 characters'),
  body('notes').optional().isString().isLength({ max: 2000 }).withMessage('Notes must be a string with max 2000 characters'),
];

export const updateDiagnosisValidator = [
  body('diagnosis').optional().isString().isLength({ min: 1, max: 5000 }).withMessage('Diagnosis must be a string between 1 and 5000 characters'),
  body('notes').optional().isString().isLength({ max: 2000 }).withMessage('Notes must be a string with max 2000 characters'),
];

export const diagnosisIdParam = [param('id').isInt().withMessage('Diagnosis ID must be an integer')];

export const appointmentIdParam = [param('appointmentId').isInt().withMessage('Appointment ID must be an integer')];

