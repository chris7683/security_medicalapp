import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface PasswordResetTokenAttributes {
  id: number;
  userId: number;
  otp: string;
  expiresAt: Date;
  used: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

type PasswordResetTokenCreationAttributes = Optional<PasswordResetTokenAttributes, 'id' | 'createdAt' | 'updatedAt'>;

export class PasswordResetToken extends Model<PasswordResetTokenAttributes, PasswordResetTokenCreationAttributes> implements PasswordResetTokenAttributes {
  public id!: number;
  public userId!: number;
  public otp!: string;
  public expiresAt!: Date;
  public used!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PasswordResetToken.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
    },
    otp: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'expires_at',
    },
    used: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  { sequelize, modelName: 'PasswordResetToken', tableName: 'password_reset_tokens', timestamps: false }
);

