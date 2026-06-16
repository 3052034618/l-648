import prisma from '../lib/prisma'
import { ExamStatus, TrainingStatus, NotificationType } from '@prisma/client'
import { createNotification } from '../services/notificationService'
import { ExamAnswer } from '../types'

export async function createExam(data: {
  title: string
  description: string
  totalScore?: number
  passScore?: number
  durationMinutes?: number
}) {
  try {
    const exam = await prisma.exam.create({
      data: {
        title: data.title,
        description: data.description,
        totalScore: data.totalScore ?? 100,
        passScore: data.passScore ?? 60,
        durationMinutes: data.durationMinutes ?? 60
      }
    })

    return {
      success: true,
      data: exam
    }
  } catch (error) {
    return {
      success: false,
      error: '创建考试失败'
    }
  }
}

export async function getExam(examId: number) {
  try {
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        questions: {
          select: {
            id: true,
            questionText: true,
            questionType: true,
            options: true,
            score: true,
            orderIndex: true
          },
          orderBy: {
            orderIndex: 'asc'
          }
        }
      }
    })

    if (!exam) {
      return {
        success: false,
        error: '考试不存在'
      }
    }

    return {
      success: true,
      data: exam
    }
  } catch (error) {
    return {
      success: false,
      error: '获取考试详情失败'
    }
  }
}

export async function getExamWithAnswers(examId: number) {
  try {
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        questions: {
          orderBy: {
            orderIndex: 'asc'
          }
        }
      }
    })

    if (!exam) {
      return {
        success: false,
        error: '考试不存在'
      }
    }

    return {
      success: true,
      data: exam
    }
  } catch (error) {
    return {
      success: false,
      error: '获取考试详情失败'
    }
  }
}

export async function listExams(filters?: {
  title?: string
}) {
  try {
    const where: any = {}

    if (filters?.title) {
      where.title = {
        contains: filters.title
      }
    }

    const exams = await prisma.exam.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        _count: {
          select: {
            questions: true,
            examRecords: true
          }
        }
      }
    })

    return {
      success: true,
      data: exams
    }
  } catch (error) {
    return {
      success: false,
      error: '获取考试列表失败'
    }
  }
}

export async function updateExam(examId: number, data: Partial<{
  title: string
  description: string
  totalScore: number
  passScore: number
  durationMinutes: number
}>) {
  try {
    const exam = await prisma.exam.findUnique({
      where: { id: examId }
    })

    if (!exam) {
      return {
        success: false,
        error: '考试不存在'
      }
    }

    const updatedExam = await prisma.exam.update({
      where: { id: examId },
      data
    })

    return {
      success: true,
      data: updatedExam
    }
  } catch (error) {
    return {
      success: false,
      error: '更新考试失败'
    }
  }
}

export async function deleteExam(examId: number) {
  try {
    const exam = await prisma.exam.findUnique({
      where: { id: examId }
    })

    if (!exam) {
      return {
        success: false,
        error: '考试不存在'
      }
    }

    await prisma.examQuestion.deleteMany({
      where: { examId }
    })

    await prisma.examRecord.deleteMany({
      where: { examId }
    })

    await prisma.exam.delete({
      where: { id: examId }
    })

    return {
      success: true,
      data: { message: '考试已删除' }
    }
  } catch (error) {
    return {
      success: false,
      error: '删除考试失败'
    }
  }
}

export async function addQuestion(examId: number, data: {
  questionText: string
  questionType: string
  options: any
  correctAnswer: string
  score: number
  orderIndex?: number
}) {
  try {
    const exam = await prisma.exam.findUnique({
      where: { id: examId }
    })

    if (!exam) {
      return {
        success: false,
        error: '考试不存在'
      }
    }

    const maxOrderIndex = await prisma.examQuestion.findFirst({
      where: { examId },
      orderBy: { orderIndex: 'desc' },
      select: { orderIndex: true }
    })

    const question = await prisma.examQuestion.create({
      data: {
        examId,
        questionText: data.questionText,
        questionType: data.questionType,
        options: data.options,
        correctAnswer: data.correctAnswer,
        score: data.score,
        orderIndex: data.orderIndex ?? (maxOrderIndex?.orderIndex ?? 0) + 1
      }
    })

    return {
      success: true,
      data: question
    }
  } catch (error) {
    return {
      success: false,
      error: '添加题目失败'
    }
  }
}

export async function updateQuestion(questionId: number, data: Partial<{
  questionText: string
  questionType: string
  options: any
  correctAnswer: string
  score: number
  orderIndex: number
}>) {
  try {
    const question = await prisma.examQuestion.findUnique({
      where: { id: questionId }
    })

    if (!question) {
      return {
        success: false,
        error: '题目不存在'
      }
    }

    const updatedQuestion = await prisma.examQuestion.update({
      where: { id: questionId },
      data
    })

    return {
      success: true,
      data: updatedQuestion
    }
  } catch (error) {
    return {
      success: false,
      error: '更新题目失败'
    }
  }
}

export async function deleteQuestion(questionId: number) {
  try {
    const question = await prisma.examQuestion.findUnique({
      where: { id: questionId }
    })

    if (!question) {
      return {
        success: false,
        error: '题目不存在'
      }
    }

    await prisma.examQuestion.delete({
      where: { id: questionId }
    })

    return {
      success: true,
      data: { message: '题目已删除' }
    }
  } catch (error) {
    return {
      success: false,
      error: '删除题目失败'
    }
  }
}

