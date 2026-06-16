import { Router, Response } from 'express'
import { AuthenticatedRequest, ScheduleGenerateParams } from '../types'
import { authenticate, requireProjectManager, requireVolunteer } from '../middleware/auth'
import prisma from '../lib/prisma'
import { ScheduleStatus } from '@prisma/client'
import {
  generateSchedule,
  confirmSchedule,
  cancelSchedule,
  getSchedule,
  getProjectSchedules,
  getMySchedules
} from '../controllers/scheduleController'

const router = Router()

router.post('/generate', authenticate, requireProjectManager, async (req: AuthenticatedRequest, res: Response) => {
  const { projectId, startDate, endDate } = req.body as ScheduleGenerateParams

  if (!projectId || !startDate || !endDate) {
    return res.status(400).json({
      success: false,
      error: '缺少必填参数'
    })
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId }
  })

  if (!project) {
    return res.status(404).json({
      success: false,
      error: '项目不存在'
    })
  }

  if (project.projectManagerId !== req.user!.id) {
    const managerProfile = await prisma.projectManagerProfile.findUnique({
      where: { userId: req.user!.id }
    })
    if (!managerProfile || project.projectManagerId !== managerProfile.id) {
      return res.status(403).json({
        success: false,
        error: '无权为该项目生成排班'
      })
    }
  }

  const result = await generateSchedule(
    projectId,
    new Date(startDate),
    new Date(endDate)
  )
  res.status(result.success ? 200 : 400).json(result)
})

router.get('/me', authenticate, requireVolunteer, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : 1
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : 20

    const volunteerProfile = await prisma.volunteerProfile.findUnique({
      where: { userId: req.user!.id }
    })

    if (!volunteerProfile) {
      return res.status(404).json({
        success: false,
        error: '志愿者资料不存在'
      })
    }

    const where = { volunteerProfileId: volunteerProfile.id }

    const [schedules, total] = await Promise.all([
      prisma.schedule.findMany({
        where,
        include: {
          project: {
            select: {
              id: true,
              title: true,
              category: true,
              location: true,
              latitude: true,
              longitude: true,
              status: true,
              pointsPerHour: true
            }
          },
          volunteerProfile: {
            include: {
              user: {
                select: { id: true, realName: true, username: true }
              }
            }
          },
          attendance: true
        },
        orderBy: [
          { scheduledDate: 'desc' },
          { startTime: 'desc' }
        ],
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      prisma.schedule.count({ where })
    ])

    res.json({
      success: true,
      data: {
        items: schedules,
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取我的排班失败'
    })
  }
})

router.get('/project/:projectId', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const projectId = parseInt(req.params.projectId)

  if (isNaN(projectId)) {
    return res.status(400).json({
      success: false,
      error: '无效的项目ID'
    })
  }

  const result = await getProjectSchedules(projectId)
  res.status(result.success ? 200 : 400).json(result)
})

router.get('/', authenticate, requireProjectManager, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : 1
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : 10
    const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined
    const status = req.query.status as string | undefined

    const where: any = {}
    if (projectId && !isNaN(projectId)) {
      where.projectId = projectId
    }
    if (status) {
      where.status = status as ScheduleStatus
    }

    if (req.user!.role === 'PROJECT_MANAGER') {
      const managerProfile = await prisma.projectManagerProfile.findUnique({
        where: { userId: req.user!.id }
      })
      if (!managerProfile) {
        return res.status(403).json({ success: false, error: '项目负责人资料不存在' })
      }
      const managedProjectIds = await prisma.project.findMany({
        where: { projectManagerId: managerProfile.id },
        select: { id: true }
      })
      const managedIds = managedProjectIds.map(p => p.id)
      if (projectId && !isNaN(projectId)) {
        where.projectId = { in: managedIds.filter(id => id === projectId) }
      } else {
        where.projectId = { in: managedIds }
      }
    }

    const [schedules, total] = await Promise.all([
      prisma.schedule.findMany({
        where,
        include: {
          project: {
            select: { id: true, title: true }
          },
          volunteerProfile: {
            include: {
              user: {
                select: { id: true, realName: true, username: true }
              }
            }
          },
          attendance: true
        },
        orderBy: [
          { scheduledDate: 'desc' },
          { startTime: 'desc' }
        ],
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      prisma.schedule.count({ where })
    ])

    res.json({
      success: true,
      data: {
        items: schedules,
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取排班列表失败'
    })
  }
})

router.put('/:id/confirm', authenticate, requireVolunteer, async (req: AuthenticatedRequest, res: Response) => {
  const scheduleId = parseInt(req.params.id)

  if (isNaN(scheduleId)) {
    return res.status(400).json({
      success: false,
      error: '无效的排班ID'
    })
  }

  const result = await confirmSchedule(scheduleId, req.user!.id)
  res.status(result.success ? 200 : 400).json(result)
})

router.put('/:id/cancel', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const scheduleId = parseInt(req.params.id)
  const { reason } = req.body

  if (isNaN(scheduleId)) {
    return res.status(400).json({
      success: false,
      error: '无效的排班ID'
    })
  }

  if (!reason) {
    return res.status(400).json({
      success: false,
      error: '缺少取消原因'
    })
  }

  const result = await cancelSchedule(scheduleId, reason, req.user!.id)
  res.status(result.success ? 200 : 400).json(result)
})

router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const scheduleId = parseInt(req.params.id)

  if (isNaN(scheduleId)) {
    return res.status(400).json({
      success: false,
      error: '无效的排班ID'
    })
  }

  const result = await getSchedule(scheduleId)
  res.status(result.success ? 200 : 400).json(result)
})

router.put('/:id', authenticate, requireProjectManager, async (req: AuthenticatedRequest, res: Response) => {
  const scheduleId = parseInt(req.params.id)
  const { status, scheduledDate, startTime, endTime } = req.body

  if (isNaN(scheduleId)) {
    return res.status(400).json({
      success: false,
      error: '无效的排班ID'
    })
  }

  try {
    const updateData: any = {}
    if (status) updateData.status = status
    if (scheduledDate) updateData.scheduledDate = new Date(scheduledDate)
    if (startTime) updateData.startTime = startTime
    if (endTime) updateData.endTime = endTime

    const updated = await prisma.schedule.update({
      where: { id: scheduleId },
      data: updateData,
      include: {
        project: { select: { id: true, title: true } },
        volunteerProfile: {
          include: {
            user: { select: { id: true, realName: true, username: true } }
          }
        },
        attendance: true
      }
    })

    res.json({ success: true, data: updated })
  } catch (error) {
    res.status(400).json({
      success: false,
      error: '更新排班失败'
    })
  }
})

router.delete('/:id', authenticate, requireProjectManager, async (req: AuthenticatedRequest, res: Response) => {
  const scheduleId = parseInt(req.params.id)

  if (isNaN(scheduleId)) {
    return res.status(400).json({
      success: false,
      error: '无效的排班ID'
    })
  }

  try {
    await prisma.schedule.delete({ where: { id: scheduleId } })
    res.json({ success: true, data: null })
  } catch (error) {
    res.status(400).json({
      success: false,
      error: '删除排班失败'
    })
  }
})

export default router
