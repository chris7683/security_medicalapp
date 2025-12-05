import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface DiagnosisAttributes {
  id: number;
  appointmentId: number;
  doctorId: number;
  patientId: number;
  diagnosis: string;
  notes?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type DiagnosisCreationAttributes = Optional<DiagnosisAttributes, 'id' | 'notes' | 'createdAt' | 'updatedAt'>;

export class Diagnosis extends Model<DiagnosisAttributes, DiagnosisCreationAttributes> implements DiagnosisAttributes {
  public id!: number;
  public appointmentId!: number;
  public doctorId!: number;
  public patientId!: number;
  public diagnosis!: string;
  public notes!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Diagnosis.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    appointmentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'appointment_id',
    },
    doctorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'doctor_id',
    },
    patientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'patient_id',
    },
    diagnosis: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Diagnosis',
    tableName: 'diagnoses',
    timestamps: true,
  }
);

