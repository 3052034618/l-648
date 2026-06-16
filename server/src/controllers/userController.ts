import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import prisma from '../lib/prisma'
import { ApiResponse, AuthenticatedRequest } from '../types'
import { Role } from '@prisma/client'

const SALT_ROUNDS = 10

function excludePassword<T extends { passwordHash?: string }>(user: T): Omit<T, 'passwordHash'> {
  const { passwordHash, ...rest } = user
  return rest
}

export async function getCurrentUser(req: AuthenticatedRequest, res: Response<ApiResponse>) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: '未认证'
      })
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        volunteerProfile: true,
        managerProfile: true
      }
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      })
    }

    return res.json({
      success: true,
      data: excludePassword(user)
    })
  } catch (error) {
    console.error('Get current user error:', error)
    return res.status(500).json({
      success: false,
      error: '获取用户信息失败，请稍后重试'
    })
  }
}

export async function getUserById(req: Request, res: Response<ApiResponse>) {
  try {
    const id = parseInt(req.params.id)
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: '无效的用户ID'
      })
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        volunteerProfile: true,
        managerProfile: true
      }
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      })
    }

    return res.json({
      success: true,
      data: excludePassword(user)
    })
  } catch (error) {
    console.error('Get user by id error:', error)
    return res.status(500).json({
      success: false,
      error: '获取用户信息失败，请稍后重试'
    })
  }
}

export async function getAllUsers(req: Request, res: Response<ApiResponse>) {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10
    const role = req.query.role as Role | undefined

    const where = role ? { role } : {}

    const skip = (page - 1) * pageSize

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          volunteerProfile: true,
          managerProfile: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.user.count({ where })
    ])

    const usersWithoutPassword = users.map(excludePassword)

    return res.json({
      success: true,
      data: {
        items: usersWithoutPassword,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    })
  } catch (error) {
    console.error('Get all users error:', error)
    return res.status(500).json({
      success: false,
      error: '获取用户列表失败，请稍后重试'
    })
  }
}

export async function updateUser(req: AuthenticatedRequest, res: Response<ApiResponse>) {
  try {
    const id = parseInt(req.params.id)
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: '无效的用户ID'
      })
    }

    if (req.user?.id !== id && req.user?.role !== Role.ADMIN) {
      return res.status(403).json({
        success: false,
        error: '权限不足，只能修改自己的信息'
      })
    }

    const { username, email, realName, phone, idCard, avatar, password, organization, position } = req.body

    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      })
    }

    if (username && username !== existingUser.username) {
      const usernameExists = await prisma.user.findUnique({
        where: { username }
      })
      if (usernameExists) {
        return res.status(400).json({
          success: false,
          error: '用户名已存在'
        })
      }
    }

    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email }
      })
      if (emailExists) {
        return res.status(400).json({
          success: false,
          error: '邮箱已存在'
        })
      }
    }

    if (phone && phone !== existingUser.phone) {
      const phoneExists = await prisma.user.findUnique({
        where: { phone }
      })
      if (phoneExists) {
        return res.status(400).json({
          success: false,
          error: '手机号已存在'
        })
      }
    }

    if (idCard && idCard !== existingUser.idCard) {
      const idCardExists = await prisma.user.findUnique({
        where: { idCard }
      })
      if (idCardExists) {
        return res.status(400).json({
          success: false,
          error: '身份证号已存在'
        })
      }
    }

    const updateData: any = {}
    if (username) updateData.username = username
    if (email) updateData.email = email
    if (realName) updateData.realName = realName
    if (phone) updateData.phone = phone
    if (idCard) updateData.idCard = idCard
    if (avatar !== undefined) updateData.avatar = avatar
    if (password) updateData.passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

    const user = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id },
        data: updateData,
        include: {
          volunteerProfile: true,
          managerProfile: true
        }
      })

      if (existingUser.role === Role.PROJECT_MANAGER && (organization || position)) {
        const managerUpdateData: any = {}
        if (organization) managerUpdateData.organization = organization
        if (position) managerUpdateData.position = position

        await tx.projectManagerProfile.update({
          where: { userId: id },
          data: managerUpdateData
        })
      }

      return updatedUser
    })

    return res.json({
      success: true,
      data: excludePassword(user)
    })
  } catch (error) {
    console.error('Update user error:', error)
    return res.status(500).json({
      success: false,
      error: '更新用户信息失败，请稍后重试'
    })
  }
}

export async function deleteUser(req: AuthenticatedRequest, res: Response<ApiResponse>) {
  try {
    const id = parseInt(req.params.id)
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: '无效的用户ID'
      })
    }

    if (req.user?.id === id) {
      return res.status(400).json({
        success: false,
        error: '不能删除自己的账户'
      })
    }

    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      })
    }

    await prisma.$transaction(async (tx) => {
      await tx.refreshToken.deleteMany({
        where: { userId: id }
      })

      if (existingUser.role === Role.VOLUNTEER) {
        await tx.volunteerProfile.deleteMany({
          where: { userId: id }
        })
      } else if (existingUser.role === Role.PROJECT_MANAGER) {
        await tx.projectManagerProfile.deleteMany({
          where: { userId: id }
        })
      }

      await tx.user.delete({
        where: { id }
      })
    })

    return res.json({
      success: true,
      data: {
        message: '用户删除成功'
      }
    })
  } catch (error) {
    console.error('Delete user error:', error)
    return res.status(500).json({
      success: false,
      error: '删除用户失败，请稍后重试'
    })
  }
}
