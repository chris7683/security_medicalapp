import { Router } from 'express';
import { authenticateJWT, requireRole } from '../middleware/auth';
import {
  createDiagnosis,
  getDiagnosis,
  listPatientDiagnoses,
  updateDiagnosis,
} from '../controllers/diagnosisController';
import {
  createDiagnosisValidator,
  updateDiagnosisValidator,
  appointmentIdParam,
  diagnosisIdParam,
} from '../validators/diagnosisValidators';
import { auditLog } from '../middleware/auditLogger';

const router = Router();

router.use(authenticateJWT);

router.post('/', requireRole(['doctor']), createDiagnosisValidator, auditLog('create_diagnosis'), createDiagnosis);
router.get('/patient', listPatientDiagnoses);
router.get('/appointment/:appointmentId', appointmentIdParam, getDiagnosis);
router.put('/:id', diagnosisIdParam, requireRole(['doctor']), updateDiagnosisValidator, auditLog('update_diagnosis'), updateDiagnosis);

export default router;

