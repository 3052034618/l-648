import { Router, Response } from 'express'
import { authenticate } from '../middleware/auth'
import { AuthenticatedRequest } from '../types'
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount
} from '../services/notificationService'

const router = Router()

router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 20

    const result = await getNotifications(userId, page, pageSize)

    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取通知列表失败'
    })
  }
})

router.put('/:id/read', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const notificationId = parseInt(req.params.id)

    if (isNaN(notificationId)) {
      return res.status(400).json({
        success: false,
        error: '通知ID无效'
      })
    }

    const notification = await markAsRead(notificationId)

    res.json({
      success: true,
      data: notification
    })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: '通知不存在'
      })
    }
    res.status(500).json({
      success: false,
      error: '标记已读失败'
    })
  }
})

router.put('/read-all', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id

    const result = await markAllAsRead(userId)

    res.json({
      success: true,
      data: {
        updatedCount: result.count
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '全部标记已读失败'
    })
  }
})

router.get('/unread-count', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id

    const count = await getUnreadCount(userId)

    res.json({
      success: true,
      data: { count }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取未读数量失败'
    })
  }
})

export default router
