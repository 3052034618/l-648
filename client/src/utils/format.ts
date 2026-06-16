import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import localeZh from 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale(localeZh)

export const formatDate = (
  date: string | Date | number,
  format: string = 'YYYY-MM-DD'
): string => {
  if (!date) return '-'
  return dayjs(date).format(format)
}

export const formatDateTime = (
  date: string | Date | number,
  format: string = 'YYYY-MM-DD HH:mm:ss'
): string => {
  if (!date) return '-'
  return dayjs(date).format(format)
}

export const formatTime = (
  date: string | Date | number,
  format: string = 'HH:mm:ss'
): string => {
  if (!date) return '-'
  return dayjs(date).format(format)
}

export const formatRelativeTime = (date: string | Date | number): string => {
  if (!date) return '-'
  return dayjs(date).fromNow()
}

export const formatDuration = (minutes: number): string => {
  if (!minutes || minutes < 0) return '-'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours > 0) {
    return `${hours}小时${mins > 0 ? `${mins}分钟` : ''}`
  }
  return `${mins}分钟`
}

export const formatServiceHours = (hours: number): string => {
  if (hours === undefined || hours === null) return '-'
  return `${hours.toFixed(1)} 小时`
}

export const formatPoints = (points: number): string => {
  if (points === undefined || points === null) return '-'
  return `${points.toLocaleString()} 积分`
}

export const formatPointsChange = (points: number): string => {
  if (points === undefined || points === null) return '-'
  const sign = points >= 0 ? '+' : ''
  return `${sign}${points.toLocaleString()} 积分`
}

export const formatCreditScore = (score: number): string => {
  if (score === undefined || score === null) return '-'
  return `${score} 分`
}

export const formatCurrency = (amount: number, currency: string = 'CNY'): string => {
  if (amount === undefined || amount === null) return '-'
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export const formatPercent = (value: number, decimals: number = 1): string => {
  if (value === undefined || value === null) return '-'
  return `${(value * 100).toFixed(decimals)}%`
}

export const formatPhone = (phone: string): string => {
  if (!phone) return '-'
  if (phone.length === 11) {
    return phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1****$3')
  }
  return phone
}

export const formatIdCard = (idCard: string): string => {
  if (!idCard) return '-'
  if (idCard.length >= 15) {
    return `${idCard.slice(0, 6)}********${idCard.slice(-4)}`
  }
  return idCard
}

export const formatName = (name: string): string => {
  if (!name) return '-'
  if (name.length <= 1) return name
  if (name.length === 2) return `${name[0]}*`
  return `${name[0]}${'*'.repeat(name.length - 2)}${name[name.length - 1]}`
}

export const formatEmail = (email: string): string => {
  if (!email) return '-'
  const [username, domain] = email.split('@')
  if (!username || !domain) return email
  const maskedUsername =
    username.length <= 2
      ? username
      : `${username[0]}${'*'.repeat(Math.min(username.length - 2, 4))}${username[username.length - 1]}`
  return `${maskedUsername}@${domain}`
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === undefined || bytes === null || bytes === 0) return '-'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const unitIndex = Math.floor(Math.log(bytes) / Math.log(1024))
  const value = bytes / Math.pow(1024, unitIndex)
  return `${value.toFixed(unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`
}

export const formatDistance = (meters: number): string => {
  if (meters === undefined || meters === null) return '-'
  if (meters < 1000) {
    return `${Math.round(meters)} 米`
  }
  return `${(meters / 1000).toFixed(2)} 公里`
}

export const formatDayOfWeek = (dayOfWeek: number): string => {
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return days[dayOfWeek] || '-'
}

export const formatRole = (role: string): string => {
  const roleMap: Record<string, string> = {
    VOLUNTEER: '志愿者',
    PROJECT_MANAGER: '项目管理员',
    ADMIN: '系统管理员',
  }
  return roleMap[role] || role || '-'
}

export const formatProjectStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    DRAFT: '草稿',
    PUBLISHED: '已发布',
    ONGOING: '进行中',
    COMPLETED: '已完成',
    CANCELLED: '已取消',
  }
  return statusMap[status] || status || '-'
}

