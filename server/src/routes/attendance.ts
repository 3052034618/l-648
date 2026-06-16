import { Router, Response } from 'express'
import { AuthenticatedRequest, AttendanceCheckInData } from '../types'
import { authenticate, requireVolunteer } from '../middleware/auth'
import {
  checkIn,
  checkOut,
  getAttendance,
  getMyAttendances,
  getProjectAttendances
} from '../controllers/attendanceController'

const router = Router()

router.post('/check-in', authenticate, requireVolunteer, async (req: AuthenticatedRequest, res: Response) => {
  const { scheduleId, latitude, longitude } = req.body as AttendanceCheckInData

  if (!scheduleId || latitude === undefined || longitude === undefined) {
    return res.status(400).json({
      success: false,
      error: '缺少必填参数'
    })
  }

  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return res.status(400).json({
      success: false,
      error: '经纬度格式不正确'
    })
  }

  const result = await checkIn(scheduleId, req.user!.id, latitude, longitude)
  res.status(result.success ? 200 : 400).json(result)
})

router.post('/check-out', authenticate, requireVolunteer, async (req: AuthenticatedRequest, res: Response) => {
  const { scheduleId, latitude, longitude } = req.body as AttendanceCheckInData

  if (!scheduleId || latitude === undefined || longitude === undefined) {
    return res.status(400).json({
      success: false,
      error: '缺少必填参数'
    })
  }

  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return res.status(400).json({
      success: false,
      error: '经纬度格式不正确'
    })
  }

  const result = await checkOut(scheduleId, req.user!.id, latitude, longitude)
  res.status(result.success ? 200 : 400).json(result)
})

router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const attendanceId = parseInt(req.params.id)

  if (isNaN(attendanceId)) {
    return res.status(400).json({
      success: false,
      error: '无效的签到记录ID'
    })
  }

  const result = await getAttendance(attendanceId)
  res.status(result.success ? 200 : 400).json(result)
})

router.get('/me', authenticate, requireVolunteer, async (req: AuthenticatedRequest, res: Response) => {
  const result = await getMyAttendances(req.user!.id)
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

  const result = await getProjectAttendances(projectId)
  res.status(result.success ? 200 : 400).json(result)
})

export default router
