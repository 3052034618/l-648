import { Router, Response } from 'express'
import { AuthenticatedRequest } from '../types'
import { authenticate, requireAdmin, requireVolunteer } from '../middleware/auth'
import prisma from '../lib/prisma'
import {
  createTraining,
  getTraining,
  listTrainings,
  updateTraining,
  deleteTraining,
  startTraining,
  updateProgress,
  completeTraining
} from '../controllers/trainingController'

const router = Router()

router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const { category, level } = req.query
  const result = await listTrainings({
    category: category as string | undefined,
    level: level as any
  })
  res.status(result.success ? 200 : 400).json(result)
})

router.post('/', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { title, description, content, category, level, durationMinutes, passScore, examId } = req.body

  if (!title || !description || !content || !category || !level || !durationMinutes) {
    return res.status(400).json({
      success: false,
      error: '缺少必填参数'
    })
  }

  const result = await createTraining({
    title,
    description,
    content,
    category,
    level,
    durationMinutes,
    passScore,
    examId
  })
  res.status(result.success ? 201 : 400).json(result)
})

router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id)

  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      error: '无效的培训ID'
    })
  }

  const result = await getTraining(id)
  res.status(result.success ? 200 : 400).json(result)
})

router.put('/:id', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id)
  const { title, description, content, category, level, durationMinutes, passScore, examId } = req.body

  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      error: '无效的培训ID'
    })
  }

  const result = await updateTraining(id, {
    title,
    description,
    content,
    category,
    level,
    durationMinutes,
    passScore,
    examId
  })
  res.status(result.success ? 200 : 400).json(result)
})

router.delete('/:id', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id)

  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      error: '无效的培训ID'
    })
  }

  const result = await deleteTraining(id)
  res.status(result.success ? 200 : 400).json(result)
})

router.post('/:id/start', authenticate, requireVolunteer, async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id)

  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      error: '无效的培训ID'
    })
  }

  const profile = await prisma.volunteerProfile.findUnique({
    where: { userId: req.user!.id }
  })

  if (!profile) {
    return res.status(404).json({
      success: false,
      error: '志愿者资料不存在'
    })
  }

  const result = await startTraining(id, profile.id)
  res.status(result.success ? 200 : 400).json(result)
})

router.put('/:id/progress', authenticate, requireVolunteer, async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id)
  const { progress } = req.body

  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      error: '无效的培训ID'
    })
  }

  if (progress === undefined || progress === null) {
    return res.status(400).json({
      success: false,
      error: '缺少进度参数'
    })
  }

  const profile = await prisma.volunteerProfile.findUnique({
    where: { userId: req.user!.id }
  })

  if (!profile) {
    return res.status(404).json({
      success: false,
      error: '志愿者资料不存在'
    })
  }

  const result = await updateProgress(id, profile.id, progress)
  res.status(result.success ? 200 : 400).json(result)
})

router.post('/:id/complete', authenticate, requireVolunteer, async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id)

  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      error: '无效的培训ID'
    })
  }

  const profile = await prisma.volunteerProfile.findUnique({
    where: { userId: req.user!.id }
  })

  if (!profile) {
    return res.status(404).json({
      success: false,
      error: '志愿者资料不存在'
    })
  }

  const result = await completeTraining(id, profile.id)
  res.status(result.success ? 200 : 400).json(result)
})

export default router
