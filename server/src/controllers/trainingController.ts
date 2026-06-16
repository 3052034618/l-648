import prisma from '../lib/prisma'
import { TrainingStatus, ProjectLevel, NotificationType } from '@prisma/client'
import { createNotification } from '../services/notificationService'

export async function createTraining(data: {
  title: string
  description: string
  content: string
  category: string
  level: ProjectLevel
  durationMinutes: number
  passScore?: number
  examId?: number
}) {
  try {
    const training = await prisma.training.create({
      data: {
        title: data.title,
        description: data.description,
        content: data.content,
        category: data.category,
        level: data.level,
        durationMinutes: data.durationMinutes,
        passScore: data.passScore ?? 60,
        examId: data.examId
      }
    })

    return {
      success: true,
      data: training
    }
  } catch (error) {
    return {
      success: false,
      error: '创建培训失败'
    }
  }
}

export async function getTraining(trainingId: number) {
  try {
    const training = await prisma.training.findUnique({
      where: { id: trainingId },
      include: {
        exam: {
          include: {
            questions: true
          }
        }
      }
    })

    if (!training) {
      return {
        success: false,
        error: '培训不存在'
      }
    }

    return {
      success: true,
      data: training
    }
  } catch (error) {
    return {
      success: false,
      error: '获取培训详情失败'
    }
  }
}

export async function listTrainings(filters?: {
  category?: string
  level?: ProjectLevel
}) {
  try {
    const where: any = {}

    if (filters?.category) {
      where.category = filters.category
    }

    if (filters?.level) {
      where.level = filters.level
    }

    const trainings = await prisma.training.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        exam: {
          select: {
            id: true,
            title: true,
            totalScore: true,
            passScore: true,
            durationMinutes: true
          }
        }
      }
    })

    return {
      success: true,
      data: trainings
    }
  } catch (error) {
    return {
      success: false,
      error: '获取培训列表失败'
    }
  }
}

export async function updateTraining(trainingId: number, data: Partial<{
  title: string
  description: string
  content: string
  category: string
  level: ProjectLevel
  durationMinutes: number
  passScore: number
  examId: number
}>) {
  try {
    const training = await prisma.training.findUnique({
      where: { id: trainingId }
    })

    if (!training) {
      return {
        success: false,
        error: '培训不存在'
      }
    }

    const updatedTraining = await prisma.training.update({
      where: { id: trainingId },
      data
    })

    return {
      success: true,
      data: updatedTraining
    }
  } catch (error) {
    return {
      success: false,
      error: '更新培训失败'
    }
  }
}

export async function deleteTraining(trainingId: number) {
  try {
    const training = await prisma.training.findUnique({
      where: { id: trainingId }
    })

    if (!training) {
      return {
        success: false,
        error: '培训不存在'
      }
    }

    await prisma.trainingRecord.deleteMany({
      where: { trainingId }
    })

    await prisma.training.delete({
      where: { id: trainingId }
    })

    return {
      success: true,
      data: { message: '培训已删除' }
    }
  } catch (error) {
    return {
      success: false,
      error: '删除培训失败'
    }
  }
}

export async function startTraining(trainingId: number, volunteerProfileId: number) {
  try {
    const training = await prisma.training.findUnique({
      where: { id: trainingId }
    })

    if (!training) {
      return {
        success: false,
        error: '培训不存在'
      }
    }

    const volunteerProfile = await prisma.volunteerProfile.findUnique({
      where: { id: volunteerProfileId }
    })

    if (!volunteerProfile) {
      return {
        success: false,
        error: '志愿者不存在'
      }
    }

    const existingRecord = await prisma.trainingRecord.findUnique({
      where: {
        trainingId_volunteerProfileId: {
          trainingId,
          volunteerProfileId
        }
      }
    })

    let trainingRecord

    if (existingRecord) {
      if (existingRecord.status === TrainingStatus.COMPLETED) {
        return {
          success: false,
          error: '您已完成该培训'
        }
      }

      trainingRecord = await prisma.trainingRecord.update({
        where: { id: existingRecord.id },
        data: {
          status: TrainingStatus.IN_PROGRESS,
          progress: 0
        }
      })
    } else {
      trainingRecord = await prisma.trainingRecord.create({
        data: {
          trainingId,
          volunteerProfileId,
          status: TrainingStatus.IN_PROGRESS,
          progress: 0
        }
      })
    }

    return {
      success: true,
      data: trainingRecord
    }
  } catch (error) {
    return {
      success: false,
      error: '开始学习失败'
    }
  }
}

export async function updateProgress(trainingId: number, volunteerProfileId: number, progress: number) {
  try {
    if (progress < 0 || progress > 100) {
      return {
        success: false,
        error: '进度值必须在0-100之间'
      }
    }

    const trainingRecord = await prisma.trainingRecord.findUnique({
      where: {
        trainingId_volunteerProfileId: {
          trainingId,
          volunteerProfileId
        }
      }
    })

    if (!trainingRecord) {
      return {
        success: false,
        error: '培训记录不存在，请先开始学习'
      }
    }

    if (trainingRecord.status === TrainingStatus.COMPLETED) {
      return {
        success: false,
        error: '培训已完成，无法更新进度'
      }
    }

    const updatedRecord = await prisma.trainingRecord.update({
      where: { id: trainingRecord.id },
      data: {
        progress,
        status: progress === 100 ? TrainingStatus.COMPLETED : TrainingStatus.IN_PROGRESS,
        completedAt: progress === 100 ? new Date() : null
      }
    })

    if (progress === 100) {
      const volunteer = await prisma.volunteerProfile.findUnique({
        where: { id: volunteerProfileId },
        select: { userId: true }
      })

      if (volunteer) {
        await createNotification(
          volunteer.userId,
          NotificationType.TRAINING_PASSED,
          '培训完成',
          `恭喜您已完成《${(await prisma.training.findUnique({ where: { id: trainingId } }))?.title}》培训！`,
          trainingId,
          'training'
        )
      }
    }

    return {
      success: true,
      data: updatedRecord
    }
  } catch (error) {
    return {
      success: false,
      error: '更新学习进度失败'
    }
  }
}

export async function completeTraining(trainingId: number, volunteerProfileId: number) {
  try {
    const training = await prisma.training.findUnique({
      where: { id: trainingId }
    })

    if (!training) {
      return {
        success: false,
        error: '培训不存在'
      }
    }

    const trainingRecord = await prisma.trainingRecord.findUnique({
      where: {
        trainingId_volunteerProfileId: {
          trainingId,
          volunteerProfileId
        }
      }
    })

    if (!trainingRecord) {
      return {
        success: false,
        error: '培训记录不存在，请先开始学习'
      }
    }

    if (trainingRecord.status === TrainingStatus.COMPLETED) {
      return {
        success: false,
        error: '您已完成该培训'
      }
    }

    const updatedRecord = await prisma.trainingRecord.update({
      where: { id: trainingRecord.id },
      data: {
        status: TrainingStatus.COMPLETED,
        progress: 100,
        completedAt: new Date()
      }
    })

    const volunteer = await prisma.volunteerProfile.findUnique({
      where: { id: volunteerProfileId },
      select: { userId: true }
    })

    if (volunteer) {
      await createNotification(
        volunteer.userId,
        NotificationType.TRAINING_PASSED,
        '培训完成',
        `恭喜您已完成《${training.title}》培训！`,
        trainingId,
        'training'
      )
    }

    return {
      success: true,
      data: updatedRecord
    }
  } catch (error) {
    return {
      success: false,
      error: '完成培训失败'
    }
  }
}
