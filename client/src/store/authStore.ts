import { create } from 'zustand'
import { persist, devtools } from 'zustand/middleware'
import type { User, LoginCredentials, RegisterData, AuthState } from '../types'
import { authApi } from '../services/api'
import socketService from '../services/socket'

interface AuthStore extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<void>
  fetchProfile: () => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<void>
  setLoading: (loading: boolean) => void
  setUser: (user: User | null) => void
  clearAuth: () => void
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
}

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        login: async (credentials: LoginCredentials) => {
          set({ loading: true })
          try {
            const { token, user } = await authApi.login(credentials)
            localStorage.setItem('token', token)
            localStorage.setItem('user', JSON.stringify(user))
            set({
              user,
              token,
              isAuthenticated: true,
              loading: false,
            })
            socketService.connect()
          } catch (error) {
            set({ loading: false })
            throw error
          }
        },

        register: async (data: RegisterData) => {
          set({ loading: true })
          try {
            const { token, user } = await authApi.register(data)
            localStorage.setItem('token', token)
            localStorage.setItem('user', JSON.stringify(user))
            set({
              user,
              token,
              isAuthenticated: true,
              loading: false,
            })
            socketService.connect()
          } catch (error) {
            set({ loading: false })
            throw error
          }
        },

        logout: async () => {
          set({ loading: true })
          try {
            await authApi.logout()
          } catch (error) {
            console.error('Logout API error:', error)
          } finally {
            get().clearAuth()
          }
        },

        refreshToken: async () => {
          try {
            const { token } = await authApi.refreshToken()
            localStorage.setItem('token', token)
            set({ token })
            socketService.updateToken(token)
          } catch (error) {
            get().clearAuth()
            throw error
          }
        },

        fetchProfile: async () => {
          set({ loading: true })
          try {
            const user = await authApi.getProfile()
            localStorage.setItem('user', JSON.stringify(user))
            set({
              user,
              loading: false,
            })
          } catch (error) {
            set({ loading: false })
            throw error
          }
        },

        updateProfile: async (data: Partial<User>) => {
          set({ loading: true })
          try {
            const user = await authApi.updateProfile(data)
            localStorage.setItem('user', JSON.stringify(user))
            set({
              user,
              loading: false,
            })
          } catch (error) {
            set({ loading: false })
            throw error
          }
        },

        setLoading: (loading: boolean) => {
          set({ loading })
        },

        setUser: (user: User | null) => {
          set({ user })
          if (user) {
            localStorage.setItem('user', JSON.stringify(user))
          } else {
            localStorage.removeItem('user')
          }
        },

        clearAuth: () => {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          socketService.disconnect()
          set({
            ...initialState,
          })
        },
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          user: state.user,
          token: state.token,
          isAuthenticated: state.isAuthenticated,
        }),
        onRehydrateStorage: () => (state) => {
          if (state?.isAuthenticated && state.token) {
            socketService.connect()
          }
        },
      }
    )
  )
)

export const selectAuth = (state: AuthStore) => ({
  user: state.user,
  token: state.token,
  isAuthenticated: state.isAuthenticated,
  loading: state.loading,
})

export const selectAuthActions = (state: AuthStore) => ({
  login: state.login,
  register: state.register,
  logout: state.logout,
  refreshToken: state.refreshToken,
  fetchProfile: state.fetchProfile,
  updateProfile: state.updateProfile,
  setLoading: state.setLoading,
  setUser: state.setUser,
  clearAuth: state.clearAuth,
})

export const selectIsAdmin = (state: AuthStore) =>
  state.user?.role === 'ADMIN'

export const selectIsVolunteer = (state: AuthStore) =>
  state.user?.role === 'VOLUNTEER'

export const selectIsProjectManager = (state: AuthStore) =>
  state.user?.role === 'PROJECT_MANAGER'

export const selectUser = (state: AuthStore) => state.user

export const selectUserRole = (state: AuthStore) => state.user?.role

export const useUserStore = useAuthStore

export default useAuthStore
