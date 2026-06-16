import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import prisma from '../lib/prisma'
import { generateToken, generateRefreshToken, verifyToken } from '../lib/jwt'
import { validateLogin, validateRegister, validateRefreshToken } from '../validators/authValidator'
import { ApiResponse, AuthenticatedRequest } from '../types'
import { Role } from '@prisma/client'

const SALT_ROUNDS = 10
const REFRESH_TOKEN_EXPIRES_DAYS = 30

export async function register(req: Request, res: Response<ApiResponse>) {
  try {
    const validation = validateRegister(req.body)
    if (!validation.success) {
      const errors = validation.error.issues.map(issue => issue.message).join(', ')
      return res.status(400).json({
        success: false,
        error: errors
      })
    }

    const { username, email, password, realName, phone, role, idCard, organization, position } = validation.data

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email },
          { phone }
        ]
      }
    })

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: '用户名、邮箱或手机号已存在'
      })
    }

    if (idCard) {
      const existingIdCard = await prisma.user.findUnique({
        where: { idCard }
      })
      if (existingIdCard) {
        return res.status(400).json({
          success: false,
          error: '身份证号已被使用'
        })
      }
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          username,
          email,
          passwordHash,
          realName,
          phone,
          idCard,
          role
        }
      })

      if (role === Role.VOLUNTEER) {
        await tx.volunteerProfile.create({
          data: {
            userId: newUser.id
          }
        })
      } else if (role === Role.PROJECT_MANAGER) {
        await tx.projectManagerProfile.create({
          data: {
            userId: newUser.id,
            organization: organization!,
            position: position!
          }
        })
      }

      return newUser
    })

    const accessToken = generateToken(user.id, user.role)
    const refreshToken = generateRefreshToken()

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS)

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt
      }
    })

    const { passwordHash: _, ...userWithoutPassword } = user

    return res.status(201).json({
      success: true,
      data: {
        user: userWithoutPassword,
        accessToken,
        refreshToken
      }
    })
  } catch (error) {
    console.error('Register error:', error)
    return res.status(500).json({
      success: false,
      error: '注册失败，请稍后重试'
    })
  }
}

export async function login(req: Request, res: Response<ApiResponse>) {
  try {
    const validation = validateLogin(req.body)
    if (!validation.success) {
      const errors = validation.error.issues.map(issue => issue.message).join(', ')
      return res.status(400).json({
        success: false,
        error: errors
      })
    }

    const { username, password } = validation.data

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email: username },
          { phone: username }
        ]
      }
    })

    if (!user) {
      return res.status(401).json({
        success: false,
        error: '用户名或密码错误'
      })
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: '用户名或密码错误'
      })
    }

    const accessToken = generateToken(user.id, user.role)
    const refreshToken = generateRefreshToken()

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS)

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt
      }
    })

    const { passwordHash: _, ...userWithoutPassword } = user

    return res.json({
      success: true,
      data: {
        user: userWithoutPassword,
        accessToken,
        refreshToken
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return res.status(500).json({
      success: false,
      error: '登录失败，请稍后重试'
    })
  }
}

export async function logout(req: AuthenticatedRequest, res: Response<ApiResponse>) {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader?.split(' ')[1]

    if (token) {
      const payload = verifyToken(token)
      if (payload) {
        await prisma.refreshToken.deleteMany({
          where: {
            userId: payload.userId
          }
        })
      }
    }

    return res.json({
      success: true,
      data: {
        message: '登出成功'
      }
    })
  } catch (error) {
    console.error('Logout error:', error)
    return res.status(500).json({
      success: false,
      error: '登出失败，请稍后重试'
    })
  }
}

export async function refresh(req: Request, res: Response<ApiResponse>) {
  try {
    const validation = validateRefreshToken(req.body)
    if (!validation.success) {
      const errors = validation.error.issues.map(issue => issue.message).join(', ')
      return res.status(400).json({
        success: false,
        error: errors
      })
    }

    const { refreshToken } = validation.data

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true }
    })

    if (!storedToken) {
      return res.status(401).json({
        success: false,
        error: '刷新令牌无效'
      })
    }

    if (storedToken.expiresAt < new Date()) {
      await prisma.refreshToken.delete({
        where: { id: storedToken.id }
      })
      return res.status(401).json({
        success: false,
        error: '刷新令牌已过期'
      })
    }

    const accessToken = generateToken(storedToken.user.id, storedToken.user.role)
    const newRefreshToken = generateRefreshToken()

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS)

    await prisma.$transaction(async (tx) => {
      await tx.refreshToken.delete({
        where: { id: storedToken.id }
      })
      await tx.refreshToken.create({
        data: {
          userId: storedToken.userId,
          token: newRefreshToken,
          expiresAt
        }
      })
    })

    return res.json({
      success: true,
      data: {
        accessToken,
        refreshToken: newRefreshToken
      }
    })
  } catch (error) {
    console.error('Refresh token error:', error)
    return res.status(500).json({
      success: false,
      error: '刷新令牌失败，请稍后重试'
    })
  }
}
