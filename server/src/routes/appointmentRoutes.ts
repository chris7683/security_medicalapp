import { Router } from 'express';
import { authenticateJWT, requireRole } from '../middleware/auth';
import {
  createAppointment,
  listAppointments,
  getAppointment,
  updateAppointment,
  deleteAppointment,
} from '../controllers/appointmentController';
import {
  createAppointmentValidator,
  updateAppointmentValidator,
  appointmentIdParam,
} from '../validators/appointmentValidators';
import { auditLog } from '../middleware/auditLogger';

const router = Router();

router.use(authenticateJWT);

router.post('/', createAppointmentValidator, auditLog('create_appointment'), createAppointment);
router.get('/', listAppointments);
router.get('/:id', appointmentIdParam, getAppointment);
router.put('/:id', appointmentIdParam, updateAppointmentValidator, requireRole(['doctor']), auditLog('update_appointment'), updateAppointment);
router.delete('/:id', appointmentIdParam, auditLog('delete_appointment'), deleteAppointment);

export default router;

