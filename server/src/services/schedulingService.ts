import prisma from '../lib/prisma'
import { ScheduleStatus, AttendanceStatus, TrainingStatus, NotificationType } from '@prisma/client'
import { createNotification } from './notificationService'

interface VolunteerScore {
  volunteerProfileId: number
  userId: number
  totalScore: number
  skillMatchScore: number
  ratingScore: number
  serviceHoursScore: number
  attendanceScore: number
  matchingSkills: number[]
}

export async function generateSchedule(
  projectId: number,
  startDate: Date,
  endDate: Date
) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        requiredSkills: {
          include: { skill: true }
        },
        projectManager: {
          include: { user: true }
        }
      }
    })

    if (!project) {
      return {
        success: false,
        error: '项目不存在'
      }
    }

    if (startDate > endDate) {
      return {
        success: false,
        error: '开始日期不能晚于结束日期'
      }
    }

    const requiredSkillIds = project.requiredSkills.map(rs => rs.skillId)
    const requiredTrainingIds = project.requiredTrainingIds

    const dayOfWeekStart = startDate.getDay()
    const dayOfWeekEnd = endDate.getDay()

    const volunteers = await prisma.volunteerProfile.findMany({
      where: {
        user: {
          creditScore: {
            gte: 60
          }
        },
        skills: {
          some: {
            skillId: {
              in: requiredSkillIds
            }
          }
        },
        availability: {
          some: {
            dayOfWeek: {
              gte: Math.min(dayOfWeekStart, dayOfWeekEnd),
              lte: Math.max(dayOfWeekStart, dayOfWeekEnd)
            }
          }
        }
      },
      include: {
        user: {
          select: {
            id: true,
            creditScore: true,
            totalPoints: true,
            totalServiceHours: true
          }
        },
        skills: {
          include: {
            skill: true
          }
        },
        availability: true,
        trainingRecords: {
          where: {
            trainingId: {
              in: requiredTrainingIds
            },
            status: TrainingStatus.COMPLETED
          }
        },
        attendances: {
          where: {
            status: {
              in: [AttendanceStatus.PRESENT, AttendanceStatus.ABSENT, AttendanceStatus.LATE]
            }
          },
          take: 20,
          orderBy: {
            createdAt: 'desc'
          }
        },
        reviewsReceived: {
          take: 10,
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    const trainedVolunteers = volunteers.filter(v => 
      requiredTrainingIds.length === 0 || 
      v.trainingRecords.length === requiredTrainingIds.length
    )

    const scoredVolunteers: VolunteerScore[] = trainedVolunteers.map(volunteer => {
      const projectSkills = project.requiredSkills
      const volunteerSkills = volunteer.skills

      let skillMatchScore = 0
      const matchingSkills: number[] = []

      projectSkills.forEach(ps => {
        const vs = volunteerSkills.find(v => v.skillId === ps.skillId)
        if (vs && vs.proficiency >= ps.minProficiency) {
          skillMatchScore += (vs.proficiency / 5) * (1 / projectSkills.length) * 100
          matchingSkills.push(ps.skillId)
        }
      })

      const reviews = volunteer.reviewsReceived
      const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 4
      const ratingScore = (avgRating / 5) * 100

      const maxHours = 100
      const serviceHoursScore = Math.min((volunteer.user.totalServiceHours / maxHours) * 100, 100)

      const attendances = volunteer.attendances
      const totalAttendance = attendances.length
      const presentCount = attendances.filter(a => a.status === AttendanceStatus.PRESENT || a.status === AttendanceStatus.LATE).length
      const attendanceScore = totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 100

      const totalScore = (skillMatchScore * 0.4) + (ratingScore * 0.3) + (serviceHoursScore * 0.2) + (attendanceScore * 0.1)

      return {
        volunteerProfileId: volunteer.id,
        userId: volunteer.user.id,
        totalScore,
        skillMatchScore,
        ratingScore,
        serviceHoursScore,
        attendanceScore,
        matchingSkills
      }
    })

    scoredVolunteers.sort((a, b) => b.totalScore - a.totalScore)

    const createdSchedules = []
    const assignedVolunteers = new Set<number>()

    const currentDate = new Date(startDate)

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay()

      for (const requiredSkill of project.requiredSkills) {
        for (let i = 0; i < requiredSkill.requiredCount; i++) {
          const availableVolunteer = scoredVolunteers.find(v =>
            !assignedVolunteers.has(v.volunteerProfileId) &&
            v.matchingSkills.includes(requiredSkill.skillId)
          )

          if (availableVolunteer) {
            const volunteer = trainedVolunteers.find(v => v.id === availableVolunteer.volunteerProfileId)
            const availability = volunteer?.availability.find(a => a.dayOfWeek === dayOfWeek)

            if (availability) {
              const existingSchedule = await prisma.schedule.findUnique({
                where: {
                  projectId_volunteerProfileId_scheduledDate_startTime: {
                    projectId,
                    volunteerProfileId: availableVolunteer.volunteerProfileId,
                    scheduledDate: new Date(currentDate),
                    startTime: availability.startTime
                  }
                }
              })

              if (!existingSchedule) {
                const schedule = await prisma.schedule.create({
                  data: {
                    projectId,
                    volunteerProfileId: availableVolunteer.volunteerProfileId,
                    scheduledDate: new Date(currentDate),
                    startTime: availability.startTime,
                    endTime: availability.endTime,
                    status: ScheduleStatus.PENDING
                  },
                  include: {
                    volunteerProfile: {
                      include: {
                        user: true
                      }
                    }
                  }
                })

                createdSchedules.push(schedule)
                assignedVolunteers.add(availableVolunteer.volunteerProfileId)

                await createNotification(
                  availableVolunteer.userId,
                  NotificationType.SCHEDULE_UPDATED,
                  '新的排班通知',
                  `您已被安排参加"${project.title}"项目，请确认排班信息。`,
                  schedule.id,
                  'SCHEDULE'
                )
              }
            }
          }
        }
      }

      assignedVolunteers.clear()
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return {
      success: true,
      data: {
        schedules: createdSchedules,
        totalGenerated: createdSchedules.length
      }
    }
  } catch (error) {
    return {
      success: false,
      error: '生成排班失败'
    }
  }
}

export async function confirmSchedule(scheduleId: number, volunteerProfileId: number) {
  try {
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        project: true,
        volunteerProfile: {
          include: {
            user: true
          }
        }
      }
    })

    if (!schedule) {
      return {
        success: false,
        error: '排班不存在'
      }
    }

    if (schedule.volunteerProfileId !== volunteerProfileId) {
      return {
        success: false,
        error: '无权确认该排班'
      }
    }

    if (schedule.status !== ScheduleStatus.PENDING) {
      return {
        success: false,
        error: '排班状态不允许确认'
      }
    }

    const updatedSchedule = await prisma.schedule.update({
      where: { id: scheduleId },
      data: {
        status: ScheduleStatus.CONFIRMED
      }
    })

    await createNotification(
      schedule.project.projectManagerId,
      NotificationType.SCHEDULE_UPDATED,
      '排班已确认',
      `志愿者"${schedule.volunteerProfile.user.realName}"已确认"${schedule.project.title}"的排班。`,
      scheduleId,
      'SCHEDULE'
    )

    return {
      success: true,
      data: updatedSchedule
    }
  } catch (error) {
    return {
      success: false,
      error: '确认排班失败'
    }
  }
}

