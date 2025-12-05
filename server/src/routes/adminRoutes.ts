import { Router } from 'express';
import { authenticateJWT, requireRole } from '../middleware/auth';
import {
  listUsers,
  createUser,
  deleteUser,
  assignDoctorToPatient,
  assignNurseToPatient,
  removeDoctorFromPatient,
  removeNurseFromPatient,
} from '../controllers/adminController';
import { createUserValidator, userIdParam } from '../validators/adminValidators';
import { auditLog } from '../middleware/auditLogger';

const router = Router();

router.use(authenticateJWT);
router.use(requireRole(['admin']));

router.get('/users', auditLog('admin_list_users'), listUsers);
router.post('/users', createUserValidator, auditLog('admin_create_user'), createUser);
router.delete('/users/:id', userIdParam, auditLog('admin_delete_user'), deleteUser);

router.post('/patients/:patientId/assign-doctor', auditLog('admin_assign_doctor'), assignDoctorToPatient);
router.post('/patients/:patientId/assign-nurse', auditLog('admin_assign_nurse'), assignNurseToPatient);
router.delete('/patients/:patientId/doctor', auditLog('admin_remove_doctor'), removeDoctorFromPatient);
router.delete('/patients/:patientId/nurse', auditLog('admin_remove_nurse'), removeNurseFromPatient);

export default router;

