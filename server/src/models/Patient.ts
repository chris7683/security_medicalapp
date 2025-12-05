import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { encrypt, decrypt, isEncrypted } from '../utils/encryption';

interface PatientAttributes {
  id: number;
  name: string;
  age: number;
  condition: string | null;
  assignedDoctorId?: number | null;
  assignedNurseId?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

type PatientCreationAttributes = Optional<PatientAttributes, 'id' | 'assignedDoctorId' | 'assignedNurseId' | 'createdAt' | 'updatedAt'>;

export class Patient extends Model<PatientAttributes, PatientCreationAttributes> implements PatientAttributes {
  public id!: number;
  public name!: string;
  public age!: number;
  public condition!: string | null;
  public assignedDoctorId!: number | null;
  public assignedNurseId!: number | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Patient.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      // Not using autoIncrement since we manually set id to match user.id
    },
    name: {
      type: DataTypes.TEXT, // Changed to TEXT to accommodate encrypted data (longer)
      allowNull: false,
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 0, max: 150 },
    },
    condition: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    assignedDoctorId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'assigned_doctor',
    },
    assignedNurseId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'assigned_nurse',
    },
  },
  { 
    sequelize, 
    modelName: 'Patient', 
    tableName: 'patients', 
    timestamps: false,
    hooks: {
      // Encrypt sensitive fields before creating
      beforeCreate: (patient: Patient) => {
        if (patient.name && !isEncrypted(patient.name)) {
          const encrypted = encrypt(patient.name);
          if (encrypted) patient.name = encrypted;
        }
        if (patient.condition && patient.condition !== null && typeof patient.condition === 'string' && patient.condition.trim() !== '' && !isEncrypted(patient.condition)) {
          const encrypted = encrypt(patient.condition);
          if (encrypted) patient.condition = encrypted;
        }
      },
      // Encrypt sensitive fields before updating
      beforeUpdate: (patient: Patient) => {
        // Only encrypt if the field was actually changed and not already encrypted
        if ((patient as any).changed('name') && patient.name && !isEncrypted(patient.name)) {
          const encrypted = encrypt(patient.name);
          if (encrypted) patient.name = encrypted;
        }
        if ((patient as any).changed('condition') && patient.condition && patient.condition !== null && typeof patient.condition === 'string' && patient.condition.trim() !== '' && !isEncrypted(patient.condition)) {
          const encrypted = encrypt(patient.condition);
          if (encrypted) patient.condition = encrypted;
        }
      },
      // Decrypt sensitive fields after retrieving
      afterFind: (instances: any) => {
        if (!instances) return;
        
        const decryptInstance = (instance: Patient) => {
          if (instance && instance.name) {
            const decrypted = decrypt(instance.name);
            if (decrypted) {
              (instance as any).dataValues.name = decrypted;
              instance.name = decrypted;
            }
          }
          if (instance && instance.condition && instance.condition !== null && typeof instance.condition === 'string' && instance.condition.trim() !== '') {
            const decrypted = decrypt(instance.condition);
            if (decrypted) {
              (instance as any).dataValues.condition = decrypted;
              instance.condition = decrypted;
            }
          }
        };
        
        if (Array.isArray(instances)) {
          instances.forEach(decryptInstance);
        } else {
          decryptInstance(instances);
        }
      },
    },
  }
);


