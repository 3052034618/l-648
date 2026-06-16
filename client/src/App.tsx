import { useEffect } from 'react'
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom'
import { ConfigProvider, App as AntdApp } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import 'dayjs/locale/zh-cn'
import { useAuthStore } from './store/authStore'
import { useNotificationStore } from './store/notificationStore'
import type { Role } from './types'

interface RouteConfig {
  path: string
  element: React.ReactNode
  roles?: Role[]
  requiresAuth?: boolean
}

const publicRoutes: RouteConfig[] = [
  {
    path: '/login',
    element: <div>登录页面</div>,
    requiresAuth: false,
  },
  {
    path: '/register',
    element: <div>注册页面</div>,
    requiresAuth: false,
  },
  {
    path: '/forgot-password',
    element: <div>忘记密码页面</div>,
    requiresAuth: false,
  },
]

const volunteerRoutes: RouteConfig[] = [
  {
    path: '/dashboard',
    element: <div>志愿者仪表盘</div>,
    roles: ['VOLUNTEER', 'PROJECT_MANAGER', 'ADMIN'],
  },
  {
    path: '/projects',
    element: <div>项目列表</div>,
    roles: ['VOLUNTEER', 'PROJECT_MANAGER', 'ADMIN'],
  },
  {
    path: '/projects/:id',
    element: <div>项目详情</div>,
    roles: ['VOLUNTEER', 'PROJECT_MANAGER', 'ADMIN'],
  },
  {
    path: '/my-projects',
    element: <div>我的项目</div>,
    roles: ['VOLUNTEER'],
  },
  {
    path: '/schedules',
    element: <div>我的排班</div>,
    roles: ['VOLUNTEER'],
  },
  {
    path: '/attendance',
    element: <div>考勤记录</div>,
    roles: ['VOLUNTEER'],
  },
  {
    path: '/trainings',
    element: <div>培训课程</div>,
    roles: ['VOLUNTEER', 'PROJECT_MANAGER', 'ADMIN'],
  },
  {
    path: '/trainings/:id',
    element: <div>培训详情</div>,
    roles: ['VOLUNTEER'],
  },
  {
    path: '/exams',
    element: <div>考试中心</div>,
    roles: ['VOLUNTEER'],
  },
  {
    path: '/exams/:id',
    element: <div>考试页面</div>,
    roles: ['VOLUNTEER'],
  },
  {
    path: '/points',
    element: <div>我的积分</div>,
    roles: ['VOLUNTEER'],
  },
  {
    path: '/exchange',
    element: <div>积分兑换</div>,
    roles: ['VOLUNTEER'],
  },
  {
    path: '/credit',
    element: <div>信用分</div>,
    roles: ['VOLUNTEER'],
  },
  {
    path: '/skills',
    element: <div>技能管理</div>,
    roles: ['VOLUNTEER'],
  },
  {
    path: '/availability',
    element: <div>时间设置</div>,
    roles: ['VOLUNTEER'],
  },
  {
    path: '/reviews',
    element: <div>我的评价</div>,
    roles: ['VOLUNTEER'],
  },
]

const projectManagerRoutes: RouteConfig[] = [
  {
    path: '/manager/dashboard',
    element: <div>项目管理员仪表盘</div>,
    roles: ['PROJECT_MANAGER', 'ADMIN'],
  },
  {
    path: '/manager/projects',
    element: <div>项目管理</div>,
    roles: ['PROJECT_MANAGER', 'ADMIN'],
  },
  {
    path: '/manager/projects/create',
    element: <div>创建项目</div>,
    roles: ['PROJECT_MANAGER', 'ADMIN'],
  },
  {
    path: '/manager/projects/:id/edit',
    element: <div>编辑项目</div>,
    roles: ['PROJECT_MANAGER', 'ADMIN'],
  },
  {
    path: '/manager/projects/:id/applications',
    element: <div>项目申请审核</div>,
    roles: ['PROJECT_MANAGER', 'ADMIN'],
  },
  {
    path: '/manager/projects/:id/schedules',
    element: <div>排班管理</div>,
    roles: ['PROJECT_MANAGER', 'ADMIN'],
  },
  {
    path: '/manager/projects/:id/attendance',
    element: <div>考勤管理</div>,
    roles: ['PROJECT_MANAGER', 'ADMIN'],
  },
  {
    path: '/manager/projects/:id/reviews',
    element: <div>评价管理</div>,
    roles: ['PROJECT_MANAGER', 'ADMIN'],
  },
  {
    path: '/manager/trainings',
    element: <div>培训管理</div>,
    roles: ['PROJECT_MANAGER', 'ADMIN'],
  },
  {
    path: '/manager/trainings/create',
    element: <div>创建培训</div>,
    roles: ['PROJECT_MANAGER', 'ADMIN'],
  },
  {
    path: '/manager/exams',
    element: <div>考试管理</div>,
    roles: ['PROJECT_MANAGER', 'ADMIN'],
  },
  {
    path: '/manager/exams/create',
    element: <div>创建考试</div>,
    roles: ['PROJECT_MANAGER', 'ADMIN'],
  },
  {
    path: '/manager/reports',
    element: <div>项目报表</div>,
    roles: ['PROJECT_MANAGER', 'ADMIN'],
  },
]

