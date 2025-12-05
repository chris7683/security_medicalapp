import { body, param } from 'express-validator';

export const patientIdParam = [param('id').isInt().withMessage('Patient ID must be an integer')];

export const updatePatientByDoctorValidator = [
  body('name').optional().isString().isLength({ min: 1, max: 200 }),
  body('age').optional().isInt({ min: 0, max: 150 }),
  body('condition').optional().isString().custom((value) => {
    // Allow empty string to delete condition, or non-empty string
    if (value === '' || value === null || value === undefined) return true;
    return value.length >= 1;
  }),
  body('assignedDoctorId').optional().isUUID(),
  body('assignedNurseId').optional().isUUID(),
];

export const updatePatientByNurseValidator = [
  body('condition').optional().isString().custom((value) => {
    // Allow empty string to delete condition, or non-empty string
    if (value === '' || value === null || value === undefined) return true;
    return value.length >= 1;
  }),
];

export const assignNurseValidator = [
  param('patientId').isInt().withMessage('patientId must be an integer'),
  body('nurseId')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      if (value === null || value === undefined || value === '') {
        return true; // Allow null/empty to remove assignment
      }
      const num = parseInt(value, 10);
      return !isNaN(num) && num > 0;
    })
    .withMessage('nurseId must be a positive integer or null'),
];


