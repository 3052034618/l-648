import React, { useEffect, useState } from 'react'
import {
  Card,
  Typography,
  Row,
  Col,
  Statistic,
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  Avatar,
  Tabs,
  List,
  Progress,
  Empty,
  Rate,
  Divider,
  Descriptions,
} from 'antd'
import {
  SearchOutlined,
  StarOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  UserOutlined,
  RiseOutlined,
  GiftOutlined,
  CrownOutlined,
  FireOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import ReactECharts from 'echarts-for-react'
import { userApi, reviewApi, projectApi } from '../../services/api'
import type { User, Review, Project } from '../../types'

const { Title, Text } = Typography
const { Option } = Select
const { TabPane } = Tabs

interface VolunteerRankingData {
  id: number
  userId: number
  user: User
  starRating: number
  ratingCount: number
  totalServiceHours: number
  totalPoints: number
  projectCount: number
  recentReviews: Review[]
}

const VolunteerRanking: React.FC = () => {
  const [volunteers, setVolunteers] = useState<VolunteerRankingData[]>([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [sortBy, setSortBy] = useState<'hours' | 'rating' | 'points' | 'projects'>('hours')
  const [selectedVolunteer, setSelectedVolunteer] = useState<VolunteerRankingData | null>(null as any)
  const [projects, setProjects] = useState<Project[]>([])
  const [projectFilter, setProjectFilter] = useState<number | ''>('')

  useEffect(() => {
    fetchData()
  }, [sortBy, projectFilter])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [usersRes, projectsRes] = await Promise.all([
        userApi.getUsers({ page: 1, pageSize: 100 }),
        projectApi.getMyProjects({ page: 1, pageSize: 100 }),
      ])

      setProjects(projectsRes.items)

      const volunteerUsers = usersRes.items.filter((u) => u.role === 'VOLUNTEER')

      const rankingData: (VolunteerRankingData | null)[] = await Promise.all(
        volunteerUsers.map(async (user) => {
          if (!user.volunteerProfile) {
            return null
          }

          const reviews = await reviewApi
            .getReviews({
              page: 1,
              pageSize: 100,
              volunteerProfileId: user.volunteerProfile.id,
            })
            .catch(() => ({ items: [] as Review[] }))

          const recentReviews = reviews.items.slice(0, 5)

          let projectCount = 0
          let totalHours = 0

          projectsRes.items.forEach((p) => {
            const acceptedApps = p.applications?.filter(
              (a) => a.volunteerProfileId === user.volunteerProfile?.id && a.status === 'ACCEPTED'
            ).length
            if (acceptedApps && acceptedApps > 0) {
              projectCount++
            }

            p.schedules?.forEach((s) => {
              if (s.volunteerProfileId === user.volunteerProfile?.id && s.attendance) {
                totalHours += s.attendance.serviceHours || 0
              }
            })
          })

          return {
            id: user.volunteerProfile.id,
            userId: user.id,
            user,
            starRating: user.volunteerProfile.starRating || 0,
            ratingCount: user.volunteerProfile.ratingCount || 0,
            totalServiceHours: totalHours || user.totalServiceHours || 0,
            totalPoints: user.totalPoints || 0,
            projectCount,
            recentReviews,
          }
        })
      )

      const filteredData = rankingData.filter(
        (v): v is VolunteerRankingData => v !== null
      )

      const sortedData = [...filteredData].sort((a, b) => {
        switch (sortBy) {
          case 'hours':
            return b.totalServiceHours - a.totalServiceHours
          case 'rating':
            return b.starRating - a.starRating
          case 'points':
            return b.totalPoints - a.totalPoints
          case 'projects':
            return b.projectCount - a.projectCount
          default:
            return 0
        }
      })

      let resultData = sortedData
      if (projectFilter) {
        const selectedProject = projectsRes.items.find((p) => p.id === projectFilter)
        if (selectedProject) {
          const acceptedVolunteerIds =
            selectedProject.applications
              ?.filter((a) => a.status === 'ACCEPTED')
              .map((a) => a.volunteerProfileId) || []
          resultData = sortedData.filter((v) => acceptedVolunteerIds.includes(v.id))
        }
      }

      if (searchText) {
        const search = searchText.toLowerCase()
        resultData = resultData.filter(
          (v) =>
            v.user.realName?.toLowerCase().includes(search) ||
            v.user.username?.toLowerCase().includes(search)
        )
      }

      setVolunteers(resultData)
    } catch (error) {
      console.error('获取排行榜数据失败', error)
      const mockData: VolunteerRankingData[] = generateMockData(20)
      setVolunteers(mockData)
    } finally {
      setLoading(false)
    }
  }

  const generateMockData = (count: number): VolunteerRankingData[] => {
    const names = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十', '郑十一', '王十二']
    return Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      userId: i + 100,
      user: {
        id: i + 100,
        username: `volunteer${i + 1}`,
        email: `volunteer${i + 1}@example.com`,
        realName: names[i % names.length],
        phone: `138${String(10000000 + i).padStart(8, '0')}`,
        role: 'VOLUNTEER' as const,
        creditScore: 80 + Math.floor(Math.random() * 20),
        totalPoints: Math.floor(Math.random() * 5000) + 500,
        totalServiceHours: Math.floor(Math.random() * 500) + 10,
        createdAt: dayjs().subtract(i, 'month').toISOString(),
        updatedAt: dayjs().toISOString(),
      },
      starRating: 3 + Math.random() * 2,
      ratingCount: Math.floor(Math.random() * 50) + 5,
      totalServiceHours: Math.floor(Math.random() * 500) + 10,
      totalPoints: Math.floor(Math.random() * 5000) + 500,
      projectCount: Math.floor(Math.random() * 20) + 1,
      recentReviews: [],
    })).sort((a, b) => b.totalServiceHours - a.totalServiceHours)
  }

  const getRankIcon = (index: number) => {
    if (index === 0) return <CrownOutlined style={{ fontSize: 24, color: '#faad14' }} />
    if (index === 1) return <TrophyOutlined style={{ fontSize: 22, color: '#8c8c8c' }} />
    if (index === 2) return <TrophyOutlined style={{ fontSize: 20, color: '#d46b08' }} />
    return <Text strong style={{ fontSize: 16, color: '#8c8c8c' }}>#{index + 1}</Text>
  }

  const getRankColor = (index: number) => {
    if (index === 0) return '#faad14'
    if (index === 1) return '#8c8c8c'
    if (index === 2) return '#d46b08'
    return '#1677ff'
  }

  const columns: ColumnsType<VolunteerRankingData> = [
    {
      title: '排名',
      key: 'rank',
      width: 80,
      render: (_, __, index) => (
        <div style={{ textAlign: 'center' }}>{getRankIcon(index)}</div>
      ),
    },
    {
      title: '志愿者',
      key: 'volunteer',
      width: 180,
      render: (_, record) => (
        <Space>
          <Avatar
            size={40}
            icon={<UserOutlined />}
            src={record.user.avatar}
            style={{
              border: `2px solid ${getRankColor(volunteers.indexOf(record))}`,
            }}
          />
          <div>
            <Text strong>{record.user.realName || record.user.username}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              @{record.user.username}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: '星级评分',
      dataIndex: 'starRating',
      key: 'starRating',
      width: 150,
      sorter: (a, b) => a.starRating - b.starRating,
      render: (rating: number, record: VolunteerRankingData) => (
        <Space>
          <Rate disabled value={Math.round(rating)} style={{ fontSize: 14, color: '#faad14' }} />
          <Text strong style={{ color: '#faad14' }}>
            {rating.toFixed(1)}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            ({record.ratingCount || 0}次评价)
          </Text>
        </Space>
      ),
    },
    {
      title: '服务时长',
      dataIndex: 'totalServiceHours',
      key: 'totalServiceHours',
      width: 120,
      sorter: (a, b) => a.totalServiceHours - b.totalServiceHours,
      render: (hours: number) => (
        <Space>
          <ClockCircleOutlined style={{ color: '#1677ff' }} />
          <Text strong style={{ color: '#1677ff', fontSize: 16 }}>
            {hours.toFixed(0)}
          </Text>
          <Text type="secondary">小时</Text>
        </Space>
      ),
    },
    {
      title: '参与项目',
      dataIndex: 'projectCount',
      key: 'projectCount',
      width: 100,
      sorter: (a, b) => a.projectCount - b.projectCount,
      render: (count: number) => (
        <Space>
          <TrophyOutlined style={{ color: '#52c41a' }} />
          <Text strong>{count}</Text>
          <Text type="secondary">个</Text>
        </Space>
      ),
    },
    {
      title: '总积分',
      dataIndex: 'totalPoints',
      key: 'totalPoints',
      width: 120,
      sorter: (a, b) => a.totalPoints - b.totalPoints,
      render: (points: number) => (
        <Space>
          <GiftOutlined style={{ color: '#eb2f96' }} />
          <Text strong style={{ color: '#eb2f96' }}>
            {points.toLocaleString()}
          </Text>
          <Text type="secondary">分</Text>
        </Space>
      ),
    },
    {
      title: '信用分',
      key: 'creditScore',
      width: 100,
      render: (_, record) => {
        const score = record.user.creditScore
        const color = score >= 90 ? '#52c41a' : score >= 70 ? '#faad14' : '#ff4d4f'
        return (
          <Space>
            <RiseOutlined style={{ color }} />
            <Text strong style={{ color }}>
              {score}
            </Text>
          </Space>
        )
      },
    },
  ]

  const topThree = volunteers.slice(0, 3)
  const rankingOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'value',
      name: '服务时长(小时)',
    },
    yAxis: {
      type: 'category',
      data: volunteers.slice(0, 10).map((v) => v.user.realName || v.user.username),
      inverse: true,
    },
    series: [
      {
        type: 'bar',
        data: volunteers.slice(0, 10).map((v, i) => ({
          value: v.totalServiceHours,
          itemStyle: {
            color:
              i === 0
                ? '#faad14'
                : i === 1
                ? '#8c8c8c'
                : i === 2
                ? '#d46b08'
                : '#1677ff',
            borderRadius: [0, 4, 4, 0],
          },
        })),
        barWidth: '60%',
        label: {
          show: true,
          position: 'right',
          formatter: '{c}小时',
        },
      },
    ],
  }

  const ratingDistributionOption = {
    title: {
      text: '星级分布',
      left: 'center',
      textStyle: { fontSize: 14, fontWeight: 600 },
    },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: ['1星', '2星', '3星', '4星', '5星'],
    },
    yAxis: { type: 'value', name: '人数' },
    series: [
      {
        type: 'bar',
        data: [
          volunteers.filter((v) => v.starRating < 2).length,
          volunteers.filter((v) => v.starRating >= 2 && v.starRating < 3).length,
          volunteers.filter((v) => v.starRating >= 3 && v.starRating < 4).length,
          volunteers.filter((v) => v.starRating >= 4 && v.starRating < 5).length,
          volunteers.filter((v) => v.starRating >= 5).length,
        ],
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#faad14' },
              { offset: 1, color: '#ffa940' },
            ],
          },
          borderRadius: [4, 4, 0, 0],
        },
      },
    ],
    grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
  }

  const hoursDistributionOption = {
    title: {
      text: '服务时长分布',
      left: 'center',
      textStyle: { fontSize: 14, fontWeight: 600 },
    },
    tooltip: { trigger: 'item', formatter: '{b}: {c}人 ({d}%)' },
    legend: { orient: 'vertical', left: 'left' },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
        label: { show: false, position: 'center' },
        emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
        labelLine: { show: false },
        data: [
          { value: volunteers.filter((v) => v.totalServiceHours < 50).length, name: '50小时以下', itemStyle: { color: '#91d5ff' } },
          { value: volunteers.filter((v) => v.totalServiceHours >= 50 && v.totalServiceHours < 100).length, name: '50-100小时', itemStyle: { color: '#69c0ff' } },
          { value: volunteers.filter((v) => v.totalServiceHours >= 100 && v.totalServiceHours < 200).length, name: '100-200小时', itemStyle: { color: '#40a9ff' } },
          { value: volunteers.filter((v) => v.totalServiceHours >= 200 && v.totalServiceHours < 300).length, name: '200-300小时', itemStyle: { color: '#1890ff' } },
          { value: volunteers.filter((v) => v.totalServiceHours >= 300).length, name: '300小时以上', itemStyle: { color: '#096dd9' } },
        ],
      },
    ],
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          志愿者排行榜
        </Title>
        <Text type="secondary">根据服务时长、评分等多维度展示志愿者排名</Text>
      </div>

      {topThree.length >= 3 && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} md={{ span: 8, order: 1 }}>
            <Card
              style={{
                borderRadius: 16,
                border: 'none',
                boxShadow: '0 4px 12px rgba(140, 140, 140, 0.15)',
                background: 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)',
                marginTop: 24,
              }}
              bodyStyle={{ padding: 20, textAlign: 'center' }}
            >
              <TrophyOutlined style={{ fontSize: 48, color: '#8c8c8c' }} />
              <Title level={4} style={{ margin: '12px 0 8px 0' }}>
                亚军
              </Title>
              <Avatar
                size={80}
                icon={<UserOutlined />}
                src={topThree[1]?.user.avatar}
                style={{ border: '4px solid #8c8c8c', marginBottom: 12 }}
              />
              <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 8 }}>
                {topThree[1]?.user.realName || topThree[1]?.user.username}
              </Text>
              <Space direction="vertical" size={4}>
                <Space>
                  <ClockCircleOutlined style={{ color: '#1677ff' }} />
                  <Text>
                    {topThree[1]?.totalServiceHours.toFixed(0)} 小时
                  </Text>
                </Space>
                <Space>
                  <StarOutlined style={{ color: '#faad14' }} />
                  <Text>{topThree[1]?.starRating.toFixed(1)} 分</Text>
                </Space>
              </Space>
            </Card>
          </Col>
          <Col xs={24} md={{ span: 8, order: 2 }}>
            <Card
              style={{
                borderRadius: 16,
                border: 'none',
                boxShadow: '0 4px 16px rgba(250, 173, 20, 0.3)',
                background: 'linear-gradient(135deg, #fffbe6 0%, #fff1b8 100%)',
              }}
              bodyStyle={{ padding: 24, textAlign: 'center' }}
            >
              <CrownOutlined style={{ fontSize: 64, color: '#faad14' }} />
              <Title level={3} style={{ margin: '12px 0 8px 0', color: '#d46b08' }}>
                冠军
              </Title>
              <Avatar
                size={100}
                icon={<UserOutlined />}
                src={topThree[0]?.user.avatar}
                style={{ border: '4px solid #faad14', marginBottom: 16 }}
              />
              <Text strong style={{ fontSize: 18, display: 'block', marginBottom: 12 }}>
                {topThree[0]?.user.realName || topThree[0]?.user.username}
              </Text>
              <Space direction="vertical" size={8}>
                <Space>
                  <ClockCircleOutlined style={{ color: '#1677ff', fontSize: 18 }} />
                  <Text strong style={{ fontSize: 18 }}>
                    {topThree[0]?.totalServiceHours.toFixed(0)} 小时
                  </Text>
                </Space>
                <Space>
                  <StarOutlined style={{ color: '#faad14', fontSize: 18 }} />
                  <Text strong style={{ fontSize: 18 }}>
                    {topThree[0]?.starRating.toFixed(1)} 分
                  </Text>
                </Space>
                <Tag color="gold" icon={<FireOutlined />}>
                  连续服务
                </Tag>
              </Space>
            </Card>
          </Col>
          <Col xs={24} md={8} order={3}>
            <Card
              style={{
                borderRadius: 16,
                border: 'none',
                boxShadow: '0 4px 12px rgba(212, 107, 8, 0.15)',
                background: 'linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%)',
                marginTop: 40,
              }}
              bodyStyle={{ padding: 20, textAlign: 'center' }}
            >
              <TrophyOutlined style={{ fontSize: 48, color: '#d46b08' }} />
              <Title level={4} style={{ margin: '12px 0 8px 0', color: '#d46b08' }}>
                季军
              </Title>
              <Avatar
                size={80}
                icon={<UserOutlined />}
                src={topThree[2]?.user.avatar}
                style={{ border: '4px solid #d46b08', marginBottom: 12 }}
              />
              <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 8 }}>
                {topThree[2]?.user.realName || topThree[2]?.user.username}
              </Text>
              <Space direction="vertical" size={4}>
                <Space>
                  <ClockCircleOutlined style={{ color: '#1677ff' }} />
                  <Text>
                    {topThree[2]?.totalServiceHours.toFixed(0)} 小时
                  </Text>
                </Space>
                <Space>
                  <StarOutlined style={{ color: '#faad14' }} />
                  <Text>{topThree[2]?.starRating.toFixed(1)} 分</Text>
                </Space>
              </Space>
            </Card>
          </Col>
        </Row>
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} lg={6}>
          <Card
            style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
            bodyStyle={{ padding: 20 }}
          >
            <Statistic
              title="志愿者总数"
              value={volunteers.length}
              prefix={<UserOutlined style={{ color: '#1677ff' }} />}
              suffix="人"
            />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card
            style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
            bodyStyle={{ padding: 20 }}
          >
            <Statistic
              title="总服务时长"
              value={volunteers.reduce((acc, v) => acc + v.totalServiceHours, 0).toFixed(0)}
              prefix={<ClockCircleOutlined style={{ color: '#52c41a' }} />}
              suffix="小时"
            />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card
            style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
            bodyStyle={{ padding: 20 }}
          >
            <Statistic
              title="平均评分"
              value={
                volunteers.length > 0
                  ? (volunteers.reduce((acc, v) => acc + v.starRating, 0) / volunteers.length).toFixed(1)
                  : '0.0'
              }
              prefix={<StarOutlined style={{ color: '#faad14' }} />}
              suffix="分"
            />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card
            style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
            bodyStyle={{ padding: 20 }}
          >
            <Statistic
              title="总积分"
              value={volunteers.reduce((acc, v) => acc + v.totalPoints, 0).toLocaleString()}
              prefix={<GiftOutlined style={{ color: '#eb2f96' }} />}
              suffix="分"
            />
          </Card>
        </Col>
      </Row>

      <Card
        style={{
          borderRadius: 12,
          border: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          marginBottom: 24,
        }}
        bodyStyle={{ padding: 20 }}
      >
        <Space wrap size={[16, 16]} style={{ width: '100%' }}>
          <Input
            placeholder="搜索志愿者姓名"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 200 }}
            allowClear
          />
          <Select
            placeholder="筛选项目"
            value={projectFilter || undefined}
            onChange={setProjectFilter}
            style={{ width: 200 }}
            allowClear
            showSearch
            optionFilterProp="children"
          >
            {projects.map((p) => (
              <Option key={p.id} value={p.id}>
                {p.title}
              </Option>
            ))}
          </Select>
          <Select
            placeholder="排序方式"
            value={sortBy}
            onChange={setSortBy}
            style={{ width: 150 }}
          >
            <Option value="hours">按服务时长</Option>
            <Option value="rating">按星级评分</Option>
            <Option value="points">按总积分</Option>
            <Option value="projects">按参与项目</Option>
          </Select>
        </Space>
      </Card>

      <Tabs defaultActiveKey="table">
        <TabPane tab="排行榜表格" key="table">
          <Card
            style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
            bodyStyle={{ padding: 0 }}
          >
            {volunteers.length === 0 && !loading ? (
              <Empty description="暂无排行榜数据" style={{ padding: '60px 0' }} />
            ) : (
              <Table
                columns={columns}
                dataSource={volunteers}
                rowKey="id"
                loading={loading}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total) => `共 ${total} 名志愿者`,
                }}
                scroll={{ x: 900 }}
                onRow={(record) => ({
                  onClick: () => setSelectedVolunteer(record),
                  style: { cursor: 'pointer' },
                })}
              />
            )}
          </Card>
        </TabPane>
        <TabPane tab="统计图表" key="charts">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={14}>
              <Card
                style={{
                  borderRadius: 12,
                  border: 'none',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  height: '100%',
                }}
                title="服务时长排行TOP10"
              >
                <ReactECharts option={rankingOption} style={{ height: 400 }} />
              </Card>
            </Col>
            <Col xs={24} lg={10}>
              <Card
                style={{
                  borderRadius: 12,
                  border: 'none',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  marginBottom: 16,
                }}
              >
                <ReactECharts option={ratingDistributionOption} style={{ height: 200 }} />
              </Card>
              <Card
                style={{
                  borderRadius: 12,
                  border: 'none',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}
              >
                <ReactECharts option={hoursDistributionOption} style={{ height: 250 }} />
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>

      {selectedVolunteer && (
        <div
          style={{
            position: 'fixed',
            right: 0,
            top: 0,
            width: 420,
            height: '100vh',
            background: '#fff',
            boxShadow: '-4px 0 12px rgba(0,0,0,0.1)',
            zIndex: 1000,
            overflowY: 'auto',
          }}
        >
          <div style={{ padding: 24 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 24,
              }}
            >
              <Title level={4} style={{ margin: 0 }}>
                志愿者详情
              </Title>
              <Button onClick={() => setSelectedVolunteer(null)}>关闭</Button>
            </div>

            <Card
              style={{
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)',
                marginBottom: 16,
              }}
              bodyStyle={{ padding: 20, textAlign: 'center' }}
            >
              <Avatar
                size={80}
                icon={<UserOutlined />}
                src={selectedVolunteer.user.avatar}
                style={{ border: '4px solid #fff', marginBottom: 12 }}
              />
              <Text strong style={{ fontSize: 18, display: 'block', marginBottom: 4 }}>
                {selectedVolunteer.user.realName || selectedVolunteer.user.username}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                @{selectedVolunteer.user.username}
              </Text>
              <div style={{ marginTop: 12 }}>
                <Rate
                  disabled
                  value={Math.round(selectedVolunteer.starRating)}
                  style={{ fontSize: 20, color: '#faad14' }}
                />
                <Text strong style={{ color: '#faad14', marginLeft: 8, fontSize: 16 }}>
                  {selectedVolunteer.starRating.toFixed(1)}
                </Text>
              </div>
            </Card>

            <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <Card size="small" style={{ borderRadius: 8, border: 'none', background: '#f0f5ff' }}>
                  <Statistic
                    title="服务时长"
                    value={selectedVolunteer.totalServiceHours.toFixed(0)}
                    suffix="小时"
                    valueStyle={{ fontSize: 18, color: '#1677ff' }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" style={{ borderRadius: 8, border: 'none', background: '#f6ffed' }}>
                  <Statistic
                    title="参与项目"
                    value={selectedVolunteer.projectCount}
                    suffix="个"
                    valueStyle={{ fontSize: 18, color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" style={{ borderRadius: 8, border: 'none', background: '#fff7e6' }}>
                  <Statistic
                    title="总积分"
                    value={selectedVolunteer.totalPoints.toLocaleString()}
                    suffix="分"
                    valueStyle={{ fontSize: 18, color: '#faad14' }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" style={{ borderRadius: 8, border: 'none', background: '#f9f0ff' }}>
                  <Statistic
                    title="信用分"
                    value={selectedVolunteer.user.creditScore}
                    valueStyle={{ fontSize: 18, color: '#722ed1' }}
                  />
                </Card>
              </Col>
            </Row>

            <Divider orientation="left">基础信息</Divider>
            <Descriptions column={1} size="small" bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="邮箱">{selectedVolunteer.user.email}</Descriptions.Item>
              <Descriptions.Item label="手机号">{selectedVolunteer.user.phone}</Descriptions.Item>
              <Descriptions.Item label="注册时间">
                {dayjs(selectedVolunteer.user.createdAt).format('YYYY-MM-DD')}
              </Descriptions.Item>
              <Descriptions.Item label="评价次数">
                {selectedVolunteer.ratingCount} 次
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">技能证书</Divider>
            {selectedVolunteer.user.volunteerProfile?.skills ? (
              <List
                size="small"
                dataSource={selectedVolunteer.user.volunteerProfile.skills}
                renderItem={(item) => (
                  <List.Item>
                    <Space>
                      <Tag color="blue">{item.skill?.name}</Tag>
                      <Text type="secondary">熟练度:</Text>
                      <Progress
                        percent={item.proficiency * 10}
                        size="small"
                        showInfo={false}
                        style={{ width: 80 }}
                      />
                      <Text>{item.proficiency}/10</Text>
                    </Space>
                  </List.Item>
                )}
              />
            ) : (
              <Text type="secondary">暂无技能数据</Text>
            )}

            <Divider orientation="left">近期评价</Divider>
            {selectedVolunteer.recentReviews && selectedVolunteer.recentReviews.length > 0 ? (
              <List
                size="small"
                dataSource={selectedVolunteer.recentReviews}
                renderItem={(item) => (
                  <List.Item>
                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                      <Space>
                        <Rate
                          disabled
                          value={item.rating}
                          style={{ fontSize: 12, color: '#faad14' }}
                        />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {dayjs(item.createdAt).format('YYYY-MM-DD')}
                        </Text>
                      </Space>
                      <Text style={{ fontSize: 13 }}>{item.comment}</Text>
                      <Space wrap size={[4, 4]}>
                        {item.tags?.map((tag, i) => (
                          <Tag key={i} color="blue" style={{ fontSize: 12 }}>
                            {tag}
                          </Tag>
                        ))}
                      </Space>
                    </Space>
                  </List.Item>
                )}
              />
            ) : (
              <Text type="secondary">暂无评价记录</Text>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default VolunteerRanking
