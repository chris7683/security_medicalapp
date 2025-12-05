import { body, param } from 'express-validator';

export const createAppointmentValidator = [
  body('patientId').isInt().withMessage('Patient ID must be an integer'),
  body('doctorId').isInt().withMessage('Doctor ID must be an integer'),
  body('appointmentDate').isISO8601().withMessage('Appointment date must be a valid ISO 8601 date'),
  body('notes').optional().isString().isLength({ max: 1000 }).withMessage('Notes must be a string with max 1000 characters'),
];

export const updateAppointmentValidator = [
  body('status').optional().isIn(['pending', 'confirmed', 'completed', 'cancelled']).withMessage('Invalid status'),
  body('appointmentDate').optional().isISO8601().withMessage('Appointment date must be a valid ISO 8601 date'),
  body('notes').optional().isString().isLength({ max: 1000 }).withMessage('Notes must be a string with max 1000 characters'),
];

export const appointmentIdParam = [param('id').isInt().withMessage('Appointment ID must be an integer')];

export const appointmentIdParamForDiagnosis = [param('appointmentId').isInt().withMessage('Appointment ID must be an integer')];

