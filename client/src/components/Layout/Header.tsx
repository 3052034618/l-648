import React, { useState } from 'react'
import { Layout, Avatar, Dropdown, Badge, Button, Space } from 'antd'
import {
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  BellOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, useNotificationStore } from '../../store'
import NotificationCenter from '../Notification/NotificationCenter'
import { Role } from '../../types'

const { Header: AntHeader } = Layout

const roleNames: Record<Role, string> = {
  VOLUNTEER: '志愿者',
  PROJECT_MANAGER: '项目负责人',
  ADMIN: '管理员'
}

const Header: React.FC = () => {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const unreadCount = useNotificationStore((state) => state.unreadCount)
  const [notificationOpen, setNotificationOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
      onClick: () => navigate('/profile')
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '账户设置',
      onClick: () => navigate('/settings')
    },
    {
      type: 'divider' as const
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout
    }
  ]

  return (
    <AntHeader
      style={{
        background: '#fff',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        boxShadow: '0 1px 4px rgba(0,21,41,.08)',
        height: 64,
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}
    >
      <Space size={16}>
        <Dropdown
          open={notificationOpen}
          onOpenChange={setNotificationOpen}
          trigger={['click']}
          dropdownRender={() => <NotificationCenter onClose={() => setNotificationOpen(false)} />}
          placement="bottomRight"
        >
          <Badge count={unreadCount} size="small" offset={[2, 2]}>
            <Button
              type="text"
              icon={<BellOutlined style={{ fontSize: 20 }} />}
              style={{ fontSize: 20, padding: '4px 12px' }}
            />
          </Badge>
        </Dropdown>

        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <Space style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 4 }}>
            <Avatar
              size={40}
              icon={<UserOutlined />}
              src={user?.avatar}
              style={{ backgroundColor: '#1677ff' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span style={{ fontWeight: 500, fontSize: 14 }}>{user?.realName}</span>
              <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                {user?.role ? roleNames[user.role] : ''}
              </span>
            </div>
          </Space>
        </Dropdown>
      </Space>
    </AntHeader>
  )
}

export default Header