const adminRoutes: RouteConfig[] = [
  {
    path: '/admin/dashboard',
    element: <div>系统管理员仪表盘</div>,
    roles: ['ADMIN'],
  },
  {
    path: '/admin/users',
    element: <div>用户管理</div>,
    roles: ['ADMIN'],
  },
  {
    path: '/admin/users/:id',
    element: <div>用户详情</div>,
    roles: ['ADMIN'],
  },
  {
    path: '/admin/skills',
    element: <div>技能管理</div>,
    roles: ['ADMIN'],
  },
  {
    path: '/admin/points-rules',
    element: <div>积分规则管理</div>,
    roles: ['ADMIN'],
  },
  {
    path: '/admin/credit-thresholds',
    element: <div>信用阈值管理</div>,
    roles: ['ADMIN'],
  },
  {
    path: '/admin/exchange-rules',
    element: <div>兑换规则管理</div>,
    roles: ['ADMIN'],
  },
  {
    path: '/admin/reports',
    element: <div>月度报表</div>,
    roles: ['ADMIN'],
  },
  {
    path: '/admin/settings',
    element: <div>系统设置</div>,
    roles: ['ADMIN'],
  },
  {
    path: '/admin/notifications',
    element: <div>通知管理</div>,
    roles: ['ADMIN'],
  },
]

const commonRoutes: RouteConfig[] = [
  {
    path: '/profile',
    element: <div>个人中心</div>,
    roles: ['VOLUNTEER', 'PROJECT_MANAGER', 'ADMIN'],
  },
  {
    path: '/profile/edit',
    element: <div>编辑资料</div>,
    roles: ['VOLUNTEER', 'PROJECT_MANAGER', 'ADMIN'],
  },
  {
    path: '/notifications',
    element: <div>消息中心</div>,
    roles: ['VOLUNTEER', 'PROJECT_MANAGER', 'ADMIN'],
  },
  {
    path: '/settings',
    element: <div>账户设置</div>,
    roles: ['VOLUNTEER', 'PROJECT_MANAGER', 'ADMIN'],
  },
]

const allRoutes: RouteConfig[] = [
  ...publicRoutes,
  ...volunteerRoutes,
  ...projectManagerRoutes,
  ...adminRoutes,
  ...commonRoutes,
]

const ProtectedRoute: React.FC<{
  children: React.ReactNode
  roles?: Role[]
}> = ({ children, roles }) => {
  const { isAuthenticated, user, loading } = useAuthStore()
  const location = useLocation()

  if (loading) {
    return <div>加载中...</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/403" replace />
  }

  return <>{children}</>
}

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuthStore()

  if (loading) {
    return <div>加载中...</div>
  }

  if (isAuthenticated) {
    const defaultPath: Record<Role, string> = {
      VOLUNTEER: '/dashboard',
      PROJECT_MANAGER: '/manager/dashboard',
      ADMIN: '/admin/dashboard',
    }
    return <Navigate to={user ? defaultPath[user.role] : '/login'} replace />
  }

  return <>{children}</>
}

const AppContent: React.FC = () => {
  const { isAuthenticated, fetchProfile, loading } = useAuthStore()
  const { fetchUnreadCount, initSocketListeners } = useNotificationStore()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token && isAuthenticated) {
      fetchProfile().catch(() => {})
      fetchUnreadCount().catch(() => {})
    }
  }, [isAuthenticated, fetchProfile, fetchUnreadCount])

  useEffect(() => {
    if (isAuthenticated) {
      const cleanup = initSocketListeners()
      return cleanup
    }
  }, [isAuthenticated, initSocketListeners])

  if (loading && !isAuthenticated) {
    return <div>加载中...</div>
  }

  return (
    <Routes>
      {publicRoutes.map((route) => (
        <Route
          key={route.path}
          path={route.path}
          element={
            route.requiresAuth === false ? (
              <PublicRoute>{route.element}</PublicRoute>
            ) : (
              <ProtectedRoute roles={route.roles}>{route.element}</ProtectedRoute>
            )
          }
        />
      ))}

      {allRoutes
        .filter((r) => r.requiresAuth !== false)
        .map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={
              <ProtectedRoute roles={route.roles}>{route.element}</ProtectedRoute>
            }
          />
        ))}

      <Route path="/403" element={<div>无权限访问</div>} />
      <Route path="/404" element={<div>页面不存在</div>} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  )
}

const App: React.FC = () => {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
        },
      }}
    >
      <AntdApp>
        <Router>
          <AppContent />
        </Router>
      </AntdApp>
    </ConfigProvider>
  )
}

export default App
