import prisma from '../lib/prisma'
import { ProjectStatus, ProjectLevel, TrainingStatus } from '@prisma/client'

interface MatchResult {
  id: number
  matchScore: number
  skillMatch: number
  timeMatch: number
  trainingMatch: boolean
  creditMatch: boolean
  canApply: boolean
  details: {
    skillMatches: Array<{
      skillId: number
      skillName: string
      requiredProficiency: number
      volunteerProficiency: number
      matched: boolean
    }>
    timeOverlap: number
    missingTrainings: string[]
    creditScore: number
    historicalRating: number
    activityScore: number
    reasons: string[]
  }
}

function calculateSkillMatch(
  volunteerSkills: Array<{ skillId: number; proficiency: number; skill: { name: string } }>,
  requiredSkills: Array<{ skillId: number; minProficiency: number; skill: { name: string } }>
): { score: number; details: MatchResult['details']['skillMatches'] } {
  if (requiredSkills.length === 0) {
    return { score: 100, details: [] }
  }

  const skillMap = new Map(volunteerSkills.map(vs => [vs.skillId, vs]))
  const details: MatchResult['details']['skillMatches'] = []
  let totalScore = 0

  for (const reqSkill of requiredSkills) {
    const volunteerSkill = skillMap.get(reqSkill.skillId)
    const matched = volunteerSkill && volunteerSkill.proficiency >= reqSkill.minProficiency
    const proficiencyRatio = volunteerSkill ? Math.min(volunteerSkill.proficiency / reqSkill.minProficiency, 1) : 0

    details.push({
      skillId: reqSkill.skillId,
      skillName: reqSkill.skill.name,
      requiredProficiency: reqSkill.minProficiency,
      volunteerProficiency: volunteerSkill?.proficiency || 0,
      matched: !!matched
    })

    totalScore += proficiencyRatio * 100
  }

  return {
    score: totalScore / requiredSkills.length,
    details
  }
}

function calculateTimeMatch(
  availability: Array<{ dayOfWeek: number; startTime: string; endTime: string }>,
  projectStartDate: Date,
  projectEndDate: Date
): { score: number; overlapDays: number } {
  const totalDays = Math.ceil((projectEndDate.getTime() - projectStartDate.getTime()) / (1000 * 60 * 60 * 24))
  if (totalDays <= 0) return { score: 100, overlapDays: 0 }

  const availabilityMap = new Map<number, Array<{ start: string; end: string }>>()
  for (const avail of availability) {
    if (!availabilityMap.has(avail.dayOfWeek)) {
      availabilityMap.set(avail.dayOfWeek, [])
    }
    availabilityMap.get(avail.dayOfWeek)!.push({
      start: avail.startTime,
      end: avail.endTime
    })
  }

  let overlapDays = 0
  const currentDate = new Date(projectStartDate)

  while (currentDate <= projectEndDate) {
    const dayOfWeek = currentDate.getDay()
    if (availabilityMap.has(dayOfWeek)) {
      overlapDays++
    }
    currentDate.setDate(currentDate.getDate() + 1)
  }

  const score = (overlapDays / totalDays) * 100
  return { score: Math.min(score, 100), overlapDays }
}

async function checkTrainingMatch(
  volunteerProfileId: number,
  requiredTrainingIds: number[],
  projectLevel: ProjectLevel
): Promise<{ matched: boolean; missingTrainings: string[] }> {
  const requiredTrainings = await prisma.training.findMany({
    where: {
      OR: [
        { id: { in: requiredTrainingIds } },
        { level: projectLevel }
      ]
    }
  })

  if (requiredTrainings.length === 0) {
    return { matched: true, missingTrainings: [] }
  }

  const completedTrainings = await prisma.trainingRecord.findMany({
    where: {
      volunteerProfileId,
      trainingId: { in: requiredTrainings.map(t => t.id) },
      status: TrainingStatus.COMPLETED
    },
    select: { trainingId: true }
  })

  const completedIds = new Set(completedTrainings.map(t => t.trainingId))
  const missingTrainings = requiredTrainings
    .filter(t => !completedIds.has(t.id))
    .map(t => t.title)

  return {
    matched: missingTrainings.length === 0,
    missingTrainings
  }
}

