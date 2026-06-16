import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import type {
  ApiResponse,
  LoginCredentials,
  RegisterData,
  User,
  PaginationParams,
  PaginationResult,
  Project,
  ProjectCreateData,
  Schedule,
  ScheduleGenerateParams,
  Attendance,
  AttendanceCheckInData,
  Training,
  TrainingRecord,
  Exam,
  ExamRecord,
  ExamSubmitData,
  Review,
  ReviewData,
  Skill,
  SkillData,
  VolunteerSkill,
  VolunteerSkillData,
  Availability,
  AvailabilityData,
  PointsRecord,
  CreditRecord,
  PointsRule,
  PointsRuleData,
  ExchangeRule,
  ExchangeRuleData,
  ExchangeRecord,
  CreditThreshold,
  CreditThresholdData,
  Notification,
  NotificationStatus,
  MonthlyReport,
  SystemSettings,
  ProjectApplication,
  StatisticsData,
} from '../types'

const BASE_URL = '/api'

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

const handleResponse = <T>(response: AxiosResponse<ApiResponse<T>>): T => {
  if (response.data.success) {
    return response.data.data as T
  }
  throw new Error(response.data.message || response.data.error || '请求失败')
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<{ token: string; user: User }> => {
    const response = await api.post<ApiResponse<{ token: string; user: User }>>('/auth/login', credentials)
    return handleResponse(response)
  },

  register: async (data: RegisterData): Promise<{ token: string; user: User }> => {
    const response = await api.post<ApiResponse<{ token: string; user: User }>>('/auth/register', data)
    return handleResponse(response)
  },

  logout: async (): Promise<void> => {
    await api.post<ApiResponse<void>>('/auth/logout')
  },

  refreshToken: async (): Promise<{ token: string }> => {
    const response = await api.post<ApiResponse<{ token: string }>>('/auth/refresh')
    return handleResponse(response)
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get<ApiResponse<User>>('/auth/profile')
    return handleResponse(response)
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await api.put<ApiResponse<User>>('/auth/profile', data)
    return handleResponse(response)
  },
}

export const userApi = {
  getUsers: async (params?: PaginationParams): Promise<PaginationResult<User>> => {
    const response = await api.get<ApiResponse<PaginationResult<User>>>('/users', { params })
    return handleResponse(response)
  },

  getUserById: async (id: number): Promise<User> => {
    const response = await api.get<ApiResponse<User>>(`/users/${id}`)
    return handleResponse(response)
  },

  updateUser: async (id: number, data: Partial<User>): Promise<User> => {
    const response = await api.put<ApiResponse<User>>(`/users/${id}`, data)
    return handleResponse(response)
  },

  deleteUser: async (id: number): Promise<void> => {
    const response = await api.delete<ApiResponse<void>>(`/users/${id}`)
    handleResponse(response)
  },
}

export const projectApi = {
  getProjects: async (params?: PaginationParams & { status?: string; category?: string }): Promise<PaginationResult<Project>> => {
    const response = await api.get<ApiResponse<PaginationResult<Project>>>('/projects', { params })
    return handleResponse(response)
  },

  getProjectById: async (id: number): Promise<Project> => {
    const response = await api.get<ApiResponse<Project>>(`/projects/${id}`)
    return handleResponse(response)
  },

  createProject: async (data: ProjectCreateData): Promise<Project> => {
    const response = await api.post<ApiResponse<Project>>('/projects', data)
    return handleResponse(response)
  },

  updateProject: async (id: number, data: Partial<ProjectCreateData>): Promise<Project> => {
    const response = await api.put<ApiResponse<Project>>(`/projects/${id}`, data)
    return handleResponse(response)
  },

  deleteProject: async (id: number): Promise<void> => {
    const response = await api.delete<ApiResponse<void>>(`/projects/${id}`)
    handleResponse(response)
  },

  getMyProjects: async (params?: PaginationParams): Promise<PaginationResult<Project>> => {
    const response = await api.get<ApiResponse<PaginationResult<Project>>>('/projects/my', { params })
    return handleResponse(response)
  },

  applyForProject: async (projectId: number): Promise<ProjectApplication> => {
    const response = await api.post<ApiResponse<ProjectApplication>>(`/projects/${projectId}/apply`)
    return handleResponse(response)
  },

  getApplications: async (projectId: number): Promise<ProjectApplication[]> => {
    const response = await api.get<ApiResponse<ProjectApplication[]>>(`/projects/${projectId}/applications`)
    return handleResponse(response)
  },

  reviewApplication: async (projectId: number, applicationId: number, status: string): Promise<ProjectApplication> => {
    const response = await api.put<ApiResponse<ProjectApplication>>(`/projects/${projectId}/applications/${applicationId}`, { status })
    return handleResponse(response)
  },

  getRecommendedProjects: async (limit: number = 10): Promise<any[]> => {
    const response = await api.get<ApiResponse<any[]>>('/projects/me/recommendations', { params: { limit } })
    return handleResponse(response)
  },

  getMatchVolunteers: async (projectId: number, limit: number = 20): Promise<any[]> => {
    const response = await api.get<ApiResponse<any[]>>(`/projects/${projectId}/match-volunteers`, { params: { limit } })
    return handleResponse(response)
  },
}

