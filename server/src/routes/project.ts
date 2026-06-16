import { Router, Response } from 'express'
import { AuthenticatedRequest, ProjectCreateData } from '../types'
import { authenticate, requireProjectManager, requireVolunteer, requireAdmin } from '../middleware/auth'
import prisma from '../lib/prisma'
import { ProjectStatus, ProjectLevel } from '@prisma/client'
import {
  createProject,
  getProject,
  listProjects,
  updateProject,
  deleteProject,
  publishProject,
  getMyProjects,
  getAppliedProjects,
  applyProject,
  reviewApplication
} from '../controllers/projectController'
import { matchProjectsForVolunteer, matchVolunteersForProject } from '../services/projectMatcherService'

const router = Router()

router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const { page, pageSize, status, category, level, keyword } = req.query

  const filters = {
    page: page ? parseInt(page as string) : undefined,
    pageSize: pageSize ? parseInt(pageSize as string) : undefined,
    status: status as ProjectStatus | undefined,
    category: category as string | undefined,
    level: level as ProjectLevel | undefined,
    keyword: keyword as string | undefined
  }

  const result = await listProjects(filters)
  res.status(result.success ? 200 : 400).json(result)
})

router.post('/', authenticate, requireProjectManager, async (req: AuthenticatedRequest, res: Response) => {
  const data = req.body as ProjectCreateData

  if (!data.title || !data.description || !data.category || !data.level || !data.location || !data.startDate || !data.endDate || !data.maxParticipants || !data.minParticipants || !data.requiredSkills) {
    return res.status(400).json({
      success: false,
      error: '缺少必填参数'
    })
  }

  const result = await createProject(req.user!.id, data)
  res.status(result.success ? 201 : 400).json(result)
})

router.get('/me/managed', authenticate, requireProjectManager, async (req: AuthenticatedRequest, res: Response) => {
  const result = await getMyProjects(req.user!.id)
  res.status(result.success ? 200 : 400).json(result)
})

router.get('/me/applied', authenticate, requireVolunteer, async (req: AuthenticatedRequest, res: Response) => {
  const profile = await prisma.volunteerProfile.findUnique({
    where: { userId: req.user!.id }
  })

  if (!profile) {
    return res.status(404).json({
      success: false,
      error: '志愿者资料不存在'
    })
  }

  const result = await getAppliedProjects(profile.id)
  res.status(result.success ? 200 : 400).json(result)
})

router.get('/me/recommendations', authenticate, requireVolunteer, async (req: AuthenticatedRequest, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 10

  const profile = await prisma.volunteerProfile.findUnique({
    where: { userId: req.user!.id }
  })

  if (!profile) {
    return res.status(404).json({
      success: false,
      error: '志愿者资料不存在'
    })
  }

  const result = await matchProjectsForVolunteer(profile.id, limit)
  res.status(result.success ? 200 : 400).json(result)
})

router.get('/:id/match-volunteers', authenticate, requireProjectManager, async (req: AuthenticatedRequest, res: Response) => {
  const projectId = parseInt(req.params.id)
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 20

  if (isNaN(projectId)) {
    return res.status(400).json({
      success: false,
      error: '无效的项目ID'
    })
  }

  const result = await matchVolunteersForProject(projectId, limit)
  res.status(result.success ? 200 : 400).json(result)
})

router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const projectId = parseInt(req.params.id)

  if (isNaN(projectId)) {
    return res.status(400).json({
      success: false,
      error: '无效的项目ID'
    })
  }

  const result = await getProject(projectId)
  res.status(result.success ? 200 : 400).json(result)
})

router.put('/:id', authenticate, requireProjectManager, async (req: AuthenticatedRequest, res: Response) => {
  const projectId = parseInt(req.params.id)
  const data = req.body as Partial<ProjectCreateData>

  if (isNaN(projectId)) {
    return res.status(400).json({
      success: false,
      error: '无效的项目ID'
    })
  }

  const result = await updateProject(projectId, req.user!.id, data)
  res.status(result.success ? 200 : 400).json(result)
})

router.delete('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const projectId = parseInt(req.params.id)

  if (isNaN(projectId)) {
    return res.status(400).json({
      success: false,
      error: '无效的项目ID'
    })
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { projectManager: true }
  })

  if (!project) {
    return res.status(404).json({
      success: false,
      error: '项目不存在'
    })
  }

  if (project.projectManager.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: '无权删除该项目'
    })
  }

  const result = await deleteProject(projectId, req.user!.id)
  res.status(result.success ? 200 : 400).json(result)
})

router.post('/:id/publish', authenticate, requireProjectManager, async (req: AuthenticatedRequest, res: Response) => {
  const projectId = parseInt(req.params.id)

  if (isNaN(projectId)) {
    return res.status(400).json({
      success: false,
      error: '无效的项目ID'
    })
  }

  const result = await publishProject(projectId, req.user!.id)
  res.status(result.success ? 200 : 400).json(result)
})

router.post('/:id/apply', authenticate, requireVolunteer, async (req: AuthenticatedRequest, res: Response) => {
  const projectId = parseInt(req.params.id)

  if (isNaN(projectId)) {
    return res.status(400).json({
      success: false,
      error: '无效的项目ID'
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

  const result = await applyProject(projectId, profile.id)
  res.status(result.success ? 201 : 400).json(result)
})

router.put('/applications/:id/review', authenticate, requireProjectManager, async (req: AuthenticatedRequest, res: Response) => {
  const applicationId = parseInt(req.params.id)
  const { status } = req.body

  if (isNaN(applicationId)) {
    return res.status(400).json({
      success: false,
      error: '无效的申请ID'
    })
  }

  if (!status) {
    return res.status(400).json({
      success: false,
      error: '缺少审核状态参数'
    })
  }

  const result = await reviewApplication(applicationId, req.user!.id, status)
  res.status(result.success ? 200 : 400).json(result)
})

export default router
