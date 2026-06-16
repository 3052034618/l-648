import prisma from '../lib/prisma'
import { ProjectCreateData, PaginationResult } from '../types'
import { ProjectStatus, ProjectLevel, Role } from '@prisma/client'

export async function createProject(userId: number, data: ProjectCreateData) {
  try {
    const managerProfile = await prisma.projectManagerProfile.findUnique({
      where: { userId }
    })

    if (!managerProfile) {
      return {
        success: false,
        error: '项目负责人资料不存在'
      }
    }

    const project = await prisma.project.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        level: data.level as ProjectLevel,
        status: ProjectStatus.DRAFT,
        location: data.location,
        latitude: data.latitude,
        longitude: data.longitude,
        startDate: data.startDate,
        endDate: data.endDate,
        maxParticipants: data.maxParticipants,
        minParticipants: data.minParticipants,
        requiredTrainingIds: data.requiredTrainingIds,
        pointsPerHour: data.pointsPerHour,
        projectManagerId: managerProfile.id,
        requiredSkills: {
          create: data.requiredSkills.map(skill => ({
            skillId: skill.skillId,
            minProficiency: skill.minProficiency,
            requiredCount: skill.requiredCount
          }))
        }
      },
      include: {
        requiredSkills: {
          include: {
            skill: true
          }
        },
        projectManager: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                realName: true
              }
            }
          }
        }
      }
    })

    return {
      success: true,
      data: project
    }
  } catch (error) {
    return {
      success: false,
      error: '创建项目失败'
    }
  }
}

export async function getProject(projectId: number) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        requiredSkills: {
          include: {
            skill: true
          }
        },
        projectManager: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                realName: true,
                avatar: true
              }
            }
          }
        },
        applications: {
          include: {
            volunteerProfile: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    realName: true,
                    avatar: true
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            applications: true,
            schedules: true
          }
        }
      }
    })

    if (!project) {
      return {
        success: false,
        error: '项目不存在'
      }
    }

    return {
      success: true,
      data: project
    }
  } catch (error) {
    return {
      success: false,
      error: '获取项目详情失败'
    }
  }
}

export async function listProjects(filters: {
  page?: number
  pageSize?: number
  status?: ProjectStatus
  category?: string
  level?: ProjectLevel
  keyword?: string
}) {
  try {
    const page = filters.page || 1
    const pageSize = filters.pageSize || 10
    const skip = (page - 1) * pageSize

    const where: any = {
      status: {
        not: ProjectStatus.DRAFT
      }
    }

    if (filters.status) {
      where.status = filters.status
    }

    if (filters.category) {
      where.category = filters.category
    }

    if (filters.level) {
      where.level = filters.level
    }

    if (filters.keyword) {
      where.OR = [
        { title: { contains: filters.keyword } },
        { description: { contains: filters.keyword } }
      ]
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          requiredSkills: {
            include: {
              skill: true
            }
          },
          projectManager: {
            include: {
              user: {
                select: {
                  id: true,
                  realName: true
                }
              }
            }
          },
          _count: {
            select: {
              applications: true
            }
          }
        }
      }),
      prisma.project.count({ where })
    ])

    const result: PaginationResult<any> = {
      items: projects,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }

    return {
      success: true,
      data: result
    }
  } catch (error) {
    return {
      success: false,
      error: '获取项目列表失败'
    }
  }
}

export async function updateProject(projectId: number, userId: number, data: Partial<ProjectCreateData>) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        projectManager: true
      }
    })

    if (!project) {
      return {
        success: false,
        error: '项目不存在'
      }
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })

    if (project.projectManager.userId !== userId && user?.role !== Role.ADMIN) {
      return {
        success: false,
        error: '无权修改该项目'
      }
    }

    if (project.status !== ProjectStatus.DRAFT) {
      return {
        success: false,
        error: '只能修改草稿状态的项目'
      }
    }

    const updateData: any = {}

    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.category !== undefined) updateData.category = data.category
    if (data.level !== undefined) updateData.level = data.level as ProjectLevel
    if (data.location !== undefined) updateData.location = data.location
    if (data.latitude !== undefined) updateData.latitude = data.latitude
    if (data.longitude !== undefined) updateData.longitude = data.longitude
    if (data.startDate !== undefined) updateData.startDate = data.startDate
    if (data.endDate !== undefined) updateData.endDate = data.endDate
    if (data.maxParticipants !== undefined) updateData.maxParticipants = data.maxParticipants
    if (data.minParticipants !== undefined) updateData.minParticipants = data.minParticipants
    if (data.requiredTrainingIds !== undefined) updateData.requiredTrainingIds = data.requiredTrainingIds
    if (data.pointsPerHour !== undefined) updateData.pointsPerHour = data.pointsPerHour

    if (data.requiredSkills !== undefined) {
      updateData.requiredSkills = {
        deleteMany: {},
        create: data.requiredSkills.map(skill => ({
          skillId: skill.skillId,
          minProficiency: skill.minProficiency,
          requiredCount: skill.requiredCount
        }))
      }
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: updateData,
      include: {
        requiredSkills: {
          include: {
            skill: true
          }
        },
        projectManager: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                realName: true
              }
            }
          }
        }
      }
    })

    return {
      success: true,
      data: updatedProject
    }
  } catch (error) {
    return {
      success: false,
      error: '更新项目失败'
    }
  }
}