export const scheduleApi = {
  getSchedules: async (params?: PaginationParams & { projectId?: number; status?: string }): Promise<PaginationResult<Schedule>> => {
    const response = await api.get<ApiResponse<PaginationResult<Schedule>>>('/schedules', { params })
    return handleResponse(response)
  },

  getScheduleById: async (id: number): Promise<Schedule> => {
    const response = await api.get<ApiResponse<Schedule>>(`/schedules/${id}`)
    return handleResponse(response)
  },

  generateSchedules: async (params: ScheduleGenerateParams): Promise<Schedule[]> => {
    const response = await api.post<ApiResponse<Schedule[]>>('/schedules/generate', params)
    return handleResponse(response)
  },

  updateSchedule: async (id: number, data: Partial<Schedule>): Promise<Schedule> => {
    const response = await api.put<ApiResponse<Schedule>>(`/schedules/${id}`, data)
    return handleResponse(response)
  },

  deleteSchedule: async (id: number): Promise<void> => {
    const response = await api.delete<ApiResponse<void>>(`/schedules/${id}`)
    handleResponse(response)
  },

  getMySchedules: async (params?: PaginationParams): Promise<PaginationResult<Schedule>> => {
    const response = await api.get<ApiResponse<PaginationResult<Schedule>>>('/schedules/my', { params })
    return handleResponse(response)
  },
}

export const attendanceApi = {
  getAttendances: async (params?: PaginationParams & { scheduleId?: number; status?: string }): Promise<PaginationResult<Attendance>> => {
    const response = await api.get<ApiResponse<PaginationResult<Attendance>>>('/attendances', { params })
    return handleResponse(response)
  },

  getAttendanceById: async (id: number): Promise<Attendance> => {
    const response = await api.get<ApiResponse<Attendance>>(`/attendances/${id}`)
    return handleResponse(response)
  },

  checkIn: async (data: AttendanceCheckInData): Promise<Attendance> => {
    const response = await api.post<ApiResponse<Attendance>>('/attendances/check-in', data)
    return handleResponse(response)
  },

  checkOut: async (id: number, data: { latitude: number; longitude: number }): Promise<Attendance> => {
    const response = await api.post<ApiResponse<Attendance>>(`/attendances/${id}/check-out`, data)
    return handleResponse(response)
  },

  updateAttendance: async (id: number, data: Partial<Attendance>): Promise<Attendance> => {
    const response = await api.put<ApiResponse<Attendance>>(`/attendances/${id}`, data)
    return handleResponse(response)
  },

  getMyAttendances: async (params?: PaginationParams): Promise<PaginationResult<Attendance>> => {
    const response = await api.get<ApiResponse<PaginationResult<Attendance>>>('/attendances/my', { params })
    return handleResponse(response)
  },
}

export const trainingApi = {
  getTrainings: async (params?: PaginationParams & { category?: string; level?: string }): Promise<PaginationResult<Training>> => {
    const response = await api.get<ApiResponse<PaginationResult<Training>>>('/trainings', { params })
    return handleResponse(response)
  },

  getTrainingById: async (id: number): Promise<Training> => {
    const response = await api.get<ApiResponse<Training>>(`/trainings/${id}`)
    return handleResponse(response)
  },

  createTraining: async (data: Omit<Training, 'id' | 'createdAt' | 'updatedAt'>): Promise<Training> => {
    const response = await api.post<ApiResponse<Training>>('/trainings', data)
    return handleResponse(response)
  },

  updateTraining: async (id: number, data: Partial<Training>): Promise<Training> => {
    const response = await api.put<ApiResponse<Training>>(`/trainings/${id}`, data)
    return handleResponse(response)
  },

  deleteTraining: async (id: number): Promise<void> => {
    const response = await api.delete<ApiResponse<void>>(`/trainings/${id}`)
    handleResponse(response)
  },

  getMyTrainingRecords: async (): Promise<TrainingRecord[]> => {
    const response = await api.get<ApiResponse<TrainingRecord[]>>('/trainings/my')
    return handleResponse(response)
  },

  startTraining: async (trainingId: number): Promise<TrainingRecord> => {
    const response = await api.post<ApiResponse<TrainingRecord>>(`/trainings/${trainingId}/start`)
    return handleResponse(response)
  },

  updateProgress: async (trainingId: number, progress: number): Promise<TrainingRecord> => {
    const response = await api.put<ApiResponse<TrainingRecord>>(`/trainings/${trainingId}/progress`, { progress })
    return handleResponse(response)
  },
}