async function getHistoricalRating(volunteerProfileId: number): Promise<number> {
  const reviews = await prisma.review.findMany({
    where: { volunteerProfileId },
    select: { rating: true }
  })

  if (reviews.length === 0) return 80

  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
  return (avgRating / 5) * 100
}

async function getActivityScore(volunteerProfileId: number): Promise<number> {
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

  const [applications, attendances, pointsRecords] = await Promise.all([
    prisma.projectApplication.count({
      where: {
        volunteerProfileId,
        appliedAt: { gte: threeMonthsAgo }
      }
    }),
    prisma.attendance.count({
      where: {
        volunteerProfileId,
        createdAt: { gte: threeMonthsAgo }
      }
    }),
    prisma.pointsRecord.count({
      where: {
        volunteerProfileId,
        createdAt: { gte: threeMonthsAgo }
      }
    })
  ])

  const activityScore = Math.min(
    (applications * 10 + attendances * 15 + pointsRecords * 5),
    100
  )

  return activityScore
}

export async function matchProjectsForVolunteer(volunteerProfileId: number, limit: number = 10) {
  try {
    const volunteer = await prisma.volunteerProfile.findUnique({
      where: { id: volunteerProfileId },
      include: {
        user: {
          select: {
            creditScore: true
          }
        },
        skills: {
          include: {
            skill: {
              select: { name: true }
            }
          }
        },
        availability: true
      }
    })

    if (!volunteer) {
      return {
        success: false,
        error: '志愿者资料不存在'
      }
    }

    const creditThreshold = await prisma.creditThreshold.findFirst({
      where: { isActive: true },
      orderBy: { minCreditScore: 'asc' }
    })

    const minCreditScore = creditThreshold?.minCreditScore || 60

    if (volunteer.user.creditScore < minCreditScore) {
      return {
        success: true,
        data: []
      }
    }

    const appliedProjectIds = await prisma.projectApplication.findMany({
      where: { volunteerProfileId },
      select: { projectId: true }
    }).then(apps => apps.map(a => a.projectId))

    const projects = await prisma.project.findMany({
      where: {
        status: ProjectStatus.PUBLISHED,
        id: { notIn: appliedProjectIds }
      },
      include: {
        requiredSkills: {
          include: {
            skill: {
              select: { name: true }
            }
          }
        },
        projectManager: {
          include: {
            user: {
              select: {
                realName: true
              }
            }
          }
        }
      }
    })

    const historicalRating = await getHistoricalRating(volunteerProfileId)
    const activityScore = await getActivityScore(volunteerProfileId)

    const matchResults: Array<MatchResult & { project: typeof projects[0] }> = []

    for (const project of projects) {
      const skillMatch = calculateSkillMatch(volunteer.skills, project.requiredSkills)
      const timeMatch = calculateTimeMatch(volunteer.availability, project.startDate, project.endDate)
      const trainingMatch = await checkTrainingMatch(volunteerProfileId, project.requiredTrainingIds, project.level)
      const creditMatch = volunteer.user.creditScore >= minCreditScore

      const reasons: string[] = []

      if (skillMatch.score >= 80) {
        const matchedSkillNames = skillMatch.details.filter(s => s.matched).map(s => s.skillName)
        if (matchedSkillNames.length > 0) {
          reasons.push(`技能高度匹配：${matchedSkillNames.slice(0, 3).join('、')}`)
        }
      } else if (skillMatch.score >= 50) {
        reasons.push('部分技能匹配')
      } else if (project.requiredSkills.length === 0) {
        reasons.push('无特殊技能要求，适合参与')
      }

      if (timeMatch.score >= 70) {
        reasons.push(`时间匹配度高，可覆盖 ${timeMatch.overlapDays} 天`)
      } else if (timeMatch.score >= 40) {
        reasons.push('部分时间匹配')
      }

      if (trainingMatch.matched) {
        reasons.push('已满足培训要求')
      } else {
        reasons.push(`需先完成培训：${trainingMatch.missingTrainings[0]}等`)
      }

      if (creditMatch) {
        reasons.push('信用分达标')
      }

      if (historicalRating >= 80) {
        reasons.push('历史评价优秀')
      }

      const advancedCreditThreshold = await prisma.creditThreshold.findFirst({
        where: {
          isActive: true,
          restriction: { contains: '高级项目' }
        }
      })
      const advancedMinCredit = advancedCreditThreshold?.minCreditScore || 80

      const canApply = creditMatch &&
        (project.level === ProjectLevel.BASIC ||
         project.level === ProjectLevel.INTERMEDIATE ||
         (project.level === ProjectLevel.ADVANCED &&
          trainingMatch.matched &&
          volunteer.user.creditScore >= advancedMinCredit))

      const trainingScore = trainingMatch.matched ? 100 : 30

      const matchScore = skillMatch.score * 0.35 +
        timeMatch.score * 0.25 +
        historicalRating * 0.15 +
        activityScore * 0.1 +
        trainingScore * 0.15 +
        (creditMatch ? 100 : 0) * 0.15

      matchResults.push({
        id: project.id,
        matchScore: Math.round(Math.min(matchScore, 100) * 10) / 10,
        skillMatch: Math.round(skillMatch.score * 10) / 10,
        timeMatch: Math.round(timeMatch.score * 10) / 10,
        trainingMatch: trainingMatch.matched,
        creditMatch,
        canApply,
        details: {
          skillMatches: skillMatch.details,
          timeOverlap: timeMatch.overlapDays,
          missingTrainings: trainingMatch.missingTrainings,
          creditScore: volunteer.user.creditScore,
          historicalRating: Math.round(historicalRating * 10) / 10,
          activityScore: Math.round(activityScore * 10) / 10,
          reasons
        },
        project
      })
    }

    matchResults.sort((a, b) => b.matchScore - a.matchScore)

    return {
      success: true,
      data: matchResults.slice(0, limit)
    }
  } catch (error) {
    return {
      success: false,
      error: '匹配项目失败'
    }
  }
}

