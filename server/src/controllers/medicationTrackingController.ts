import { Response } from 'express';
import { validationResult } from 'express-validator';
import { Op } from 'sequelize';
import { MedicationTracking } from '../models/MedicationTracking';
import { Medication } from '../models/Medication';
import { Patient } from '../models/Patient';
import { User } from '../models/User';
import { AuthenticatedRequest } from '../middleware/auth';
import { decrypt } from '../utils/encryption';

// Nurse: Track medication administration
export async function trackMedication(req: AuthenticatedRequest, res: Response) {
  if (!req.user || req.user.role !== 'nurse') {
    return res.status(403).json({ message: 'Forbidden: Only nurses can track medications' });
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { medicationId, status, notes } = req.body as {
    medicationId: number;
    status: 'given' | 'missed' | 'pending';
    notes?: string;
  };

  // Verify medication exists and nurse is assigned to the patient
  const medication = await Medication.findByPk(medicationId);
  if (!medication) return res.status(404).json({ message: 'Medication not found' });

  const patient = await Patient.findByPk(medication.patientId);
  if (!patient) return res.status(404).json({ message: 'Patient not found' });

  // Check if nurse is assigned to this patient
  const nurseId = parseInt(req.user.id, 10);
  if (patient.assignedNurseId !== nurseId) {
    return res.status(403).json({ message: 'Forbidden: You can only track medications for your assigned patients' });
  }

  // Create or update tracking record
  const [tracking, created] = await MedicationTracking.findOrCreate({
    where: {
      medicationId,
      trackedBy: nurseId,
    },
    defaults: {
      medicationId,
      trackedBy: nurseId,
      status,
      notes,
      trackedAt: new Date(),
    },
  });

  if (!created) {
    // Update existing tracking
    await tracking.update({ status, notes, trackedAt: new Date() });
  }

  return res.json(tracking);
}

// Doctor: View medication tracking information for their assigned patients
export async function getAllTracking(req: AuthenticatedRequest, res: Response) {
  if (!req.user || req.user.role !== 'doctor') {
    return res.status(403).json({ message: 'Forbidden: Only doctors can view tracking information' });
  }

  const doctorId = parseInt(req.user.id, 10);
  console.log(`Doctor ${doctorId} (${req.user.username}) requesting tracking information`);

  // Get patients assigned to this doctor
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

  // Get medications for assigned patients
  const medications = await Medication.findAll({
    where: { 
      patientId: {
        [Op.in]: patientIds
      }
    },
    attributes: ['id']
  });
  const medicationIds = medications.map(m => m.id);
  
  console.log(`Found ${medications.length} medications for doctor ${doctorId}'s assigned patients`);
  console.log(`Medication IDs:`, medicationIds);

  if (medicationIds.length === 0) {
    console.log(`No medications found for doctor ${doctorId}'s assigned patients`);
    return res.json([]);
  }

  // Get tracking records for these medications
  const trackings = await MedicationTracking.findAll({
    where: {
      medicationId: {
        [Op.in]: medicationIds
      }
    },
    include: [
      {
        model: Medication,
        as: 'Medication',
        include: [{ model: Patient, as: 'Patient' }],
      },
      {
        model: User,
        as: 'tracker',
        attributes: ['id', 'username', 'email'],
      },
    ],
    order: [['trackedAt', 'DESC']],
  });

  console.log(`Found ${trackings.length} tracking records for doctor ${doctorId}`);

  // Decrypt patient names, medication names, and dosages in included data
  trackings.forEach((tracking: any) => {
    if (tracking.Medication) {
      // Decrypt medication name if encrypted
      if (tracking.Medication.name) {
        const decryptedMedName = decrypt(tracking.Medication.name);
        if (decryptedMedName) {
          tracking.Medication.name = decryptedMedName;
          if (tracking.Medication.dataValues) {
            tracking.Medication.dataValues.name = decryptedMedName;
          }
        }
      }
      
      // Decrypt medication dosage if encrypted
      if (tracking.Medication.dosage) {
        const decryptedDosage = decrypt(tracking.Medication.dosage);
        if (decryptedDosage) {
          tracking.Medication.dosage = decryptedDosage;
          if (tracking.Medication.dataValues) {
            tracking.Medication.dataValues.dosage = decryptedDosage;
          }
        }
      }
      
      // Decrypt medication instructions if encrypted
      if (tracking.Medication.instructions) {
        const decryptedInstructions = decrypt(tracking.Medication.instructions);
        if (decryptedInstructions) {
          tracking.Medication.instructions = decryptedInstructions;
          if (tracking.Medication.dataValues) {
            tracking.Medication.dataValues.instructions = decryptedInstructions;
          }
        }
      }
      
      // Decrypt patient name if included
      if (tracking.Medication.Patient && tracking.Medication.Patient.name) {
        const decryptedPatientName = decrypt(tracking.Medication.Patient.name);
        if (decryptedPatientName) {
          tracking.Medication.Patient.name = decryptedPatientName;
          if (tracking.Medication.Patient.dataValues) {
            tracking.Medication.Patient.dataValues.name = decryptedPatientName;
          }
        }
      }
    }
  });

  return res.json(trackings);
}

// Nurse: Get tracking for their assigned patients
export async function getMyTracking(req: AuthenticatedRequest, res: Response) {
  if (!req.user || req.user.role !== 'nurse') {
    return res.status(403).json({ message: 'Forbidden: Only nurses can view their tracking' });
  }

  const nurseId = parseInt(req.user.id, 10);
  
  // Get all patients assigned to this nurse
  const assignedPatients = await Patient.findAll({ where: { assignedNurseId: nurseId } });
  const patientIds = assignedPatients.map(p => p.id);

  // Get all medications for assigned patients
  const medications = await Medication.findAll({ where: { patientId: patientIds } });
  const medicationIds = medications.map(m => m.id);

  // Get tracking for those medications
  const trackings = await MedicationTracking.findAll({
    where: { medicationId: medicationIds },
    include: [
      {
        model: Medication,
        as: 'Medication',
        include: [{ model: Patient, as: 'Patient' }],
      },
    ],
    order: [['trackedAt', 'DESC']],
  });

  return res.json(trackings);
}

// Get tracking for a specific medication
export async function getMedicationTracking(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

  const { medicationId } = req.params;
  const role = req.user.role;

  if (role === 'doctor') {
    // Doctors can see all tracking
    const trackings = await MedicationTracking.findAll({
      where: { medicationId: parseInt(medicationId, 10) },
      include: [
        {
          model: User,
          as: 'tracker',
          attributes: ['id', 'username', 'email'],
        },
      ],
      order: [['trackedAt', 'DESC']],
    });
    return res.json(trackings);
  }

  if (role === 'nurse') {
    // Nurses can see tracking for their assigned patients
    const medication = await Medication.findByPk(medicationId);
    if (!medication) return res.status(404).json({ message: 'Medication not found' });

    const patient = await Patient.findByPk(medication.patientId);
    if (!patient || patient.assignedNurseId !== parseInt(req.user.id, 10)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const trackings = await MedicationTracking.findAll({
      where: { medicationId: parseInt(medicationId, 10) },
      order: [['trackedAt', 'DESC']],
    });
    return res.json(trackings);
  }

  return res.status(403).json({ message: 'Forbidden' });
}