export const examApi = {
  getExams: async (params?: PaginationParams): Promise<PaginationResult<Exam>> => {
    const response = await api.get<ApiResponse<PaginationResult<Exam>>>('/exams', { params })
    return handleResponse(response)
  },

  getExamById: async (id: number): Promise<Exam> => {
    const response = await api.get<ApiResponse<Exam>>(`/exams/${id}`)
    return handleResponse(response)
  },

  createExam: async (data: Omit<Exam, 'id' | 'createdAt' | 'updatedAt'>): Promise<Exam> => {
    const response = await api.post<ApiResponse<Exam>>('/exams', data)
    return handleResponse(response)
  },

  updateExam: async (id: number, data: Partial<Exam>): Promise<Exam> => {
    const response = await api.put<ApiResponse<Exam>>(`/exams/${id}`, data)
    return handleResponse(response)
  },

  deleteExam: async (id: number): Promise<void> => {
    const response = await api.delete<ApiResponse<void>>(`/exams/${id}`)
    handleResponse(response)
  },

  startExam: async (examId: number): Promise<ExamRecord> => {
    const response = await api.post<ApiResponse<ExamRecord>>(`/exams/${examId}/start`)
    return handleResponse(response)
  },

  submitExam: async (examId: number, data: ExamSubmitData): Promise<ExamRecord> => {
    const response = await api.post<ApiResponse<ExamRecord>>(`/exams/${examId}/submit`, data)
    return handleResponse(response)
  },

  getMyExamRecords: async (): Promise<ExamRecord[]> => {
    const response = await api.get<ApiResponse<ExamRecord[]>>('/exams/my')
    return handleResponse(response)
  },
}

export const reviewApi = {
  getReviews: async (params?: PaginationParams & { projectId?: number; volunteerProfileId?: number }): Promise<PaginationResult<Review>> => {
    const response = await api.get<ApiResponse<PaginationResult<Review>>>('/reviews', { params })
    return handleResponse(response)
  },

  createReview: async (data: ReviewData): Promise<Review> => {
    const response = await api.post<ApiResponse<Review>>('/reviews', data)
    return handleResponse(response)
  },

  updateReview: async (id: number, data: Partial<ReviewData>): Promise<Review> => {
    const response = await api.put<ApiResponse<Review>>(`/reviews/${id}`, data)
    return handleResponse(response)
  },

  getMyReviews: async (): Promise<Review[]> => {
    const response = await api.get<ApiResponse<Review[]>>('/reviews/my')
    return handleResponse(response)
  },
}

export const skillApi = {
  getSkills: async (params?: PaginationParams & { category?: string }): Promise<PaginationResult<Skill>> => {
    const response = await api.get<ApiResponse<PaginationResult<Skill>>>('/skills', { params })
    return handleResponse(response)
  },

  getSkillById: async (id: number): Promise<Skill> => {
    const response = await api.get<ApiResponse<Skill>>(`/skills/${id}`)
    return handleResponse(response)
  },

  createSkill: async (data: SkillData): Promise<Skill> => {
    const response = await api.post<ApiResponse<Skill>>('/skills', data)
    return handleResponse(response)
  },

  updateSkill: async (id: number, data: Partial<SkillData>): Promise<Skill> => {
    const response = await api.put<ApiResponse<Skill>>(`/skills/${id}`, data)
    return handleResponse(response)
  },

  deleteSkill: async (id: number): Promise<void> => {
    const response = await api.delete<ApiResponse<void>>(`/skills/${id}`)
    handleResponse(response)
  },

  getMySkills: async (): Promise<VolunteerSkill[]> => {
    const response = await api.get<ApiResponse<VolunteerSkill[]>>('/skills/my')
    return handleResponse(response)
  },

  addMySkill: async (data: VolunteerSkillData): Promise<VolunteerSkill> => {
    const response = await api.post<ApiResponse<VolunteerSkill>>('/skills/my', data)
    return handleResponse(response)
  },

  updateMySkill: async (id: number, data: Partial<VolunteerSkillData>): Promise<VolunteerSkill> => {
    const response = await api.put<ApiResponse<VolunteerSkill>>(`/skills/my/${id}`, data)
    return handleResponse(response)
  },

  removeMySkill: async (id: number): Promise<void> => {
    const response = await api.delete<ApiResponse<void>>(`/skills/my/${id}`)
    handleResponse(response)
  },
}

