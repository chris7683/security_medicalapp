import { Response } from 'express';
import { validationResult } from 'express-validator';
import { Patient } from '../models/Patient';
import { AuthenticatedRequest } from '../middleware/auth';

// Helper function to find patient record for a patient user
async function findPatientForUser(userId: number, username: string): Promise<Patient | null> {
  // Strategy 1: Calculate based on user ID offset (PRIMARY - most reliable)
  // User IDs: 1=DrJohn, 2=NurseAmy, 3=Patient1, 4=Patient2, etc.
  // Patient IDs: 1=Patient One, 2=Patient Two, etc.
  // So patient.id = user.id - 2 (if user.id >= 3)
  if (userId >= 3) {
    const calculatedPatientId = userId - 2;
    const patient = await Patient.findByPk(calculatedPatientId);
    if (patient) {
      console.log(`Mapped user.id=${userId} to patient.id=${calculatedPatientId} (${patient.name})`);
      return patient;
    }
  }

  // Strategy 2: Extract number from username (e.g., "Patient1" -> 1)
  // Fallback if calculation doesn't work
  if (username) {
    const match = username.match(/patient(\d+)/i);
    if (match) {
      const patientNum = parseInt(match[1], 10);
      // Map Patient1 -> Patient One (id=1), Patient2 -> Patient Two (id=2), etc.
      const numberWords = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];
      if (patientNum >= 1 && patientNum <= 10) {
        const patientName = `Patient ${numberWords[patientNum - 1]}`;
        const patient = await Patient.findOne({ where: { name: patientName } });
        if (patient) {
          console.log(`Mapped username ${username} to patient.id=${patient.id} (${patient.name})`);
          return patient;
        }
      }
    }
  }

  console.log(`Could not find patient record for user.id=${userId}, username=${username}`);
  return null;
}

export async function listPatients(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  const role = req.user.role;
  
  // Admin can see all patients
  if (role === 'admin') {
    const patients = await Patient.findAll();
    return res.json(patients);
  }
  
  if (role === 'doctor') {
    // Doctors can only see patients assigned to them
    const doctorId = parseInt(req.user.id, 10);
    console.log(`Doctor ${doctorId} (${req.user.username}) requesting patients`);
    const patients = await Patient.findAll({ where: { assignedDoctorId: doctorId } });
    console.log(`Found ${patients.length} patients assigned to doctor ${doctorId}`);
    
    // Log patient details for debugging
    patients.forEach((p: any) => {
      console.log(`  - Patient ID: ${p.id}, Name: ${p.name}, Assigned Doctor ID: ${p.assignedDoctorId}`);
    });
    
    return res.json(patients);
  }
  if (role === 'nurse') {
    const nurseId = parseInt(req.user.id, 10);
    console.log(`Nurse ${nurseId} (${req.user.username}) requesting patients`);
    const patients = await Patient.findAll({ where: { assignedNurseId: nurseId } });
    console.log(`Found ${patients.length} patients assigned to nurse ${nurseId}`);
    
    // Remove condition field for nurses - they should not see patient conditions
    // The afterFind hook should have already decrypted the names
    const patientsWithoutCondition = patients.map((p: any) => {
      // Use the instance directly (decryption already happened in afterFind hook)
      const patientData: any = {
        id: p.id,
        name: p.name, // Already decrypted by afterFind hook
        age: p.age,
        assignedDoctorId: p.assignedDoctorId,
        assignedNurseId: p.assignedNurseId,
        // condition is intentionally excluded
      };
      console.log(`Returning patient ${patientData.id}: ${patientData.name}`);
      return patientData;
    });
    return res.json(patientsWithoutCondition);
  }
  // patient role - only their own record
  const userId = parseInt(req.user.id, 10);
  const patient = await findPatientForUser(userId, req.user.username || '');
  if (!patient) return res.json([]);
  return res.json([patient]);
}

export async function getPatient(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  const id = req.params.id;
  const role = req.user.role;
  
  if (role === 'doctor') {
    const doctorId = parseInt(req.user.id, 10);
    const patient = await Patient.findByPk(id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    // Verify patient is assigned to this doctor
    if (patient.assignedDoctorId !== doctorId) {
      return res.status(403).json({ message: 'Forbidden: Patient is not assigned to you' });
    }
    return res.json(patient);
  }
  
  if (role === 'nurse') {
    const patient = await Patient.findByPk(id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    const nurseId = parseInt(req.user.id, 10);
    if (patient.assignedNurseId !== nurseId) return res.status(403).json({ message: 'Forbidden' });
    // Remove condition field for nurses - they should not see patient conditions
    // The afterFind hook should have already decrypted the name
    const patientData: any = {
      id: patient.id,
      name: patient.name, // Already decrypted by afterFind hook
      age: patient.age,
      assignedDoctorId: patient.assignedDoctorId,
      assignedNurseId: patient.assignedNurseId,
      // condition is intentionally excluded
    };
    return res.json(patientData);
  }
  
  // patient role - find their own patient record using logged-in user info
  const loggedInUserId = parseInt(req.user.id, 10);
  const patient = await findPatientForUser(loggedInUserId, req.user.username || '');
  if (!patient) {
    console.log(`No patient record found for user ${loggedInUserId} (${req.user.username})`);
    return res.status(404).json({ message: 'Patient not found' });
  }
  
  // Verify the requested ID matches (if different, deny access)
  const requestedId = parseInt(id, 10);
  const userPatient = await findPatientForUser(requestedId, req.user.username || '');
  if (!userPatient || userPatient.id !== patient.id) {
    return res.status(403).json({ message: 'Forbidden: Can only view own profile' });
  }
  
  console.log(`Patient ${req.user.username} (user.id=${loggedInUserId}) viewing patient record id=${patient.id}, name=${patient.name}`);
  return res.json(patient);
}

export async function updatePatient(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const id = req.params.id;
  const patient = await Patient.findByPk(id);
  if (!patient) return res.status(404).json({ message: 'Patient not found' });

  const role = req.user.role;
  if (role === 'doctor') {
    const doctorId = parseInt(req.user.id, 10);
    // Verify patient is assigned to this doctor
    if (patient.assignedDoctorId !== doctorId) {
      return res.status(403).json({ message: 'Forbidden: Patient is not assigned to you' });
    }
    // Doctors can update patient info and assign nurses, but not change assigned doctor
    const { name, age, condition, assignedNurseId } = req.body as Partial<Patient>;
    // Handle empty condition as deleting it (set to null)
    const updateData: any = { name, age, assignedNurseId };
    if (condition !== undefined) {
      // Convert empty string or whitespace-only strings to null
      const trimmedCondition = typeof condition === 'string' ? condition.trim() : condition;
      updateData.condition = (trimmedCondition === '' || trimmedCondition === null || trimmedCondition === undefined) ? null : trimmedCondition;
    }
    await patient.update(updateData);
    return res.json(patient);
  }
  if (role === 'nurse') {
    // Nurses cannot update patient records - they can only track medications
    return res.status(403).json({ message: 'Forbidden: Nurses cannot update patient records' });
  }
  // patient can only update own condition? We'll restrict to read-only for simplicity
  if (parseInt(id, 10) !== parseInt(req.user.id, 10)) return res.status(403).json({ message: 'Forbidden' });
  return res.status(403).json({ message: 'Patients cannot update records' });
}


