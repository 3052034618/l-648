import prisma from '../lib/prisma'
import { NotificationType } from '@prisma/client'
import { createNotification } from '../services/notificationService'

export async function createPointsRule(data: {
  name: string
  description: string
  points: number
  condition: any
  isActive: boolean
}) {
  try {
    const rule = await prisma.pointsRule.create({
      data: {
        name: data.name,
        description: data.description,
        points: data.points,
        condition: data.condition,
        isActive: data.isActive
      }
    })

    return {
      success: true,
      data: rule
    }
  } catch (error) {
    return {
      success: false,
      error: '创建积分规则失败'
    }
  }
}

export async function updatePointsRule(id: number, data: {
  name?: string
  description?: string
  points?: number
  condition?: any
  isActive?: boolean
}) {
  try {
    const rule = await prisma.pointsRule.update({
      where: { id },
      data: {
        ...data
      }
    })

    return {
      success: true,
      data: rule
    }
  } catch (error) {
    return {
      success: false,
      error: '更新积分规则失败'
    }
  }
}

export async function deletePointsRule(id: number) {
  try {
    await prisma.pointsRule.delete({
      where: { id }
    })

    return {
      success: true,
      data: { message: '积分规则已删除' }
    }
  } catch (error) {
    return {
      success: false,
      error: '删除积分规则失败'
    }
  }
}

export async function listPointsRules() {
  try {
    const rules = await prisma.pointsRule.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return {
      success: true,
      data: rules
    }
  } catch (error) {
    return {
      success: false,
      error: '获取积分规则列表失败'
    }
  }
}

export async function createExchangeRule(data: {
  name: string
  description: string
  pointsRequired: number
  reward: string
  rewardImage?: string
  stock: number
  isActive: boolean
}) {
  try {
    const rule = await prisma.exchangeRule.create({
      data: {
        name: data.name,
        description: data.description,
        pointsRequired: data.pointsRequired,
        reward: data.reward,
        rewardImage: data.rewardImage,
        stock: data.stock,
        isActive: data.isActive
      }
    })

    return {
      success: true,
      data: rule
    }
  } catch (error) {
    return {
      success: false,
      error: '创建兑换规则失败'
    }
  }
}

export async function updateExchangeRule(id: number, data: {
  name?: string
  description?: string
  pointsRequired?: number
  reward?: string
  rewardImage?: string
  stock?: number
  isActive?: boolean
}) {
  try {
    const rule = await prisma.exchangeRule.update({
      where: { id },
      data: {
        ...data
      }
    })

    return {
      success: true,
      data: rule
    }
  } catch (error) {
    return {
      success: false,
      error: '更新兑换规则失败'
    }
  }
}

export async function deleteExchangeRule(id: number) {
  try {
    await prisma.exchangeRule.delete({
      where: { id }
    })

    return {
      success: true,
      data: { message: '兑换规则已删除' }
    }
  } catch (error) {
    return {
      success: false,
      error: '删除兑换规则失败'
    }
  }
}

export async function listExchangeRules() {
  try {
    const rules = await prisma.exchangeRule.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return {
      success: true,
      data: rules
    }
  } catch (error) {
    return {
      success: false,
      error: '获取兑换规则列表失败'
    }
  }
}

export async function createCreditThreshold(data: {
  name: string
  description: string
  minCreditScore: number
  restriction: string
  isActive: boolean
}) {
  try {
    const threshold = await prisma.creditThreshold.create({
      data: {
        name: data.name,
        description: data.description,
        minCreditScore: data.minCreditScore,
        restriction: data.restriction,
        isActive: data.isActive
      }
    })

    return {
      success: true,
      data: threshold
    }
  } catch (error) {
    return {
      success: false,
      error: '创建信用分门槛失败'
    }
  }
}

export async function updateCreditThreshold(id: number, data: {
  name?: string
  description?: string
  minCreditScore?: number
  restriction?: string
  isActive?: boolean
}) {
  try {
    const threshold = await prisma.creditThreshold.update({
      where: { id },
      data: {
        ...data
      }
    })

    return {
      success: true,
      data: threshold
    }
  } catch (error) {
    return {
      success: false,
      error: '更新信用分门槛失败'
    }
  }
}

