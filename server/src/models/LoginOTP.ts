import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface LoginOTPAttributes {
  id: number;
  userId: number;
  email: string;
  otp: string;
  expiresAt: Date;
  used: boolean;
  createdAt?: Date;
}

type LoginOTPCreationAttributes = Optional<LoginOTPAttributes, 'id' | 'createdAt'>;

export class LoginOTP extends Model<LoginOTPAttributes, LoginOTPCreationAttributes> implements LoginOTPAttributes {
  public id!: number;
  public userId!: number;
  public email!: string;
  public otp!: string;
  public expiresAt!: Date;
  public used!: boolean;
  public readonly createdAt!: Date;
}

LoginOTP.init(
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
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
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
  { sequelize, modelName: 'LoginOTP', tableName: 'login_otps', timestamps: true }
);

