export type Role = 'VOLUNTEER' | 'PROJECT_MANAGER' | 'ADMIN'

export type ProjectStatus = 'DRAFT' | 'PUBLISHED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED'

export type ProjectLevel = 'BASIC' | 'INTERMEDIATE' | 'ADVANCED'

export type ScheduleStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED'

export type AttendanceStatus = 'PENDING' | 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE_EARLY'

export type NotificationType =
  | 'TASK_ASSIGNMENT'
  | 'ATTENDANCE_ABNORMAL'
  | 'TRAINING_PASSED'
  | 'TRAINING_FAILED'
  | 'POINTS_CHANGED'
  | 'CREDIT_CHANGED'
  | 'SCHEDULE_UPDATED'
  | 'PROJECT_CREATED'
  | 'EXAM_REMINDER'
  | 'SYSTEM_ANNOUNCEMENT'
  | 'SYSTEM'
  | 'PROJECT'
  | 'TRAINING'
  | 'POINTS'
  | 'WARNING'

export type NotificationStatus = 'UNREAD' | 'READ'

export type TrainingStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'

export type ExamStatus = 'NOT_TAKEN' | 'PASSED' | 'FAILED'

export type ReportStatus = 'PENDING' | 'GENERATED' | 'EXPORTED'

export interface User {
  id: number
  username: string
  email: string
  realName: string
  phone: string
  idCard?: string
  avatar?: string
  role: Role
  creditScore: number
  totalPoints: number
  totalServiceHours: number
  volunteerProfile?: VolunteerProfile
  managerProfile?: ProjectManagerProfile
  createdAt: string
  updatedAt: string
}

export interface VolunteerProfile {
  id: number
  userId: number
  skills: VolunteerSkill[]
  availability: Availability[]
  emergencyContact?: string
  emergencyPhone?: string
  starRating: number
  ratingCount: number
  createdAt: string
  updatedAt: string
}

export interface ProjectManagerProfile {
  id: number
  userId: number
  organization: string
  position: string
  createdAt: string
  updatedAt: string
}

export interface Skill {
  id: number
  name: string
  category: string
  description?: string
  createdAt: string
}

export interface VolunteerSkill {
  id: number
  volunteerProfileId: number
  skillId: number
  skill: Skill
  proficiency: number
  certificateUrl?: string
  createdAt: string
}

export interface Availability {
  id: number
  volunteerProfileId: number
  dayOfWeek: number
  startTime: string
  endTime: string
  createdAt: string
}

export interface Project {
  id: number
  title: string
  description: string
  coverImage?: string
  category: string
  level: ProjectLevel
  status: ProjectStatus
  location: string
  latitude?: number
  longitude?: number
  startDate: string
  endDate: string
  maxParticipants: number
  minParticipants: number
  requiredTrainingIds: number[]
  pointsPerHour: number
  projectManagerId: number
  projectManager: ProjectManagerProfile & { user: User }
  requiredSkills: ProjectRequiredSkill[]
  schedules: Schedule[]
  applications: ProjectApplication[]
  createdAt: string
  updatedAt: string
}

export interface ProjectRequiredSkill {
  id: number
  projectId: number
  skillId: number
  skill: Skill
  minProficiency: number
  requiredCount: number
  createdAt: string
}

export interface ProjectApplication {
  id: number
  projectId: number
  project: Project
  volunteerProfileId: number
  volunteerProfile: VolunteerProfile & { user: User }
  status: string
  appliedAt: string
  reviewedAt?: string
}

export interface Schedule {
  id: number
  projectId: number
  project: Project
  volunteerProfileId: number
  volunteerProfile: VolunteerProfile & { user: User }
  scheduledDate: string
  startTime: string
  endTime: string
  status: ScheduleStatus
  attendance?: Attendance
  createdAt: string
  updatedAt: string
}

export interface Attendance {
  id: number
  scheduleId: number
  schedule: Schedule
  volunteerProfileId: number
  volunteerProfile: VolunteerProfile & { user: User }
  checkInTime?: string
  checkOutTime?: string
  checkInLatitude?: number
  checkInLongitude?: number
  checkOutLatitude?: number
  checkOutLongitude?: number
  serviceHours: number
  status: AttendanceStatus
  pointsEarned: number
  createdAt: string
  updatedAt: string
}