export async function deleteProject(projectId: number, userId: number) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        projectManager: true
      }
    })

    if (!project) {
      return {
        success: false,
        error: '项目不存在'
      }
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })

    if (project.projectManager.userId !== userId && user?.role !== Role.ADMIN) {
      return {
        success: false,
        error: '无权删除该项目'
      }
    }

    await prisma.$transaction([
      prisma.projectRequiredSkill.deleteMany({
        where: { projectId }
      }),
      prisma.projectApplication.deleteMany({
        where: { projectId }
      }),
      prisma.schedule.deleteMany({
        where: { projectId }
      }),
      prisma.review.deleteMany({
        where: { projectId }
      }),
      prisma.monthlyReportProject.deleteMany({
        where: { projectId }
      }),
      prisma.project.delete({
        where: { id: projectId }
      })
    ])

    return {
      success: true,
      data: { message: '项目已删除' }
    }
  } catch (error) {
    return {
      success: false,
      error: '删除项目失败'
    }
  }
}

export async function publishProject(projectId: number, userId: number) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        projectManager: true
      }
    })

    if (!project) {
      return {
        success: false,
        error: '项目不存在'
      }
    }

    if (project.projectManager.userId !== userId) {
      return {
        success: false,
        error: '无权发布该项目'
      }
    }

    if (project.status !== ProjectStatus.DRAFT) {
      return {
        success: false,
        error: '只能发布草稿状态的项目'
      }
    }

    const publishedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        status: ProjectStatus.PUBLISHED
      },
      include: {
        requiredSkills: {
          include: {
            skill: true
          }
        },
        projectManager: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                realName: true
              }
            }
          }
        }
      }
    })

    return {
      success: true,
      data: publishedProject
    }
  } catch (error) {
    return {
      success: false,
      error: '发布项目失败'
    }
  }
}

export async function getMyProjects(userId: number) {
  try {
    const managerProfile = await prisma.projectManagerProfile.findUnique({
      where: { userId }
    })

    if (!managerProfile) {
      return {
        success: false,
        error: '项目负责人资料不存在'
      }
    }

    const projects = await prisma.project.findMany({
      where: { projectManagerId: managerProfile.id },
      orderBy: { createdAt: 'desc' },
      include: {
        requiredSkills: {
          include: {
            skill: true
          }
        },
        _count: {
          select: {
            applications: true,
            schedules: true
          }
        }
      }
    })

    return {
      success: true,
      data: projects
    }
  } catch (error) {
    return {
      success: false,
      error: '获取我的项目失败'
    }
  }
}

export async function getAppliedProjects(volunteerProfileId: number) {
  try {
    const applications = await prisma.projectApplication.findMany({
      where: { volunteerProfileId },
      orderBy: { appliedAt: 'desc' },
      include: {
        project: {
          include: {
            requiredSkills: {
              include: {
                skill: true
              }
            },
            projectManager: {
              include: {
                user: {
                  select: {
                    id: true,
                    realName: true
                  }
                }
              }
            }
          }
        }
      }
    })

    return {
      success: true,
      data: applications
    }
  } catch (error) {
    return {
      success: false,
      error: '获取申请的项目失败'
    }
  }
}

export async function applyProject(projectId: number, volunteerProfileId: number) {
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

    if (project.status !== ProjectStatus.PUBLISHED) {
      return {
        success: false,
        error: '只能申请已发布的项目'
      }
    }

    const existingApplication = await prisma.projectApplication.findUnique({
      where: {
        projectId_volunteerProfileId: {
          projectId,
          volunteerProfileId
        }
      }
    })

    if (existingApplication) {
      return {
        success: false,
        error: '已申请该项目'
      }
    }

    const application = await prisma.projectApplication.create({
      data: {
        projectId,
        volunteerProfileId,
        status: 'PENDING'
      },
      include: {
        project: {
          include: {
            projectManager: {
              include: {
                user: {
                  select: {
                    id: true,
                    realName: true
                  }
                }
              }
            }
          }
        }
      }
    })

    return {
      success: true,
      data: application
    }
  } catch (error) {
    return {
      success: false,
      error: '申请项目失败'
    }
  }
}

export async function reviewApplication(applicationId: number, userId: number, status: string) {
  try {
    const application = await prisma.projectApplication.findUnique({
      where: { id: applicationId },
      include: {
        project: {
          include: {
            projectManager: true
          }
        }
      }
    })

    if (!application) {
      return {
        success: false,
        error: '申请不存在'
      }
    }

    if (application.project.projectManager.userId !== userId) {
      return {
        success: false,
        error: '无权审核该申请'
      }
    }

    if (application.status !== 'PENDING') {
      return {
        success: false,
        error: '该申请已被审核'
      }
    }

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return {
        success: false,
        error: '无效的审核状态'
      }
    }

    const reviewedApplication = await prisma.projectApplication.update({
      where: { id: applicationId },
      data: {
        status,
        reviewedAt: new Date()
      },
      include: {
        project: {
          include: {
            projectManager: {
              include: {
                user: {
                  select: {
                    id: true,
                    realName: true
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
                username: true,
                realName: true
              }
            }
          }
        }
      }
    })

    return {
      success: true,
      data: reviewedApplication
    }
  } catch (error) {
    return {
      success: false,
      error: '审核申请失败'
    }
  }
}
