import { Router, Response } from 'express'
import { AuthenticatedRequest, SkillData } from '../types'
import { authenticate, requireAdmin } from '../middleware/auth'
import {
  createSkill,
  listSkills,
  updateSkill,
  deleteSkill
} from '../controllers/skillController'

const router = Router()

router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const { category } = req.query
  const result = await listSkills(category as string | undefined)
  res.status(result.success ? 200 : 400).json(result)
})

router.post('/', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { name, category, description } = req.body as SkillData

  if (!name || !category) {
    return res.status(400).json({
      success: false,
      error: '缺少必填参数'
    })
  }

  const result = await createSkill({ name, category, description })
  res.status(result.success ? 201 : 400).json(result)
})

router.put('/:id', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id)
  const { name, category, description } = req.body as Partial<SkillData>

  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      error: '无效的技能ID'
    })
  }

  const result = await updateSkill(id, { name, category, description })
  res.status(result.success ? 200 : 400).json(result)
})

router.delete('/:id', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id)

  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      error: '无效的技能ID'
    })
  }

  const result = await deleteSkill(id)
  res.status(result.success ? 200 : 400).json(result)
})

export default router
