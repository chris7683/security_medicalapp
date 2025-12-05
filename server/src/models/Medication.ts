import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { encrypt, decrypt, isEncrypted } from '../utils/encryption';

interface MedicationAttributes {
  id: number;
  patientId: number;
  name: string;
  dosage: string;
  frequency: string;
  instructions?: string;
  prescribedBy: number;
  createdAt?: Date;
  updatedAt?: Date;
}

type MedicationCreationAttributes = Optional<MedicationAttributes, 'id' | 'createdAt' | 'updatedAt'>;

export class Medication extends Model<MedicationAttributes, MedicationCreationAttributes> implements MedicationAttributes {
  public id!: number;
  public patientId!: number;
  public name!: string;
  public dosage!: string;
  public frequency!: string;
  public instructions!: string | undefined;
  public prescribedBy!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Medication.init(
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
    name: {
      type: DataTypes.TEXT, // Changed to TEXT to accommodate encrypted data
      allowNull: false,
    },
    dosage: {
      type: DataTypes.TEXT, // Changed to TEXT to accommodate encrypted data
      allowNull: false,
    },
    frequency: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    instructions: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    prescribedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'prescribed_by',
    },
  },
  { 
    sequelize, 
    modelName: 'Medication', 
    tableName: 'medications', 
    timestamps: false,
    hooks: {
      // Encrypt sensitive fields before creating
      beforeCreate: (medication: Medication) => {
        if (medication.name && !isEncrypted(medication.name)) {
          const encrypted = encrypt(medication.name);
          if (encrypted) medication.name = encrypted;
        }
        if (medication.dosage && !isEncrypted(medication.dosage)) {
          const encrypted = encrypt(medication.dosage);
          if (encrypted) medication.dosage = encrypted;
        }
        if (medication.instructions && !isEncrypted(medication.instructions)) {
          const encrypted = encrypt(medication.instructions);
          if (encrypted) medication.instructions = encrypted;
        }
      },
      // Encrypt sensitive fields before updating
      beforeUpdate: (medication: Medication) => {
        if ((medication as any).changed('name') && medication.name && !isEncrypted(medication.name)) {
          const encrypted = encrypt(medication.name);
          if (encrypted) medication.name = encrypted;
        }
        if ((medication as any).changed('dosage') && medication.dosage && !isEncrypted(medication.dosage)) {
          const encrypted = encrypt(medication.dosage);
          if (encrypted) medication.dosage = encrypted;
        }
        if ((medication as any).changed('instructions') && medication.instructions && !isEncrypted(medication.instructions)) {
          const encrypted = encrypt(medication.instructions);
          if (encrypted) medication.instructions = encrypted;
        }
      },
      // Decrypt sensitive fields after retrieving
      afterFind: (instances: any) => {
        if (!instances) return;
        
        const decryptInstance = (instance: Medication) => {
          if (instance && instance.name) {
            const decrypted = decrypt(instance.name);
            if (decrypted) {
              (instance as any).dataValues.name = decrypted;
              instance.name = decrypted;
            }
          }
          if (instance && instance.dosage) {
            const decrypted = decrypt(instance.dosage);
            if (decrypted) {
              (instance as any).dataValues.dosage = decrypted;
              instance.dosage = decrypted;
            }
          }
          if (instance && instance.instructions) {
            const decrypted = decrypt(instance.instructions);
            if (decrypted) {
              (instance as any).dataValues.instructions = decrypted;
              instance.instructions = decrypted;
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

