import prisma from '../lib/prisma'
import { ScheduleStatus, AttendanceStatus, NotificationType } from '@prisma/client'
import { createNotification } from './notificationService'

export async function checkAndMarkAbsence() {
  try {
    const now = new Date()
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000)

    const absentSchedules = await prisma.schedule.findMany({
      where: {
        status: ScheduleStatus.CONFIRMED,
        attendance: null,
        scheduledDate: {
          lte: now
        }
      },
      include: {
        project: true,
        volunteerProfile: {
          include: {
            user: true
          }
        }
      }
    })

    const results = []

    for (const schedule of absentSchedules) {
      const scheduleDateTime = new Date(schedule.scheduledDate)
      const [hours, minutes] = schedule.startTime.split(':').map(Number)
      scheduleDateTime.setHours(hours, minutes, 0, 0)

      if (scheduleDateTime > thirtyMinutesAgo) {
        continue
      }

      const existingAttendance = await prisma.attendance.findUnique({
        where: { scheduleId: schedule.id }
      })

      if (existingAttendance) {
        continue
      }

      const attendance = await prisma.attendance.create({
        data: {
          scheduleId: schedule.id,
          volunteerProfileId: schedule.volunteerProfileId,
          status: AttendanceStatus.ABSENT,
          serviceHours: 0,
          pointsEarned: 0
        }
      })

      const updatedUser = await prisma.user.update({
        where: { id: schedule.volunteerProfile.userId },
        data: {
          creditScore: {
            decrement: 5
          }
        }
      })

      const creditRecord = await prisma.creditRecord.create({
        data: {
          userId: schedule.volunteerProfile.userId,
          amount: -5,
          reason: '缺席服务',
          relatedEntityId: schedule.id,
          relatedEntityType: 'SCHEDULE'
        }
      })

      await createNotification(
        schedule.volunteerProfile.userId,
        NotificationType.ATTENDANCE_ABNORMAL,
        '签到异常通知',
        `您在"${schedule.project.title}"项目的服务缺席，已扣除信用分5分。`,
        schedule.id,
        'SCHEDULE'
      )

      results.push({
        scheduleId: schedule.id,
        volunteerId: schedule.volunteerProfile.userId,
        attendanceId: attendance.id,
        creditRecordId: creditRecord.id,
        newCreditScore: updatedUser.creditScore
      })
    }

    return {
      success: true,
      data: {
        processed: results.length,
        results
      }
    }
  } catch (error) {
    return {
      success: false,
      error: '缺席检测失败'
    }
  }
}
