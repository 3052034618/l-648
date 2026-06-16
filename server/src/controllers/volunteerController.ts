import prisma from '../lib/prisma'
import { AvailabilityData } from '../types'

export async function updateProfile(volunteerProfileId: number, data: {
  emergencyContact?: string
  emergencyPhone?: string
}) {
  try {
    const profile = await prisma.volunteerProfile.update({
      where: { id: volunteerProfileId },
      data: {
        emergencyContact: data.emergencyContact,
        emergencyPhone: data.emergencyPhone
      }
    })

    return {
      success: true,
      data: profile
    }
  } catch (error) {
    return {
      success: false,
      error: '更新志愿者资料失败'
    }
  }
}

export async function addSkill(
  volunteerProfileId: number,
  skillId: number,
  proficiency: number,
  certificateUrl?: string
) {
  try {
    const skill = await prisma.skill.findUnique({ where: { id: skillId } })
    if (!skill) {
      return {
        success: false,
        error: '技能不存在'
      }
    }

    const existingSkill = await prisma.volunteerSkill.findUnique({
      where: {
        volunteerProfileId_skillId: {
          volunteerProfileId,
          skillId
        }
      }
    })

    if (existingSkill) {
      return {
        success: false,
        error: '已添加该技能'
      }
    }

    if (proficiency < 1 || proficiency > 5) {
      return {
        success: false,
        error: '熟练度必须在 1-5 之间'
      }
    }

    const volunteerSkill = await prisma.volunteerSkill.create({
      data: {
        volunteerProfileId,
        skillId,
        proficiency,
        certificateUrl
      },
      include: {
        skill: true
      }
    })

    return {
      success: true,
      data: volunteerSkill
    }
  } catch (error) {
    return {
      success: false,
      error: '添加技能失败'
    }
  }
}

export async function updateSkill(
  volunteerSkillId: number,
  proficiency: number,
  certificateUrl?: string
) {
  try {
    if (proficiency < 1 || proficiency > 5) {
      return {
        success: false,
        error: '熟练度必须在 1-5 之间'
      }
    }

    const volunteerSkill = await prisma.volunteerSkill.update({
      where: { id: volunteerSkillId },
      data: {
        proficiency,
        certificateUrl
      },
      include: {
        skill: true
      }
    })

    return {
      success: true,
      data: volunteerSkill
    }
  } catch (error) {
    return {
      success: false,
      error: '更新技能失败'
    }
  }
}

export async function removeSkill(volunteerSkillId: number) {
  try {
    await prisma.volunteerSkill.delete({
      where: { id: volunteerSkillId }
    })

    return {
      success: true,
      data: { message: '技能已移除' }
    }
  } catch (error) {
    return {
      success: false,
      error: '移除技能失败'
    }
  }
}

export async function setAvailability(
  volunteerProfileId: number,
  availability: AvailabilityData[]
) {
  try {
    await prisma.availability.deleteMany({
      where: { volunteerProfileId }
    })

    const createdAvailability = await Promise.all(
      availability.map(async (item) => {
        if (item.dayOfWeek < 0 || item.dayOfWeek > 6) {
          throw new Error('星期必须在 0-6 之间')
        }
        return prisma.availability.create({
          data: {
            volunteerProfileId,
            dayOfWeek: item.dayOfWeek,
            startTime: item.startTime,
            endTime: item.endTime
          }
        })
      })
    )

    return {
      success: true,
      data: createdAvailability
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '设置空闲时段失败'
    }
  }
}

export async function getProfile(volunteerProfileId: number) {
  try {
    const profile = await prisma.volunteerProfile.findUnique({
      where: { id: volunteerProfileId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            realName: true,
            email: true,
            phone: true,
            avatar: true,
            creditScore: true,
            totalPoints: true,
            totalServiceHours: true
          }
        },
        skills: {
          include: {
            skill: true
          }
        },
        availability: true
      }
    })

    if (!profile) {
      return {
        success: false,
        error: '志愿者资料不存在'
      }
    }

    return {
      success: true,
      data: profile
    }
  } catch (error) {
    return {
      success: false,
      error: '获取志愿者详情失败'
    }
  }
}

export async function getMyProfile(userId: number) {
  try {
    const profile = await prisma.volunteerProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            realName: true,
            email: true,
            phone: true,
            avatar: true,
            creditScore: true,
            totalPoints: true,
            totalServiceHours: true
          }
        },
        skills: {
          include: {
            skill: true
          }
        },
        availability: true
      }
    })

    if (!profile) {
      return {
        success: false,
        error: '志愿者资料不存在'
      }
    }

    return {
      success: true,
      data: profile
    }
  } catch (error) {
    return {
      success: false,
      error: '获取个人资料失败'
    }
  }
}
