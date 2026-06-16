import 'dotenv/config'
import express from 'express'
import http from 'http'
import cors from 'cors'
import cron from 'node-cron'
import { errorHandler, notFoundHandler } from './middleware/errorHandler'
import { initSocket } from './lib/socket'
import { checkAndMarkAbsence } from './services/absenceDetectionService'
import { scheduleMonthlyReport } from './services/reportService'

import authRoutes from './routes/auth'
import userRoutes from './routes/user'
import volunteerRoutes from './routes/volunteer'
import skillRoutes from './routes/skill'
import projectRoutes from './routes/project'
import scheduleRoutes from './routes/schedule'
import attendanceRoutes from './routes/attendance'
import notificationRoutes from './routes/notification'
import trainingRoutes from './routes/training'
import examRoutes from './routes/exam'
import reviewRoutes from './routes/review'
import adminRoutes from './routes/admin'
import reportRoutes from './routes/report'

const app = express()
const server = http.createServer(app)
const PORT = process.env.PORT || 3001

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString()
    }
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/volunteers', volunteerRoutes)
app.use('/api/skills', skillRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/schedules', scheduleRoutes)
app.use('/api/attendance', attendanceRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/trainings', trainingRoutes)
app.use('/api/exams', examRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/reports', reportRoutes)

initSocket(server)

app.use(notFoundHandler)
app.use(errorHandler)

cron.schedule('*/5 * * * *', () => {
  console.log('Running absence detection job...')
  checkAndMarkAbsence().catch(err => {
    console.error('Absence detection job failed:', err)
  })
})

cron.schedule('0 0 1 * *', () => {
  console.log('Running monthly report generation job...')
  scheduleMonthlyReport().catch(err => {
    console.error('Monthly report generation job failed:', err)
  })
})

server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`)
  console.log(`📡 Socket.IO server initialized`)
  console.log(`⏰ Scheduled jobs: absence detection (every 5 min), monthly report (1st of month)`)
})

export default app
