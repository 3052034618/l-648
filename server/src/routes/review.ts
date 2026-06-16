import { Router, Response } from 'express'
import { AuthenticatedRequest, ReviewData } from '../types'
import { authenticate, requireProjectManager } from '../middleware/auth'
import prisma from '../lib/prisma'
import {
  createReview,
  getReview,
  getProjectReviews,
  getVolunteerReviews,
  getVolunteerRanking,
  getSatisfactionWordCloud
} from '../controllers/reviewController'

const router = Router()

router.post('/', authenticate, requireProjectManager, async (req: AuthenticatedRequest, res: Response) => {
  const { projectId, volunteerProfileId, rating, comment, tags } = req.body as ReviewData

  if (!projectId || !volunteerProfileId || !rating || !comment) {
    return res.status(400).json({
      success: false,
      error: '缺少必填参数'
    })
  }

  const managerProfile = await prisma.projectManagerProfile.findUnique({
    where: { userId: req.user!.id }
  })

  if (!managerProfile) {
    return res.status(404).json({
      success: false,
      error: '项目负责人资料不存在'
    })
  }

  const result = await createReview(req.user!.id, {
    projectId,
    volunteerProfileId,
    rating,
    comment,
    tags: tags || []
  })

  res.status(result.success ? 201 : 400).json(result)
})

router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const reviewId = parseInt(req.params.id)

  if (isNaN(reviewId)) {
    return res.status(400).json({
      success: false,
      error: '无效的评价ID'
    })
  }

  const result = await getReview(reviewId)
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

  const result = await getProjectReviews(projectId)
  res.status(result.success ? 200 : 400).json(result)
})

router.get('/volunteer/:volunteerId', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const volunteerProfileId = parseInt(req.params.volunteerId)

  if (isNaN(volunteerProfileId)) {
    return res.status(400).json({
      success: false,
      error: '无效的志愿者ID'
    })
  }

  const result = await getVolunteerReviews(volunteerProfileId)
  res.status(result.success ? 200 : 400).json(result)
})

router.get('/ranking', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined

  if (limit !== undefined && isNaN(limit)) {
    return res.status(400).json({
      success: false,
      error: '无效的limit参数'
    })
  }

  const result = await getVolunteerRanking(limit)
  res.status(result.success ? 200 : 400).json(result)
})

router.get('/wordcloud', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined

  if (projectId !== undefined && isNaN(projectId)) {
    return res.status(400).json({
      success: false,
      error: '无效的项目ID'
    })
  }

  const result = await getSatisfactionWordCloud(projectId)
  res.status(result.success ? 200 : 400).json(result)
})

export default router
