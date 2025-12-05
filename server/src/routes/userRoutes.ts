import { Router } from 'express';
import { authenticateJWT, requireRole } from '../middleware/auth';
import { assignNurse, assignNurseToDoctor, changePassword, listDoctors, listNurses } from '../controllers/userController';
import { assignNurseValidator } from '../validators/patientValidators';
import { assignNurseToDoctorValidator, changePasswordValidator } from '../validators/userValidators';
import { auditLog } from '../middleware/auditLogger';

const router = Router();

router.use(authenticateJWT);

router.get('/doctors', listDoctors);
router.get('/nurses', listNurses);
router.post('/:patientId/assign-nurse', requireRole(['doctor']), assignNurseValidator, assignNurse);
router.post('/assign-nurse', requireRole(['doctor']), assignNurseToDoctorValidator, auditLog('doctor_assign_nurse'), assignNurseToDoctor);
router.put('/change-password', changePasswordValidator, auditLog('change_password'), changePassword);

export default router;


