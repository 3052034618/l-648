import { Router, Response } from 'express'
import { AuthenticatedRequest, AttendanceCheckInData } from '../types'
import { authenticate, requireVolunteer } from '../middleware/auth'
import prisma from '../lib/prisma'
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
  const { scheduleId, attendanceId, latitude, longitude } = req.body as {
    scheduleId?: number
    attendanceId?: number
    latitude: number
    longitude: number
  }

  let actualScheduleId = scheduleId

  if (!actualScheduleId && attendanceId) {
    const att = await prisma.attendance.findUnique({
      where: { id: attendanceId },
      select: { scheduleId: true }
    })
    if (att) actualScheduleId = att.scheduleId
  }

  if (!actualScheduleId || latitude === undefined || longitude === undefined) {
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

  const result = await checkOut(actualScheduleId, req.user!.id, latitude, longitude)
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

    const [attendances, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        include: {
          schedule: {
            include: {
              project: {
                select: {
                  id: true,
                  title: true,
                  category: true,
                  location: true,
                  status: true
                }
              }
            }
          },
          volunteerProfile: {
            include: {
              user: {
                select: { id: true, realName: true, username: true }
              }
            }
          }
        },
        orderBy: [
          { checkInTime: 'desc' },
          { createdAt: 'desc' }
        ],
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      prisma.attendance.count({ where })
    ])

    res.json({
      success: true,
      data: {
        items: attendances,
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取我的签到记录失败'
    })
  }
})

router.get('/schedule/:scheduleId', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const scheduleId = parseInt(req.params.scheduleId)

    if (isNaN(scheduleId)) {
      return res.status(400).json({
        success: false,
        error: '无效的排班ID'
      })
    }

    const volunteerProfile = await prisma.volunteerProfile.findUnique({
      where: { userId: req.user!.id }
    })

    const where: any = { scheduleId }
    if (volunteerProfile) {
      where.volunteerProfileId = volunteerProfile.id
    }

    const attendance = await prisma.attendance.findFirst({
      where,
      include: {
        schedule: {
          include: {
            project: {
              select: {
                id: true,
                title: true,
                category: true,
                location: true,
                status: true
              }
            }
          }
        },
        volunteerProfile: {
          include: {
            user: {
              select: { id: true, realName: true, username: true }
            }
          }
        }
      }
    })

    res.json({
      success: true,
      data: attendance
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取签到记录失败'
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

  const result = await getProjectAttendances(projectId)
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

export default router
