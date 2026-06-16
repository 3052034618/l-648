import prisma from '../lib/prisma'
import {
  generateSchedule as generateScheduleService,
  confirmSchedule as confirmScheduleService,
  cancelSchedule as cancelScheduleService,
  getProjectSchedules as getProjectSchedulesService,
  getVolunteerSchedules as getVolunteerSchedulesService,
  getScheduleById
} from '../services/schedulingService'

export async function generateSchedule(
  projectId: number,
  startDate: Date,
  endDate: Date
) {
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

    return await generateScheduleService(projectId, startDate, endDate)
  } catch (error) {
    return {
      success: false,
      error: '生成排班失败'
    }
  }
}

export async function confirmSchedule(scheduleId: number, userId: number) {
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

    return await confirmScheduleService(scheduleId, volunteerProfile.id)
  } catch (error) {
    return {
      success: false,
      error: '确认排班失败'
    }
  }
}

export async function cancelSchedule(scheduleId: number, reason: string, userId: number) {
  try {
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        project: {
          include: {
            projectManager: true
          }
        },
        volunteerProfile: true
      }
    })

    if (!schedule) {
      return {
        success: false,
        error: '排班不存在'
      }
    }

    const isManager = schedule.project.projectManager.userId === userId
    const isVolunteer = schedule.volunteerProfile.userId === userId

    if (!isManager && !isVolunteer) {
      return {
        success: false,
        error: '无权取消该排班'
      }
    }

    return await cancelScheduleService(scheduleId, reason)
  } catch (error) {
    return {
      success: false,
      error: '取消排班失败'
    }
  }
}

export async function getSchedule(scheduleId: number) {
  return await getScheduleById(scheduleId)
}

export async function getProjectSchedules(projectId: number) {
  return await getProjectSchedulesService(projectId)
}

export async function getMySchedules(userId: number) {
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

    return await getVolunteerSchedulesService(volunteerProfile.id)
  } catch (error) {
    return {
      success: false,
      error: '获取我的排班失败'
    }
  }
}
