import { Response } from 'express';
import bcrypt from 'bcrypt';
import { validationResult } from 'express-validator';
import { QueryTypes } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from '../models/User';
import { Patient } from '../models/Patient';
import { Appointment } from '../models/Appointment';
import { Medication } from '../models/Medication';
import { MedicationTracking } from '../models/MedicationTracking';
import { Diagnosis } from '../models/Diagnosis';
import { AuthenticatedRequest } from '../middleware/auth';

export async function listUsers(req: AuthenticatedRequest, res: Response) {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  const users = await User.findAll({ attributes: { exclude: ['password'] } });
  return res.json(users);
}

export async function createUser(req: AuthenticatedRequest, res: Response) {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { username, email, password, role } = req.body as {
    username: string;
    email: string;
    password: string;
    role: 'admin' | 'doctor' | 'nurse' | 'patient';
  };

  const emailNormalized = email.trim().toLowerCase();
  const existing = await User.findOne({ where: { email: emailNormalized } });
  if (existing) return res.status(409).json({ message: 'Email already in use' });

  const saltRounds = 12;
  const hashed = await bcrypt.hash(password, saltRounds);
  const user = await User.create({ username, email: emailNormalized, password: hashed, role });

  if (role === 'patient') {
    await Patient.create({ id: user.id, name: username, age: 0, condition: 'N/A' });
  }

  return res.status(201).json({ id: user.id, username: user.username, email: user.email, role: user.role });
}

export async function deleteUser(req: AuthenticatedRequest, res: Response) {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  const { id } = req.params;
  const userId = parseInt(id, 10);
  if (userId === parseInt(req.user.id, 10)) return res.status(400).json({ message: 'Cannot delete yourself' });

  const user = await User.findByPk(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  // Handle all foreign key references before deleting the user
  
  // 1. Remove user as assigned doctor from patients
  await Patient.update(
    { assignedDoctorId: null },
    { where: { assignedDoctorId: userId } }
  );

  // 2. Remove user as assigned nurse from patients
  await Patient.update(
    { assignedNurseId: null },
    { where: { assignedNurseId: userId } }
  );

  // 3. Remove user as assigned nurse from other users (doctors)
  await User.update(
    { assignedNurseId: null },
    { where: { assignedNurseId: userId } }
  );

  // 4. Delete appointments where user is the doctor
  // Note: After running fix_user_delete_constraints.sql, this will be handled by CASCADE
  // But we handle it explicitly for safety and immediate effect
  await Appointment.destroy({ where: { doctorId: userId } });

  // 5. Delete diagnoses where user is the doctor
  // Note: After running fix_user_delete_constraints.sql, this will be handled by CASCADE
  await Diagnosis.destroy({ where: { doctorId: userId } });

  // 6. Delete medications prescribed by this user
  // Note: After running fix_user_delete_constraints.sql, this will be handled by CASCADE
  await Medication.destroy({ where: { prescribedBy: userId } });

  // 7. Delete medication tracking records tracked by this user
  // Note: After running fix_user_delete_constraints.sql, this will be handled by CASCADE
  await MedicationTracking.destroy({ where: { trackedBy: userId } });

  // 8. Delete patient record if user is a patient
  if (user.role === 'patient') {
    // First, delete all medications for this patient (they reference patient_id)
    await Medication.destroy({ where: { patientId: userId } });
    
    // Then delete the patient record
    await Patient.destroy({ where: { id: userId } });
  }

  // 9. Delete refresh tokens for this user (explicit deletion for safety, CASCADE will also handle it)
  await sequelize.query('DELETE FROM refresh_tokens WHERE user_id = :userId', {
    replacements: { userId },
    type: QueryTypes.DELETE,
  });

  // 10. Delete password reset tokens for this user (explicit deletion for safety, CASCADE will also handle it)
  await sequelize.query('DELETE FROM password_reset_tokens WHERE user_id = :userId', {
    replacements: { userId },
    type: QueryTypes.DELETE,
  });

  // 11. Finally, delete the user
  // RefreshToken and PasswordResetToken now have ON DELETE CASCADE, so they'll be deleted automatically
  // But we delete them explicitly above for immediate effect and logging
  await user.destroy();

  return res.json({ message: 'User deleted successfully' });
}

export async function assignDoctorToPatient(req: AuthenticatedRequest, res: Response) {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  
  try {
    const { patientId } = req.params;
    const { doctorId } = req.body as { doctorId: number };

    if (!doctorId || isNaN(doctorId)) {
      return res.status(400).json({ message: 'Invalid doctorId: doctorId is required and must be a number' });
    }

    const doctor = await User.findByPk(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: `Doctor with ID ${doctorId} not found` });
    }
    if (doctor.role !== 'doctor') {
      return res.status(400).json({ message: `User with ID ${doctorId} is not a doctor (role: ${doctor.role})` });
    }

    const patientIdNum = parseInt(patientId, 10);
    if (isNaN(patientIdNum)) {
      return res.status(400).json({ message: 'Invalid patientId: must be a number' });
    }

    const patient = await Patient.findByPk(patientIdNum);
    if (!patient) {
      return res.status(404).json({ message: `Patient with ID ${patientIdNum} not found` });
    }

    await patient.update({ assignedDoctorId: doctorId });
    return res.json(patient);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error assigning doctor to patient:', error);
    return res.status(500).json({ 
      message: 'Failed to assign doctor to patient',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
}

export async function assignNurseToPatient(req: AuthenticatedRequest, res: Response) {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  const { patientId } = req.params;
  const { nurseId } = req.body as { nurseId: number };

  const nurse = await User.findByPk(nurseId);
  if (!nurse || nurse.role !== 'nurse') return res.status(400).json({ message: 'Invalid nurseId' });

  const patient = await Patient.findByPk(parseInt(patientId, 10));
  if (!patient) return res.status(404).json({ message: 'Patient not found' });

  await patient.update({ assignedNurseId: nurseId });
  return res.json(patient);
}

export async function removeDoctorFromPatient(req: AuthenticatedRequest, res: Response) {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  const { patientId } = req.params;
  const patient = await Patient.findByPk(parseInt(patientId, 10));
  if (!patient) return res.status(404).json({ message: 'Patient not found' });

  await patient.update({ assignedDoctorId: null });
  return res.json(patient);
}

export async function removeNurseFromPatient(req: AuthenticatedRequest, res: Response) {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  const { patientId } = req.params;
  const patient = await Patient.findByPk(parseInt(patientId, 10));
  if (!patient) return res.status(404).json({ message: 'Patient not found' });

  await patient.update({ assignedNurseId: null });
  return res.json(patient);
}

