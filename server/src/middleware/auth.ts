import { Response, NextFunction } from 'express'
import { verifyToken } from '../lib/jwt'
import prisma from '../lib/prisma'
import { AuthenticatedRequest } from '../types'
import { Role } from '@prisma/client'

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: '未提供认证令牌'
    })
  }

  const token = authHeader.split(' ')[1]
  const payload = verifyToken(token)

  if (!payload) {
    return res.status(401).json({
      success: false,
      error: '认证令牌无效或已过期'
    })
  }

  prisma.user.findUnique({
    where: { id: payload.userId }
  }).then(user => {
    if (!user) {
      return res.status(401).json({
        success: false,
        error: '用户不存在'
      })
    }
    req.user = user
    next()
  }).catch(err => {
    res.status(500).json({
      success: false,
      error: '认证过程出错'
    })
  })
}

export function requireRole(...roles: Role[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: '未认证'
      })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: '权限不足'
      })
    }

    next()
  }
}

export function requireVolunteer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  return requireRole(Role.VOLUNTEER)(req, res, next)
}

export function requireProjectManager(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  return requireRole(Role.PROJECT_MANAGER)(req, res, next)
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  return requireRole(Role.ADMIN)(req, res, next)
}