export async function matchVolunteersForProject(projectId: number, limit: number = 10) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        requiredSkills: {
          include: {
            skill: {
              select: { name: true }
            }
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

    const creditThreshold = await prisma.creditThreshold.findFirst({
      where: { isActive: true },
      orderBy: { minCreditScore: 'asc' }
    })

    const minCreditScore = creditThreshold?.minCreditScore || 60

    const appliedVolunteerIds = await prisma.projectApplication.findMany({
      where: { projectId },
      select: { volunteerProfileId: true }
    }).then(apps => apps.map(a => a.volunteerProfileId))

    const volunteers = await prisma.volunteerProfile.findMany({
      where: {
        id: { notIn: appliedVolunteerIds },
        user: {
          creditScore: { gte: minCreditScore }
        }
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            realName: true,
            avatar: true,
            creditScore: true,
            totalServiceHours: true
          }
        },
        skills: {
          include: {
            skill: {
              select: { name: true }
            }
          }
        },
        availability: true
      }
    })

    const matchResults: Array<MatchResult & { volunteer: typeof volunteers[0] }> = []

    for (const volunteer of volunteers) {
      const skillMatch = calculateSkillMatch(volunteer.skills, project.requiredSkills)
      const timeMatch = calculateTimeMatch(volunteer.availability, project.startDate, project.endDate)
      const trainingMatch = await checkTrainingMatch(volunteer.id, project.requiredTrainingIds, project.level)
      const creditMatch = volunteer.user.creditScore >= minCreditScore

      if (!creditMatch) continue

      const historicalRating = await getHistoricalRating(volunteer.id)
      const activityScore = await getActivityScore(volunteer.id)

      const matchScore = skillMatch.score * 0.4 + timeMatch.score * 0.3 + historicalRating * 0.2 + activityScore * 0.1

      matchResults.push({
        id: volunteer.id,
        matchScore: Math.round(matchScore * 100) / 100,
        skillMatch: Math.round(skillMatch.score * 100) / 100,
        timeMatch: Math.round(timeMatch.score * 100) / 100,
        trainingMatch: trainingMatch.matched,
        creditMatch,
        details: {
          skillMatches: skillMatch.details,
          timeOverlap: timeMatch.overlapDays,
          missingTrainings: trainingMatch.missingTrainings,
          creditScore: volunteer.user.creditScore,
          historicalRating: Math.round(historicalRating * 100) / 100,
          activityScore: Math.round(activityScore * 100) / 100,
          reasons: []
        },
        volunteer
      })
    }

    matchResults.sort((a, b) => b.matchScore - a.matchScore)

    return {
      success: true,
      data: matchResults.slice(0, limit)
    }
  } catch (error) {
    return {
      success: false,
      error: '匹配志愿者失败'
    }
  }
}
