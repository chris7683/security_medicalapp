import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import { Patient } from '../models/Patient';
import { User } from '../models/User';
import { AuthenticatedRequest } from '../middleware/auth';

export async function assignNurse(req: AuthenticatedRequest, res: Response) {
  if (!req.user || req.user.role !== 'doctor') {
    return res.status(403).json({ message: 'Forbidden: Only doctors can assign nurses to patients' });
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  
  const { patientId } = req.params as { patientId: string };
  const { nurseId } = req.body as { nurseId: string | number | null };

  const doctorId = parseInt(req.user.id, 10);
  const patientIdNum = parseInt(patientId, 10);
  const patient = await Patient.findByPk(patientIdNum);
  if (!patient) return res.status(404).json({ message: 'Patient not found' });

  // Verify patient is assigned to this doctor
  if (patient.assignedDoctorId !== doctorId) {
    return res.status(403).json({ message: 'Forbidden: You can only assign nurses to your assigned patients' });
  }

  // Handle null/empty nurseId as removing assignment
  if (nurseId === null || nurseId === undefined || nurseId === '' || nurseId === 'null') {
    await patient.update({ assignedNurseId: null });
    return res.json(patient);
  }

  // Validate nurse exists and is a nurse
  const nurseIdNum = typeof nurseId === 'string' ? parseInt(nurseId, 10) : nurseId;
  if (isNaN(nurseIdNum)) {
    return res.status(400).json({ message: 'Invalid nurseId' });
  }

  const nurse = await User.findByPk(nurseIdNum);
  if (!nurse || nurse.role !== 'nurse') {
    return res.status(400).json({ message: 'Invalid nurseId' });
  }

  await patient.update({ assignedNurseId: nurseIdNum });
  return res.json(patient);
}

export async function assignNurseToDoctor(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  if (req.user.role !== 'doctor') return res.status(403).json({ message: 'Only doctors can assign nurses to themselves' });

  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { nurseId } = req.body as { nurseId: number };
  const doctorId = parseInt(req.user.id, 10);

  const nurse = await User.findByPk(nurseId);
  if (!nurse || nurse.role !== 'nurse') {
    return res.status(400).json({ message: 'Invalid nurse ID' });
  }

  const doctor = await User.findByPk(doctorId);
  if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

  await doctor.update({ assignedNurseId: nurseId });
  return res.json({ message: 'Nurse assigned successfully', doctor });
}

export async function changePassword(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { currentPassword, newPassword } = req.body as {
    currentPassword: string;
    newPassword: string;
  };

  const userId = parseInt(req.user.id, 10);
  const user = await User.findByPk(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  // Verify current password
  const storedPwd: string = user.password || '';
  const isHashed = storedPwd.startsWith('$2');
  let valid = false;
  if (isHashed) {
    valid = await bcrypt.compare(currentPassword, storedPwd);
  } else {
    valid = currentPassword === storedPwd;
  }

  if (!valid) {
    return res.status(401).json({ message: 'Current password is incorrect' });
  }

  // Hash new password
  const saltRounds = 12;
  const hashed = await bcrypt.hash(newPassword, saltRounds);
  await user.update({ password: hashed });

  return res.json({ message: 'Password changed successfully' });
}

export async function listDoctors(req: AuthenticatedRequest, res: Response) {
  try {
    console.log(`listDoctors: User ${req.user?.id || 'anonymous'} (${req.user?.username || 'N/A'}) requesting doctors`);
    
    const doctors = await User.findAll({
      where: { role: 'doctor' },
      attributes: ['id', 'username', 'email'],
    });
    
    console.log(`Found ${doctors.length} doctors:`, doctors.map(d => ({ id: d.id, username: d.username, email: d.email })));
    return res.json(doctors);
  } catch (error) {
    console.error('Error listing doctors:', error);
    return res.status(500).json({ message: 'Failed to retrieve doctors' });
  }
}

export async function listNurses(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      console.log('listNurses: No user in request');
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    console.log(`listNurses: User ${req.user.id} (${req.user.username}, role: ${req.user.role}) requesting nurses`);
    
    const nurses = await User.findAll({
      where: { role: 'nurse' },
      attributes: ['id', 'username', 'email'],
    });
    
    console.log(`Found ${nurses.length} nurses:`, nurses.map(n => ({ id: n.id, username: n.username, email: n.email })));
    return res.json(nurses);
  } catch (error) {
    console.error('Error listing nurses:', error);
    return res.status(500).json({ message: 'Failed to retrieve nurses' });
  }
}


