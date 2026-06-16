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
  FilterOutlined,
  LockOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import ReactECharts from 'echarts-for-react'
import ReactWordcloud from 'react-wordcloud'
import { projectApi, skillApi } from '../../services/api'
import type { Project } from '../../types'

const { Title, Text } = Typography

interface RecommendedProject extends Project {
  matchScore: number
  matchReasons: string[]
  canApply: boolean
  details?: {
    skillMatch: number
    timeMatch: number
    ratingScore: number
    activityScore: number
    trainingScore: number
    creditScore: number
  }
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
      const [recs, skills] = await Promise.all([
        projectApi.getRecommendedProjects(10),
        skillApi.getMySkills().catch(() => [])
      ])

      const mySkillNames = skills.map((s: any) => s.skill?.name || s.name || '')
      setMySkills(mySkillNames)

      const recommended = recs.map((item: any) => ({
        ...item.project,
        matchScore: Math.round(item.matchScore),
        matchReasons: item.details?.reasons || [],
        canApply: item.canApply,
        details: item.details
      }))

      setRecommendations(recommended)
    } catch (error) {
      console.error('Failed to fetch recommendations:', error)
      setRecommendations([])
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
                hoverable={project.canApply}
                style={{
                  borderRadius: 12,
                  border: 'none',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  transition: 'all 0.3s',
                  opacity: project.canApply ? 1 : 0.85
                }}
                onClick={() => {
                  if (project.canApply) {
                    navigate(`/projects/${project.id}`)
                  }
                }}
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
                      background: project.canApply
                        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                        : 'linear-gradient(135deg, #bfbfbf 0%, #8c8c8c 100%)',
                      borderRadius: '12px 12px 0 0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: 36,
                      margin: '-24px -24px 16px -24px'
                    }}
                  >
                    {project.canApply ? <StarOutlined /> : <LockOutlined />}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <Space>
                    <Tag color={levelColors[project.level]}>
                      {levelText[project.level]}
                    </Tag>
                    {!project.canApply && (
                      <Tag color="error" icon={<LockOutlined />}>暂不可报名</Tag>
                    )}
                  </Space>
                  <Tag color="blue">{project.category}</Tag>
                </div>
                <Title level={5} style={{ marginBottom: 8, fontSize: 16 }} ellipsis>
                  {project.title}
                </Title>
                <Text type="secondary" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 12 }}>
                  {project.description}
                </Text>
                <div style={{ marginBottom: 12, padding: 12, background: project.canApply ? '#f6ffed' : '#fff2e8', borderRadius: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <StarOutlined style={{ color: project.canApply ? '#52c41a' : '#fa8c16' }} />
                    <Text style={{ fontSize: 13, fontWeight: 500 }}>
                      {project.canApply ? '匹配原因' : '暂不可报名原因'}
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
                    {project.canApply ? (
                      <Button type="link" style={{ padding: 0 }} icon={<ArrowRightOutlined />}>
                        查看详情
                      </Button>
                    ) : (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        不符合报名条件
                      </Text>
                    )}
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
