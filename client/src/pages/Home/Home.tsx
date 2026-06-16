import React, { useEffect, useState } from 'react'
import { Row, Col, Card, Statistic, Typography, Space, Spin } from 'antd'
import {
  TeamOutlined,
  ProjectOutlined,
  ClockCircleOutlined,
  GiftOutlined,
  RiseOutlined,
  CheckCircleOutlined,
  UserAddOutlined,
  PercentageOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { adminApi, projectApi } from '../../api'
import { StatisticsData } from '../../types'
import { useAuthStore } from '../../store'

const { Title, Text } = Typography

const Home: React.FC = () => {
  const user = useAuthStore((state) => state.user)
  const [statistics, setStatistics] = useState<StatisticsData | null>(null)
  const [trendData, setTrendData] = useState<{ date: string; count: number }[]>([])
  const [categoryData, setCategoryData] = useState<{ category: string; count: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stats, projects] = await Promise.all([
          adminApi.getDashboardStats(),
          projectApi.getProjects({ page: 1, pageSize: 100 })
        ])
        
        setStatistics({
          totalVolunteers: stats.totalVolunteers || 0,
          totalProjects: stats.totalProjects || 0,
          totalServiceHours: stats.totalServiceHours || 0,
          totalPointsDistributed: stats.totalPointsDistributed || 0,
          ongoingProjects: stats.ongoingProjects || stats.activeProjects || 0,
          pendingApplications: stats.pendingApplications || 0,
          todayAttendance: stats.todayAttendance || 0,
          averageRating: stats.averageRating || 0,
          volunteerCount: stats.totalVolunteers || 0,
          projectCount: stats.totalProjects || 0,
          newVolunteersThisMonth: stats.newVolunteersThisMonth || 0,
          activeProjects: stats.activeProjects || 0,
          completedProjects: stats.completedProjects || 0,
          attendanceRate: stats.attendanceRate || 0
        })
        
        const categories = projects.items.reduce((acc: Record<string, number>, project) => {
          acc[project.category] = (acc[project.category] || 0) + 1
          return acc
        }, {})
        setCategoryData(Object.entries(categories).map(([category, count]) => ({ category, count })))
        
        const mockTrend = Array.from({ length: 7 }, (_, i) => ({
          date: `${i + 1}月`,
          count: Math.floor(Math.random() * 100) + 50
        }))
        setTrendData(mockTrend)
      } catch (error) {
        console.error('Failed to fetch statistics:', error)
        const mockStats: StatisticsData = {
          totalVolunteers: 1256,
          totalProjects: 89,
          totalServiceHours: 15680,
          totalPointsDistributed: 25600,
          ongoingProjects: 23,
          pendingApplications: 15,
          todayAttendance: 45,
          averageRating: 4.8,
          volunteerCount: 1256,
          projectCount: 89,
          newVolunteersThisMonth: 128,
          activeProjects: 23,
          completedProjects: 66,
          attendanceRate: 92.5
        }
        setStatistics(mockStats)
        setTrendData([
          { date: '1月', count: 120 },
          { date: '2月', count: 150 },
          { date: '3月', count: 180 },
          { date: '4月', count: 210 },
          { date: '5月', count: 190 },
          { date: '6月', count: 230 },
          { date: '7月', count: 260 }
        ])
        setCategoryData([
          { category: '环保', count: 25 },
          { category: '教育', count: 20 },
          { category: '医疗', count: 15 },
          { category: '社区服务', count: 18 },
          { category: '其他', count: 11 }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const statCards = statistics
    ? [
        {
          title: '志愿者人数',
          value: statistics.volunteerCount,
          icon: <TeamOutlined style={{ fontSize: 32, color: '#1677ff' }} />,
          color: '#1677ff',
          suffix: '人',
          trend: statistics.newVolunteersThisMonth,
          trendText: `本月新增 ${statistics.newVolunteersThisMonth} 人`
        },
        {
          title: '项目总数',
          value: statistics.projectCount,
          icon: <ProjectOutlined style={{ fontSize: 32, color: '#52c41a' }} />,
          color: '#52c41a',
          suffix: '个',
          trend: statistics.activeProjects,
          trendText: `进行中 ${statistics.activeProjects} 个`
        },
        {
          title: '服务时长',
          value: statistics.totalServiceHours,
          icon: <ClockCircleOutlined style={{ fontSize: 32, color: '#faad14' }} />,
          color: '#faad14',
          suffix: '小时',
          trend: statistics.completedProjects,
          trendText: `已完成项目 ${statistics.completedProjects} 个`
        },
        {
          title: '积分发放',
          value: statistics.totalPointsDistributed,
          icon: <GiftOutlined style={{ fontSize: 32, color: '#eb2f96' }} />,
          color: '#eb2f96',
          suffix: '分',
          trend: statistics.attendanceRate,
          trendText: `签到率 ${statistics.attendanceRate.toFixed(1)}%`
        }
      ]
    : []

  const trendChartOption = {
    title: {
      text: '志愿者增长趋势',
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
      data: trendData.map((item) => item.date),
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      name: '人数'
    },
    series: [
      {
        data: trendData.map((item) => item.count),
        type: 'line',
        smooth: true,
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(22, 119, 255, 0.3)' },
              { offset: 1, color: 'rgba(22, 119, 255, 0.05)' }
            ]
          }
        },
        lineStyle: {
          color: '#1677ff',
          width: 3
        },
        itemStyle: {
          color: '#1677ff'
        }
      }
    ],
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    }
  }

  const categoryChartOption = {
    title: {
      text: '项目分类统计',
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 600
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}个 ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
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
            fontSize: 20,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: categoryData.map((item) => ({
          value: item.count,
          name: item.category
        }))
      }
    ]
  }

  const quickActions = [
    {
      icon: <RiseOutlined />,
      title: '快速报名',
      description: '浏览推荐项目',
      color: '#1677ff'
    },
    {
      icon: <CheckCircleOutlined />,
      title: '今日签到',
      description: '完成志愿服务',
      color: '#52c41a'
    },
    {
      icon: <UserAddOutlined />,
      title: '邀请好友',
      description: '共同参与志愿',
      color: '#faad14'
    },
    {
      icon: <PercentageOutlined />,
      title: '积分兑换',
      description: '使用积分兑换',
      color: '#eb2f96'
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
        <Title level={3} style={{ marginBottom: 8 }}>
          欢迎回来，{user?.realName}！
        </Title>
        <Text type="secondary">今天是 {new Date().toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statCards.map((card, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card
              style={{
                borderRadius: 12,
                border: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}
              bodyStyle={{ padding: 20 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <Statistic
                    title={
                      <Text type="secondary" style={{ fontSize: 14 }}>
                        {card.title}
                      </Text>
                    }
                    value={card.value}
                    suffix={card.suffix}
                    valueStyle={{ color: card.color, fontWeight: 600 }}
                  />
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {card.trendText}
                    </Text>
                  </div>
                </div>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 12,
                    background: `${card.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {card.icon}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <Card
            style={{
              borderRadius: 12,
              border: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              height: '100%'
            }}
          >
            <ReactECharts option={trendChartOption} style={{ height: 320 }} />
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
          >
            <ReactECharts option={categoryChartOption} style={{ height: 320 }} />
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <Title level={5} style={{ margin: 0 }}>
              快捷操作
            </Title>
          </Space>
        }
        style={{
          borderRadius: 12,
          border: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}
      >
        <Row gutter={[16, 16]}>
          {quickActions.map((action, index) => (
            <Col xs={12} sm={6} key={index}>
              <div
                style={{
                  padding: 20,
                  borderRadius: 12,
                  background: `${action.color}10`,
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  textAlign: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = `0 8px 16px ${action.color}30`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: action.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                    color: '#fff',
                    fontSize: 24
                  }}
                >
                  {action.icon}
                </div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{action.title}</div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {action.description}
                </Text>
              </div>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  )
}

export default Home
