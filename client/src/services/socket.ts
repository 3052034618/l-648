import { io, Socket } from 'socket.io-client'
import type { Notification, Attendance, Schedule } from '../types'

interface ServerToClientEvents {
  'notification:new': (notification: Notification) => void
  'notification:unreadCount': (data: { count: number }) => void
  'attendance:updated': (attendance: Attendance) => void
  'schedule:updated': (schedule: Schedule) => void
  'points:updated': (data: { userId: number; points: number; description: string }) => void
  'credit:updated': (data: { userId: number; creditScore: number; reason: string }) => void
  'project:created': (data: { projectId: number; title: string }) => void
  'exam:reminder': (data: { examId: number; title: string; startTime: string }) => void
  'training:completed': (data: { trainingId: number; title: string; passed: boolean }) => void
  'connect': () => void
  'disconnect': () => void
  'connect_error': (error: Error) => void
}

interface ClientToServerEvents {
  'notification:markRead': (notificationId: number) => void
  'notification:markAllRead': () => void
  'user:join': (userId: number) => void
  'user:leave': (userId: number) => void
}

class SocketService {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private eventListeners: Map<string, Set<(...args: any[]) => void>> = new Map()

  connect(): Socket<ServerToClientEvents, ClientToServerEvents> {
    if (this.socket?.connected) {
      return this.socket
    }

    const token = localStorage.getItem('token')

    this.socket = io({
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: this.reconnectDelay,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
      auth: {
        token: token ? `Bearer ${token}` : undefined,
      },
    })

    this.socket.on('connect', () => {
      console.log('Socket connected')
      this.reconnectAttempts = 0
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        this.joinUser(user.id)
      }
      this.emit('connect')
    })

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason)
      if (reason === 'io server disconnect') {
        this.reconnectAttempts++
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          setTimeout(() => this.connect(), this.reconnectDelay * this.reconnectAttempts)
        }
      }
      this.emit('disconnect', reason)
    })

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      this.emit('connect_error', error)
    })

    this.socket.on('notification:new', (notification) => {
      this.emit('notification:new', notification)
    })

    this.socket.on('notification:unreadCount', (data) => {
      this.emit('notification:unreadCount', data)
    })

    this.socket.on('attendance:updated', (attendance) => {
      this.emit('attendance:updated', attendance)
    })

    this.socket.on('schedule:updated', (schedule) => {
      this.emit('schedule:updated', schedule)
    })

    this.socket.on('points:updated', (data) => {
      this.emit('points:updated', data)
    })

    this.socket.on('credit:updated', (data) => {
      this.emit('credit:updated', data)
    })

    this.socket.on('project:created', (data) => {
      this.emit('project:created', data)
    })

    this.socket.on('exam:reminder', (data) => {
      this.emit('exam:reminder', data)
    })

    this.socket.on('training:completed', (data) => {
      this.emit('training:completed', data)
    })

    return this.socket
  }

  disconnect(): void {
    if (this.socket) {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        this.leaveUser(user.id)
      }
      this.socket.disconnect()
      this.socket = null
    }
    this.eventListeners.clear()
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false
  }

  on<T extends keyof ServerToClientEvents>(
    event: T,
    callback: ServerToClientEvents[T]
  ): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set())
    }
    this.eventListeners.get(event)!.add(callback)

    if (this.socket) {
      this.socket.on(event, callback as any)
    }

    return () => {
      this.off(event, callback)
    }
  }

  off<T extends keyof ServerToClientEvents>(
    event: T,
    callback: ServerToClientEvents[T]
  ): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.delete(callback)
    }
    if (this.socket) {
      this.socket.off(event, callback as any)
    }
  }

  private emit(event: string, ...args: any[]): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach((callback) => callback(...args))
    }
  }

  joinUser(userId: number): void {
    if (this.socket?.connected) {
      this.socket.emit('user:join', userId)
    }
  }

  leaveUser(userId: number): void {
    if (this.socket?.connected) {
      this.socket.emit('user:leave', userId)
    }
  }

  markNotificationAsRead(notificationId: number): void {
    if (this.socket?.connected) {
      this.socket.emit('notification:markRead', notificationId)
    }
  }

  markAllNotificationsAsRead(): void {
    if (this.socket?.connected) {
      this.socket.emit('notification:markAllRead')
    }
  }

  updateToken(token: string): void {
    if (this.socket) {
      this.socket.auth = { token: `Bearer ${token}` }
      if (this.socket.connected) {
        this.socket.disconnect().connect()
      }
    }
  }

  getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> | null {
    return this.socket
  }
}

const socketService = new SocketService()

export default socketService
