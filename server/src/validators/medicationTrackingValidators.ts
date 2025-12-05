import { body, param } from 'express-validator';

export const trackMedicationValidator = [
  body('medicationId').isInt().notEmpty(),
  body('status').isIn(['given', 'missed', 'pending']),
  body('notes').optional().isString(),
];

export const medicationIdParamValidator = [
  param('medicationId').isInt(),
];

