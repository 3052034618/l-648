import React, { useState } from 'react'
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Tabs,
  Divider,
  message,
  Space,
  Checkbox
} from 'antd'
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  TeamOutlined
} from '@ant-design/icons'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../../store'

const { Title, Text } = Typography

type LoginType = 'username' | 'email' | 'phone'

interface LoginFormData {
  username?: string
  email?: string
  phone?: string
  password: string
  remember: boolean
}

const Login: React.FC = () => {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const authLoading = useAuthStore((state) => state.loading)
  const [loading, setLoading] = useState(false)
  const [loginType, setLoginType] = useState<LoginType>('username')
  const [form] = Form.useForm<LoginFormData>()

  const handleSubmit = async (values: LoginFormData) => {
    setLoading(true)
    try {
      const credentials: {
        username?: string
        email?: string
        phone?: string
        password: string
      } = {
        password: values.password
      }

      if (loginType === 'username') {
        credentials.username = values.username
      } else if (loginType === 'email') {
        credentials.email = values.email
      } else if (loginType === 'phone') {
        credentials.phone = values.phone
      }

      await login(credentials)
      message.success('登录成功')
      navigate('/')
    } catch (error) {
      console.error('Login error:', error)
    } finally {
      setLoading(false)
    }
  }

  const tabItems = [
    {
      key: 'username',
      label: (
        <Space>
          <UserOutlined />
          用户名登录
        </Space>
      )
    },
    {
      key: 'email',
      label: (
        <Space>
          <MailOutlined />
          邮箱登录
        </Space>
      )
    },
    {
      key: 'phone',
      label: (
        <Space>
          <PhoneOutlined />
          手机号登录
        </Space>
      )
    }
  ]

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
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: '#fff'
          }}
        />
      </div>

      <Card
        style={{
          width: 480,
          borderRadius: 16,
          boxShadow: '0 24px 48px rgba(0,0,0,0.15)',
          position: 'relative',
          zIndex: 1
        }}
        bodyStyle={{ padding: 40 }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: '#fff',
              fontSize: 36
            }}
          >
            <TeamOutlined />
          </div>
          <Title level={2} style={{ marginBottom: 8 }}>
            志愿服务系统
          </Title>
          <Text type="secondary">欢迎回来，请登录您的账户</Text>
        </div>

        <Tabs
          activeKey={loginType}
          onChange={(key) => setLoginType(key as LoginType)}
          items={tabItems}
          centered
          style={{ marginBottom: 24 }}
        />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ remember: true }}
          size="large"
        >
          {loginType === 'username' && (
            <Form.Item
              name="username"
              label="用户名"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input
                prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
                placeholder="请输入用户名"
                autoComplete="username"
              />
            </Form.Item>
          )}

          {loginType === 'email' && (
            <Form.Item
              name="email"
              label="邮箱"
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入有效的邮箱地址' }
              ]}
            >
              <Input
                prefix={<MailOutlined style={{ color: '#bfbfbf' }} />}
                placeholder="请输入邮箱地址"
                autoComplete="email"
              />
            </Form.Item>
          )}

          {loginType === 'phone' && (
            <Form.Item
              name="phone"
              label="手机号"
              rules={[
                { required: true, message: '请输入手机号' },
                { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' }
              ]}
            >
              <Input
                prefix={<PhoneOutlined style={{ color: '#bfbfbf' }} />}
                placeholder="请输入手机号"
                autoComplete="tel"
              />
            </Form.Item>
          )}

          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }, { min: 6, message: '密码至少6位' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="请输入密码"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox>记住我</Checkbox>
              </Form.Item>
              <a href="#/forgot-password">忘记密码？</a>
            </div>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading || authLoading}
              block
              size="large"
              style={{
                height: 48,
                borderRadius: 8,
                fontSize: 16,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none'
              }}
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        <Divider plain>
          <Text type="secondary">还没有账户？</Text>
        </Divider>

        <Link to="/register">
          <Button block size="large" style={{ borderRadius: 8, height: 48 }}>
            立即注册
          </Button>
        </Link>
      </Card>
    </div>
  )
}

export default Login
