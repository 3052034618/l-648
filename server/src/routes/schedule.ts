import { Router, Response } from 'express'
import { AuthenticatedRequest, ScheduleGenerateParams } from '../types'
import { authenticate, requireProjectManager, requireVolunteer } from '../middleware/auth'
import prisma from '../lib/prisma'
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

  if (project.projectManagerId !== req.user!.managerProfile?.id) {
    return res.status(403).json({
      success: false,
      error: '无权为该项目生成排班'
    })
  }

  const result = await generateSchedule(
    projectId,
    new Date(startDate),
    new Date(endDate)
  )
  res.status(result.success ? 200 : 400).json(result)
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

router.get('/me', authenticate, requireVolunteer, async (req: AuthenticatedRequest, res: Response) => {
  const result = await getMySchedules(req.user!.id)
  res.status(result.success ? 200 : 400).json(result)
})

export default router
