import { Router, Response } from 'express'
import { AuthenticatedRequest, AvailabilityData, VolunteerSkillData } from '../types'
import { authenticate, requireVolunteer } from '../middleware/auth'
import prisma from '../lib/prisma'
import {
  updateProfile,
  addSkill,
  updateSkill,
  removeSkill,
  setAvailability,
  getProfile,
  getMyProfile
} from '../controllers/volunteerController'

const router = Router()

router.get('/me', authenticate, requireVolunteer, async (req: AuthenticatedRequest, res: Response) => {
  const result = await getMyProfile(req.user!.id)
  res.status(result.success ? 200 : 400).json(result)
})

router.put('/me', authenticate, requireVolunteer, async (req: AuthenticatedRequest, res: Response) => {
  const { emergencyContact, emergencyPhone } = req.body

  const profile = await prisma.volunteerProfile.findUnique({
    where: { userId: req.user!.id }
  })

  if (!profile) {
    return res.status(404).json({
      success: false,
      error: '志愿者资料不存在'
    })
  }

  const result = await updateProfile(profile.id, { emergencyContact, emergencyPhone })
  res.status(result.success ? 200 : 400).json(result)
})

router.post('/me/skills', authenticate, requireVolunteer, async (req: AuthenticatedRequest, res: Response) => {
  const { skillId, proficiency, certificateUrl } = req.body as VolunteerSkillData

  if (!skillId || !proficiency) {
    return res.status(400).json({
      success: false,
      error: '缺少必填参数'
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

  const result = await addSkill(profile.id, skillId, proficiency, certificateUrl)
  res.status(result.success ? 201 : 400).json(result)
})

router.put('/me/skills/:id', authenticate, requireVolunteer, async (req: AuthenticatedRequest, res: Response) => {
  const volunteerSkillId = parseInt(req.params.id)
  const { proficiency, certificateUrl } = req.body

  if (isNaN(volunteerSkillId)) {
    return res.status(400).json({
      success: false,
      error: '无效的技能ID'
    })
  }

  if (!proficiency) {
    return res.status(400).json({
      success: false,
      error: '缺少熟练度参数'
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

  const volunteerSkill = await prisma.volunteerSkill.findUnique({
    where: { id: volunteerSkillId }
  })

  if (!volunteerSkill) {
    return res.status(404).json({
      success: false,
      error: '技能不存在'
    })
  }

  if (volunteerSkill.volunteerProfileId !== profile.id) {
    return res.status(403).json({
      success: false,
      error: '无权修改该技能'
    })
  }

  const result = await updateSkill(volunteerSkillId, proficiency, certificateUrl)
  res.status(result.success ? 200 : 400).json(result)
})

router.delete('/me/skills/:id', authenticate, requireVolunteer, async (req: AuthenticatedRequest, res: Response) => {
  const volunteerSkillId = parseInt(req.params.id)

  if (isNaN(volunteerSkillId)) {
    return res.status(400).json({
      success: false,
      error: '无效的技能ID'
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

  const volunteerSkill = await prisma.volunteerSkill.findUnique({
    where: { id: volunteerSkillId }
  })

  if (!volunteerSkill) {
    return res.status(404).json({
      success: false,
      error: '技能不存在'
    })
  }

  if (volunteerSkill.volunteerProfileId !== profile.id) {
    return res.status(403).json({
      success: false,
      error: '无权删除该技能'
    })
  }

  const result = await removeSkill(volunteerSkillId)
  res.status(result.success ? 200 : 400).json(result)
})

router.put('/me/availability', authenticate, requireVolunteer, async (req: AuthenticatedRequest, res: Response) => {
  const { availability } = req.body as { availability: AvailabilityData[] }

  if (!availability || !Array.isArray(availability)) {
    return res.status(400).json({
      success: false,
      error: '缺少空闲时段参数'
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

  const result = await setAvailability(profile.id, availability)
  res.status(result.success ? 200 : 400).json(result)
})

router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const volunteerProfileId = parseInt(req.params.id)

  if (isNaN(volunteerProfileId)) {
    return res.status(400).json({
      success: false,
      error: '无效的志愿者ID'
    })
  }

  const result = await getProfile(volunteerProfileId)
  res.status(result.success ? 200 : 400).json(result)
})

export default router
