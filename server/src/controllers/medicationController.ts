import { Response } from 'express';
import { validationResult } from 'express-validator';
import { Op } from 'sequelize';
import { Medication } from '../models/Medication';
import { MedicationTracking } from '../models/MedicationTracking';
import { Patient } from '../models/Patient';
import { AuthenticatedRequest } from '../middleware/auth';
import { decrypt } from '../utils/encryption';

// Helper function to find patient record for a patient user (same as in patientController)
async function findPatientForUser(userId: number, username: string): Promise<Patient | null> {
  // Strategy 1: Try direct match first (patient.id = user.id)
  // Some patients might have been created with matching IDs
  let patient = await Patient.findByPk(userId);
  if (patient) {
    console.log(`Mapped user.id=${userId} to patient.id=${userId} (direct match)`);
    return patient;
  }
  
  // Strategy 2: Calculate based on user ID offset (for standard pattern)
  // User IDs: 1=DrJohn, 2=NurseAmy, 3=Patient1, 4=Patient2, etc.
  // Patient IDs: 1=Patient One, 2=Patient Two, etc.
  // So patient.id = user.id - 2 (if user.id >= 3)
  if (userId >= 3) {
    const calculatedPatientId = userId - 2;
    patient = await Patient.findByPk(calculatedPatientId);
    if (patient) {
      console.log(`Mapped user.id=${userId} to patient.id=${calculatedPatientId} (offset calculation)`);
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
        // Since patient names are encrypted, we need to search through all and decrypt
        const allPatients = await Patient.findAll();
        for (const p of allPatients) {
          const decryptedName = decrypt(p.name);
          if (decryptedName && decryptedName.toLowerCase() === patientName.toLowerCase()) {
            console.log(`Mapped username ${username} to patient.id=${p.id} by decrypted name match`);
            return p;
          }
        }
      }
    }
    
    // Strategy 3: Search all patients and decrypt names to find match (for cases like "tom")
    const allPatients = await Patient.findAll();
    const usernameLower = username.toLowerCase();
    for (const p of allPatients) {
      const decryptedName = decrypt(p.name);
      if (decryptedName) {
        const decryptedLower = decryptedName.toLowerCase();
        // Check if username matches decrypted name (case-insensitive)
        if (decryptedLower.includes(usernameLower) || usernameLower.includes(decryptedLower.split(' ').pop() || '')) {
          console.log(`Mapped username ${username} to patient.id=${p.id} by decrypted name match: ${decryptedName}`);
          return p;
        }
      }
    }
  }

  console.log(`Could not find patient record for user.id=${userId}, username=${username}`);
  return null;
}

export async function createMedication(req: AuthenticatedRequest, res: Response) {
  if (!req.user || req.user.role !== 'doctor') {
    return res.status(403).json({ message: 'Forbidden: Only doctors can prescribe medications' });
  }
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { patientId, name, dosage, frequency, instructions } = req.body as {
    patientId: number;
    name: string;
    dosage: string;
    frequency: string;
    instructions?: string;
  };

  const patient = await Patient.findByPk(patientId);
  if (!patient) return res.status(404).json({ message: 'Patient not found' });

  // Verify patient is assigned to this doctor
  const doctorId = parseInt(req.user.id, 10);
  if (patient.assignedDoctorId !== doctorId) {
    return res.status(403).json({ message: 'Forbidden: You can only prescribe medications for your assigned patients' });
  }

  const medication = await Medication.create({
    patientId,
    name,
    dosage,
    frequency,
    instructions,
    prescribedBy: parseInt(req.user.id, 10),
  });

  return res.status(201).json(medication);
}

