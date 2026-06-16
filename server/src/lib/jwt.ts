import jwt from 'jsonwebtoken'
import { JwtPayload } from '../types'
import { Role } from '@prisma/client'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

export function generateToken(userId: number, role: Role): string {
  return jwt.sign({ userId, role }, JWT_SECRET as jwt.Secret, { expiresIn: JWT_EXPIRES_IN })
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload
  } catch (error) {
    return null
  }
}

export function generateRefreshToken(): string {
  return jwt.sign({}, JWT_SECRET as jwt.Secret, { expiresIn: '30d' })
}
