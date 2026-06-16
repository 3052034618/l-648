import React, { useState } from 'react'
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Radio,
  message,
  Space,
  Steps,
  Divider
} from 'antd'
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  TeamOutlined,
  IdcardOutlined,
  BuildOutlined,
  SafetyCertificateOutlined,
  ArrowLeftOutlined,
  CheckCircleOutlined
} from '@ant-design/icons'
import { useNavigate, Link } from 'react-router-dom'
import { checkUsername, checkEmail, checkPhone } from '../../api'
import { useAuthStore } from '../../store'
import { Role, RegisterData } from '../../types'

const { Title, Text } = Typography
const { Step } = Steps
const { Password } = Input

interface RegisterFormData {
  username: string
  email: string
  phone: string
  realName: string
  password: string
  confirmPassword: string
  role: Role
  idCard?: string
  organization?: string
  position?: string
}

const roleOptions = [
  {
    value: 'VOLUNTEER' as Role,
    label: '志愿者',
    description: '参与志愿服务活动，积累积分和经验',
    icon: <UserOutlined />
  },
  {
    value: 'PROJECT_MANAGER' as Role,
    label: '项目负责人',
    description: '创建和管理志愿服务项目',
    icon: <SafetyCertificateOutlined />
  },
  {
    value: 'ADMIN' as Role,
    label: '管理员',
    description: '系统管理和平台运营',
    icon: <TeamOutlined />
  }
]

