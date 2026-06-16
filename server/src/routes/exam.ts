import { Router, Response } from 'express'
import { AuthenticatedRequest, ExamAnswer } from '../types'
import { authenticate, requireAdmin, requireVolunteer } from '../middleware/auth'
import prisma from '../lib/prisma'
import {
  createExam,
  getExam,
  getExamWithAnswers,
  listExams,
  updateExam,
  deleteExam,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  startExam,
  submitExam,
  getExamRecord,
  getMyExamRecords
} from '../controllers/examController'

const router = Router()

router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const { title } = req.query
  const result = await listExams({
    title: title as string | undefined
  })
  res.status(result.success ? 200 : 400).json(result)
})

router.post('/', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { title, description, totalScore, passScore, durationMinutes } = req.body

  if (!title || !description) {
    return res.status(400).json({
      success: false,
      error: '缺少必填参数'
    })
  }

  const result = await createExam({
    title,
    description,
    totalScore,
    passScore,
    durationMinutes
  })
  res.status(result.success ? 201 : 400).json(result)
})

router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id)

  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      error: '无效的考试ID'
    })
  }

  let result
  if (req.user?.role === 'ADMIN') {
    result = await getExamWithAnswers(id)
  } else {
    result = await getExam(id)
  }
  res.status(result.success ? 200 : 400).json(result)
})

router.put('/:id', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id)
  const { title, description, totalScore, passScore, durationMinutes } = req.body

  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      error: '无效的考试ID'
    })
  }

  const result = await updateExam(id, {
    title,
    description,
    totalScore,
    passScore,
    durationMinutes
  })
  res.status(result.success ? 200 : 400).json(result)
})

router.delete('/:id', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id)

  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      error: '无效的考试ID'
    })
  }

  const result = await deleteExam(id)
  res.status(result.success ? 200 : 400).json(result)
})

router.post('/:id/questions', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id)
  const { questionText, questionType, options, correctAnswer, score, orderIndex } = req.body

  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      error: '无效的考试ID'
    })
  }

  if (!questionText || !questionType || !correctAnswer || score === undefined) {
    return res.status(400).json({
      success: false,
      error: '缺少必填参数'
    })
  }

  const result = await addQuestion(id, {
    questionText,
    questionType,
    options,
    correctAnswer,
    score,
    orderIndex
  })
  res.status(result.success ? 201 : 400).json(result)
})

router.put('/questions/:id', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id)
  const { questionText, questionType, options, correctAnswer, score, orderIndex } = req.body

  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      error: '无效的题目ID'
    })
  }

  const result = await updateQuestion(id, {
    questionText,
    questionType,
    options,
    correctAnswer,
    score,
    orderIndex
  })
  res.status(result.success ? 200 : 400).json(result)
})

router.delete('/questions/:id', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id)

  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      error: '无效的题目ID'
    })
  }

  const result = await deleteQuestion(id)
  res.status(result.success ? 200 : 400).json(result)
})

router.post('/:id/start', authenticate, requireVolunteer, async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id)

  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      error: '无效的考试ID'
    })
  }

  const profile = await prisma.volunteerProfile.findUnique({
    where: { userId: req.user!.id }
  })

  if (!profile) {
    return res.status(404).json({
      success: false,
      error: '志愿者资料不存在'
    })
  }

  const result = await startExam(id, profile.id)
  res.status(result.success ? 200 : 400).json(result)
})

router.post('/:id/submit', authenticate, requireVolunteer, async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id)
  const { answers, startedAt } = req.body as { answers: ExamAnswer[]; startedAt: string }

  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      error: '无效的考试ID'
    })
  }

  if (!answers || !Array.isArray(answers)) {
    return res.status(400).json({
      success: false,
      error: '缺少答案参数'
    })
  }

  if (!startedAt) {
    return res.status(400).json({
      success: false,
      error: '缺少开始时间参数'
    })
  }

  const profile = await prisma.volunteerProfile.findUnique({
    where: { userId: req.user!.id }
  })

  if (!profile) {
    return res.status(404).json({
      success: false,
      error: '志愿者资料不存在'
    })
  }

  const result = await submitExam(id, profile.id, answers, new Date(startedAt))
  res.status(result.success ? 200 : 400).json(result)
})

router.get('/records/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id)

  if (isNaN(id)) {
    return res.status(400).json({
      success: false,
      error: '无效的考试记录ID'
    })
  }

  const result = await getExamRecord(id)
  res.status(result.success ? 200 : 400).json(result)
})

router.get('/me/records', authenticate, requireVolunteer, async (req: AuthenticatedRequest, res: Response) => {
  const profile = await prisma.volunteerProfile.findUnique({
    where: { userId: req.user!.id }
  })

  if (!profile) {
    return res.status(404).json({
      success: false,
      error: '志愿者资料不存在'
    })
  }

  const result = await getMyExamRecords(profile.id)
  res.status(result.success ? 200 : 400).json(result)
})

export default router
