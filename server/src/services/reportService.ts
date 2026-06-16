import prisma from '../lib/prisma'
import { ReportStatus, ProjectStatus } from '@prisma/client'
import * as ExcelJS from 'exceljs'
import * as cron from 'node-cron'
import * as path from 'path'
import * as fs from 'fs'

export async function generateMonthlyReport(year: number, month: number) {
  try {
    const reportMonth = `${year}-${String(month).padStart(2, '0')}`
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59)

    const existingReport = await prisma.monthlyReport.findFirst({
      where: { reportMonth }
    })

    if (existingReport) {
      return {
        success: false,
        error: '该月份报表已存在'
      }
    }

    const report = await prisma.monthlyReport.create({
      data: {
        reportMonth,
        status: ReportStatus.PENDING
      }
    })

    const totalVolunteers = await prisma.volunteerProfile.count({
      where: {
        createdAt: {
          lte: endDate
        }
      }
    })

    const projects = await prisma.project.findMany({
      where: {
        OR: [
          {
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          },
          {
            schedules: {
              some: {
                scheduledDate: {
                  gte: startDate,
                  lte: endDate
                }
              }
            }
          }
        ]
      },
      include: {
        schedules: {
          where: {
            scheduledDate: {
              gte: startDate,
              lte: endDate
            }
          },
          include: {
            attendance: true
          }
        }
      }
    })

    const totalProjects = projects.length
    let totalServiceHours = 0
    let totalPointsDistributed = 0

    const projectDetails: { projectId: number; participantCount: number; serviceHours: number; pointsDistributed: number }[] = []

    for (const project of projects) {
      const participantIds = new Set<number>()
      let projectServiceHours = 0
      let projectPointsDistributed = 0

      for (const schedule of project.schedules) {
        if (schedule.volunteerProfileId) {
          participantIds.add(schedule.volunteerProfileId)
        }
        if (schedule.attendance) {
          projectServiceHours += schedule.attendance.serviceHours
          projectPointsDistributed += schedule.attendance.pointsEarned
        }
      }

      totalServiceHours += projectServiceHours
      totalPointsDistributed += projectPointsDistributed

      projectDetails.push({
        projectId: project.id,
        participantCount: participantIds.size,
        serviceHours: projectServiceHours,
        pointsDistributed: projectPointsDistributed
      })
    }

    const updatedReport = await prisma.$transaction(async (tx) => {
      const reportUpdate = await tx.monthlyReport.update({
        where: { id: report.id },
        data: {
          totalVolunteers,
          totalProjects,
          totalServiceHours,
          totalPointsDistributed,
          status: ReportStatus.GENERATED,
          generatedAt: new Date()
        }
      })

      for (const detail of projectDetails) {
        await tx.monthlyReportProject.create({
          data: {
            monthlyReportId: report.id,
            projectId: detail.projectId,
            participantCount: detail.participantCount,
            serviceHours: detail.serviceHours,
            pointsDistributed: detail.pointsDistributed
          }
        })
      }

      return reportUpdate
    })

    return {
      success: true,
      data: updatedReport
    }
  } catch (error) {
    return {
      success: false,
      error: '生成月度报表失败'
    }
  }
}

export async function exportReportToExcel(reportId: number) {
  try {
    const report = await prisma.monthlyReport.findUnique({
      where: { id: reportId },
      include: {
        projects: {
          include: {
            project: true
          }
        }
      }
    })

    if (!report) {
      return {
        success: false,
        error: '报表不存在'
      }
    }

    if (report.status !== ReportStatus.GENERATED && report.status !== ReportStatus.EXPORTED) {
      return {
        success: false,
        error: '报表尚未生成'
      }
    }

    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'Volunteer Management System'
    workbook.created = new Date()

    const summarySheet = workbook.addWorksheet('汇总数据')
    summarySheet.columns = [
      { header: '指标', key: 'metric', width: 30 },
      { header: '数值', key: 'value', width: 20 }
    ]

    summarySheet.addRow({ metric: '报表月份', value: report.reportMonth })
    summarySheet.addRow({ metric: '总志愿者数', value: report.totalVolunteers })
    summarySheet.addRow({ metric: '总项目数', value: report.totalProjects })
    summarySheet.addRow({ metric: '总服务时长(小时)', value: report.totalServiceHours })
    summarySheet.addRow({ metric: '总发放积分', value: report.totalPointsDistributed })
    summarySheet.addRow({ metric: '生成时间', value: report.generatedAt?.toLocaleString() || '' })

    summarySheet.getRow(1).font = { bold: true }
    summarySheet.getColumn('metric').font = { bold: true }

    const detailSheet = workbook.addWorksheet('项目明细')
    detailSheet.columns = [
      { header: '项目ID', key: 'projectId', width: 10 },
      { header: '项目名称', key: 'projectName', width: 30 },
      { header: '参与人数', key: 'participantCount', width: 12 },
      { header: '服务时长(小时)', key: 'serviceHours', width: 15 },
      { header: '积分发放', key: 'pointsDistributed', width: 12 }
    ]

    detailSheet.getRow(1).font = { bold: true }

    for (const project of report.projects) {
      detailSheet.addRow({
        projectId: project.projectId,
        projectName: project.project.title,
        participantCount: project.participantCount,
        serviceHours: project.serviceHours,
        pointsDistributed: project.pointsDistributed
      })
    }

    const exportsDir = path.join(process.cwd(), 'exports')
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true })
    }

    const fileName = `monthly-report-${report.reportMonth}.xlsx`
    const filePath = path.join(exportsDir, fileName)

    await workbook.xlsx.writeFile(filePath)

    await prisma.monthlyReport.update({
      where: { id: reportId },
      data: {
        status: ReportStatus.EXPORTED,
        exportedAt: new Date(),
        filePath
      }
    })

    return {
      success: true,
      data: {
        filePath,
        fileName
      }
    }
  } catch (error) {
    return {
      success: false,
      error: '导出报表失败'
    }
  }
}

export async function getReportList(page: number = 1, pageSize: number = 10) {
  try {
    const skip = (page - 1) * pageSize

    const [reports, total] = await Promise.all([
      prisma.monthlyReport.findMany({
        orderBy: { reportMonth: 'desc' },
        skip,
        take: pageSize
      }),
      prisma.monthlyReport.count()
    ])

    return {
      success: true,
      data: {
        items: reports,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    }
  } catch (error) {
    return {
      success: false,
      error: '获取报表列表失败'
    }
  }
}

export async function getReport(reportId: number) {
  try {
    const report = await prisma.monthlyReport.findUnique({
      where: { id: reportId },
      include: {
        projects: {
          include: {
            project: true
          }
        }
      }
    })

    if (!report) {
      return {
        success: false,
        error: '报表不存在'
      }
    }

    return {
      success: true,
      data: report
    }
  } catch (error) {
    return {
      success: false,
      error: '获取报表详情失败'
    }
  }
}

export function scheduleMonthlyReport() {
  cron.schedule('0 0 1 * *', async () => {
    const now = new Date()
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const year = lastMonth.getFullYear()
    const month = lastMonth.getMonth() + 1

    console.log(`[Scheduled Task] Generating monthly report for ${year}-${month}`)

    const result = await generateMonthlyReport(year, month)

    if (result.success && result.data) {
      console.log(`[Scheduled Task] Monthly report generated successfully: ${result.data.id}`)
    } else {
      console.log(`[Scheduled Task] Failed to generate monthly report: ${result.error}`)
    }
  }, {
    scheduled: true,
    timezone: 'Asia/Shanghai'
  })

  console.log('[Scheduled Task] Monthly report scheduler started')
}
