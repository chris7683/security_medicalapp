import { body, param } from 'express-validator';

export const createMedicationValidator = [
  body('patientId').isInt(),
  body('name').isString().isLength({ min: 1, max: 200 }),
  body('dosage').isString().isLength({ min: 1, max: 100 }),
  body('frequency').isString().isLength({ min: 1, max: 100 }),
  body('instructions').optional().isString(),
];

export const medicationIdParam = [param('id').isInt()];
export const patientIdParam = [param('patientId').isInt()];

