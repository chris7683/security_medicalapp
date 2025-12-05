import * as jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { User } from '../models/User';

dotenv.config();

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'dev_access_secret';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'dev_refresh_secret';
const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

// JWT signing options with secure defaults
const baseJwtOptions: jwt.SignOptions = {
  algorithm: 'HS256', // Specify algorithm to prevent algorithm confusion attacks
  issuer: 'healthcare-app',
  audience: 'healthcare-client',
};

export function generateAccessToken(user: User) {
  return jwt.sign(
    { sub: user.id, role: user.role, username: user.username },
    ACCESS_TOKEN_SECRET,
    {
      algorithm: 'HS256',
      issuer: 'healthcare-app',
      audience: 'healthcare-client',
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    } as jwt.SignOptions
  );
}

export function generateRefreshToken(user: User) {
  return jwt.sign(
    { sub: user.id },
    REFRESH_TOKEN_SECRET,
    {
      algorithm: 'HS256',
      issuer: 'healthcare-app',
      audience: 'healthcare-client',
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    } as jwt.SignOptions
  );
}

export function verifyAccessToken(token: string) {
  const payload = jwt.verify(token, ACCESS_TOKEN_SECRET as jwt.Secret, {
    algorithms: ['HS256'],
    issuer: 'healthcare-app',
    audience: 'healthcare-client',
  }) as jwt.JwtPayload & {
    sub: string;
    role: string;
    username: string;
    iat: number;
    exp: number;
  };
  return payload;
}

export function verifyRefreshToken(token: string) {
  const payload = jwt.verify(token, REFRESH_TOKEN_SECRET as jwt.Secret, {
    algorithms: ['HS256'],
    issuer: 'healthcare-app',
    audience: 'healthcare-client',
  }) as jwt.JwtPayload & { sub: string; iat: number; exp: number };
  return payload;
}

