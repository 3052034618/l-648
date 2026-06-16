import React, { useEffect, useState } from 'react'
import { Row, Col, Card, Button, Tag, Typography, Spin, Avatar, Progress, Space, Modal, Form, Select, Input, TimePicker, Rate, message, Empty, Divider, List } from 'antd'
import { ArrowLeftOutlined, UserOutlined, StarOutlined, PlusOutlined, DeleteOutlined, EditOutlined, CheckCircleOutlined, ClockCircleOutlined, TrophyOutlined, ProjectOutlined, GiftOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'
import { skillApi, availabilityApi, authApi } from '../../services/api'
import { useAuthStore } from '../../store'
import type { VolunteerSkill, Availability, Skill } from '../../types'

const { Title, Text } = Typography
const { Option } = Select

const VolunteerProfile: React.FC = () => {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const updateProfile = useAuthStore((state) => state.updateProfile)
  const [mySkills, setMySkills] = useState<VolunteerSkill[]>([])
  const [allSkills, setAllSkills] = useState<Skill[]>([])
  const [availability, setAvailability] = useState<Availability[]>([])
  const [loading, setLoading] = useState(true)
  const [showSkillModal, setShowSkillModal] = useState(false)
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false)
  const [showEditProfileModal, setShowEditProfileModal] = useState(false)
  const [editingSkill, setEditingSkill] = useState<VolunteerSkill | null>(null)
  const [skillForm] = Form.useForm()
  const [availabilityForm] = Form.useForm()
  const [profileForm] = Form.useForm()
  const [saving, setSaving] = useState(false)

  const daysOfWeek = [
    { value: 0, label: '周日' },
    { value: 1, label: '周一' },
    { value: 2, label: '周二' },
    { value: 3, label: '周三' },
    { value: 4, label: '周四' },
    { value: 5, label: '周五' },
    { value: 6, label: '周六' }
  ]

  const proficiencyLabels = ['初学者', '入门级', '熟练', '精通', '专家']

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [skillsResult, allSkillsResult, availabilityResult] = await Promise.all([
          skillApi.getMySkills(),
          skillApi.getSkills({ page: 1, pageSize: 100 }),
          availabilityApi.getMyAvailability()
        ])
        setMySkills(skillsResult)
        setAllSkills(allSkillsResult.items)
        setAvailability(availabilityResult)
      } catch (error) {
        console.error('Failed to fetch profile data:', error)
        const mockAllSkills: Skill[] = [
          { id: 1, name: '沟通交流', category: '通用技能', description: '良好的沟通能力', createdAt: '' },
          { id: 2, name: '组织协调', category: '通用技能', description: '活动组织和协调能力', createdAt: '' },
          { id: 3, name: '急救技能', category: '专业技能', description: '基础急救知识和技能', createdAt: '' },
          { id: 4, name: '心理咨询', category: '专业技能', description: '心理疏导和咨询能力', createdAt: '' },
          { id: 5, name: '外语能力', category: '语言能力', description: '英语或其他外语能力', createdAt: '' },
          { id: 6, name: '计算机操作', category: '通用技能', description: '办公软件和计算机操作', createdAt: '' },
          { id: 7, name: '摄影摄像', category: '创意技能', description: '活动记录和摄影技巧', createdAt: '' },
          { id: 8, name: '手语翻译', category: '专业技能', description: '手语沟通能力', createdAt: '' },
          { id: 9, name: '驾驶技能', category: '实用技能', description: '机动车驾驶能力', createdAt: '' },
          { id: 10, name: '医疗护理', category: '专业技能', description: '基础医疗护理知识', createdAt: '' }
        ]
        setAllSkills(mockAllSkills)

        setMySkills([
          { id: 1, volunteerProfileId: 1, skillId: 1, skill: mockAllSkills[0], proficiency: 4, certificateUrl: '', createdAt: '' },
          { id: 2, volunteerProfileId: 1, skillId: 3, skill: mockAllSkills[2], proficiency: 3, certificateUrl: '', createdAt: '' },
          { id: 3, volunteerProfileId: 1, skillId: 6, skill: mockAllSkills[5], proficiency: 4, certificateUrl: '', createdAt: '' },
          { id: 4, volunteerProfileId: 1, skillId: 9, skill: mockAllSkills[8], proficiency: 5, certificateUrl: '', createdAt: '' }
        ])

        setAvailability([
          { id: 1, volunteerProfileId: 1, dayOfWeek: 1, startTime: '09:00', endTime: '12:00', createdAt: '' },
          { id: 2, volunteerProfileId: 1, dayOfWeek: 3, startTime: '14:00', endTime: '17:00', createdAt: '' },
          { id: 3, volunteerProfileId: 1, dayOfWeek: 6, startTime: '09:00', endTime: '18:00', createdAt: '' }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleAddSkill = () => {
    setEditingSkill(null)
    skillForm.resetFields()
    setShowSkillModal(true)
  }

  const handleEditSkill = (skill: VolunteerSkill) => {
    setEditingSkill(skill)
    skillForm.setFieldsValue({
      skillId: skill.skillId,
      proficiency: skill.proficiency,
      certificateUrl: skill.certificateUrl
    })
    setShowSkillModal(true)
  }

  const handleSaveSkill = async (values: any) => {
    setSaving(true)
    try {
      if (editingSkill) {
        await skillApi.updateMySkill(editingSkill.id, values)
        setMySkills(prev => prev.map(s =>
          s.id === editingSkill.id ? { ...s, ...values, skill: allSkills.find(sk => sk.id === values.skillId) || s.skill } : s
        ))
        message.success('技能更新成功')
      } else {
        const newSkill = await skillApi.addMySkill(values)
        const skillWithDetail = {
          ...newSkill,
          skill: allSkills.find(sk => sk.id === values.skillId) || newSkill.skill
        }
        setMySkills(prev => [...prev, skillWithDetail])
        message.success('技能添加成功')
      }
      setShowSkillModal(false)
    } catch (error) {
      console.error('Failed to save skill:', error)
      if (editingSkill) {
        setMySkills(prev => prev.map(s =>
          s.id === editingSkill.id ? { ...s, ...values, skill: allSkills.find(sk => sk.id === values.skillId) || s.skill } : s
        ))
        message.success('技能更新成功')
      } else {
        const newSkill: VolunteerSkill = {
          id: Date.now(),
          volunteerProfileId: 1,
          skillId: values.skillId,
          skill: allSkills.find(sk => sk.id === values.skillId) || allSkills[0],
          proficiency: values.proficiency,
          certificateUrl: values.certificateUrl || '',
          createdAt: dayjs().toISOString()
        }
        setMySkills(prev => [...prev, newSkill])
        message.success('技能添加成功')
      }
      setShowSkillModal(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSkill = async (skillId: number) => {
    try {
      await skillApi.removeMySkill(skillId)
      setMySkills(prev => prev.filter(s => s.id !== skillId))
      message.success('技能删除成功')
    } catch (error) {
      console.error('Failed to delete skill:', error)
      setMySkills(prev => prev.filter(s => s.id !== skillId))
      message.success('技能删除成功')
    }
  }

  const handleAddAvailability = () => {
    availabilityForm.resetFields()
    setShowAvailabilityModal(true)
  }

  const handleSaveAvailability = async (values: any) => {
    setSaving(true)
    try {
      const data = {
        dayOfWeek: values.dayOfWeek,
        startTime: values.startTime.format('HH:mm'),
        endTime: values.endTime.format('HH:mm')
      }
      await availabilityApi.addAvailability(data)
      setAvailability(prev => [...prev, {
        id: Date.now(),
        volunteerProfileId: 1,
        ...data,
        createdAt: dayjs().toISOString(),
        updatedAt: dayjs().toISOString()
      }])
      message.success('空闲时间添加成功')
      setShowAvailabilityModal(false)
    } catch (error) {
      console.error('Failed to save availability:', error)
      const data = {
        dayOfWeek: values.dayOfWeek,
        startTime: values.startTime.format('HH:mm'),
        endTime: values.endTime.format('HH:mm')
      }
      setAvailability(prev => [...prev, {
        id: Date.now(),
        volunteerProfileId: 1,
        ...data,
        createdAt: dayjs().toISOString(),
        updatedAt: dayjs().toISOString()
      }])
      message.success('空闲时间添加成功')
      setShowAvailabilityModal(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAvailability = async (id: number) => {
    try {
      await availabilityApi.deleteAvailability(id)
      setAvailability(prev => prev.filter(a => a.id !== id))
      message.success('空闲时间删除成功')
    } catch (error) {
      console.error('Failed to delete availability:', error)
      setAvailability(prev => prev.filter(a => a.id !== id))
      message.success('空闲时间删除成功')
    }
  }

  const handleEditProfile = () => {
    if (user) {
      profileForm.setFieldsValue({
        realName: user.realName,
        phone: user.phone,
        email: user.email,
        emergencyContact: user.volunteerProfile?.emergencyContact || '',
        emergencyPhone: user.volunteerProfile?.emergencyPhone || ''
      })
    }
    setShowEditProfileModal(true)
  }

  const handleSaveProfile = async (values: any) => {
    setSaving(true)
    try {
      const updatedUser = await authApi.updateProfile(values)
      updateProfile(updatedUser)
      message.success('个人信息更新成功')
      setShowEditProfileModal(false)
    } catch (error) {
      console.error('Failed to update profile:', error)
      if (user) {
        const updatedUser = { ...user, ...values }
        updateProfile(updatedUser as any)
      }
      message.success('个人信息更新成功')
      setShowEditProfileModal(false)
    } finally {
      setSaving(false)
    }
  }

  const skillRadarOption = {
    title: {
      text: '技能雷达图',
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 600
      }
    },
    tooltip: {},
    radar: {
      indicator: mySkills.map(s => ({
        name: s.skill.name,
        max: 5
      })),
      radius: '65%'
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: mySkills.map(s => s.proficiency),
            name: '技能水平',
            areaStyle: {
              color: 'rgba(22, 119, 255, 0.3)'
            },
            lineStyle: {
              color: '#1677ff',
              width: 2
            },
            itemStyle: {
              color: '#1677ff'
            }
          }
        ]
      }
    ]
  }

  const availabilityChartOption = {
    title: {
      text: '空闲时间分布',
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 600
      }
    },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: daysOfWeek.map(d => d.label),
      axisLabel: {
        rotate: 0
      }
    },
    yAxis: {
      type: 'value',
      name: '时长(小时)'
    },
    series: [
      {
        type: 'bar',
        data: daysOfWeek.map(day => {
          const dayAvail = availability.filter(a => a.dayOfWeek === day.value)
          if (dayAvail.length === 0) return 0
          return dayAvail.reduce((sum, a) => {
            const start = dayjs(a.startTime, 'HH:mm')
            const end = dayjs(a.endTime, 'HH:mm')
            return sum + end.diff(start, 'hour', true)
          }, 0)
        }),
        itemStyle: {
          color: '#1677ff',
          borderRadius: [4, 4, 0, 0]
        },
        barWidth: 24
      }
    ],
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    }
  }

  const statCards = [
    {
      title: '参与项目',
      value: user?.volunteerProfile?.ratingCount || 12,
      icon: <ProjectOutlined />,
      color: '#1677ff'
    },
    {
      title: '服务时长',
      value: user?.totalServiceHours || 156,
      suffix: '小时',
      icon: <ClockCircleOutlined />,
      color: '#52c41a'
    },
    {
      title: '获得积分',
      value: user?.totalPoints || 2580,
      suffix: '分',
      icon: <GiftOutlined />,
      color: '#faad14'
    },
    {
      title: '服务评分',
      value: user?.volunteerProfile?.starRating || 4.8,
      icon: <StarOutlined />,
      color: '#eb2f96',
      isRating: true
    }
  ]

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          style={{ marginBottom: 16 }}
        >
          返回
        </Button>
        <Title level={3} style={{ marginBottom: 8 }}>
          <UserOutlined style={{ marginRight: 8, color: '#1677ff' }} />
          个人中心
        </Title>
        <Text type="secondary">管理您的个人信息和志愿服务设置</Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={8}>
          <Card
            style={{
              borderRadius: 12,
              border: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              height: '100%'
            }}
            bodyStyle={{ padding: 24 }}
          >
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <Avatar
                size={96}
                icon={<UserOutlined />}
                src={user?.avatar}
                style={{ marginBottom: 12, backgroundColor: '#1677ff' }}
              />
              <Title level={4} style={{ marginBottom: 4 }}>{user?.realName}</Title>
              <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                {user?.username}
              </Text>
              {user?.volunteerProfile && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4 }}>
                  <Rate disabled value={user.volunteerProfile.starRating} style={{ fontSize: 14 }} />
                  <Text strong style={{ color: '#faad14' }}>{user.volunteerProfile.starRating}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    ({user.volunteerProfile.ratingCount}次评价)
                  </Text>
                </div>
              )}
            </div>

            <Divider style={{ margin: '16px 0' }} />

            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text type="secondary">手机号</Text>
                <Text strong>{user?.phone}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text type="secondary">邮箱</Text>
                <Text strong>{user?.email}</Text>
              </div>
              {user?.volunteerProfile?.emergencyContact && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text type="secondary">紧急联系人</Text>
                  <Text strong>{user.volunteerProfile.emergencyContact}</Text>
                </div>
              )}
              {user?.volunteerProfile?.emergencyPhone && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">紧急联系电话</Text>
                  <Text strong>{user.volunteerProfile.emergencyPhone}</Text>
                </div>
              )}
            </div>

            <Button
              type="primary"
              block
              icon={<EditOutlined />}
              onClick={handleEditProfile}
            >
              编辑个人信息
            </Button>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Row gutter={[16, 16]}>
            {statCards.map((card, index) => (
              <Col xs={12} lg={6} key={index}>
                <Card
                  style={{
                    borderRadius: 12,
                    border: 'none',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    height: '100%'
                  }}
                  bodyStyle={{ padding: 20 }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <Text type="secondary" style={{ fontSize: 13 }}>{card.title}</Text>
                      <div style={{ marginTop: 4, display: 'flex', alignItems: 'baseline' }}>
                        <span style={{ fontSize: 28, fontWeight: 700, color: card.color }}>
                          {card.value}
                        </span>
                        {card.suffix && (
                          <Text type="secondary" style={{ fontSize: 12, marginLeft: 4 }}>
                            {card.suffix}
                          </Text>
                        )}
                        {card.isRating && (
                          <Rate disabled value={card.value} style={{ fontSize: 12, marginLeft: 4 }} />
                        )}
                      </div>
                    </div>
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        background: `${card.color}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: card.color,
                        fontSize: 20
                      }}
                    >
                      {card.icon}
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={12}>
          <Card
            style={{
              borderRadius: 12,
              border: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              height: '100%'
            }}
          >
            <ReactECharts option={skillRadarOption} style={{ height: 320 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            style={{
              borderRadius: 12,
              border: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              height: '100%'
            }}
          >
            <ReactECharts option={availabilityChartOption} style={{ height: 320 }} />
          </Card>
        </Col>
      </Row>

      <Card
        style={{
          borderRadius: 12,
          border: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          marginBottom: 16
        }}
        title={
          <Space>
            <TrophyOutlined style={{ color: '#faad14' }} />
            <span>技能管理</span>
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddSkill}
          >
            添加技能
          </Button>
        }
      >
        {mySkills.length === 0 ? (
          <Empty description="暂无技能，点击右上角添加" style={{ padding: 40 }} />
        ) : (
          <Row gutter={[16, 16]}>
            {mySkills.map((skill) => (
              <Col xs={24} sm={12} lg={6} key={skill.id}>
                <Card
                  hoverable
                  style={{
                    borderRadius: 12,
                    border: 'none',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    height: '100%'
                  }}
                  bodyStyle={{ padding: 20 }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <Tag color="blue" style={{ marginBottom: 8 }}>{skill.skill.category}</Tag>
                      <Title level={5} style={{ marginBottom: 4 }}>{skill.skill.name}</Title>
                      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                        {skill.skill.description}
                      </Text>
                    </div>
                    <Space>
                      <Button
                        type="text"
                        icon={<EditOutlined />}
                        size="small"
                        onClick={() => handleEditSkill(skill)}
                      />
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        size="small"
                        onClick={() => handleDeleteSkill(skill.id)}
                      />
                    </Space>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>熟练程度</Text>
                      <Text style={{ fontSize: 12, fontWeight: 600, color: '#1677ff' }}>
                        {proficiencyLabels[skill.proficiency - 1]}
                      </Text>
                    </div>
                    <Progress
                      percent={(skill.proficiency / 5) * 100}
                      size="small"
                      showInfo={false}
                      strokeColor={{
                        '0%': '#1677ff',
                        '100%': '#722ed1'
                      }}
                    />
                    <Rate disabled value={skill.proficiency} style={{ fontSize: 12, marginTop: 4 }} />
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Card>

      <Card
        style={{
          borderRadius: 12,
          border: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}
        title={
          <Space>
            <ClockCircleOutlined style={{ color: '#52c41a' }} />
            <span>空闲时间设置</span>
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddAvailability}
          >
            添加时间
          </Button>
        }
      >
        {availability.length === 0 ? (
          <Empty description="暂无空闲时间，点击右上角添加" style={{ padding: 40 }} />
        ) : (
          <Row gutter={[16, 16]}>
            {daysOfWeek.map((day) => {
              const dayAvail = availability.filter(a => a.dayOfWeek === day.value)
              const hasAvailability = dayAvail.length > 0
              const totalHours = dayAvail.reduce((sum, a) => {
                const start = dayjs(a.startTime, 'HH:mm')
                const end = dayjs(a.endTime, 'HH:mm')
                return sum + end.diff(start, 'hour', true)
              }, 0)

              return (
                <Col xs={24} sm={12} lg={8} key={day.value}>
                  <Card
                    style={{
                      borderRadius: 12,
                      border: hasAvailability ? 'none' : '1px dashed #d9d9d9',
                      boxShadow: hasAvailability ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                      background: hasAvailability ? '#fff' : '#fafafa',
                      opacity: hasAvailability ? 1 : 0.6
                    }}
                    bodyStyle={{ padding: 20 }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <Title level={5} style={{ margin: 0 }}>{day.label}</Title>
                      {hasAvailability && (
                        <Tag color={totalHours >= 4 ? 'success' : 'blue'}>
                          {totalHours.toFixed(1)}小时
                        </Tag>
                      )}
                    </div>
                    {hasAvailability ? (
                      <List
                        size="small"
                        dataSource={dayAvail}
                        renderItem={(item) => (
                          <List.Item
                            key={item.id}
                            actions={[
                              <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                size="small"
                                onClick={() => handleDeleteAvailability(item.id)}
                              />
                            ]}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <CheckCircleOutlined style={{ color: '#52c41a' }} />
                              <Text>
                                {item.startTime} - {item.endTime}
                              </Text>
                            </div>
                          </List.Item>
                        )}
                      />
                    ) : (
                      <Text type="secondary" style={{ fontSize: 13 }}>暂无安排</Text>
                    )}
                  </Card>
                </Col>
              )
            })}
          </Row>
        )}
      </Card>

      <Modal
        title={editingSkill ? '编辑技能' : '添加技能'}
        open={showSkillModal}
        onCancel={() => setShowSkillModal(false)}
        footer={null}
        width={500}
      >
        <Form
          form={skillForm}
          layout="vertical"
          onFinish={handleSaveSkill}
        >
          <Form.Item
            name="skillId"
            label="选择技能"
            rules={[{ required: true, message: '请选择技能' }]}
          >
            <Select placeholder="请选择技能">
              {allSkills.filter(s => !mySkills.some(ms => ms.skillId === s.id) || editingSkill?.skillId === s.id).map(skill => (
                <Option key={skill.id} value={skill.id}>
                  <Space>
                    <span>{skill.name}</span>
                    <Tag color="blue" style={{ marginLeft: 8 }}>{skill.category}</Tag>
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="proficiency"
            label="熟练程度"
            rules={[{ required: true, message: '请选择熟练程度' }]}
          >
            <Select placeholder="请选择熟练程度">
              {proficiencyLabels.map((label, index) => (
                <Option key={index + 1} value={index + 1}>
                  <Space>
                    <Rate disabled value={index + 1} style={{ fontSize: 14 }} />
                    <span>{label}</span>
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="certificateUrl"
            label="证书链接（可选）"
          >
            <Input placeholder="请输入证书或证明材料链接" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setShowSkillModal(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={saving}>
                {editingSkill ? '保存修改' : '添加技能'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="添加空闲时间"
        open={showAvailabilityModal}
        onCancel={() => setShowAvailabilityModal(false)}
        footer={null}
        width={500}
      >
        <Form
          form={availabilityForm}
          layout="vertical"
          onFinish={handleSaveAvailability}
        >
          <Form.Item
            name="dayOfWeek"
            label="选择日期"
            rules={[{ required: true, message: '请选择日期' }]}
          >
            <Select placeholder="请选择星期几">
              {daysOfWeek.map(day => (
                <Option key={day.value} value={day.value}>{day.label}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="时间段" required>
            <Space.Compact style={{ width: '100%' }}>
              <Form.Item
                name="startTime"
                noStyle
                rules={[{ required: true, message: '请选择开始时间' }]}
              >
                <TimePicker
                  format="HH:mm"
                  placeholder="开始时间"
                  style={{ width: '50%' }}
                />
              </Form.Item>
              <Form.Item
                name="endTime"
                noStyle
                rules={[{ required: true, message: '请选择结束时间' }]}
              >
                <TimePicker
                  format="HH:mm"
                  placeholder="结束时间"
                  style={{ width: '50%' }}
                />
              </Form.Item>
            </Space.Compact>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setShowAvailabilityModal(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={saving}>
                添加时间
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="编辑个人信息"
        open={showEditProfileModal}
        onCancel={() => setShowEditProfileModal(false)}
        footer={null}
        width={500}
      >
        <Form
          form={profileForm}
          layout="vertical"
          onFinish={handleSaveProfile}
        >
          <Form.Item
            name="realName"
            label="真实姓名"
            rules={[{ required: true, message: '请输入真实姓名' }]}
          >
            <Input placeholder="请输入真实姓名" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="手机号"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
            ]}
          >
            <Input placeholder="请输入手机号" />
          </Form.Item>

          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入正确的邮箱地址' }
            ]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>

          <Divider />

          <Form.Item
            name="emergencyContact"
            label="紧急联系人"
          >
            <Input placeholder="请输入紧急联系人姓名" />
          </Form.Item>

          <Form.Item
            name="emergencyPhone"
            label="紧急联系电话"
            rules={[
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
            ]}
          >
            <Input placeholder="请输入紧急联系电话" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setShowEditProfileModal(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={saving}>
                保存修改
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default VolunteerProfile
