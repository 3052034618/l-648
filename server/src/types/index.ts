import { Request } from 'express'
import { User, Role } from '@prisma/client'

export interface AuthenticatedRequest extends Request {
  user?: User
}

export interface JwtPayload {
  userId: number
  role: Role
  iat?: number
  exp?: number
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface RegisterData {
  username: string
  email: string
  password: string
  realName: string
  phone: string
  role: Role
  idCard?: string
  organization?: string
  position?: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginationParams {
  page: number
  pageSize: number
}

export interface PaginationResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface SkillData {
  name: string
  category: string
  description?: string
}

export interface AvailabilityData {
  dayOfWeek: number
  startTime: string
  endTime: string
}

export interface VolunteerSkillData {
  skillId: number
  proficiency: number
  certificateUrl?: string
}

export interface ProjectCreateData {
  title: string
  description: string
  category: string
  level: string
  location: string
  latitude?: number
  longitude?: number
  startDate: Date
  endDate: Date
  maxParticipants: number
  minParticipants: number
  requiredTrainingIds: number[]
  pointsPerHour: number
  requiredSkills: {
    skillId: number
    minProficiency: number
    requiredCount: number
  }[]
}

export interface ScheduleGenerateParams {
  projectId: number
  startDate: Date
  endDate: Date
}

export interface AttendanceCheckInData {
  scheduleId: number
  latitude: number
  longitude: number
}

export interface ExamAnswer {
  questionId: number
  answer: string
}

export interface ExamSubmitData {
  examId: number
  answers: ExamAnswer[]
}

export interface ReviewData {
  projectId: number
  volunteerProfileId: number
  rating: number
  comment: string
  tags: string[]
}

export interface PointsRuleData {
  name: string
  description: string
  points: number
  condition: any
  isActive: boolean
}

export interface ExchangeRuleData {
  name: string
  description: string
  pointsRequired: number
  reward: string
  rewardImage?: string
  stock: number
  isActive: boolean
}

export interface CreditThresholdData {
  name: string
  description: string
  minCreditScore: number
  restriction: string
  isActive: boolean
}