export async function deleteCreditThreshold(id: number) {
  try {
    await prisma.creditThreshold.delete({
      where: { id }
    })

    return {
      success: true,
      data: { message: '信用分门槛已删除' }
    }
  } catch (error) {
    return {
      success: false,
      error: '删除信用分门槛失败'
    }
  }
}

export async function listCreditThresholds() {
  try {
    const thresholds = await prisma.creditThreshold.findMany({
      orderBy: { minCreditScore: 'asc' }
    })

    return {
      success: true,
      data: thresholds
    }
  } catch (error) {
    return {
      success: false,
      error: '获取信用分门槛列表失败'
    }
  }
}

export async function exchangePoints(volunteerProfileId: number, exchangeRuleId: number) {
  try {
    const exchangeRule = await prisma.exchangeRule.findUnique({
      where: { id: exchangeRuleId }
    })

    if (!exchangeRule) {
      return {
        success: false,
        error: '兑换规则不存在'
      }
    }

    if (!exchangeRule.isActive) {
      return {
        success: false,
        error: '该兑换规则未激活'
      }
    }

    if (exchangeRule.stock <= 0) {
      return {
        success: false,
        error: '库存不足'
      }
    }

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

    if (volunteerProfile.user.totalPoints < exchangeRule.pointsRequired) {
      return {
        success: false,
        error: '积分不足'
      }
    }

    const exchangeRecord = await prisma.$transaction(async (tx) => {
      const record = await tx.exchangeRecord.create({
        data: {
          volunteerProfileId,
          exchangeRuleId,
          pointsSpent: exchangeRule.pointsRequired,
          status: 'COMPLETED'
        },
        include: {
          exchangeRule: true
        }
      })

      await tx.exchangeRule.update({
        where: { id: exchangeRuleId },
        data: {
          stock: {
            decrement: 1
          }
        }
      })

      await tx.user.update({
        where: { id: volunteerProfile.userId },
        data: {
          totalPoints: {
            decrement: exchangeRule.pointsRequired
          }
        }
      })

      await tx.pointsRecord.create({
        data: {
          volunteerProfileId,
          amount: -exchangeRule.pointsRequired,
          type: 'EXCHANGE',
          description: `兑换${exchangeRule.name}`,
          relatedEntityId: record.id,
          relatedEntityType: 'EXCHANGE_RECORD'
        }
      })

      return record
    })

    await createNotification(
      volunteerProfile.userId,
      NotificationType.POINTS_CHANGED,
      '积分兑换成功',
      `您已成功兑换${exchangeRule.reward}，消耗${exchangeRule.pointsRequired}积分`,
      exchangeRecord.id,
      'EXCHANGE_RECORD'
    )

    return {
      success: true,
      data: exchangeRecord
    }
  } catch (error) {
    return {
      success: false,
      error: '积分兑换失败'
    }
  }
}

export async function listExchangeRecords(volunteerProfileId?: number) {
  try {
    const whereClause = volunteerProfileId ? { volunteerProfileId } : {}

    const records = await prisma.exchangeRecord.findMany({
      where: whereClause,
      include: {
        volunteerProfile: {
          include: { user: true }
        },
        exchangeRule: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return {
      success: true,
      data: records
    }
  } catch (error) {
    return {
      success: false,
      error: '获取兑换记录失败'
    }
  }
}

export async function getSystemSettings() {
  try {
    const settings = await prisma.systemSettings.findMany({
      orderBy: { key: 'asc' }
    })

    return {
      success: true,
      data: settings
    }
  } catch (error) {
    return {
      success: false,
      error: '获取系统设置失败'
    }
  }
}

export async function updateSystemSetting(key: string, value: any, description?: string) {
  try {
    const existingSetting = await prisma.systemSettings.findUnique({
      where: { key }
    })

    let setting
    if (existingSetting) {
      setting = await prisma.systemSettings.update({
        where: { key },
        data: {
          value,
          description: description !== undefined ? description : existingSetting.description
        }
      })
    } else {
      setting = await prisma.systemSettings.create({
        data: {
          key,
          value,
          description
        }
      })
    }

    return {
      success: true,
      data: setting
    }
  } catch (error) {
    return {
      success: false,
      error: '更新系统设置失败'
    }
  }
}