export async function startExam(examId: number, volunteerProfileId: number) {
  try {
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        questions: true
      }
    })

    if (!exam) {
      return {
        success: false,
        error: '考试不存在'
      }
    }

    if (exam.questions.length === 0) {
      return {
        success: false,
        error: '该考试暂无题目'
      }
    }

    const volunteerProfile = await prisma.volunteerProfile.findUnique({
      where: { id: volunteerProfileId }
    })

    if (!volunteerProfile) {
      return {
        success: false,
        error: '志愿者不存在'
      }
    }

    return {
      success: true,
      data: {
        examId: exam.id,
        title: exam.title,
        description: exam.description,
        durationMinutes: exam.durationMinutes,
        startedAt: new Date(),
        questions: exam.questions.map(q => ({
          id: q.id,
          questionText: q.questionText,
          questionType: q.questionType,
          options: q.options,
          score: q.score
        }))
      }
    }
  } catch (error) {
    return {
      success: false,
      error: '开始考试失败'
    }
  }
}

export async function submitExam(examId: number, volunteerProfileId: number, answers: ExamAnswer[], startedAt: Date) {
  try {
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        questions: true,
        trainings: true
      }
    })

    if (!exam) {
      return {
        success: false,
        error: '考试不存在'
      }
    }

    const volunteerProfile = await prisma.volunteerProfile.findUnique({
      where: { id: volunteerProfileId },
      include: {
        user: true
      }
    })

    if (!volunteerProfile) {
      return {
        success: false,
        error: '志愿者不存在'
      }
    }

    let totalScore = 0

    for (const question of exam.questions) {
      const userAnswer = answers.find(a => a.questionId === question.id)
      if (!userAnswer) continue

      const correctAnswers = question.correctAnswer.split(',').sort()
      const userAnswers = userAnswer.answer.split(',').sort()

      if (question.questionType === 'SINGLE' || question.questionType === 'JUDGE') {
        if (question.correctAnswer === userAnswer.answer) {
          totalScore += question.score
        }
      } else if (question.questionType === 'MULTIPLE') {
        const correctCount = correctAnswers.length
        let matchCount = 0

        for (const ua of userAnswers) {
          if (correctAnswers.includes(ua)) {
            matchCount++
          }
        }

        for (const ua of userAnswers) {
          if (!correctAnswers.includes(ua)) {
            matchCount = 0
            break
          }
        }

        if (matchCount > 0) {
          totalScore += Math.floor((matchCount / correctCount) * question.score)
        }
      }
    }

    const passed = totalScore >= exam.passScore
    const status = passed ? ExamStatus.PASSED : ExamStatus.FAILED

    const examRecord = await prisma.examRecord.create({
      data: {
        examId,
        volunteerProfileId,
        answers: answers as any,
        score: totalScore,
        status,
        startedAt,
        submittedAt: new Date()
      }
    })

    for (const training of exam.trainings) {
      const trainingRecord = await prisma.trainingRecord.findUnique({
        where: {
          trainingId_volunteerProfileId: {
            trainingId: training.id,
            volunteerProfileId
          }
        }
      })

      if (trainingRecord) {
        await prisma.trainingRecord.update({
          where: { id: trainingRecord.id },
          data: {
            status: passed ? TrainingStatus.COMPLETED : TrainingStatus.FAILED,
            progress: passed ? 100 : trainingRecord.progress,
            completedAt: passed ? new Date() : trainingRecord.completedAt
          }
        })
      }
    }

    await createNotification(
      volunteerProfile.userId,
      passed ? NotificationType.TRAINING_PASSED : NotificationType.TRAINING_FAILED,
      passed ? '考试通过' : '考试未通过',
      `您参加的《${exam.title}》考试已完成，得分：${totalScore}/${exam.totalScore}，${passed ? '恭喜通过！' : '未能通过，请重新学习后再试。'}`,
      examId,
      'exam'
    )

    return {
      success: true,
      data: {
        id: examRecord.id,
        score: totalScore,
        totalScore: exam.totalScore,
        passScore: exam.passScore,
        status,
        passed
      }
    }
  } catch (error) {
    return {
      success: false,
      error: '提交考试失败'
    }
  }
}

export async function getExamRecord(recordId: number) {
  try {
    const record = await prisma.examRecord.findUnique({
      where: { id: recordId },
      include: {
        exam: {
          include: {
            questions: true
          }
        }
      }
    })

    if (!record) {
      return {
        success: false,
        error: '考试记录不存在'
      }
    }

    return {
      success: true,
      data: record
    }
  } catch (error) {
    return {
      success: false,
      error: '获取考试记录失败'
    }
  }
}

export async function getMyExamRecords(volunteerProfileId: number) {
  try {
    const records = await prisma.examRecord.findMany({
      where: { volunteerProfileId },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        exam: {
          select: {
            id: true,
            title: true,
            description: true,
            totalScore: true,
            passScore: true
          }
        }
      }
    })

    return {
      success: true,
      data: records
    }
  } catch (error) {
    return {
      success: false,
      error: '获取我的考试记录失败'
    }
  }
}
