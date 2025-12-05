import { Router } from 'express';
import { authenticateJWT, requireRole } from '../middleware/auth';
import {
  trackMedication,
  getAllTracking,
  getMyTracking,
  getMedicationTracking,
} from '../controllers/medicationTrackingController';
import { trackMedicationValidator, medicationIdParamValidator } from '../validators/medicationTrackingValidators';

const router = Router();

// All routes require authentication
router.use(authenticateJWT);

// Nurse: Track medication administration
router.post('/track', requireRole(['nurse']), trackMedicationValidator, trackMedication);

// Nurse: Get their own tracking for assigned patients
router.get('/my-tracking', requireRole(['nurse']), getMyTracking);

// Doctor: View all medication tracking information
router.get('/all', requireRole(['doctor']), getAllTracking);

// Get tracking for a specific medication
router.get('/medication/:medicationId', medicationIdParamValidator, getMedicationTracking);

export default router;