export async function cancelSchedule(scheduleId: number, reason: string) {
  try {
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        project: true,
        volunteerProfile: {
          include: {
            user: true
          }
        }
      }
    })

    if (!schedule) {
      return {
        success: false,
        error: '排班不存在'
      }
    }

    if (schedule.status === ScheduleStatus.CANCELLED) {
      return {
        success: false,
        error: '排班已取消'
      }
    }

    const updatedSchedule = await prisma.schedule.update({
      where: { id: scheduleId },
      data: {
        status: ScheduleStatus.CANCELLED
      }
    })

    await createNotification(
      schedule.volunteerProfile.user.id,
      NotificationType.SCHEDULE_UPDATED,
      '排班已取消',
      `您在"${schedule.project.title}"的排班已被取消，原因：${reason}`,
      scheduleId,
      'SCHEDULE'
    )

    return {
      success: true,
      data: updatedSchedule
    }
  } catch (error) {
    return {
      success: false,
      error: '取消排班失败'
    }
  }
}

export async function getProjectSchedules(projectId: number) {
  try {
    const schedules = await prisma.schedule.findMany({
      where: { projectId },
      include: {
        volunteerProfile: {
          include: {
            user: {
              select: {
                id: true,
                realName: true,
                phone: true,
                avatar: true
              }
            }
          }
        },
        attendance: true
      },
      orderBy: [
        { scheduledDate: 'asc' },
        { startTime: 'asc' }
      ]
    })

    return {
      success: true,
      data: schedules
    }
  } catch (error) {
    return {
      success: false,
      error: '获取项目排班失败'
    }
  }
}

export async function getVolunteerSchedules(volunteerProfileId: number) {
  try {
    const schedules = await prisma.schedule.findMany({
      where: { volunteerProfileId },
      include: {
        project: {
          include: {
            projectManager: {
              include: {
                user: {
                  select: {
                    id: true,
                    realName: true,
                    phone: true
                  }
                }
              }
            }
          }
        },
        attendance: true
      },
      orderBy: [
        { scheduledDate: 'asc' },
        { startTime: 'asc' }
      ]
    })

    return {
      success: true,
      data: schedules
    }
  } catch (error) {
    return {
      success: false,
      error: '获取志愿者排班失败'
    }
  }
}

export async function getScheduleById(scheduleId: number) {
  try {
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        project: {
          include: {
            projectManager: {
              include: {
                user: {
                  select: {
                    id: true,
                    realName: true,
                    phone: true
                  }
                }
              }
            }
          }
        },
        volunteerProfile: {
          include: {
            user: {
              select: {
                id: true,
                realName: true,
                phone: true,
                avatar: true
              }
            }
          }
        },
        attendance: true
      }
    })

    if (!schedule) {
      return {
        success: false,
        error: '排班不存在'
      }
    }

    return {
      success: true,
      data: schedule
    }
  } catch (error) {
    return {
      success: false,
      error: '获取排班详情失败'
    }
  }
}
