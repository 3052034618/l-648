import { Router, Response } from 'express'
import { AuthenticatedRequest } from '../types'
import { authenticate, requireAdmin } from '../middleware/auth'
import * as fs from 'fs'
import {
  generateMonthlyReport,
  exportReportToExcel,
  getReportList,
  getReport
} from '../services/reportService'

const router = Router()

router.post('/generate', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { year, month } = req.body

  if (!year || !month) {
    return res.status(400).json({
      success: false,
      error: '缺少必填参数'
    })
  }

  if (month < 1 || month > 12) {
    return res.status(400).json({
      success: false,
      error: '月份必须在 1-12 之间'
    })
  }

  const result = await generateMonthlyReport(year, month)
  res.status(result.success ? 201 : 400).json(result)
})

router.get('/', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const page = req.query.page ? parseInt(req.query.page as string) : 1
  const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : 10

  if (isNaN(page) || page < 1) {
    return res.status(400).json({
      success: false,
      error: '无效的页码'
    })
  }

  if (isNaN(pageSize) || pageSize < 1 || pageSize > 100) {
    return res.status(400).json({
      success: false,
      error: '无效的每页数量'
    })
  }

  const result = await getReportList(page, pageSize)
  res.status(result.success ? 200 : 400).json(result)
})

router.get('/:id', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const reportId = parseInt(req.params.id)

  if (isNaN(reportId)) {
    return res.status(400).json({
      success: false,
      error: '无效的报表ID'
    })
  }

  const result = await getReport(reportId)
  res.status(result.success ? 200 : 400).json(result)
})

router.get('/:id/export', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const reportId = parseInt(req.params.id)

  if (isNaN(reportId)) {
    return res.status(400).json({
      success: false,
      error: '无效的报表ID'
    })
  }

  const result = await exportReportToExcel(reportId)

  if (!result.success || !result.data) {
    return res.status(400).json(result)
  }

  const filePath = result.data.filePath
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      success: false,
      error: '文件不存在'
    })
  }

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', `attachment; filename="${result.data.fileName}"`)

  const fileStream = fs.createReadStream(filePath)
  fileStream.pipe(res)
})

export default router
