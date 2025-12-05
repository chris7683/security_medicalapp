import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { Medication } from './Medication';
import { User } from './User';
import { encrypt, decrypt, isEncrypted } from '../utils/encryption';

interface MedicationTrackingAttributes {
  id: number;
  medicationId: number;
  trackedBy: number; // Nurse's user ID
  status: 'given' | 'missed' | 'pending';
  notes?: string;
  trackedAt?: Date;
}

type MedicationTrackingCreationAttributes = Optional<MedicationTrackingAttributes, 'id' | 'trackedAt'>;

export class MedicationTracking extends Model<MedicationTrackingAttributes, MedicationTrackingCreationAttributes> implements MedicationTrackingAttributes {
  public id!: number;
  public medicationId!: number;
  public trackedBy!: number;
  public status!: 'given' | 'missed' | 'pending';
  public notes!: string | undefined;
  public readonly trackedAt!: Date;
}

MedicationTracking.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    medicationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'medication_id',
      references: {
        model: Medication,
        key: 'id',
      },
    },
    trackedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'tracked_by',
      references: {
        model: User,
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM('given', 'missed', 'pending'),
      allowNull: false,
      defaultValue: 'pending',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    trackedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'tracked_at',
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'MedicationTracking',
    tableName: 'medication_tracking',
    timestamps: false,
    hooks: {
      // Encrypt sensitive fields before creating
      beforeCreate: (tracking: MedicationTracking) => {
        if (tracking.notes && !isEncrypted(tracking.notes)) {
          const encrypted = encrypt(tracking.notes);
          if (encrypted) tracking.notes = encrypted;
        }
      },
      // Encrypt sensitive fields before updating
      beforeUpdate: (tracking: MedicationTracking) => {
        if ((tracking as any).changed('notes') && tracking.notes && !isEncrypted(tracking.notes)) {
          const encrypted = encrypt(tracking.notes);
          if (encrypted) tracking.notes = encrypted;
        }
      },
      // Decrypt sensitive fields after retrieving
      afterFind: (instances: any) => {
        if (!instances) return;
        
        const decryptInstance = (instance: MedicationTracking) => {
          if (instance && instance.notes) {
            const decrypted = decrypt(instance.notes);
            if (decrypted) {
              (instance as any).dataValues.notes = decrypted;
              instance.notes = decrypted;
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

