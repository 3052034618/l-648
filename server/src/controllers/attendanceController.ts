import prisma from '../lib/prisma'
import { AttendanceStatus, ScheduleStatus } from '@prisma/client'
import { calculatePoints, addPoints } from '../services/pointsService'

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return { hours, minutes }
}

export async function checkIn(
  scheduleId: number,
  userId: number,
  latitude: number,
  longitude: number
) {
  try {
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        project: true,
        volunteerProfile: true
      }
    })

    if (!schedule) {
      return {
        success: false,
        error: '排班不存在'
      }
    }

    if (schedule.volunteerProfile.userId !== userId) {
      return {
        success: false,
        error: '该排班不属于您'
      }
    }

    if (schedule.status !== ScheduleStatus.CONFIRMED) {
      return {
        success: false,
        error: '排班未确认，无法签到'
      }
    }

    const now = new Date()
    const scheduledDate = new Date(schedule.scheduledDate)
    const startTime = parseTime(schedule.startTime)
    const endTime = parseTime(schedule.endTime)

    const scheduleStart = new Date(scheduledDate)
    scheduleStart.setHours(startTime.hours, startTime.minutes, 0, 0)

    const scheduleEnd = new Date(scheduledDate)
    scheduleEnd.setHours(endTime.hours, endTime.minutes, 0, 0)

    const checkInWindowStart = new Date(scheduleStart.getTime() - 60 * 60 * 1000)
    const checkInWindowEnd = new Date(scheduleEnd.getTime())

    if (now < checkInWindowStart) {
      return {
        success: false,
        error: '还未到签到时间'
      }
    }

    if (now > checkInWindowEnd) {
      return {
        success: false,
        error: '已超过签到时间'
      }
    }

    const project = schedule.project
    if (project.latitude && project.longitude) {
      const distance = calculateDistance(
        latitude,
        longitude,
        project.latitude,
        project.longitude
      )

      if (distance > 500) {
        return {
          success: false,
          error: '您不在项目地点范围内'
        }
      }
    }

    const existingAttendance = await prisma.attendance.findUnique({
      where: { scheduleId }
    })

    if (existingAttendance && existingAttendance.checkInTime) {
      return {
        success: false,
        error: '您已签到'
      }
    }

    const isLate = now.getTime() > scheduleStart.getTime() + 30 * 60 * 1000
    const status = isLate ? AttendanceStatus.LATE : AttendanceStatus.PRESENT

    let attendance
    if (existingAttendance) {
      attendance = await prisma.attendance.update({
        where: { id: existingAttendance.id },
        data: {
          checkInTime: now,
          checkInLatitude: latitude,
          checkInLongitude: longitude,
          status
        }
      })
    } else {
      attendance = await prisma.attendance.create({
        data: {
          scheduleId,
          volunteerProfileId: schedule.volunteerProfileId,
          checkInTime: now,
          checkInLatitude: latitude,
          checkInLongitude: longitude,
          status
        }
      })
    }

    return {
      success: true,
      data: {
        attendance,
        isLate,
        message: isLate ? '签到成功，您已迟到' : '签到成功'
      }
    }
  } catch (error) {
    return {
      success: false,
      error: '签到失败'
    }
  }
}

export async function checkOut(
  scheduleId: number,
  userId: number,
  latitude: number,
  longitude: number
) {
  try {
    const attendance = await prisma.attendance.findUnique({
      where: { scheduleId },
      include: {
        schedule: {
          include: {
            project: true,
            volunteerProfile: true
          }
        }
      }
    })

    if (!attendance) {
      return {
        success: false,
        error: '签到记录不存在'
      }
    }

    if (attendance.schedule.volunteerProfile.userId !== userId) {
      return {
        success: false,
        error: '该签到记录不属于您'
      }
    }

    if (!attendance.checkInTime) {
      return {
        success: false,
        error: '您还未签到，无法签退'
      }
    }

    if (attendance.checkOutTime) {
      return {
        success: false,
        error: '您已签退'
      }
    }

    const now = new Date()
    const checkInTime = new Date(attendance.checkInTime)
    const serviceHoursMs = now.getTime() - checkInTime.getTime()
    const serviceHours = Math.round(serviceHoursMs / (1000 * 60 * 60) * 10) / 10

    const project = attendance.schedule.project
    if (project.latitude && project.longitude) {
      const distance = calculateDistance(
        latitude,
        longitude,
        project.latitude,
        project.longitude
      )

      if (distance > 500) {
        return {
          success: false,
          error: '您不在项目地点范围内'
        }
      }
    }

    const pointsEarned = calculatePoints(serviceHours, project.pointsPerHour)

    const updatedAttendance = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOutTime: now,
        checkOutLatitude: latitude,
        checkOutLongitude: longitude,
        serviceHours,
        pointsEarned
      }
    })

    await prisma.user.update({
      where: { id: userId },
      data: {
        totalServiceHours: {
          increment: serviceHours
        }
      }
    })

    if (pointsEarned > 0) {
      await addPoints(
        attendance.volunteerProfileId,
        pointsEarned,
        'SERVICE',
        `参与"${project.title}"项目服务`,
        attendance.id,
        'ATTENDANCE'
      )
    }

    return {
      success: true,
      data: {
        attendance: updatedAttendance,
        serviceHours,
        pointsEarned,
        message: `签退成功，服务时长${serviceHours}小时，获得${pointsEarned}积分`
      }
    }
  } catch (error) {
    return {
      success: false,
      error: '签退失败'
    }
  }
}

export async function getAttendance(attendanceId: number) {
  try {
    const attendance = await prisma.attendance.findUnique({
      where: { id: attendanceId },
      include: {
        schedule: {
          include: {
            project: true,
            volunteerProfile: {
              include: {
                user: {
                  select: {
                    id: true,
                    realName: true,
                    avatar: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!attendance) {
      return {
        success: false,
        error: '签到记录不存在'
      }
    }

    return {
      success: true,
      data: attendance
    }
  } catch (error) {
    return {
      success: false,
      error: '获取签到记录失败'
    }
  }
}

export async function getMyAttendances(userId: number) {
  try {
    const volunteerProfile = await prisma.volunteerProfile.findUnique({
      where: { userId }
    })

    if (!volunteerProfile) {
      return {
        success: false,
        error: '志愿者资料不存在'
      }
    }

    const attendances = await prisma.attendance.findMany({
      where: { volunteerProfileId: volunteerProfile.id },
      include: {
        schedule: {
          include: {
            project: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return {
      success: true,
      data: attendances
    }
  } catch (error) {
    return {
      success: false,
      error: '获取我的签到记录失败'
    }
  }
}

export async function getProjectAttendances(projectId: number) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      return {
        success: false,
        error: '项目不存在'
      }
    }

    const attendances = await prisma.attendance.findMany({
      where: {
        schedule: {
          projectId
        }
      },
      include: {
        schedule: {
          include: {
            volunteerProfile: {
              include: {
                user: {
                  select: {
                    id: true,
                    realName: true,
                    avatar: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return {
      success: true,
      data: attendances
    }
  } catch (error) {
    return {
      success: false,
      error: '获取项目签到记录失败'
    }
  }
}
