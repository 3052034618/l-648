import { Router, Response } from 'express'
import { AuthenticatedRequest, PointsRuleData, ExchangeRuleData, CreditThresholdData } from '../types'
import { authenticate, requireAdmin } from '../middleware/auth'
import prisma from '../lib/prisma'
import {
  createPointsRule,
  updatePointsRule,
  deletePointsRule,
  listPointsRules,
  createExchangeRule,
  updateExchangeRule,
  deleteExchangeRule,
  listExchangeRules,
  createCreditThreshold,
  updateCreditThreshold,
  deleteCreditThreshold,
  listCreditThresholds,
  exchangePoints,
  listExchangeRecords,
  getSystemSettings,
  updateSystemSetting
} from '../controllers/adminController'

const router = Router()

router.get('/points-rules', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const result = await listPointsRules()
  res.status(result.success ? 200 : 400).json(result)
})

router.post('/points-rules', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { name, description, points, condition, isActive } = req.body as PointsRuleData

  if (!name || !description || points === undefined || !condition) {
    return res.status(400).json({
      success: false,
      error: '缺少必填参数'
    })
  }

  const result = await createPointsRule({
    name,
    description,
    points,
    condition,
    isActive: isActive !== undefined ? isActive : true
  })

  res.status(result.success ? 201 : 400).json(result)
})

router.put('/points-rules/:id', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id)
  const data = req.body as Partial<PointsRuleData>

  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      error: '无效的规则ID'
    })
  }

  const result = await updatePointsRule(id, data)
  res.status(result.success ? 200 : 400).json(result)
})

router.delete('/points-rules/:id', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id)

  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      error: '无效的规则ID'
    })
  }

  const result = await deletePointsRule(id)
  res.status(result.success ? 200 : 400).json(result)
})

router.get('/exchange-rules', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const result = await listExchangeRules()
  res.status(result.success ? 200 : 400).json(result)
})

router.post('/exchange-rules', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { name, description, pointsRequired, reward, rewardImage, stock, isActive } = req.body as ExchangeRuleData

  if (!name || !description || pointsRequired === undefined || !reward || stock === undefined) {
    return res.status(400).json({
      success: false,
      error: '缺少必填参数'
    })
  }

  const result = await createExchangeRule({
    name,
    description,
    pointsRequired,
    reward,
    rewardImage,
    stock,
    isActive: isActive !== undefined ? isActive : true
  })

  res.status(result.success ? 201 : 400).json(result)
})

router.put('/exchange-rules/:id', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id)
  const data = req.body as Partial<ExchangeRuleData>

  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      error: '无效的规则ID'
    })
  }

  const result = await updateExchangeRule(id, data)
  res.status(result.success ? 200 : 400).json(result)
})

router.delete('/exchange-rules/:id', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id)

  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      error: '无效的规则ID'
    })
  }

  const result = await deleteExchangeRule(id)
  res.status(result.success ? 200 : 400).json(result)
})

router.get('/credit-thresholds', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const result = await listCreditThresholds()
  res.status(result.success ? 200 : 400).json(result)
})

router.post('/credit-thresholds', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { name, description, minCreditScore, restriction, isActive } = req.body as CreditThresholdData

  if (!name || !description || minCreditScore === undefined || !restriction) {
    return res.status(400).json({
      success: false,
      error: '缺少必填参数'
    })
  }

  const result = await createCreditThreshold({
    name,
    description,
    minCreditScore,
    restriction,
    isActive: isActive !== undefined ? isActive : true
  })

  res.status(result.success ? 201 : 400).json(result)
})

router.put('/credit-thresholds/:id', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id)
  const data = req.body as Partial<CreditThresholdData>

  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      error: '无效的门槛ID'
    })
  }

  const result = await updateCreditThreshold(id, data)
  res.status(result.success ? 200 : 400).json(result)
})

router.delete('/credit-thresholds/:id', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id)

  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      error: '无效的门槛ID'
    })
  }

  const result = await deleteCreditThreshold(id)
  res.status(result.success ? 200 : 400).json(result)
})

router.post('/exchange', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { volunteerProfileId, exchangeRuleId } = req.body

  if (!volunteerProfileId || !exchangeRuleId) {
    return res.status(400).json({
      success: false,
      error: '缺少必填参数'
    })
  }

  const result = await exchangePoints(volunteerProfileId, exchangeRuleId)
  res.status(result.success ? 201 : 400).json(result)
})

router.get('/exchange-records', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const volunteerProfileId = req.query.volunteerProfileId ? parseInt(req.query.volunteerProfileId as string) : undefined

  if (volunteerProfileId !== undefined && isNaN(volunteerProfileId)) {
    return res.status(400).json({
      success: false,
      error: '无效的志愿者ID'
    })
  }

  const result = await listExchangeRecords(volunteerProfileId)
  res.status(result.success ? 200 : 400).json(result)
})

router.get('/settings', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const result = await getSystemSettings()
  res.status(result.success ? 200 : 400).json(result)
})

router.put('/settings/:key', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const key = req.params.key
  const { value, description } = req.body

  if (!key || value === undefined) {
    return res.status(400).json({
      success: false,
      error: '缺少必填参数'
    })
  }

  const result = await updateSystemSetting(key, value, description)
  res.status(result.success ? 200 : 400).json(result)
})

export default router
