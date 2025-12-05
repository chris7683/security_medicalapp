import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface RefreshTokenAttributes {
  id: number;
  token: string;
  userId: number;
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

type RefreshTokenCreationAttributes = Optional<RefreshTokenAttributes, 'id' | 'createdAt' | 'updatedAt'>;

export class RefreshToken extends Model<RefreshTokenAttributes, RefreshTokenCreationAttributes> implements RefreshTokenAttributes {
  public id!: number;
  public token!: string;
  public userId!: number;
  public expiresAt!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

RefreshToken.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    token: {
      type: DataTypes.STRING(500),
      allowNull: false,
      unique: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'expires_at',
    },
  },
  { sequelize, modelName: 'RefreshToken', tableName: 'refresh_tokens', timestamps: false }
);


