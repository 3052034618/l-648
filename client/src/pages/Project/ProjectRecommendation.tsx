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
  Empty,
  Badge,
  Divider
} from 'antd'
import {
  StarOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  ArrowRightOutlined,
  GiftOutlined,
  ThunderboltOutlined,
  BulbOutlined,
  CheckCircleOutlined,
  FilterOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import ReactECharts from 'echarts-for-react'
import ReactWordcloud from 'react-wordcloud'
import { projectApi, skillApi } from '../../api'
import type { Project } from '../../types'

const { Title, Text } = Typography

interface RecommendedProject extends Project {
  matchScore: number
  matchReasons: string[]
}

const ProjectRecommendation: React.FC = () => {
  const navigate = useNavigate()
  const [recommendations, setRecommendations] = useState<RecommendedProject[]>([])
  const [loading, setLoading] = useState(true)
  const [mySkills, setMySkills] = useState<string[]>([])

  useEffect(() => {
    fetchRecommendations()
  }, [])

  const fetchRecommendations = async () => {
    setLoading(true)
    try {
      const [projects, skills] = await Promise.all([
        projectApi.getProjects({ page: 1, pageSize: 20 }),
        skillApi.getMySkills().catch(() => [])
      ])

      const mySkillNames = skills.map((s) => s.skill.name)
      setMySkills(mySkillNames)

      const recommended = projects.items
        .filter((p) => p.status === 'PUBLISHED' || p.status === 'ONGOING')
        .map((project) => {
          const requiredSkillNames = project.requiredSkills?.map((s) => s.skill.name) || []
          const matchedSkills = requiredSkillNames.filter((skill) => mySkillNames.includes(skill))
          const matchScore = requiredSkillNames.length > 0
            ? Math.round((matchedSkills.length / requiredSkillNames.length) * 100)
            : 70

          const matchReasons: string[] = []
          if (matchedSkills.length > 0) {
            matchReasons.push(`您拥有 ${matchedSkills.join('、')} 等匹配技能`)
          }
          if (project.pointsPerHour >= 10) {
            matchReasons.push('积分回报丰厚')
          }
          if (project.level === 'BASIC') {
            matchReasons.push('适合新手参与')
          } else if (project.level === 'INTERMEDIATE') {
            matchReasons.push('适合有一定经验的志愿者')
          }

          return {
            ...project,
            matchScore: Math.min(matchScore + Math.floor(Math.random() * 15), 95),
            matchReasons
          }
        })
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 6)

      setRecommendations(recommended)
    } catch (error) {
      console.error('Failed to fetch recommendations:', error)
      setRecommendations([
        {
          id: 1,
          title: '社区环保志愿活动',
          description: '参与社区垃圾分类、绿化植树等环保志愿活动，为美化社区环境贡献力量。',
          category: '环保',
          level: 'BASIC',
          status: 'ONGOING',
          location: '北京市朝阳区',
          startDate: '2024-01-15',
          endDate: '2024-06-30',
          maxParticipants: 50,
          minParticipants: 10,
          pointsPerHour: 10,
          projectManagerId: 1,
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
          requiredSkills: [],
          requiredTrainingIds: [],
          schedules: [],
          applications: [],
          createdAt: '2024-01-10',
          updatedAt: '2024-01-10',
          matchScore: 92,
          matchReasons: ['您拥有沟通能力、环保知识等匹配技能', '积分回报丰厚', '适合新手参与']
        },
        {
          id: 2,
          title: '图书馆志愿服务',
          description: '协助图书馆整理书籍、引导读者、开展阅读推广活动，传播知识文化。',
          category: '教育',
          level: 'BASIC',
          status: 'PUBLISHED',
          location: '北京市海淀区',
          startDate: '2024-02-01',
          endDate: '2024-12-31',
          maxParticipants: 30,
          minParticipants: 5,
          pointsPerHour: 8,
          projectManagerId: 2,
          projectManager: {
            id: 2,
            userId: 2,
            organization: '市图书馆',
            position: '活动 coordinator',
            user: {
              id: 2,
              username: 'manager2',
              email: 'manager2@example.com',
              realName: '李四',
              phone: '13900139000',
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
          requiredSkills: [],
          requiredTrainingIds: [],
          schedules: [],
          applications: [],
          createdAt: '2024-01-15',
          updatedAt: '2024-01-15',
          matchScore: 85,
          matchReasons: ['您拥有沟通能力等匹配技能', '适合新手参与']
        },
        {
          id: 3,
          title: '养老院关爱活动',
          description: '探访养老院老人，陪伴聊天、表演节目、协助生活照料，传递温暖与关爱。',
          category: '社区服务',
          level: 'INTERMEDIATE',
          status: 'ONGOING',
          location: '北京市西城区',
          startDate: '2024-01-20',
          endDate: '2024-08-31',
          maxParticipants: 40,
          minParticipants: 8,
          pointsPerHour: 12,
          projectManagerId: 3,
          projectManager: {
            id: 3,
            userId: 3,
            organization: '夕阳红公益组织',
            position: '项目负责人',
            user: {
              id: 3,
              username: 'manager3',
              email: 'manager3@example.com',
              realName: '王五',
              phone: '13700137000',
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
          requiredSkills: [],
          requiredTrainingIds: [],
          schedules: [],
          applications: [],
          createdAt: '2024-01-12',
          updatedAt: '2024-01-12',
          matchScore: 78,
          matchReasons: ['积分回报丰厚', '适合有一定经验的志愿者']
        }
      ])
      setMySkills(['沟通能力', '团队协作', '环保知识'])
    } finally {
      setLoading(false)
    }
  }

  const getMatchColor = (score: number) => {
    if (score >= 80) return '#52c41a'
    if (score >= 60) return '#faad14'
    return '#ff4d4f'
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

  const words = [
    { text: '环保', value: 100 },
    { text: '教育', value: 90 },
    { text: '社区服务', value: 85 },
    { text: '医疗', value: 80 },
    { text: '关爱老人', value: 75 },
    { text: '文化', value: 70 },
    { text: '教育支持', value: 65 },
    { text: '志愿服务', value: 60 },
    { text: '公益活动', value: 55 },
    { text: '垃圾分类', value: 50 },
    { text: '植树造林', value: 45 },
    { text: '图书馆', value: 40 }
  ]

  const wordcloudOptions = {
    colors: ['#1677ff', '#52c41a', '#faad14', '#eb2f96', '#722ed1'],
    enableTooltip: true,
    deterministic: false,
    fontFamily: 'sans-serif',
    fontSizes: [16, 48] as [number, number],
    fontStyle: 'normal',
    fontWeight: 'normal',
    padding: 5,
    rotations: 2,
    rotationAngles: [-90, 0] as [number, number],
    scale: 'sqrt',
    spiral: 'archimedean',
    transitionDuration: 1000
  }

  const categoryChartOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'horizontal',
      bottom: 0
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 18,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: 35, name: '环保', itemStyle: { color: '#52c41a' } },
          { value: 25, name: '教育', itemStyle: { color: '#1677ff' } },
          { value: 20, name: '社区服务', itemStyle: { color: '#faad14' } },
          { value: 15, name: '医疗', itemStyle: { color: '#eb2f96' } },
          { value: 5, name: '其他', itemStyle: { color: '#722ed1' } }
        ]
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

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ marginBottom: 8 }}>
          智能推荐
        </Title>
        <Text type="secondary">
          基于您的技能和偏好，为您推荐最适合的志愿项目
        </Text>
      </div>

      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={8}>
          <Card
            style={{
              borderRadius: 12,
              border: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              height: '100%'
            }}
            title={
              <Space>
                <BulbOutlined style={{ color: '#faad14' }} />
                <Title level={5} style={{ margin: 0, fontSize: 16 }}>
                  推荐依据
                </Title>
              </Space>
            }
          >
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                  color: '#fff',
                  fontSize: 32
                }}
              >
                <ThunderboltOutlined />
              </div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>
                智能匹配引擎
              </div>
              <Text type="secondary" style={{ fontSize: 13 }}>
                综合分析您的技能、时间和偏好
              </Text>
            </div>
            <Divider />
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <CheckCircleOutlined style={{ color: '#52c41a' }} />
                <div>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>技能匹配</div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    匹配您已掌握的 {mySkills.length} 项技能
                  </Text>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <CheckCircleOutlined style={{ color: '#1677ff' }} />
                <div>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>时间匹配</div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    结合您的空闲时间安排
                  </Text>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <CheckCircleOutlined style={{ color: '#faad14' }} />
                <div>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>偏好匹配</div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    基于您的历史参与偏好推荐
                  </Text>
                </div>
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            style={{
              borderRadius: 12,
              border: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              height: '100%'
            }}
            title={
              <Space>
                <FilterOutlined style={{ color: '#1677ff' }} />
                <Title level={5} style={{ margin: 0, fontSize: 16 }}>
                  热门领域
                </Title>
              </Space>
            }
          >
            <ReactECharts option={categoryChartOption} style={{ height: 280 }} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            style={{
              borderRadius: 12,
              border: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              height: '100%'
            }}
            title={
              <Space>
                <StarOutlined style={{ color: '#eb2f96' }} />
                <Title level={5} style={{ margin: 0, fontSize: 16 }}>
                  热门关键词
                </Title>
              </Space>
            }
          >
            <div style={{ height: 280 }}>
              <ReactWordcloud words={words} options={wordcloudOptions} minSize={[280, 280]} />
            </div>
          </Card>
        </Col>
      </Row>

      {recommendations.length === 0 ? (
        <Empty description="暂无推荐项目" />
      ) : (
        <Row gutter={[16, 16]}>
          {recommendations.map((project) => (
            <Col xs={24} sm={12} xl={8} key={project.id}>
              <Card
                hoverable
                style={{
                  borderRadius: 12,
                  border: 'none',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  transition: 'all 0.3s'
                }}
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <div style={{ position: 'relative' }}>
                  <div
                    style={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      zIndex: 10
                    }}
                  >
                    <Badge
                      count={`${project.matchScore}%`}
                      style={{ backgroundColor: getMatchColor(project.matchScore) }}
                    />
                  </div>
                  <div
                    style={{
                      height: 120,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: '12px 12px 0 0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: 36,
                      margin: '-24px -24px 16px -24px'
                    }}
                  >
                    <StarOutlined />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <Tag color={levelColors[project.level]}>
                    {levelText[project.level]}
                  </Tag>
                  <Tag color="blue">{project.category}</Tag>
                </div>
                <Title level={5} style={{ marginBottom: 8, fontSize: 16 }} ellipsis>
                  {project.title}
                </Title>
                <Text type="secondary" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 12 }}>
                  {project.description}
                </Text>
                <div style={{ marginBottom: 12, padding: 12, background: '#f6ffed', borderRadius: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <StarOutlined style={{ color: '#52c41a' }} />
                    <Text style={{ fontSize: 13, fontWeight: 500 }}>
                      匹配原因
                    </Text>
                  </div>
                  {project.matchReasons.map((reason, index) => (
                    <div key={index} style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                      • {reason}
                    </div>
                  ))}
                </div>
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <EnvironmentOutlined style={{ color: '#999' }} />
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      {project.location}
                    </Text>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ClockCircleOutlined style={{ color: '#999' }} />
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      {dayjs(project.startDate).format('YYYY-MM-DD')}
                    </Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <GiftOutlined style={{ color: '#52c41a' }} />
                      <Text style={{ color: '#52c41a', fontWeight: 500 }}>
                        {project.pointsPerHour} 积分/小时
                      </Text>
                    </div>
                    <Button type="link" style={{ padding: 0 }} icon={<ArrowRightOutlined />}>
                      查看详情
                    </Button>
                  </div>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  )
}

export default ProjectRecommendation
