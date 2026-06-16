import prisma from '../lib/prisma'
import { NotificationType } from '@prisma/client'
import { createNotification } from './notificationService'

export function calculatePoints(serviceHours: number, pointsPerHour: number): number {
  return Math.round(serviceHours * pointsPerHour)
}

export async function addPoints(
  volunteerProfileId: number,
  amount: number,
  type: string,
  description: string,
  relatedEntityId?: number,
  relatedEntityType?: string
) {
  try {
    const volunteerProfile = await prisma.volunteerProfile.findUnique({
      where: { id: volunteerProfileId },
      include: { user: true }
    })

    if (!volunteerProfile) {
      return {
        success: false,
        error: '志愿者资料不存在'
      }
    }

    const pointsRecord = await prisma.pointsRecord.create({
      data: {
        volunteerProfileId,
        amount,
        type,
        description,
        relatedEntityId,
        relatedEntityType
      }
    })

    await prisma.user.update({
      where: { id: volunteerProfile.userId },
      data: {
        totalPoints: {
          increment: amount
        }
      }
    })

    await createNotification(
      volunteerProfile.userId,
      NotificationType.POINTS_CHANGED,
      '积分变动通知',
      `${description}，积分 ${amount > 0 ? '+' : ''}${amount}`,
      relatedEntityId,
      relatedEntityType
    )

    return {
      success: true,
      data: pointsRecord
    }
  } catch (error) {
    return {
      success: false,
      error: '添加积分失败'
    }
  }
}

export async function getPointsHistory(
  volunteerProfileId: number,
  page: number = 1,
  pageSize: number = 20
) {
  try {
    const skip = (page - 1) * pageSize

    const [records, total] = await Promise.all([
      prisma.pointsRecord.findMany({
        where: { volunteerProfileId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize
      }),
      prisma.pointsRecord.count({ where: { volunteerProfileId } })
    ])

    return {
      success: true,
      data: {
        items: records,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    }
  } catch (error) {
    return {
      success: false,
      error: '获取积分记录失败'
    }
  }
}
