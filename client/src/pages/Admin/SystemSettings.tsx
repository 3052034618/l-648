import React, { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Form,
  Input,
  InputNumber,
  Switch,
  Button,
  Space,
  message,
  Tabs,
  Divider,
  Alert,
  Tag,
  Modal,
  Upload,
  Image,
  List,
  Avatar,
} from 'antd'
import {
  SettingOutlined,
  NotificationOutlined,
  SafetyOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  SaveOutlined,
  UploadOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'
import type { UploadProps } from 'antd/es/upload/interface'
import { adminApi } from '../../services/api'
import type { SystemSettings } from '../../types'

const { TextArea } = Input
const { TabPane } = Tabs
const { Dragger } = Upload

const SystemSettings: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<Record<string, any>>({})
  const [activeTab, setActiveTab] = useState('basic')
  const [logoImage, setLogoImage] = useState<string | null>(null)
  const [contactModalVisible, setContactModalVisible] = useState(false)
  const [editingContact, setEditingContact] = useState<any>(null)
  const [contactForm] = Form.useForm()

  const [basicForm] = Form.useForm()
  const [notificationForm] = Form.useForm()
  const [securityForm] = Form.useForm()

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const data = await adminApi.getSystemSettings()
      const settingsObj: Record<string, any> = {}
      data.forEach((item) => {
        settingsObj[item.key] = item.value
      })
      setSettings(settingsObj)
      basicForm.setFieldsValue(settingsObj.basic || {})
      notificationForm.setFieldsValue(settingsObj.notification || {})
      securityForm.setFieldsValue(settingsObj.security || {})
      if (settingsObj.basic?.logo) {
        setLogoImage(settingsObj.basic.logo)
      }
    } catch (error) {
      message.error('获取系统设置失败')
      const mockSettings: Record<string, any> = {
        basic: {
          siteName: '志愿服务管理系统',
          siteDescription: '专业的志愿服务管理平台，致力于连接志愿者与公益项目',
          logo: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=200&h=200&fit=crop',
          contactEmail: 'contact@volunteer.org',
          contactPhone: '400-123-4567',
          address: '北京市朝阳区志愿者大厦12层',
          workHours: '周一至周五 9:00-18:00',
          copyright: '© 2024 志愿服务管理系统 版权所有',
          icpNumber: '京ICP备12345678号',
        },
        notification: {
          enableEmail: true,
          enableSms: false,
          enablePush: true,
          newProjectNotify: true,
          scheduleNotify: true,
          attendanceNotify: true,
          reviewNotify: true,
          systemNotify: true,
        },
        security: {
          sessionTimeout: 30,
          maxLoginAttempts: 5,
          lockDuration: 30,
          enableTwoFactor: false,
          passwordMinLength: 8,
          passwordRequireNumber: true,
          passwordRequireSpecial: true,
          passwordRequireUppercase: true,
        },
        contacts: [
          { id: 1, name: '系统管理员', role: '技术支持', email: 'admin@volunteer.org', phone: '138-0000-0001', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop' },
          { id: 2, name: '李老师', role: '项目顾问', email: 'li@volunteer.org', phone: '138-0000-0002', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop' },
          { id: 3, name: '王经理', role: '运营主管', email: 'wang@volunteer.org', phone: '138-0000-0003', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop' },
        ],
      }
      setSettings(mockSettings)
      basicForm.setFieldsValue(mockSettings.basic)
      notificationForm.setFieldsValue(mockSettings.notification)
      securityForm.setFieldsValue(mockSettings.security)
      if (mockSettings.basic.logo) {
        setLogoImage(mockSettings.basic.logo)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const handleSaveBasic = async (values: any) => {
    setSaving(true)
    try {
      const submitData = { ...values, logo: logoImage }
      await adminApi.updateSystemSetting('basic', submitData)
      message.success('基本设置保存成功')
      setSettings({ ...settings, basic: submitData })
    } catch (error) {
      message.error('保存成功（模拟）')
      setSettings({ ...settings, basic: values })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveNotification = async (values: any) => {
    setSaving(true)
    try {
      await adminApi.updateSystemSetting('notification', values)
      message.success('通知设置保存成功')
      setSettings({ ...settings, notification: values })
    } catch (error) {
      message.error('保存成功（模拟）')
      setSettings({ ...settings, notification: values })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveSecurity = async (values: any) => {
    setSaving(true)
    try {
      await adminApi.updateSystemSetting('security', values)
      message.success('安全设置保存成功')
      setSettings({ ...settings, security: values })
    } catch (error) {
      message.error('保存成功（模拟）')
      setSettings({ ...settings, security: values })
    } finally {
      setSaving(false)
    }
  }

  const handleAddContact = () => {
    setEditingContact(null)
    contactForm.resetFields()
    setContactModalVisible(true)
  }

  const handleEditContact = (contact: any) => {
    setEditingContact(contact)
    contactForm.setFieldsValue(contact)
    setContactModalVisible(true)
  }

  const handleDeleteContact = (id: number) => {
    const contacts = settings.contacts || []
    const updatedContacts = contacts.filter((c: any) => c.id !== id)
    setSettings({ ...settings, contacts: updatedContacts })
    message.success('删除成功')
  }

  const handleContactSubmit = (values: any) => {
    const contacts = settings.contacts || []
    let updatedContacts: any[]
    if (editingContact) {
      updatedContacts = contacts.map((c: any) =>
        c.id === editingContact.id ? { ...c, ...values } : c
      )
    } else {
      const newContact = {
        id: Math.max(...contacts.map((c: any) => c.id), 0) + 1,
        ...values,
        avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 100000000)}?w=100&h=100&fit=crop`,
      }
      updatedContacts = [...contacts, newContact]
    }
    setSettings({ ...settings, contacts: updatedContacts })
    setContactModalVisible(false)
    message.success(editingContact ? '更新成功' : '添加成功')
  }

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    showUploadList: false,
    beforeUpload: (file) => {
      const isImage = file.type.startsWith('image/')
      if (!isImage) {
        message.error('只能上传图片文件!')
        return false
      }
      const isLt2M = file.size / 1024 / 1024 < 2
      if (!isLt2M) {
        message.error('图片大小不能超过 2MB!')
        return false
      }
      const reader = new FileReader()
      reader.onload = (e) => {
        setLogoImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      return false
    },
  }

  const contacts = settings.contacts || []

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">系统设置</h2>
        <p className="text-gray-500">配置系统参数和功能选项</p>
      </div>

      <Card loading={loading}>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane
            tab={
              <span>
                <SettingOutlined /> 基本设置
              </span>
            }
            key="basic"
          >
            <Alert
              message="系统基本信息"
              description="配置网站基本信息、联系方式等内容，修改后将立即生效。"
              type="info"
              showIcon
              className="mb-6"
            />

            <Form
              form={basicForm}
              layout="vertical"
              onFinish={handleSaveBasic}
              initialValues={settings.basic}
            >
              <Row gutter={24}>
                <Col xs={24} lg={16}>
                  <Card title="网站信息" size="small" className="mb-6">
                    <Form.Item
                      name="siteName"
                      label="网站名称"
                      rules={[
                        { required: true, message: '请输入网站名称' },
                        { max: 50, message: '名称不能超过50个字符' },
                      ]}
                    >
                      <Input placeholder="请输入网站名称" />
                    </Form.Item>
                    <Form.Item
                      name="siteDescription"
                      label="网站描述"
                      rules={[
                        { required: true, message: '请输入网站描述' },
                        { max: 200, message: '描述不能超过200个字符' },
                      ]}
                    >
                      <TextArea rows={3} placeholder="请输入网站描述" />
                    </Form.Item>
                    <Form.Item
                      name="copyright"
                      label="版权信息"
                      rules={[{ max: 100, message: '版权信息不能超过100个字符' }]}
                    >
                      <Input placeholder="请输入版权信息" />
                    </Form.Item>
                    <Form.Item
                      name="icpNumber"
                      label="ICP备案号"
                      rules={[{ max: 50, message: '备案号不能超过50个字符' }]}
                    >
                      <Input placeholder="请输入ICP备案号" />
                    </Form.Item>
                  </Card>

                  <Card title="联系方式" size="small" className="mb-6">
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          name="contactEmail"
                          label="联系邮箱"
                          rules={[
                            { required: true, message: '请输入联系邮箱' },
                            { type: 'email', message: '请输入有效的邮箱地址' },
                          ]}
                        >
                          <Input prefix={<MailOutlined />} placeholder="contact@example.com" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="contactPhone"
                          label="联系电话"
                          rules={[
                            { required: true, message: '请输入联系电话' },
                            { pattern: /^[\d-]{7,20}$/, message: '请输入有效的电话号码' },
                          ]}
                        >
                          <Input prefix={<PhoneOutlined />} placeholder="400-123-4567" />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Form.Item
                      name="address"
                      label="联系地址"
                      rules={[{ max: 200, message: '地址不能超过200个字符' }]}
                    >
                      <Input prefix={<EnvironmentOutlined />} placeholder="请输入联系地址" />
                    </Form.Item>
                    <Form.Item
                      name="workHours"
                      label="工作时间"
                      rules={[{ max: 100, message: '工作时间不能超过100个字符' }]}
                    >
                      <Input placeholder="如：周一至周五 9:00-18:00" />
                    </Form.Item>
                  </Card>
                </Col>

                <Col xs={24} lg={8}>
                  <Card title="网站Logo" size="small">
                    <div className="text-center">
                      <div className="mb-4">
                        {logoImage ? (
                          <div className="relative inline-block">
                            <Image
                              width={150}
                              height={150}
                              src={logoImage}
                              style={{ borderRadius: 8, objectFit: 'cover', border: '1px solid #e8e8e8' }}
                            />
                            <Button
                              type="text"
                              danger
                              size="small"
                              className="absolute -top-2 -right-2"
                              onClick={() => setLogoImage(null)}
                            >
                              <DeleteOutlined />
                            </Button>
                          </div>
                        ) : (
                          <Dragger {...uploadProps} style={{ width: 150, height: 150, padding: 0, margin: '0 auto' }}>
                            <p className="text-2xl text-gray-400">
                              <UploadOutlined />
                            </p>
                            <p className="text-xs text-gray-400">点击上传Logo</p>
                          </Dragger>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">• 支持 JPG、PNG 格式</p>
                      <p className="text-xs text-gray-500">• 建议尺寸 200x200 像素</p>
                      <p className="text-xs text-gray-500">• 文件大小不超过 2MB</p>
                    </div>
                  </Card>

                  <Card title="主要联系人" size="small" className="mt-6" extra={
                    <Button type="link" size="small" icon={<PlusOutlined />} onClick={handleAddContact}>
                      添加
                    </Button>
                  }>
                    {contacts.length > 0 ? (
                      <List
                        size="small"
                        dataSource={contacts}
                        renderItem={(item: any) => (
                          <List.Item
                            actions={[
                              <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleEditContact(item)} />,
                              <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteContact(item.id)} />,
                            ]}
                          >
                            <List.Item.Meta
                              avatar={<Avatar src={item.avatar} size="small" />}
                              title={item.name}
                              description={
                                <Space>
                                  <Tag color="blue">{item.role}</Tag>
                                  <span className="text-xs text-gray-400">{item.email}</span>
                                </Space>
                              }
                            />
                          </List.Item>
                        )}
                      />
                    ) : (
                      <div className="text-center text-gray-400 py-4">
                        <UserOutlined className="text-3xl mb-2" />
                        <p className="text-sm">暂无联系人</p>
                      </div>
                    )}
                  </Card>
                </Col>
              </Row>

              <Divider />

              <div className="flex justify-end">
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
                  保存设置
                </Button>
              </div>
            </Form>
          </TabPane>

          <TabPane
            tab={
              <span>
                <NotificationOutlined /> 通知设置
              </span>
            }
            key="notification"
          >
            <Alert
              message="通知配置"
              description="配置系统通知方式和内容，用户将按照这些设置接收相关通知。"
              type="info"
              showIcon
              className="mb-6"
            />

            <Form
              form={notificationForm}
              layout="vertical"
              onFinish={handleSaveNotification}
              initialValues={settings.notification}
            >
              <Card title="通知渠道" size="small" className="mb-6">
                <Row gutter={24}>
                  <Col xs={24} sm={8}>
                    <Form.Item
                      name="enableEmail"
                      label="邮件通知"
                      valuePropName="checked"
                      extra="通过邮件发送重要通知"
                    >
                      <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item
                      name="enableSms"
                      label="短信通知"
                      valuePropName="checked"
                      extra="通过短信发送紧急通知"
                    >
                      <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item
                      name="enablePush"
                      label="推送通知"
                      valuePropName="checked"
                      extra="通过浏览器推送实时通知"
                    >
                      <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>

              <Card title="通知内容" size="small" className="mb-6">
                <Row gutter={24}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="newProjectNotify"
                      label="新项目通知"
                      valuePropName="checked"
                      extra="有新项目发布时通知"
                    >
                      <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="scheduleNotify"
                      label="排班通知"
                      valuePropName="checked"
                      extra="排班有变动时通知"
                    >
                      <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="attendanceNotify"
                      label="签到通知"
                      valuePropName="checked"
                      extra="签到提醒和异常通知"
                    >
                      <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="reviewNotify"
                      label="评价通知"
                      valuePropName="checked"
                      extra="收到新评价时通知"
                    >
                      <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="systemNotify"
                      label="系统通知"
                      valuePropName="checked"
                      extra="系统公告和维护通知"
                    >
                      <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>

              <Divider />

              <div className="flex justify-end">
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
                  保存设置
                </Button>
              </div>
            </Form>
          </TabPane>

          <TabPane
            tab={
              <span>
                <SafetyOutlined /> 安全设置
              </span>
            }
            key="security"
          >
            <Alert
              message="安全配置"
              description="配置系统安全相关参数，包括会话管理、密码策略等。请谨慎修改这些设置。"
              type="warning"
              showIcon
              className="mb-6"
            />

            <Form
              form={securityForm}
              layout="vertical"
              onFinish={handleSaveSecurity}
              initialValues={settings.security}
            >
              <Card title="会话管理" size="small" className="mb-6">
                <Row gutter={24}>
                  <Col xs={24} sm={8}>
                    <Form.Item
                      name="sessionTimeout"
                      label="会话超时时间"
                      rules={[
                        { required: true, message: '请输入会话超时时间' },
                        { type: 'number', min: 5, max: 120, message: '超时时间应在5-120分钟之间' },
                      ]}
                      extra="用户无操作多长时间后自动登出（分钟）"
                    >
                      <InputNumber style={{ width: '100%' }} min={5} max={120} addonAfter="分钟" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item
                      name="maxLoginAttempts"
                      label="最大登录尝试次数"
                      rules={[
                        { required: true, message: '请输入最大尝试次数' },
                        { type: 'number', min: 3, max: 10, message: '尝试次数应在3-10次之间' },
                      ]}
                      extra="连续失败多少次后锁定账号"
                    >
                      <InputNumber style={{ width: '100%' }} min={3} max={10} addonAfter="次" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item
                      name="lockDuration"
                      label="账号锁定时长"
                      rules={[
                        { required: true, message: '请输入锁定时长' },
                        { type: 'number', min: 5, max: 120, message: '锁定时长应在5-120分钟之间' },
                      ]}
                      extra="账号被锁定后多少分钟解锁"
                    >
                      <InputNumber style={{ width: '100%' }} min={5} max={120} addonAfter="分钟" />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>

              <Card title="密码策略" size="small" className="mb-6">
                <Row gutter={24}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="passwordMinLength"
                      label="密码最小长度"
                      rules={[
                        { required: true, message: '请输入最小长度' },
                        { type: 'number', min: 6, max: 20, message: '长度应在6-20之间' },
                      ]}
                    >
                      <InputNumber style={{ width: '100%' }} min={6} max={20} addonAfter="位" />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={24}>
                  <Col xs={24} sm={8}>
                    <Form.Item
                      name="passwordRequireNumber"
                      label="必须包含数字"
                      valuePropName="checked"
                    >
                      <Switch checkedChildren="要求" unCheckedChildren="不要求" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item
                      name="passwordRequireUppercase"
                      label="必须包含大写字母"
                      valuePropName="checked"
                    >
                      <Switch checkedChildren="要求" unCheckedChildren="不要求" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item
                      name="passwordRequireSpecial"
                      label="必须包含特殊字符"
                      valuePropName="checked"
                    >
                      <Switch checkedChildren="要求" unCheckedChildren="不要求" />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>

              <Card title="双因素认证" size="small" className="mb-6">
                <Row gutter={24}>
                  <Col xs={24}>
                    <Form.Item
                      name="enableTwoFactor"
                      label="开启双因素认证"
                      valuePropName="checked"
                      extra={
                        <span className="text-gray-500">
                          <InfoCircleOutlined /> 开启后，用户登录时需要额外输入验证码
                        </span>
                      }
                    >
                      <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>

              <Divider />

              <div className="flex justify-end">
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
                  保存设置
                </Button>
              </div>
            </Form>
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title={editingContact ? '编辑联系人' : '添加联系人'}
        open={contactModalVisible}
        onCancel={() => setContactModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={contactForm} layout="vertical" onFinish={handleContactSubmit}>
          <Form.Item
            name="name"
            label="姓名"
            rules={[
              { required: true, message: '请输入姓名' },
              { max: 20, message: '姓名不能超过20个字符' },
            ]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item
            name="role"
            label="职位/角色"
            rules={[
              { required: true, message: '请输入职位' },
              { max: 50, message: '职位不能超过50个字符' },
            ]}
          >
            <Input placeholder="如：技术支持、项目顾问" />
          </Form.Item>
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item
            name="phone"
            label="联系电话"
            rules={[
              { required: true, message: '请输入联系电话' },
              { pattern: /^[\d-]{7,20}$/, message: '请输入有效的电话号码' },
            ]}
          >
            <Input placeholder="请输入联系电话" />
          </Form.Item>
          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button onClick={() => setContactModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                {editingContact ? '更新' : '添加'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default SystemSettings
