import prisma from '../lib/prisma'
import { ProjectStatus, NotificationType } from '@prisma/client'
import { createNotification } from '../services/notificationService'

export async function createReview(userId: number, data: {
  projectId: number
  volunteerProfileId: number
  rating: number
  comment: string
  tags: string[]
}) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
      include: {
        projectManager: true,
        applications: true,
        schedules: {
          where: { volunteerProfileId: data.volunteerProfileId }
        }
      }
    })

    if (!project) {
      return {
        success: false,
        error: '项目不存在'
      }
    }

    if (project.status !== ProjectStatus.COMPLETED) {
      return {
        success: false,
        error: '项目未完成，无法评价'
      }
    }

    if (project.projectManager.userId !== userId) {
      return {
        success: false,
        error: '只有项目负责人可以评价'
      }
    }

    const volunteerParticipated = project.schedules.length > 0
    if (!volunteerParticipated) {
      return {
        success: false,
        error: '该志愿者未参与此项目'
      }
    }

    const existingReview = await prisma.review.findUnique({
      where: {
        projectId_volunteerProfileId: {
          projectId: data.projectId,
          volunteerProfileId: data.volunteerProfileId
        }
      }
    })

    if (existingReview) {
      return {
        success: false,
        error: '已对该志愿者进行过评价'
      }
    }

    if (data.rating < 1 || data.rating > 5) {
      return {
        success: false,
        error: '评分必须在 1-5 之间'
      }
    }

    const volunteerProfile = await prisma.volunteerProfile.findUnique({
      where: { id: data.volunteerProfileId },
      include: { user: true }
    })

    if (!volunteerProfile) {
      return {
        success: false,
        error: '志愿者资料不存在'
      }
    }

    const newRatingCount = volunteerProfile.ratingCount + 1
    const newStarRating = (volunteerProfile.starRating * volunteerProfile.ratingCount + data.rating) / newRatingCount

    const review = await prisma.$transaction(async (tx) => {
      const createdReview = await tx.review.create({
        data: {
          projectId: data.projectId,
          volunteerProfileId: data.volunteerProfileId,
          managerId: project.projectManagerId,
          rating: data.rating,
          comment: data.comment,
          tags: data.tags
        },
        include: {
          project: true,
          volunteerProfile: {
            include: { user: true }
          }
        }
      })

      await tx.volunteerProfile.update({
        where: { id: data.volunteerProfileId },
        data: {
          starRating: newStarRating,
          ratingCount: newRatingCount
        }
      })

      return createdReview
    })

    await createNotification(
      volunteerProfile.userId,
      NotificationType.SYSTEM_ANNOUNCEMENT,
      '收到新的评价',
      `您在项目"${project.title}"中收到了${data.rating}星评价`,
      data.projectId,
      'PROJECT'
    )

    return {
      success: true,
      data: review
    }
  } catch (error) {
    return {
      success: false,
      error: '创建评价失败'
    }
  }
}

export async function getReview(reviewId: number) {
  try {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        project: true,
        volunteerProfile: {
          include: { user: true }
        },
        manager: {
          include: { user: true }
        }
      }
    })

    if (!review) {
      return {
        success: false,
        error: '评价不存在'
      }
    }

    return {
      success: true,
      data: review
    }
  } catch (error) {
    return {
      success: false,
      error: '获取评价详情失败'
    }
  }
}

export async function getProjectReviews(projectId: number) {
  try {
    const reviews = await prisma.review.findMany({
      where: { projectId },
      include: {
        volunteerProfile: {
          include: { user: true }
        },
        manager: {
          include: { user: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return {
      success: true,
      data: reviews
    }
  } catch (error) {
    return {
      success: false,
      error: '获取项目评价列表失败'
    }
  }
}

export async function getVolunteerReviews(volunteerProfileId: number) {
  try {
    const reviews = await prisma.review.findMany({
      where: { volunteerProfileId },
      include: {
        project: true,
        manager: {
          include: { user: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return {
      success: true,
      data: reviews
    }
  } catch (error) {
    return {
      success: false,
      error: '获取志愿者评价失败'
    }
  }
}

export async function getVolunteerRanking(limit?: number) {
  try {
    const rankings = await prisma.volunteerProfile.findMany({
      where: {
        ratingCount: {
          gt: 0
        }
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            realName: true,
            avatar: true
          }
        }
      },
      orderBy: [
        { starRating: 'desc' },
        { ratingCount: 'desc' }
      ],
      take: limit || 20
    })

    return {
      success: true,
      data: rankings
    }
  } catch (error) {
    return {
      success: false,
      error: '获取志愿者排行榜失败'
    }
  }
}

export async function getSatisfactionWordCloud(projectId?: number) {
  try {
    const whereClause = projectId ? { projectId } : {}

    const reviews = await prisma.review.findMany({
      where: whereClause,
      select: {
        tags: true
      }
    })

    const tagFrequency: Record<string, number> = {}

    for (const review of reviews) {
      for (const tag of review.tags) {
        if (tagFrequency[tag]) {
          tagFrequency[tag]++
        } else {
          tagFrequency[tag] = 1
        }
      }
    }

    const wordCloudData = Object.entries(tagFrequency).map(([name, value]) => ({
      name,
      value
    }))

    return {
      success: true,
      data: wordCloudData
    }
  } catch (error) {
    return {
      success: false,
      error: '获取满意度词云数据失败'
    }
  }
}