export const availabilityApi = {
  getMyAvailability: async (): Promise<Availability[]> => {
    const response = await api.get<ApiResponse<Availability[]>>('/availability/my')
    return handleResponse(response)
  },

  addAvailability: async (data: AvailabilityData): Promise<Availability> => {
    const response = await api.post<ApiResponse<Availability>>('/availability', data)
    return handleResponse(response)
  },

  updateAvailability: async (id: number, data: Partial<AvailabilityData>): Promise<Availability> => {
    const response = await api.put<ApiResponse<Availability>>(`/availability/${id}`, data)
    return handleResponse(response)
  },

  deleteAvailability: async (id: number): Promise<void> => {
    const response = await api.delete<ApiResponse<void>>(`/availability/${id}`)
    handleResponse(response)
  },
}

export const pointsApi = {
  getMyPointsRecords: async (params?: PaginationParams): Promise<PaginationResult<PointsRecord>> => {
    const response = await api.get<ApiResponse<PaginationResult<PointsRecord>>>('/points/my', { params })
    return handleResponse(response)
  },

  getPointsRules: async (): Promise<PointsRule[]> => {
    const response = await api.get<ApiResponse<PointsRule[]>>('/points/rules')
    return handleResponse(response)
  },

  createPointsRule: async (data: PointsRuleData): Promise<PointsRule> => {
    const response = await api.post<ApiResponse<PointsRule>>('/points/rules', data)
    return handleResponse(response)
  },

  updatePointsRule: async (id: number, data: Partial<PointsRuleData>): Promise<PointsRule> => {
    const response = await api.put<ApiResponse<PointsRule>>(`/points/rules/${id}`, data)
    return handleResponse(response)
  },

  deletePointsRule: async (id: number): Promise<void> => {
    const response = await api.delete<ApiResponse<void>>(`/points/rules/${id}`)
    handleResponse(response)
  },
}

export const creditApi = {
  getMyCreditRecords: async (params?: PaginationParams): Promise<PaginationResult<CreditRecord>> => {
    const response = await api.get<ApiResponse<PaginationResult<CreditRecord>>>('/credit/my', { params })
    return handleResponse(response)
  },

  getCreditThresholds: async (): Promise<CreditThreshold[]> => {
    const response = await api.get<ApiResponse<CreditThreshold[]>>('/credit/thresholds')
    return handleResponse(response)
  },

  createCreditThreshold: async (data: CreditThresholdData): Promise<CreditThreshold> => {
    const response = await api.post<ApiResponse<CreditThreshold>>('/credit/thresholds', data)
    return handleResponse(response)
  },

  updateCreditThreshold: async (id: number, data: Partial<CreditThresholdData>): Promise<CreditThreshold> => {
    const response = await api.put<ApiResponse<CreditThreshold>>(`/credit/thresholds/${id}`, data)
    return handleResponse(response)
  },

  deleteCreditThreshold: async (id: number): Promise<void> => {
    const response = await api.delete<ApiResponse<void>>(`/credit/thresholds/${id}`)
    handleResponse(response)
  },
}

export const exchangeApi = {
  getExchangeRules: async (): Promise<ExchangeRule[]> => {
    const response = await api.get<ApiResponse<ExchangeRule[]>>('/exchange/rules')
    return handleResponse(response)
  },

  createExchangeRule: async (data: ExchangeRuleData): Promise<ExchangeRule> => {
    const response = await api.post<ApiResponse<ExchangeRule>>('/exchange/rules', data)
    return handleResponse(response)
  },

  updateExchangeRule: async (id: number, data: Partial<ExchangeRuleData>): Promise<ExchangeRule> => {
    const response = await api.put<ApiResponse<ExchangeRule>>(`/exchange/rules/${id}`, data)
    return handleResponse(response)
  },

  deleteExchangeRule: async (id: number): Promise<void> => {
    const response = await api.delete<ApiResponse<void>>(`/exchange/rules/${id}`)
    handleResponse(response)
  },

  getMyExchangeRecords: async (): Promise<ExchangeRecord[]> => {
    const response = await api.get<ApiResponse<ExchangeRecord[]>>('/exchange/my')
    return handleResponse(response)
  },

  exchange: async (ruleId: number): Promise<ExchangeRecord> => {
    const response = await api.post<ApiResponse<ExchangeRecord>>(`/exchange/${ruleId}`)
    return handleResponse(response)
  },
}