const Register: React.FC = () => {
  const navigate = useNavigate()
  const register = useAuthStore((state) => state.register)
  const authLoading = useAuthStore((state) => state.loading)
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedRole, setSelectedRole] = useState<Role>('VOLUNTEER')
  const [form] = Form.useForm<RegisterFormData>()

  const validateUsername = async (_: any, value: string) => {
    if (!value) return Promise.resolve()
    try {
      const result = await checkUsername(value)
      if (!result.available) {
        return Promise.reject(new Error('用户名已被使用'))
      }
      return Promise.resolve()
    } catch {
      return Promise.resolve()
    }
  }

  const validateEmail = async (_: any, value: string) => {
    if (!value) return Promise.resolve()
    try {
      const result = await checkEmail(value)
      if (!result.available) {
        return Promise.reject(new Error('邮箱已被注册'))
      }
      return Promise.resolve()
    } catch {
      return Promise.resolve()
    }
  }

  const validatePhone = async (_: any, value: string) => {
    if (!value) return Promise.resolve()
    try {
      const result = await checkPhone(value)
      if (!result.available) {
        return Promise.reject(new Error('手机号已被注册'))
      }
      return Promise.resolve()
    } catch {
      return Promise.resolve()
    }
  }

  const handleNext = async () => {
    try {
      const fields =
        currentStep === 0
          ? ['username', 'email', 'phone', 'password', 'confirmPassword']
          : currentStep === 1
          ? ['realName', 'role']
          : []

      await form.validateFields(fields)
      setCurrentStep(currentStep + 1)
    } catch {
      // Validation failed
    }
  }

  const handlePrev = () => {
    setCurrentStep(currentStep - 1)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)

      const registerData: RegisterData = {
        username: values.username,
        email: values.email,
        phone: values.phone,
        realName: values.realName,
        password: values.password,
        role: selectedRole,
        idCard: values.idCard,
        organization: values.organization,
        position: values.position
      }

      await register(registerData)
      message.success('注册成功！')
      navigate('/')
    } catch (error) {
      console.error('Register error:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Form.Item
              name="username"
              label="用户名"
              rules={[
                { required: true, message: '请输入用户名' },
                { min: 4, message: '用户名至少4个字符' },
                { validator: validateUsername }
              ]}
            >
              <Input
                prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
                placeholder="请输入用户名"
                autoComplete="username"
              />
            </Form.Item>

            <Form.Item
              name="email"
              label="邮箱"
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入有效的邮箱地址' },
                { validator: validateEmail }
              ]}
            >
              <Input
                prefix={<MailOutlined style={{ color: '#bfbfbf' }} />}
                placeholder="请输入邮箱地址"
                autoComplete="email"
              />
            </Form.Item>

            <Form.Item
              name="phone"
              label="手机号"
              rules={[
                { required: true, message: '请输入手机号' },
                { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' },
                { validator: validatePhone }
              ]}
            >
              <Input
                prefix={<PhoneOutlined style={{ color: '#bfbfbf' }} />}
                placeholder="请输入手机号"
                autoComplete="tel"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="密码"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6个字符' }
              ]}
              hasFeedback
            >
              <Password
                prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                placeholder="请输入密码"
                autoComplete="new-password"
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="确认密码"
              dependencies={['password']}
              hasFeedback
              rules={[
                { required: true, message: '请确认密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve()
                    }
                    return Promise.reject(new Error('两次输入的密码不一致'))
                  }
                })
              ]}
            >
              <Password
                prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                placeholder="请再次输入密码"
                autoComplete="new-password"
              />
            </Form.Item>
          </Space>
        )

      case 1:
        return (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Form.Item
              name="realName"
              label="真实姓名"
              rules={[{ required: true, message: '请输入真实姓名' }]}
            >
              <Input
                prefix={<IdcardOutlined style={{ color: '#bfbfbf' }} />}
                placeholder="请输入真实姓名"
              />
            </Form.Item>

            <Form.Item
              name="role"
              label="选择角色"
              rules={[{ required: true, message: '请选择角色' }]}
            >
              <Radio.Group
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                style={{ width: '100%' }}
              >
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  {roleOptions.map((option) => (
                    <Radio.Button
                      key={option.value}
                      value={option.value}
                      style={{
                        width: '100%',
                        height: 'auto',
                        padding: 16,
                        borderRadius: 8,
                        border: selectedRole === option.value ? '2px solid #1677ff' : '1px solid #d9d9d9',
                        background: selectedRole === option.value ? '#e6f4ff' : '#fff'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 8,
                            background:
                              selectedRole === option.value
                                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                : '#f5f5f5',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: selectedRole === option.value ? '#fff' : '#8c8c8c',
                            fontSize: 20
                          }}
                        >
                          {option.icon}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
                            {option.label}
                          </div>
                          <div style={{ color: '#8c8c8c', fontSize: 13 }}>{option.description}</div>
                        </div>
                        {selectedRole === option.value && (
                          <CheckCircleOutlined style={{ color: '#1677ff', fontSize: 20 }} />
                        )}
                      </div>
                    </Radio.Button>
                  ))}
                </Space>
              </Radio.Group>
            </Form.Item>
          </Space>
        )

      case 2:
        return (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Form.Item name="idCard" label="身份证号">
              <Input
                prefix={<IdcardOutlined style={{ color: '#bfbfbf' }} />}
                placeholder="请输入身份证号（选填）"
              />
            </Form.Item>

            <Form.Item name="organization" label="所属单位/组织">
              <Input
                prefix={<BuildOutlined style={{ color: '#bfbfbf' }} />}
                placeholder="请输入所属单位或组织（选填）"
              />
            </Form.Item>

            {selectedRole === 'PROJECT_MANAGER' && (
              <Form.Item name="position" label="职位">
                <Input
                  prefix={<SafetyCertificateOutlined style={{ color: '#bfbfbf' }} />}
                  placeholder="请输入职位（选填）"
                />
              </Form.Item>
            )}
          </Space>
        )

      default:
        return null
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '40px 20px'
      }}
    >
      <Card
        style={{
          width: 560,
          borderRadius: 16,
          boxShadow: '0 24px 48px rgba(0,0,0,0.15)'
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
            注册账户
          </Title>
          <Text type="secondary">创建您的志愿服务账户</Text>
        </div>

        <Steps current={currentStep} style={{ marginBottom: 32 }}>
          <Step title="账户信息" />
          <Step title="选择角色" />
          <Step title="完善资料" />
        </Steps>

        <Form form={form} layout="vertical" size="large">
          {renderStepContent()}

          <Divider style={{ margin: '32px 0 24px' }} />

          <div style={{ display: 'flex', gap: 12 }}>
            {currentStep > 0 && (
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={handlePrev}
                style={{ flex: 1, height: 48, borderRadius: 8 }}
              >
                上一步
              </Button>
            )}
            {currentStep < 2 ? (
              <Button
                type="primary"
                onClick={handleNext}
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: 8,
                  fontSize: 16,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none'
                }}
              >
                下一步
              </Button>
            ) : (
              <Button
                type="primary"
                onClick={handleSubmit}
                loading={loading || authLoading}
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: 8,
                  fontSize: 16,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none'
                }}
              >
                完成注册
              </Button>
            )}
          </div>
        </Form>

        <Divider plain>
          <Text type="secondary">已有账户？</Text>
        </Divider>

        <Link to="/login">
          <Button block size="large" style={{ borderRadius: 8, height: 48 }}>
            立即登录
          </Button>
        </Link>
      </Card>
    </div>
  )
}

export default Register
