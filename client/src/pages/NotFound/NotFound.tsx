import React from 'react'
import { Button, Typography, Space } from 'antd'
import { HomeOutlined, ArrowLeftOutlined, SearchOutlined } from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'

const { Title, Text } = Typography

const NotFound: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const handleGoHome = () => {
    navigate('/')
  }

  const handleGoBack = () => {
    navigate(-1)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.1
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '10%',
            left: '10%',
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: '#fff'
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '10%',
            right: '10%',
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: '#fff'
          }}
        />
      </div>

      <div
        style={{
          background: '#fff',
          borderRadius: 24,
          padding: 48,
          boxShadow: '0 24px 48px rgba(0,0,0,0.15)',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
          maxWidth: 500,
          width: '90%'
        }}
      >
        <div
          style={{
            fontSize: 120,
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            lineHeight: 1,
            marginBottom: 16
          }}
        >
          404
        </div>

        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            color: '#fff',
            fontSize: 36
          }}
        >
          <SearchOutlined />
        </div>

        <Title level={3} style={{ marginBottom: 8 }}>
          页面未找到
        </Title>

        <Text type="secondary" style={{ fontSize: 16, display: 'block', marginBottom: 8 }}>
          抱歉，您访问的页面不存在
        </Text>

        <Text type="secondary" style={{ fontSize: 14, display: 'block', marginBottom: 32 }}>
          请求路径：<code style={{ background: '#f5f5f5', padding: '2px 8px', borderRadius: 4 }}>{location.pathname}</code>
        </Text>

        <Space size="middle">
          <Button
            size="large"
            icon={<ArrowLeftOutlined />}
            onClick={handleGoBack}
            style={{ borderRadius: 8, height: 44 }}
          >
            返回上一页
          </Button>
          <Button
            type="primary"
            size="large"
            icon={<HomeOutlined />}
            onClick={handleGoHome}
            style={{
              borderRadius: 8,
              height: 44,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none'
            }}
          >
            返回首页
          </Button>
        </Space>

        <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid #f0f0f0' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            如果您认为这是一个错误，请联系系统管理员
          </Text>
        </div>
      </div>
    </div>
  )
}

export default NotFound