export interface PointsRecord {
  id: number
  volunteerProfileId: number
  amount: number
  type: string
  description: string
  relatedEntityId?: number
  relatedEntityType?: string
  createdAt: string
}

export interface CreditRecord {
  id: number
  userId: number
  amount: number
  reason: string
  relatedEntityId?: number
  relatedEntityType?: string
  createdAt: string
}

export interface Training {
  id: number
  title: string
  description: string
  content: string
  category: string
  level: ProjectLevel
  durationMinutes: number
  passScore: number
  examId?: number
  exam?: Exam
  createdAt: string
  updatedAt: string
}

export interface TrainingRecord {
  id: number
  trainingId: number
  training: Training
  volunteerProfileId: number
  status: TrainingStatus
  progress: number
  completedAt?: string
  createdAt: string
  updatedAt: string
}

export interface Exam {
  id: number
  title: string
  description: string
  totalScore: number
  passScore: number
  durationMinutes: number
  questions: ExamQuestion[]
  createdAt: string
  updatedAt: string
}

export interface ExamQuestion {
  id: number
  examId: number
  questionText: string
  questionType: string
  options: Record<string, any>
  correctAnswer: string
  score: number
  orderIndex: number
  createdAt: string
}

export interface ExamRecord {
  id: number
  examId: number
  exam: Exam
  volunteerProfileId: number
  answers: Record<string, any>
  score: number
  status: ExamStatus
  startedAt: string
  submittedAt: string
  createdAt: string
}

export interface Review {
  id: number
  projectId: number
  project: Project
  volunteerProfileId: number
  volunteerProfile: VolunteerProfile & { user: User }
  managerId: number
  manager: ProjectManagerProfile & { user: User }
  rating: number
  comment: string
  tags: string[]
  createdAt: string
}

export interface Notification {
  id: number
  userId: number
  type: NotificationType
  title: string
  content: string
  relatedEntityId?: number
  relatedEntityType?: string
  status: NotificationStatus
  createdAt: string
  readAt?: string
  isRead: boolean
}

export interface PointsRule {
  id: number
  name: string
  description: string
  points: number
  condition: Record<string, any>
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ExchangeRule {
  id: number
  name: string
  description: string
  pointsRequired: number
  reward: string
  rewardImage?: string
  stock: number
  isActive: boolean
  exchangeRecords: ExchangeRecord[]
  createdAt: string
  updatedAt: string
}

export interface ExchangeRecord {
  id: number
  volunteerProfileId: number
  exchangeRuleId: number
  exchangeRule: ExchangeRule
  pointsSpent: number
  status: string
  createdAt: string
}

export interface CreditThreshold {
  id: number
  name: string
  description: string
  minCreditScore: number
  restriction: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface MonthlyReport {
  id: number
  reportMonth: string
  totalVolunteers: number
  totalProjects: number
  totalServiceHours: number
  totalPointsDistributed: number
  projects: MonthlyReportProject[]
  status: ReportStatus
  exportedAt?: string
  filePath?: string
  createdAt: string
  generatedAt?: string
}

export interface MonthlyReportProject {
  id: number
  monthlyReportId: number
  projectId: number
  project: Project
  participantCount: number
  serviceHours: number
  pointsDistributed: number
  createdAt: string
}

export interface SystemSettings {
  id: number
  key: string
  value: Record<string, any>
  description?: string
  updatedAt: string
}

export interface LoginCredentials {
  username?: string
  email?: string
  phone?: string
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
  level: ProjectLevel
  location: string
  latitude?: number
  longitude?: number
  startDate: string
  endDate: string
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
  startDate: string
  endDate: string
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
  condition: Record<string, any>
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

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
}

export interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
}

export interface StatisticsData {
  totalVolunteers: number
  totalProjects: number
  totalServiceHours: number
  totalPointsDistributed: number
  ongoingProjects: number
  pendingApplications: number
  todayAttendance: number
  averageRating: number
  volunteerCount: number
  projectCount: number
  newVolunteersThisMonth: number
  activeProjects: number
  completedProjects: number
  attendanceRate: number
}

export interface MenuItem {
  key: string
  label: string
  icon: React.ReactNode
  path: string
  roles: Role[]
}
