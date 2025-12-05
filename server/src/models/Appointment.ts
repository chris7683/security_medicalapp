import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

interface AppointmentAttributes {
  id: number;
  patientId: number;
  doctorId: number;
  appointmentDate: Date;
  status: AppointmentStatus;
  notes?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type AppointmentCreationAttributes = Optional<AppointmentAttributes, 'id' | 'status' | 'notes' | 'createdAt' | 'updatedAt'>;

export class Appointment extends Model<AppointmentAttributes, AppointmentCreationAttributes> implements AppointmentAttributes {
  public id!: number;
  public patientId!: number;
  public doctorId!: number;
  public appointmentDate!: Date;
  public status!: AppointmentStatus;
  public notes!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Appointment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    patientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'patient_id',
    },
    doctorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'doctor_id',
    },
    appointmentDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'appointment_date',
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Appointment',
    tableName: 'appointments',
    timestamps: true,
  }
);

