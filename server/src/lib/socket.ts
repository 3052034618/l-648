import { Server, Socket } from 'socket.io'
import { Server as HttpServer } from 'http'
import { verifyToken } from './jwt'
import prisma from './prisma'
import { Notification } from '@prisma/client'

const userSockets = new Map<number, Set<string>>()

let io: Server | null = null

export function initSocket(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_ORIGIN || '*',
      credentials: true
    }
  })

  io.use(async (socket: Socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '')
      
      if (!token) {
        return next(new Error('未提供认证令牌'))
      }

      const payload = verifyToken(token)
      if (!payload) {
        return next(new Error('认证令牌无效或已过期'))
      }

      const user = await prisma.user.findUnique({
        where: { id: payload.userId }
      })

      if (!user) {
        return next(new Error('用户不存在'))
      }

      socket.data.userId = user.id
      next()
    } catch (error) {
      next(new Error('认证失败'))
    }
  })

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId

    if (userId !== undefined) {
      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set())
      }
      userSockets.get(userId)!.add(socket.id)

      console.log(`用户 ${userId} 已连接，Socket ID: ${socket.id}`)

      socket.on('disconnect', () => {
        const userSocketSet = userSockets.get(userId)
        if (userSocketSet) {
          userSocketSet.delete(socket.id)
          if (userSocketSet.size === 0) {
            userSockets.delete(userId)
          }
        }
        console.log(`用户 ${userId} 已断开连接，Socket ID: ${socket.id}`)
      })
    }
  })

  return io
}

export function sendNotificationToUser(userId: number, notification: Notification) {
  if (!io) {
    console.warn('Socket.IO 未初始化')
    return
  }

  const socketIds = userSockets.get(userId)
  if (socketIds && socketIds.size > 0) {
    socketIds.forEach(socketId => {
      io!.to(socketId).emit('notification', notification)
    })
    console.log(`已向用户 ${userId} 发送通知`)
  }
}

export function broadcastSystemMessage(message: string, type: string = 'SYSTEM_ANNOUNCEMENT') {
  if (!io) {
    console.warn('Socket.IO 未初始化')
    return
  }

  io.emit('systemMessage', {
    type,
    message,
    timestamp: new Date()
  })
  console.log('已广播系统消息')
}

export function getOnlineUsers(): number[] {
  return Array.from(userSockets.keys())
}

export function isUserOnline(userId: number): boolean {
  return userSockets.has(userId)
}
