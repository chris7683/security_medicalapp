import { Response } from 'express';
import { validationResult } from 'express-validator';
import { Op } from 'sequelize';
import { Appointment } from '../models/Appointment';
import { Patient } from '../models/Patient';
import { User } from '../models/User';
import { AuthenticatedRequest } from '../middleware/auth';
import { decrypt } from '../utils/encryption';

// Helper to ensure patient data is decrypted
const decryptPatient = (appointment: any) => {
  if (appointment && appointment.patient) {
    if (appointment.patient.name) {
      const decryptedName = decrypt(appointment.patient.name);
      if (decryptedName) appointment.patient.name = decryptedName;
    }
    if (appointment.patient.condition) {
      const decryptedCondition = decrypt(appointment.patient.condition);
      if (decryptedCondition) appointment.patient.condition = decryptedCondition;
    }
  }
  return appointment;
};

export async function createAppointment(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { patientId, doctorId, appointmentDate, notes } = req.body as {
    patientId: number;
    doctorId: number;
    appointmentDate: string;
    notes?: string;
  };

  // Patients can only create appointments for themselves
  if (req.user.role === 'patient') {
    const userId = parseInt(req.user.id, 10);
    const patient = await Patient.findOne({ where: { id: userId } });
    if (!patient) return res.status(404).json({ message: 'Patient record not found' });
    if (patientId !== userId) {
      return res.status(403).json({ message: 'Patients can only request appointments for themselves' });
    }
  }

  // Verify doctor exists
  const doctor = await User.findByPk(doctorId);
  if (!doctor || doctor.role !== 'doctor') {
    return res.status(400).json({ message: 'Invalid doctor ID' });
  }

  // Verify patient exists
  const patient = await Patient.findByPk(patientId);
  if (!patient) {
    return res.status(404).json({ message: 'Patient not found' });
  }

  const appointment = await Appointment.create({
    patientId,
    doctorId,
    appointmentDate: new Date(appointmentDate),
    status: 'pending',
    notes: notes || null,
  });

  return res.status(201).json(appointment);
}

export async function listAppointments(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  const role = req.user.role;
  const userId = parseInt(req.user.id, 10);

  let appointments;
  if (role === 'doctor') {
    // Doctors can only see appointments for their assigned patients
    const doctorId = userId;
    console.log(`Doctor ${doctorId} (${req.user.username}) requesting appointments`);
    
    const assignedPatients = await Patient.findAll({ where: { assignedDoctorId: doctorId } });
    const patientIds = assignedPatients.map(p => p.id);
    
    console.log(`Found ${assignedPatients.length} patients assigned to doctor ${doctorId}`);
    console.log(`Patient IDs:`, patientIds);
    
    if (patientIds.length === 0) {
      console.log(`No patients assigned to doctor ${doctorId}, returning empty array`);
      return res.json([]);
    }
    
    // Get appointments for assigned patients (regardless of which doctor created them)
    // This allows doctors to see all appointments for their assigned patients
    appointments = await Appointment.findAll({
      where: { 
        patientId: {
          [Op.in]: patientIds
        }
      },
      include: [
        { model: Patient, as: 'patient' },
        { model: User, as: 'doctor' },
      ],
      order: [['appointmentDate', 'ASC']],
    });
    
    console.log(`Found ${appointments.length} appointments for doctor ${doctorId}`);
  } else if (role === 'patient') {
    const patient = await Patient.findOne({ where: { id: userId } });
    if (!patient) return res.json([]);
    appointments = await Appointment.findAll({
      where: { patientId: patient.id },
      include: [
        { model: Patient, as: 'patient' },
        { model: User, as: 'doctor' },
      ],
      order: [['appointmentDate', 'DESC']],
    });
  } else {
    return res.status(403).json({ message: 'Forbidden' });
  }

  // Decrypt patient data for each appointment
  const decryptedAppointments = appointments.map(app => decryptPatient(app));

  return res.json(decryptedAppointments);
}

export async function getAppointment(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  const { id } = req.params;
  const role = req.user.role;
  const userId = parseInt(req.user.id, 10);

  const appointment = await Appointment.findByPk(id, {
    include: [
      { model: Patient, as: 'patient' },
      { model: User, as: 'doctor' },
    ],
  });

  if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

  // Check access
  if (role === 'doctor') {
    if (appointment.doctorId !== userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    // Verify patient is assigned to this doctor
    const patient = await Patient.findByPk(appointment.patientId);
    if (!patient || patient.assignedDoctorId !== userId) {
      return res.status(403).json({ message: 'Forbidden: Patient is not assigned to you' });
    }
  }
  if (role === 'patient') {
    const patient = await Patient.findOne({ where: { id: userId } });
    if (!patient || appointment.patientId !== patient.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
  }

  return res.json(decryptPatient(appointment));
}

export async function updateAppointment(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { id } = req.params;
  const role = req.user.role;
  const userId = parseInt(req.user.id, 10);

  const appointment = await Appointment.findByPk(id, {
    include: [{ model: Patient, as: 'patient' }],
  });
  if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

  // Only doctors can update appointments
  if (role !== 'doctor') {
    return res.status(403).json({ message: 'Forbidden: Only doctors can update appointments' });
  }

  // Doctors can update appointments for their assigned patients
  // (regardless of which doctor created the appointment)
  const patient = await Patient.findByPk(appointment.patientId);
  if (!patient || patient.assignedDoctorId !== userId) {
    console.log(`Doctor ${userId} attempted to update appointment ${id} for patient ${appointment.patientId}, but patient is not assigned to them`);
    return res.status(403).json({ message: 'Forbidden: Patient is not assigned to you' });
  }

  const { status, appointmentDate, notes } = req.body as {
    status?: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    appointmentDate?: string;
    notes?: string;
  };

  const updateData: any = {};
  if (status) updateData.status = status;
  if (appointmentDate) updateData.appointmentDate = new Date(appointmentDate);
  if (notes !== undefined) updateData.notes = notes;

  await appointment.update(updateData);
  return res.json(appointment);
}

export async function deleteAppointment(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  const { id } = req.params;
  const role = req.user.role;
  const userId = parseInt(req.user.id, 10);

  const appointment = await Appointment.findByPk(id);
  if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

  // Patients can delete their own pending appointments
  if (role === 'patient') {
    const patient = await Patient.findOne({ where: { id: userId } });
    if (!patient || appointment.patientId !== patient.id || appointment.status !== 'pending') {
      return res.status(403).json({ message: 'Forbidden' });
    }
  } else if (role === 'doctor') {
    // Doctors can delete appointments for their assigned patients
    // (regardless of which doctor created the appointment)
    const patient = await Patient.findByPk(appointment.patientId);
    if (!patient || patient.assignedDoctorId !== userId) {
      console.log(`Doctor ${userId} attempted to delete appointment ${id} for patient ${appointment.patientId}, but patient is not assigned to them`);
      return res.status(403).json({ message: 'Forbidden: Patient is not assigned to you' });
    }
  } else {
    return res.status(403).json({ message: 'Forbidden' });
  }

  await appointment.destroy();
  return res.json({ message: 'Appointment deleted' });
}

