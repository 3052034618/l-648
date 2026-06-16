import React, { useEffect } from 'react'
import { Layout, Spin } from 'antd'
import { Outlet, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { useAuthStore } from '../../store'

const { Content } = Layout

const MainLayout: React.FC = () => {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)
  const loading = useAuthStore((state) => state.loading)
  const fetchProfile = useAuthStore((state) => state.fetchProfile)
  const token = localStorage.getItem('token')

  useEffect(() => {
    if (!isAuthenticated && !token) {
      navigate('/login')
      return
    }

    if (token && !user) {
      fetchProfile().catch(() => {
        navigate('/login')
      })
    }
  }, [isAuthenticated, token, user, navigate, fetchProfile])

  if (loading || (!isAuthenticated && !user)) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar />
      <Layout style={{ marginLeft: 240 }}>
        <Header />
        <Content
          style={{
            margin: '24px 24px 0',
            overflow: 'initial',
            minHeight: 'calc(100vh - 64px - 24px)'
          }}
        >
          <div
            style={{
              padding: 24,
              background: '#fff',
              borderRadius: 8,
              minHeight: 'calc(100vh - 64px - 48px)'
            }}
          >
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
