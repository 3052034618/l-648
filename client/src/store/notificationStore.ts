import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Notification, NotificationState, NotificationStatus } from '../types'
import { notificationApi } from '../services/api'
import socketService from '../services/socket'

interface NotificationStore extends NotificationState {
  hasMore: boolean
  page: number
  pageSize: number
  fetchNotifications: (params?: boolean | { page?: number; pageSize?: number; status?: NotificationStatus }) => Promise<void>
  fetchUnreadCount: () => Promise<void>
  markAsRead: (id: number) => Promise<void>
  markAllAsRead: () => Promise<void>
  markNotificationAsRead: (id: number) => Promise<void>
  markAllNotificationsAsRead: () => Promise<void>
  removeNotification: (id: number) => void
  addNotification: (notification: Notification) => void
  setLoading: (loading: boolean) => void
  clearNotifications: () => void
  initSocketListeners: () => () => void
}

const initialState: NotificationState & { hasMore: boolean; page: number; pageSize: number } = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  hasMore: true,
  page: 1,
  pageSize: 20,
}

export const useNotificationStore = create<NotificationStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      fetchNotifications: async (params?: boolean | { page?: number; pageSize?: number; status?: NotificationStatus }) => {
        set({ loading: true })
        try {
          let refresh = false
          let pageParams: { page: number; pageSize: number; status?: NotificationStatus }

          if (typeof params === 'boolean') {
            refresh = params
            pageParams = {
              page: refresh ? 1 : get().page,
              pageSize: get().pageSize,
            }
          } else if (typeof params === 'object' && params !== null) {
            refresh = (params.page ?? 1) === 1
            pageParams = {
              page: params.page ?? get().page,
              pageSize: params.pageSize ?? get().pageSize,
              status: params.status,
            }
          } else {
            pageParams = {
              page: get().page,
              pageSize: get().pageSize,
            }
          }

          const result = await notificationApi.getNotifications(pageParams)
          const mappedItems = result.items.map((item) => ({
            ...item,
            isRead: item.status === 'READ',
          }))
          set({
            notifications: refresh ? mappedItems : [...get().notifications, ...mappedItems],
            hasMore: pageParams.page < result.totalPages,
            page: pageParams.page + 1,
            loading: false,
          })
        } catch (error) {
          set({ loading: false })
          throw error
        }
      },

      fetchUnreadCount: async () => {
        try {
          const { count } = await notificationApi.getUnreadCount()
          set({ unreadCount: count })
        } catch (error) {
          console.error('Failed to fetch unread count:', error)
        }
      },

      markAsRead: async (id: number) => {
        try {
          const updatedNotification = await notificationApi.markAsRead(id)
          set((state) => ({
            notifications: state.notifications.map((n) =>
              n.id === id ? { ...updatedNotification, isRead: true } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
          }))
          socketService.markNotificationAsRead(id)
        } catch (error) {
          console.error('Failed to mark notification as read:', error)
          throw error
        }
      },

      markAllAsRead: async () => {
        try {
          await notificationApi.markAllAsRead()
          set((state) => ({
            notifications: state.notifications.map((n) => ({
              ...n,
              status: 'READ' as NotificationStatus,
              isRead: true,
              readAt: new Date().toISOString(),
            })),
            unreadCount: 0,
          }))
          socketService.markAllNotificationsAsRead()
        } catch (error) {
          console.error('Failed to mark all notifications as read:', error)
          throw error
        }
      },

      markNotificationAsRead: async (id: number) => {
        await get().markAsRead(id)
      },

      markAllNotificationsAsRead: async () => {
        await get().markAllAsRead()
      },

      removeNotification: (id: number) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }))
      },

      addNotification: (notification: Notification) => {
        const notificationWithIsRead = {
          ...notification,
          isRead: notification.status === 'READ',
        }
        set((state) => ({
          notifications: [notificationWithIsRead, ...state.notifications],
          unreadCount: state.unreadCount + (notificationWithIsRead.isRead ? 0 : 1),
        }))
      },

      setLoading: (loading: boolean) => {
        set({ loading })
      },

      clearNotifications: () => {
        set({
          ...initialState,
        })
      },

      initSocketListeners: () => {
        const unsub1 = socketService.on('notification:new', (notification) => {
          get().addNotification(notification)
        })

        const unsub2 = socketService.on('notification:unreadCount', ({ count }) => {
          set({ unreadCount: count })
        })

        return () => {
          unsub1()
          unsub2()
        }
      },
    })
  )
)

export const selectNotifications = (state: NotificationStore) => ({
  notifications: state.notifications,
  unreadCount: state.unreadCount,
  loading: state.loading,
  hasMore: state.hasMore,
})

export const selectNotificationActions = (state: NotificationStore) => ({
  fetchNotifications: state.fetchNotifications,
  fetchUnreadCount: state.fetchUnreadCount,
  markAsRead: state.markAsRead,
  markAllAsRead: state.markAllAsRead,
  markNotificationAsRead: state.markNotificationAsRead,
  markAllNotificationsAsRead: state.markAllNotificationsAsRead,
  removeNotification: state.removeNotification,
  addNotification: state.addNotification,
  setLoading: state.setLoading,
  clearNotifications: state.clearNotifications,
  initSocketListeners: state.initSocketListeners,
})

export default useNotificationStore
