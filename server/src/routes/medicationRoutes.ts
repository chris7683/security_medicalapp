import { Router } from 'express';
import { authenticateJWT, requireRole } from '../middleware/auth';
import {
  createMedication,
  listMedications,
  getPatientMedications,
  deleteMedication,
} from '../controllers/medicationController';
import { createMedicationValidator, medicationIdParam, patientIdParam } from '../validators/medicationValidators';
import { auditLog } from '../middleware/auditLogger';

const router = Router();

router.use(authenticateJWT);

router.post('/', requireRole(['doctor']), createMedicationValidator, auditLog('create_medication'), createMedication);
router.get('/', listMedications);
router.get('/patient/:patientId', requireRole(['doctor', 'nurse']), patientIdParam, getPatientMedications);
router.delete('/:id', requireRole(['doctor']), medicationIdParam, auditLog('delete_medication'), deleteMedication);

export default router;