export async function listMedications(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

  if (req.user.role === 'patient') {
    // For patients, we need to find their patient record ID
    const userId = parseInt(req.user.id, 10);
    const username = req.user.username || '';
    
    console.log(`Patient user ${userId} (${username}) requesting medications`);
    
    // Use the helper function to find patient record
    const patient = await findPatientForUser(userId, username);
    
    if (!patient) {
      console.log(`No patient record found for user ${userId} (${username})`);
      return res.json([]);
    }
    
    console.log(`Found patient record id=${patient.id} for user ${userId}, loading medications`);
    
    // Get medications for this patient
    const medications = await Medication.findAll({ 
      where: { patientId: patient.id } 
    });
    
    console.log(`Found ${medications.length} medications for patient ${patient.id}`);
    
    // Decrypt medication names and dosages
    medications.forEach((med: any) => {
      if (med.name) {
        const decryptedName = decrypt(med.name);
        if (decryptedName) {
          med.name = decryptedName;
          if (med.dataValues) {
            med.dataValues.name = decryptedName;
          }
        }
      }
      if (med.dosage) {
        const decryptedDosage = decrypt(med.dosage);
        if (decryptedDosage) {
          med.dosage = decryptedDosage;
          if (med.dataValues) {
            med.dataValues.dosage = decryptedDosage;
          }
        }
      }
      if (med.instructions) {
        const decryptedInstructions = decrypt(med.instructions);
        if (decryptedInstructions) {
          med.instructions = decryptedInstructions;
          if (med.dataValues) {
            med.dataValues.instructions = decryptedInstructions;
          }
        }
      }
    });
    
    return res.json(medications);
  }

  if (req.user.role === 'doctor') {
    // Doctors can only see medications for their assigned patients
    const doctorId = parseInt(req.user.id, 10);
    console.log(`Doctor ${doctorId} (${req.user.username}) requesting medications`);
    
    const assignedPatients = await Patient.findAll({ 
      where: { assignedDoctorId: doctorId },
      attributes: ['id']
    });
    const patientIds = assignedPatients.map(p => p.id);
    
    console.log(`Found ${assignedPatients.length} patients assigned to doctor ${doctorId}`);
    console.log(`Patient IDs:`, patientIds);
    
    if (patientIds.length === 0) {
      console.log(`No patients assigned to doctor ${doctorId}, returning empty array`);
      return res.json([]);
    }
    
    // Use Op.in to explicitly filter by array of patient IDs
    const medications = await Medication.findAll({
      where: { 
        patientId: {
          [Op.in]: patientIds
        }
      },
      include: [{ model: Patient, as: 'Patient' }]
    });
    
    console.log(`Found ${medications.length} medications for doctor ${doctorId}'s assigned patients`);
    
    // Decrypt patient names in included Patient data
    medications.forEach((med: any) => {
      if (med.Patient && med.Patient.name) {
        const decryptedName = decrypt(med.Patient.name);
        if (decryptedName) {
          med.Patient.name = decryptedName;
          if (med.Patient.dataValues) {
            med.Patient.dataValues.name = decryptedName;
          }
        }
        if (med.Patient.condition) {
          const decryptedCondition = decrypt(med.Patient.condition);
          if (decryptedCondition) {
            med.Patient.condition = decryptedCondition;
            if (med.Patient.dataValues) {
              med.Patient.dataValues.condition = decryptedCondition;
            }
          }
        }
      }
    });
    
    return res.json(medications);
  }

  if (req.user.role === 'nurse') {
    // Nurses can only see medications for their assigned patients
    const nurseId = parseInt(req.user.id, 10);
    console.log(`Nurse ${nurseId} (${req.user.username}) requesting medications`);
    
    const assignedPatients = await Patient.findAll({ 
      where: { assignedNurseId: nurseId },
      attributes: ['id']
    });
    const patientIds = assignedPatients.map(p => p.id);
    
    console.log(`Found ${assignedPatients.length} patients assigned to nurse ${nurseId}`);
    console.log(`Patient IDs:`, patientIds);
    
    if (patientIds.length === 0) {
      console.log(`No patients assigned to nurse ${nurseId}, returning empty array`);
      return res.json([]);
    }
    
    // Use Op.in to explicitly filter by array of patient IDs
    const medications = await Medication.findAll({
      where: { 
        patientId: {
          [Op.in]: patientIds
        }
      },
      include: [{ model: Patient, as: 'Patient' }]
    });
    
    console.log(`Found ${medications.length} medications for nurse ${nurseId}'s assigned patients`);
    
    // Decrypt patient names in included Patient data
    medications.forEach((med: any) => {
      if (med.Patient && med.Patient.name) {
        const decryptedName = decrypt(med.Patient.name);
        if (decryptedName) {
          med.Patient.name = decryptedName;
          if (med.Patient.dataValues) {
            med.Patient.dataValues.name = decryptedName;
          }
        }
        if (med.Patient.condition) {
          const decryptedCondition = decrypt(med.Patient.condition);
          if (decryptedCondition) {
            med.Patient.condition = decryptedCondition;
            if (med.Patient.dataValues) {
              med.Patient.dataValues.condition = decryptedCondition;
            }
          }
        }
      }
    });
    
    return res.json(medications);
  }

  return res.status(403).json({ message: 'Forbidden' });
}

export async function getPatientMedications(req: AuthenticatedRequest, res: Response) {
  if (!req.user || (req.user.role !== 'doctor' && req.user.role !== 'nurse')) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const { patientId } = req.params;
  const patientIdNum = parseInt(patientId, 10);
  const patient = await Patient.findByPk(patientIdNum);
  
  if (!patient) {
    return res.status(404).json({ message: 'Patient not found' });
  }

  // If doctor, verify patient is assigned to them
  if (req.user.role === 'doctor') {
    const doctorId = parseInt(req.user.id, 10);
    if (patient.assignedDoctorId !== doctorId) {
      return res.status(403).json({ message: 'Forbidden: Patient is not assigned to you' });
    }
  }

  // If nurse, verify patient is assigned to them
  if (req.user.role === 'nurse') {
    const nurseId = parseInt(req.user.id, 10);
    if (patient.assignedNurseId !== nurseId) {
      return res.status(403).json({ message: 'Forbidden: Patient is not assigned to you' });
    }
  }

  const medications = await Medication.findAll({ where: { patientId: patientIdNum } });
  return res.json(medications);
}

export async function deleteMedication(req: AuthenticatedRequest, res: Response) {
  if (!req.user || req.user.role !== 'doctor') return res.status(403).json({ message: 'Forbidden' });

  const { id } = req.params;
  const medicationId = parseInt(id, 10);
  const medication = await Medication.findByPk(medicationId);
  if (!medication) return res.status(404).json({ message: 'Medication not found' });

  const doctorId = parseInt(req.user.id, 10);

  // Verify patient is assigned to this doctor
  // Doctors can delete any medication for their assigned patients
  const patient = await Patient.findByPk(medication.patientId);
  if (!patient) {
    return res.status(404).json({ message: 'Patient not found' });
  }
  
  if (patient.assignedDoctorId !== doctorId) {
    return res.status(403).json({ message: 'Forbidden: Patient is not assigned to you' });
  }

  // Delete all tracking records for this medication first
  // This prevents foreign key constraint violations
  // (Even though we have ON DELETE CASCADE, we do this explicitly for logging and clarity)
  const deletedTrackingCount = await MedicationTracking.destroy({
    where: { medicationId: medicationId }
  });
  console.log(`Deleted ${deletedTrackingCount} tracking record(s) for medication ${medicationId}`);

  // Now delete the medication
  await medication.destroy();
  return res.json({ message: 'Medication deleted successfully' });
}

