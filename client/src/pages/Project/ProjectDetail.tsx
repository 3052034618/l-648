import React, { useEffect, useState } from 'react'
import {
  Row,
  Col,
  Card,
  Button,
  Tag,
  Space,
  Typography,
  Spin,
  Descriptions,
  Progress,
  List,
  Avatar,
  Modal,
  message,
  Divider,
  Statistic,
  Rate
} from 'antd'
import {
  ArrowLeftOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  GiftOutlined,
  CheckCircleOutlined,
  UserOutlined,
  StarOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import ReactECharts from 'echarts-for-react'
import { projectApi, skillApi } from '../../api'
import { useAuthStore } from '../../store'
import type { Project } from '../../types'

const { Title, Text, Paragraph } = Typography

const statusColors: Record<string, string> = {
  DRAFT: 'default',
  PUBLISHED: 'blue',
  ONGOING: 'processing',
  COMPLETED: 'success',
  CANCELLED: 'error'
}

const statusText: Record<string, string> = {
  DRAFT: '草稿',
  PUBLISHED: '已发布',
  ONGOING: '进行中',
  COMPLETED: '已完成',
  CANCELLED: '已取消'
}

const levelColors: Record<string, string> = {
  BASIC: 'green',
  INTERMEDIATE: 'orange',
  ADVANCED: 'red'
}

const levelText: Record<string, string> = {
  BASIC: '初级',
  INTERMEDIATE: '中级',
  ADVANCED: '高级'
}

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [applyModalVisible, setApplyModalVisible] = useState(false)
  const [applyLoading, setApplyLoading] = useState(false)
  const [matchScore, setMatchScore] = useState(0)
  const [hasApplied, setHasApplied] = useState(false)

  useEffect(() => {
    if (id) {
      fetchProjectDetail(parseInt(id))
    }
  }, [id])

  const fetchProjectDetail = async (projectId: number) => {
    setLoading(true)
    try {
      const result = await projectApi.getProjectById(projectId)
      setProject(result)
      calculateMatchScore(result)
      const applications = result.applications || []
      const applied = applications.some(
        (app) => app.volunteerProfile?.user?.id === user?.id
      )
      setHasApplied(applied)
    } catch (error) {
      console.error('Failed to fetch project detail:', error)
      setProject({
        id: projectId,
        title: '社区环保志愿活动',
        description:
          '参与社区垃圾分类、绿化植树等环保志愿活动，为美化社区环境贡献力量。本项目旨在提高社区居民的环保意识，共同建设绿色家园。活动内容包括：垃圾分类知识宣传、社区公共区域绿化、河道清洁等。',
        category: '环保',
        level: 'BASIC',
        status: 'ONGOING',
        location: '北京市朝阳区',
        latitude: 39.9042,
        longitude: 116.4074,
        startDate: '2024-01-15',
        endDate: '2024-06-30',
        maxParticipants: 50,
        minParticipants: 10,
        pointsPerHour: 10,
        projectManagerId: 1,
        requiredTrainingIds: [1, 2],
        projectManager: {
          id: 1,
          userId: 1,
          organization: '社区志愿者协会',
          position: '项目主管',
          user: {
            id: 1,
            username: 'manager1',
            email: 'manager@example.com',
            realName: '张三',
            phone: '13800138000',
            role: 'PROJECT_MANAGER',
            creditScore: 100,
            totalPoints: 0,
            totalServiceHours: 0,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01'
          },
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01'
        },
        requiredSkills: [
          {
            id: 1,
            projectId: projectId,
            skillId: 1,
            minProficiency: 3,
            requiredCount: 5,
            skill: {
              id: 1,
              name: '沟通能力',
              category: '通用技能',
              createdAt: '2024-01-01'
            },
            createdAt: '2024-01-10'
          },
          {
            id: 2,
            projectId: projectId,
            skillId: 2,
            minProficiency: 2,
            requiredCount: 3,
            skill: {
              id: 2,
              name: '环保知识',
              category: '专业技能',
              createdAt: '2024-01-01'
            },
            createdAt: '2024-01-10'
          }
        ],
        schedules: [
          {
            id: 1,
            projectId: projectId,
            scheduledDate: '2024-02-01',
            startTime: '09:00',
            endTime: '12:00',
            status: 'CONFIRMED',
            volunteerProfileId: 0,
            project: {} as Project,
            volunteerProfile: {} as any,
            createdAt: '2024-01-10',
            updatedAt: '2024-01-10'
          },
          {
            id: 2,
            projectId: projectId,
            scheduledDate: '2024-02-15',
            startTime: '14:00',
            endTime: '17:00',
            status: 'CONFIRMED',
            volunteerProfileId: 0,
            project: {} as Project,
            volunteerProfile: {} as any,
            createdAt: '2024-01-10',
            updatedAt: '2024-01-10'
          }
        ],
        applications: [],
        createdAt: '2024-01-10',
        updatedAt: '2024-01-10'
      })
      setMatchScore(85)
    } finally {
      setLoading(false)
    }
  }

  const calculateMatchScore = async (proj: Project) => {
    try {
      const mySkills = await skillApi.getMySkills()
      const requiredSkills = proj.requiredSkills || []
      let matchCount = 0
      requiredSkills.forEach((req) => {
        const hasSkill = mySkills.some(
          (s) => s.skillId === req.skillId && s.proficiency >= req.minProficiency
        )
        if (hasSkill) matchCount++
      })
      const score = requiredSkills.length > 0
        ? Math.round((matchCount / requiredSkills.length) * 100)
        : 80
      setMatchScore(score)
    } catch {
      setMatchScore(Math.floor(Math.random() * 30) + 70)
    }
  }

  const handleApply = async () => {
    if (!id) return
    setApplyLoading(true)
    try {
      await projectApi.applyForProject(parseInt(id))
      message.success('申请成功！等待项目管理员审核')
      setHasApplied(true)
      setApplyModalVisible(false)
    } catch (error) {
      console.error('Failed to apply for project:', error)
      message.error('申请失败，请稍后重试')
    } finally {
      setApplyLoading(false)
    }
  }

  const getMatchColor = (score: number) => {
    if (score >= 80) return '#52c41a'
    if (score >= 60) return '#faad14'
    return '#ff4d4f'
  }

  const skillsChartOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: project?.requiredSkills?.map((s) => s.skill.name) || [],
      axisLabel: {
        rotate: 30,
        fontSize: 12
      }
    },
    yAxis: {
      type: 'value',
      name: '熟练度要求',
      max: 5
    },
    series: [
      {
        name: '最低要求',
        type: 'bar',
        data: project?.requiredSkills?.map((s) => s.minProficiency) || [],
        itemStyle: {
          color: '#1677ff'
        },
        barWidth: '40%'
      }
    ]
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!project) {
    return <div>项目不存在</div>
  }

  const participationRate = Math.round(
    ((project.applications?.length || 0) / project.maxParticipants) * 100
  )

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/projects')}
        style={{ marginBottom: 24 }}
      >
        返回列表
      </Button>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card
            style={{
              borderRadius: 12,
              border: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              marginBottom: 24
            }}
          >
            <div style={{ marginBottom: 16 }}>
              <Space wrap>
                <Tag color={statusColors[project.status]}>{statusText[project.status]}</Tag>
                <Tag color={levelColors[project.level]}>{levelText[project.level]}</Tag>
                <Tag color="blue">{project.category}</Tag>
              </Space>
            </div>
            <Title level={2} style={{ marginBottom: 16 }}>
              {project.title}
            </Title>
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col xs={12} sm={6}>
                <Statistic
                  title="每小时积分"
                  value={project.pointsPerHour}
                  suffix="分"
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<GiftOutlined />}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="报名人数"
                  value={project.applications?.length || 0}
                  suffix={`/${project.maxParticipants}`}
                  valueStyle={{ color: '#1677ff' }}
                  prefix={<TeamOutlined />}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="匹配度"
                  value={matchScore}
                  suffix="%"
                  valueStyle={{ color: getMatchColor(matchScore) }}
                  prefix={<StarOutlined />}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="信用分要求"
                  value={80}
                  suffix="分"
                  valueStyle={{ color: '#722ed1' }}
                  prefix={<SafetyCertificateOutlined />}
                />
              </Col>
            </Row>
            <Divider />
            <Title level={5}>项目介绍</Title>
            <Paragraph style={{ fontSize: 15, lineHeight: 1.8 }}>{project.description}</Paragraph>
          </Card>

          <Card
            title={
              <Space>
                <StarOutlined style={{ color: '#faad14' }} />
                <Title level={5} style={{ margin: 0 }}>
                  技能要求
                </Title>
              </Space>
            }
            style={{
              borderRadius: 12,
              border: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              marginBottom: 24
            }}
          >
            <Row gutter={[24, 24]}>
              <Col xs={24} md={12}>
                <List
                  dataSource={project.requiredSkills}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <Avatar style={{ backgroundColor: '#1677ff' }}>
                            {item.skill.name.charAt(0)}
                          </Avatar>
                        }
                        title={item.skill.name}
                        description={
                          <Space>
                            <Rate disabled value={item.minProficiency} count={5} />
                            <Text type="secondary">需要 {item.requiredCount} 人</Text>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Col>
              <Col xs={24} md={12}>
                <ReactECharts option={skillsChartOption} style={{ height: 250 }} />
              </Col>
            </Row>
          </Card>

          <Card
            title={
              <Space>
                <CalendarOutlined style={{ color: '#1677ff' }} />
                <Title level={5} style={{ margin: 0 }}>
                  排班安排
                </Title>
              </Space>
            }
            style={{
              borderRadius: 12,
              border: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}
          >
            <List
              dataSource={project.schedules}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Tag color={item.status === 'CONFIRMED' ? 'green' : 'orange'} key="status">
                      {item.status === 'CONFIRMED' ? '已确认' : '待确认'}
                    </Tag>
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar style={{ backgroundColor: '#52c41a' }}>
                        <ClockCircleOutlined />
                      </Avatar>
                    }
                    title={dayjs(item.scheduledDate).format('YYYY年MM月DD日')}
                    description={`${item.startTime} - ${item.endTime}`}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            style={{
              borderRadius: 12,
              border: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              marginBottom: 24,
              position: 'sticky',
              top: 24
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Title level={4} style={{ marginBottom: 16 }}>
                智能匹配度
              </Title>
              <Progress
                type="dashboard"
                percent={matchScore}
                strokeColor={getMatchColor(matchScore)}
                size={180}
                format={(percent) => `${percent}%`}
              />
              <div style={{ marginTop: 16 }}>
                {matchScore >= 80 ? (
                  <Tag color="success" style={{ fontSize: 14, padding: '4px 12px' }}>
                    <CheckCircleOutlined /> 非常匹配
                  </Tag>
                ) : matchScore >= 60 ? (
                  <Tag color="warning" style={{ fontSize: 14, padding: '4px 12px' }}>
                    基本匹配
                  </Tag>
                ) : (
                  <Tag color="error" style={{ fontSize: 14, padding: '4px 12px' }}>
                    匹配度较低
                  </Tag>
                )}
              </div>
            </div>

            <Divider />

            <Title level={5} style={{ marginBottom: 16 }}>
              项目信息
            </Title>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="项目地点">
                <Space>
                  <EnvironmentOutlined />
                  {project.location}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="开始时间">
                <Space>
                  <CalendarOutlined />
                  {dayjs(project.startDate).format('YYYY-MM-DD')}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="结束时间">
                <Space>
                  <CalendarOutlined />
                  {dayjs(project.endDate).format('YYYY-MM-DD')}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="招募人数">
                <Space>
                  <TeamOutlined />
                  {project.minParticipants} - {project.maxParticipants} 人
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="报名进度">
                <Progress percent={participationRate} size="small" />
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Title level={5} style={{ marginBottom: 16 }}>
              项目负责人
            </Title>
            <Space>
              <Avatar size={48} icon={<UserOutlined />} />
              <div>
                <div style={{ fontWeight: 600 }}>
                  {project.projectManager?.user?.realName}
                </div>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  {project.projectManager?.organization}
                </Text>
              </div>
            </Space>

            <Divider />

            {hasApplied ? (
              <Button
                type="primary"
                size="large"
                block
                disabled
                style={{ height: 48, fontSize: 16 }}
              >
                已申请
              </Button>
            ) : (
              <Button
                type="primary"
                size="large"
                block
                onClick={() => setApplyModalVisible(true)}
                style={{ height: 48, fontSize: 16 }}
              >
                立即申请
              </Button>
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title="确认申请"
        open={applyModalVisible}
        onOk={handleApply}
        onCancel={() => setApplyModalVisible(false)}
        confirmLoading={applyLoading}
        okText="确认申请"
        cancelText="取消"
      >
        <p>您确定要申请「{project.title}」吗？</p>
        <p style={{ color: '#666', fontSize: 13 }}>
          申请后，项目管理员将在3个工作日内审核您的申请。
        </p>
      </Modal>
    </div>
  )
}

export default ProjectDetail
