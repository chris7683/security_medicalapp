import { User } from './User';
import { Patient } from './Patient';
import { RefreshToken } from './RefreshToken';
import { PasswordResetToken } from './PasswordResetToken';
import { Medication } from './Medication';
import { MedicationTracking } from './MedicationTracking';
import { Appointment } from './Appointment';
import { Diagnosis } from './Diagnosis';

// Associations
Patient.belongsTo(User, { as: 'assignedDoctor', foreignKey: 'assignedDoctorId' });
Patient.belongsTo(User, { as: 'assignedNurse', foreignKey: 'assignedNurseId' });

User.hasMany(Patient, { as: 'patientsAsDoctor', foreignKey: 'assignedDoctorId' });
User.hasMany(Patient, { as: 'patientsAsNurse', foreignKey: 'assignedNurseId' });

RefreshToken.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(RefreshToken, { foreignKey: 'userId' });

PasswordResetToken.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(PasswordResetToken, { foreignKey: 'userId' });

Medication.belongsTo(Patient, { as: 'Patient', foreignKey: 'patientId' });
Patient.hasMany(Medication, { as: 'Medications', foreignKey: 'patientId' });
Medication.belongsTo(User, { as: 'prescriber', foreignKey: 'prescribedBy' });
User.hasMany(Medication, { as: 'prescriptions', foreignKey: 'prescribedBy' });

MedicationTracking.belongsTo(Medication, { as: 'Medication', foreignKey: 'medicationId' });
Medication.hasMany(MedicationTracking, { as: 'Trackings', foreignKey: 'medicationId' });
MedicationTracking.belongsTo(User, { as: 'tracker', foreignKey: 'trackedBy' });
User.hasMany(MedicationTracking, { as: 'trackings', foreignKey: 'trackedBy' });

// Doctor-Nurse association
User.belongsTo(User, { as: 'assignedNurse', foreignKey: 'assignedNurseId' });
User.hasMany(User, { as: 'assignedDoctors', foreignKey: 'assignedNurseId' });

// Appointment associations
Appointment.belongsTo(Patient, { as: 'patient', foreignKey: 'patientId' });
Appointment.belongsTo(User, { as: 'doctor', foreignKey: 'doctorId' });
Patient.hasMany(Appointment, { as: 'appointments', foreignKey: 'patientId' });
User.hasMany(Appointment, { as: 'doctorAppointments', foreignKey: 'doctorId' });

// Diagnosis associations
Diagnosis.belongsTo(Appointment, { as: 'appointment', foreignKey: 'appointmentId' });
Diagnosis.belongsTo(User, { as: 'doctor', foreignKey: 'doctorId' });
Diagnosis.belongsTo(Patient, { as: 'patient', foreignKey: 'patientId' });
Appointment.hasOne(Diagnosis, { as: 'diagnosis', foreignKey: 'appointmentId' });
User.hasMany(Diagnosis, { as: 'diagnoses', foreignKey: 'doctorId' });
Patient.hasMany(Diagnosis, { as: 'diagnoses', foreignKey: 'patientId' });

export { User, Patient, RefreshToken, PasswordResetToken, Medication, MedicationTracking, Appointment, Diagnosis };


