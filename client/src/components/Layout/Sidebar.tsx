import React from 'react'
import { Layout, Menu } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  HomeOutlined,
  UserOutlined,
  ProjectOutlined,
  TeamOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  BookOutlined,
  GiftOutlined,
  SettingOutlined,
  FileTextOutlined,
  BarChartOutlined,
  CreditCardOutlined,
  StarOutlined,
  ClusterOutlined,
  ReadOutlined
} from '@ant-design/icons'
import { useAuthStore } from '../../store'
import { Role, MenuItem } from '../../types'

const { Sider } = Layout

const menuItems: MenuItem[] = [
  {
    key: 'home',
    label: '首页',
    icon: <HomeOutlined />,
    path: '/',
    roles: ['VOLUNTEER', 'PROJECT_MANAGER', 'ADMIN']
  },
  {
    key: 'project-recommendation',
    label: '项目推荐',
    icon: <StarOutlined />,
    path: '/projects/recommendation',
    roles: ['VOLUNTEER']
  },
  {
    key: 'my-projects',
    label: '我的项目',
    icon: <ProjectOutlined />,
    path: '/projects/my',
    roles: ['VOLUNTEER', 'PROJECT_MANAGER']
  },
  {
    key: 'schedule',
    label: '排班表',
    icon: <CalendarOutlined />,
    path: '/schedule',
    roles: ['VOLUNTEER']
  },
  {
    key: 'attendance',
    label: '签到记录',
    icon: <CheckCircleOutlined />,
    path: '/attendance',
    roles: ['VOLUNTEER']
  },
  {
    key: 'training-exam',
    label: '培训考试',
    icon: <BookOutlined />,
    path: '/training',
    roles: ['VOLUNTEER']
  },
  {
    key: 'points-center',
    label: '积分中心',
    icon: <GiftOutlined />,
    path: '/points',
    roles: ['VOLUNTEER']
  },
  {
    key: 'profile',
    label: '个人中心',
    icon: <UserOutlined />,
    path: '/profile',
    roles: ['VOLUNTEER', 'PROJECT_MANAGER', 'ADMIN']
  },
  {
    key: 'project-management',
    label: '项目管理',
    icon: <ClusterOutlined />,
    path: '/admin/projects',
    roles: ['PROJECT_MANAGER', 'ADMIN']
  },
  {
    key: 'schedule-management',
    label: '排班管理',
    icon: <CalendarOutlined />,
    path: '/admin/schedule',
    roles: ['PROJECT_MANAGER']
  },
  {
    key: 'attendance-management',
    label: '签到管理',
    icon: <CheckCircleOutlined />,
    path: '/admin/attendance',
    roles: ['PROJECT_MANAGER']
  },
  {
    key: 'review-management',
    label: '评价管理',
    icon: <StarOutlined />,
    path: '/admin/reviews',
    roles: ['PROJECT_MANAGER']
  },
  {
    key: 'user-management',
    label: '用户管理',
    icon: <TeamOutlined />,
    path: '/admin/users',
    roles: ['ADMIN']
  },
  {
    key: 'skill-management',
    label: '技能管理',
    icon: <ReadOutlined />,
    path: '/admin/skills',
    roles: ['ADMIN']
  },
  {
    key: 'training-management',
    label: '培训管理',
    icon: <BookOutlined />,
    path: '/admin/training',
    roles: ['ADMIN']
  },
  {
    key: 'points-rules',
    label: '积分规则',
    icon: <CreditCardOutlined />,
    path: '/admin/points-rules',
    roles: ['ADMIN']
  },
  {
    key: 'credit-settings',
    label: '信用分设置',
    icon: <BarChartOutlined />,
    path: '/admin/credit-settings',
    roles: ['ADMIN']
  },
  {
    key: 'reports',
    label: '报表中心',
    icon: <FileTextOutlined />,
    path: '/admin/reports',
    roles: ['ADMIN']
  },
  {
    key: 'system-settings',
    label: '系统设置',
    icon: <SettingOutlined />,
    path: '/admin/settings',
    roles: ['ADMIN']
  }
]

const Sidebar: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const role = useAuthStore((state) => state.user?.role)

  const filteredItems = menuItems
    .filter((item) => item.roles.includes(role as Role))
    .map((item) => ({
      key: item.path,
      icon: item.icon,
      label: item.label
    }))

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
  }

  const getSelectedKey = () => {
    const pathname = location.pathname
    return filteredItems.find((item) => pathname.startsWith(item.key))?.key || '/'
  }

  return (
    <Sider
      width={240}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0
      }}
      theme="dark"
    >
      <div
        style={{
          height: 64,
          margin: 16,
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: 18,
          fontWeight: 'bold'
        }}
      >
        志愿服务系统
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[getSelectedKey()]}
        items={filteredItems}
        onClick={handleMenuClick}
      />
    </Sider>
  )
}

export default Sidebar
