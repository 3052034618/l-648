import prisma from '../lib/prisma'
import { NotificationType, NotificationStatus } from '@prisma/client'
import { sendNotificationToUser } from '../lib/socket'

export async function createNotification(
  userId: number,
  type: NotificationType,
  title: string,
  content: string,
  relatedEntityId?: number,
  relatedEntityType?: string
) {
  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      content,
      relatedEntityId,
      relatedEntityType,
      status: NotificationStatus.UNREAD
    }
  })

  sendNotificationToUser(userId, notification)

  return notification
}

export async function getNotifications(
  userId: number,
  page: number = 1,
  pageSize: number = 20
) {
  const skip = (page - 1) * pageSize

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize
    }),
    prisma.notification.count({ where: { userId } })
  ])

  return {
    items: notifications,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  }
}

export async function markAsRead(notificationId: number) {
  return await prisma.notification.update({
    where: { id: notificationId },
    data: {
      status: NotificationStatus.READ,
      readAt: new Date()
    }
  })
}

export async function markAllAsRead(userId: number) {
  return await prisma.notification.updateMany({
    where: {
      userId,
      status: NotificationStatus.UNREAD
    },
    data: {
      status: NotificationStatus.READ,
      readAt: new Date()
    }
  })
}

export async function getUnreadCount(userId: number) {
  return await prisma.notification.count({
    where: {
      userId,
      status: NotificationStatus.UNREAD
    }
  })
}