export const formatProjectLevel = (level: string): string => {
  const levelMap: Record<string, string> = {
    BASIC: '基础',
    INTERMEDIATE: '中级',
    ADVANCED: '高级',
  }
  return levelMap[level] || level || '-'
}

export const formatScheduleStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    PENDING: '待确认',
    CONFIRMED: '已确认',
    CANCELLED: '已取消',
  }
  return statusMap[status] || status || '-'
}

export const formatAttendanceStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    PENDING: '待签到',
    PRESENT: '已出勤',
    ABSENT: '缺勤',
    LATE: '迟到',
    LEAVE_EARLY: '早退',
  }
  return statusMap[status] || status || '-'
}

export const formatTrainingStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    NOT_STARTED: '未开始',
    IN_PROGRESS: '进行中',
    COMPLETED: '已完成',
    FAILED: '未通过',
  }
  return statusMap[status] || status || '-'
}

export const formatExamStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    NOT_TAKEN: '未参加',
    PASSED: '已通过',
    FAILED: '未通过',
  }
  return statusMap[status] || status || '-'
}

export const formatNotificationType = (type: string): string => {
  const typeMap: Record<string, string> = {
    TASK_ASSIGNMENT: '任务分配',
    ATTENDANCE_ABNORMAL: '考勤异常',
    TRAINING_PASSED: '培训通过',
    TRAINING_FAILED: '培训未通过',
    POINTS_CHANGED: '积分变动',
    CREDIT_CHANGED: '信用变动',
    SCHEDULE_UPDATED: '排班更新',
    PROJECT_CREATED: '项目创建',
    EXAM_REMINDER: '考试提醒',
    SYSTEM_ANNOUNCEMENT: '系统公告',
  }
  return typeMap[type] || type || '-'
}

export const formatReportStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    PENDING: '待生成',
    GENERATED: '已生成',
    EXPORTED: '已导出',
  }
  return statusMap[status] || status || '-'
}

export const formatApplicationStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    PENDING: '待审核',
    APPROVED: '已通过',
    REJECTED: '已拒绝',
  }
  return statusMap[status] || status || '-'
}

export const formatExchangeStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    PENDING: '待处理',
    COMPLETED: '已完成',
    REJECTED: '已拒绝',
  }
  return statusMap[status] || status || '-'
}

export const formatRating = (rating: number): string => {
  if (rating === undefined || rating === null) return '-'
  return `${rating.toFixed(1)} 分`
}

export const formatStarRating = (rating: number): string => {
  if (rating === undefined || rating === null) return '-'
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating - fullStars >= 0.5
  return '★'.repeat(fullStars) + (hasHalfStar ? '☆' : '') + ` (${rating.toFixed(1)})`
}

export const formatPaginationInfo = (
  page: number,
  pageSize: number,
  total: number
): string => {
  if (!total) return '暂无数据'
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)
  return `显示 ${start}-${end} 条，共 ${total} 条`
}

export const truncateText = (text: string, maxLength: number = 50): string => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}...`
}

export const capitalizeFirstLetter = (str: string): string => {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export const toCamelCase = (str: string): string => {
  return str.replace(/[-_](.)/g, (_, c) => c.toUpperCase())
}

export const toSnakeCase = (str: string): string => {
  return str.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)
}

export default {
  formatDate,
  formatDateTime,
  formatTime,
  formatRelativeTime,
  formatDuration,
  formatServiceHours,
  formatPoints,
  formatPointsChange,
  formatCreditScore,
  formatCurrency,
  formatPercent,
  formatPhone,
  formatIdCard,
  formatName,
  formatEmail,
  formatFileSize,
  formatDistance,
  formatDayOfWeek,
  formatRole,
  formatProjectStatus,
  formatProjectLevel,
  formatScheduleStatus,
  formatAttendanceStatus,
  formatTrainingStatus,
  formatExamStatus,
  formatNotificationType,
  formatReportStatus,
  formatApplicationStatus,
  formatExchangeStatus,
  formatRating,
  formatStarRating,
  formatPaginationInfo,
  truncateText,
  capitalizeFirstLetter,
  toCamelCase,
  toSnakeCase,
}
