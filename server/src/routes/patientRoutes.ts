import { NextFunction, Request, Response, Router } from 'express';
import { authenticateJWT, requireRole } from '../middleware/auth';
import { getPatient, listPatients, updatePatient } from '../controllers/patientController';
import { patientIdParam, updatePatientByDoctorValidator, updatePatientByNurseValidator } from '../validators/patientValidators';
import { validationResult } from 'express-validator';

const router = Router();

router.use(authenticateJWT);

router.get('/', listPatients);
router.get('/:id', patientIdParam, getPatient);
router.put(
  '/:id',
  patientIdParam,
  async (req: Request, res: Response, next: NextFunction) => {
    // Apply validators based on role
    const role = (req as any).user?.role;
    
    if (role === 'doctor') {
      const validators = updatePatientByDoctorValidator;
      // Run all validators
      await Promise.all(validators.map(validator => validator.run(req)));
      
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
    }
    
    next();
  },
  requireRole(['doctor']),
  updatePatient
);

export default router;


