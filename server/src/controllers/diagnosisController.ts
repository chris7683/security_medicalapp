import { Response } from 'express';
import { validationResult } from 'express-validator';
import { Diagnosis } from '../models/Diagnosis';
import { Appointment } from '../models/Appointment';
import { Patient } from '../models/Patient';
import { AuthenticatedRequest } from '../middleware/auth';

export async function createDiagnosis(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  if (req.user.role !== 'doctor') return res.status(403).json({ message: 'Only doctors can create diagnoses' });

  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { appointmentId, diagnosis, notes } = req.body as {
    appointmentId: number;
    diagnosis: string;
    notes?: string;
  };

  const doctorId = parseInt(req.user.id, 10);

  // Verify appointment exists and belongs to this doctor
  const appointment = await Appointment.findByPk(appointmentId);
  if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
  if (appointment.doctorId !== doctorId) {
    return res.status(403).json({ message: 'You can only write diagnoses for your own appointments' });
  }
  
  // Verify patient is assigned to this doctor
  const patient = await Patient.findByPk(appointment.patientId);
  if (!patient) return res.status(404).json({ message: 'Patient not found' });
  if (patient.assignedDoctorId !== doctorId) {
    return res.status(403).json({ message: 'Forbidden: Patient is not assigned to you' });
  }

  // Check if diagnosis already exists
  const existing = await Diagnosis.findOne({ where: { appointmentId } });
  if (existing) {
    return res.status(409).json({ message: 'Diagnosis already exists for this appointment' });
  }

  const newDiagnosis = await Diagnosis.create({
    appointmentId,
    doctorId,
    patientId: appointment.patientId,
    diagnosis,
    notes: notes || null,
  });

  // Update appointment status to completed
  await appointment.update({ status: 'completed' });

  return res.status(201).json(newDiagnosis);
}

export async function getDiagnosis(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  const { appointmentId } = req.params;
  const role = req.user.role;
  const userId = parseInt(req.user.id, 10);

  const diagnosis = await Diagnosis.findOne({
    where: { appointmentId: parseInt(appointmentId, 10) },
    include: [
      { model: Appointment, as: 'appointment' },
      { model: Patient, as: 'patient' },
    ],
  });

  if (!diagnosis) return res.status(404).json({ message: 'Diagnosis not found' });

  // Check access
  if (role === 'doctor') {
    if (diagnosis.doctorId !== userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    // Verify patient is assigned to this doctor
    const patient = await Patient.findByPk(diagnosis.patientId);
    if (!patient || patient.assignedDoctorId !== userId) {
      return res.status(403).json({ message: 'Forbidden: Patient is not assigned to you' });
    }
  }
  if (role === 'patient') {
    const patient = await Patient.findOne({ where: { id: userId } });
    if (!patient || diagnosis.patientId !== patient.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
  }

  return res.json(diagnosis);
}

export async function listPatientDiagnoses(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  const role = req.user.role;
  const userId = parseInt(req.user.id, 10);

  let diagnoses;
  if (role === 'patient') {
    const patient = await Patient.findOne({ where: { id: userId } });
    if (!patient) return res.json([]);
    diagnoses = await Diagnosis.findAll({
      where: { patientId: patient.id },
      include: [
        { model: Appointment, as: 'appointment' },
        { model: Patient, as: 'patient' },
      ],
      order: [['createdAt', 'DESC']],
    });
  } else if (role === 'doctor') {
    // Doctors can only see diagnoses for their assigned patients
    const assignedPatients = await Patient.findAll({ where: { assignedDoctorId: userId } });
    const patientIds = assignedPatients.map(p => p.id);
    
    if (patientIds.length === 0) {
      return res.json([]);
    }
    
    diagnoses = await Diagnosis.findAll({
      where: { 
        doctorId: userId,
        patientId: patientIds
      },
      include: [
        { model: Appointment, as: 'appointment' },
        { model: Patient, as: 'patient' },
      ],
      order: [['createdAt', 'DESC']],
    });
  } else {
    return res.status(403).json({ message: 'Forbidden' });
  }

  return res.json(diagnoses);
}

export async function updateDiagnosis(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  if (req.user.role !== 'doctor') return res.status(403).json({ message: 'Only doctors can update diagnoses' });

  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { id } = req.params;
  const doctorId = parseInt(req.user.id, 10);

  const diagnosis = await Diagnosis.findByPk(id);
  if (!diagnosis) return res.status(404).json({ message: 'Diagnosis not found' });
  if (diagnosis.doctorId !== doctorId) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  
  // Verify patient is assigned to this doctor
  const patient = await Patient.findByPk(diagnosis.patientId);
  if (!patient || patient.assignedDoctorId !== doctorId) {
    return res.status(403).json({ message: 'Forbidden: Patient is not assigned to you' });
  }

  const { diagnosis: diagnosisText, notes } = req.body as {
    diagnosis?: string;
    notes?: string;
  };

  const updateData: any = {};
  if (diagnosisText) updateData.diagnosis = diagnosisText;
  if (notes !== undefined) updateData.notes = notes;

  await diagnosis.update(updateData);
  return res.json(diagnosis);
}