export const notificationApi = {
  getNotifications: async (params?: PaginationParams & { status?: NotificationStatus }): Promise<PaginationResult<Notification>> => {
    const response = await api.get<ApiResponse<PaginationResult<Notification>>>('/notifications', { params })
    return handleResponse(response)
  },

  getUnreadCount: async (): Promise<{ count: number }> => {
    const response = await api.get<ApiResponse<{ count: number }>>('/notifications/unread-count')
    return handleResponse(response)
  },

  markAsRead: async (id: number): Promise<Notification> => {
    const response = await api.put<ApiResponse<Notification>>(`/notifications/${id}/read`)
    return handleResponse(response)
  },

  markAllAsRead: async (): Promise<void> => {
    const response = await api.put<ApiResponse<void>>('/notifications/read-all')
    handleResponse(response)
  },
}

export const adminApi = {
  getDashboardStats: async (): Promise<Record<string, any>> => {
    const response = await api.get<ApiResponse<Record<string, any>>>('/admin/dashboard')
    return handleResponse(response)
  },

  getMonthlyReports: async (params?: PaginationParams): Promise<PaginationResult<MonthlyReport>> => {
    const response = await api.get<ApiResponse<PaginationResult<MonthlyReport>>>('/admin/reports', { params })
    return handleResponse(response)
  },

  generateMonthlyReport: async (reportMonth: string): Promise<MonthlyReport> => {
    const response = await api.post<ApiResponse<MonthlyReport>>('/admin/reports', { reportMonth })
    return handleResponse(response)
  },

  exportReport: async (id: number): Promise<{ filePath: string }> => {
    const response = await api.post<ApiResponse<{ filePath: string }>>(`/admin/reports/${id}/export`)
    return handleResponse(response)
  },

  getSystemSettings: async (): Promise<SystemSettings[]> => {
    const response = await api.get<ApiResponse<SystemSettings[]>>('/admin/settings')
    return handleResponse(response)
  },

  updateSystemSetting: async (key: string, value: Record<string, any>): Promise<SystemSettings> => {
    const response = await api.put<ApiResponse<SystemSettings>>(`/admin/settings/${key}`, { value })
    return handleResponse(response)
  },
}

export const reportApi = {
  getVolunteerStats: async (volunteerProfileId: number): Promise<Record<string, any>> => {
    const response = await api.get<ApiResponse<Record<string, any>>>(`/reports/volunteer/${volunteerProfileId}`)
    return handleResponse(response)
  },

  getProjectStats: async (projectId: number): Promise<Record<string, any>> => {
    const response = await api.get<ApiResponse<Record<string, any>>>(`/reports/project/${projectId}`)
    return handleResponse(response)
  },
}

export const statisticsApi = {
  getStatistics: async (): Promise<StatisticsData> => {
    const response = await api.get<ApiResponse<StatisticsData>>('/statistics/overview')
    return handleResponse(response)
  },

  getVolunteerTrend: async (): Promise<{ date: string; count: number }[]> => {
    const response = await api.get<ApiResponse<{ date: string; count: number }[]>>('/statistics/volunteer-trend')
    return handleResponse(response)
  },

  getProjectCategoryStats: async (): Promise<{ category: string; count: number }[]> => {
    const response = await api.get<ApiResponse<{ category: string; count: number }[]>>('/statistics/project-category')
    return handleResponse(response)
  },
}

export const register = async (data: RegisterData): Promise<{ token: string; user: User }> => {
  return authApi.register(data)
}

export const checkUsername = async (username: string): Promise<{ available: boolean }> => {
  const response = await api.get<ApiResponse<{ available: boolean }>>('/auth/check-username', {
    params: { username },
  })
  return handleResponse(response)
}

export const checkEmail = async (email: string): Promise<{ available: boolean }> => {
  const response = await api.get<ApiResponse<{ available: boolean }>>('/auth/check-email', {
    params: { email },
  })
  return handleResponse(response)
}

export const checkPhone = async (phone: string): Promise<{ available: boolean }> => {
  const response = await api.get<ApiResponse<{ available: boolean }>>('/auth/check-phone', {
    params: { phone },
  })
  return handleResponse(response)
}

export { statisticsApi as default }
