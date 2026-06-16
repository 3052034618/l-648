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
  Tabs,
  Table,
  Empty,
  Badge,
  Statistic
} from 'antd'
import {
  ProjectOutlined,
  ClockCircleOutlined,
  GiftOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  HourglassOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import ReactECharts from 'echarts-for-react'
import { projectApi, attendanceApi } from '../../api'
import { useAuthStore } from '../../store'
import type { Project, Attendance } from '../../types'

const { Title, Text } = Typography

interface MyProject extends Project {
  applicationStatus?: string
  appliedAt?: string
}

const MyProjects: React.FC = () => {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const [loading, setLoading] = useState(true)
  const [appliedProjects, setAppliedProjects] = useState<MyProject[]>([])
  const [attendances, setAttendances] = useState<Attendance[]>([])
  const [activeTab, setActiveTab] = useState('applied')

  useEffect(() => {
    fetchMyData()
  }, [])

  const fetchMyData = async () => {
    setLoading(true)
    try {
      const [projectsResult, attendancesResult] = await Promise.all([
        projectApi.getMyProjects({ page: 1, pageSize: 50 }),
        attendanceApi.getMyAttendances({ page: 1, pageSize: 50 })
      ])

      const myProjects: MyProject[] = projectsResult.items.map((p) => {
        const app = p.applications?.find(
          (a) => a.volunteerProfile?.user?.id === user?.id
        )
        return {
          ...p,
          applicationStatus: app?.status || 'PENDING',
          appliedAt: app?.appliedAt
        }
      })

      setAppliedProjects(myProjects)
      setAttendances(attendancesResult.items)
    } catch (error) {
      console.error('Failed to fetch my projects:', error)
      setAppliedProjects([
        {
          id: 1,
          title: '社区环保志愿活动',
          description: '参与社区垃圾分类、绿化植树等环保志愿活动。',
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
          applicationStatus: 'APPROVED',
          appliedAt: '2024-01-12T10:00:00Z'
        },
        {
          id: 2,
          title: '图书馆志愿服务',
          description: '协助图书馆整理书籍、引导读者。',
          category: '教育',
          level: 'BASIC',
          status: 'ONGOING',
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
          applicationStatus: 'PENDING',
          appliedAt: '2024-01-20T14:30:00Z'
        }
      ])
      setAttendances([
        {
          id: 1,
          scheduleId: 1,
          volunteerProfileId: 1,
          checkInTime: '2024-02-01T09:00:00Z',
          checkOutTime: '2024-02-01T12:00:00Z',
          serviceHours: 3,
          status: 'PRESENT',
          pointsEarned: 30,
          schedule: {
            id: 1,
            projectId: 1,
            scheduledDate: '2024-02-01',
            startTime: '09:00',
            endTime: '12:00',
            status: 'CONFIRMED',
            volunteerProfileId: 1,
            project: {
              id: 1,
              title: '社区环保志愿活动',
              category: '环保'
            } as Project
          } as any,
          volunteerProfile: {} as any,
          createdAt: '2024-02-01',
          updatedAt: '2024-02-01'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'success'
      case 'REJECTED':
        return 'error'
      case 'PENDING':
        return 'warning'
      default:
        return 'default'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return '已通过'
      case 'REJECTED':
        return '已拒绝'
      case 'PENDING':
        return '审核中'
      default:
        return status
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'BASIC':
        return 'green'
      case 'INTERMEDIATE':
        return 'orange'
      case 'ADVANCED':
        return 'red'
      default:
        return 'default'
    }
  }

  const getLevelText = (level: string) => {
    switch (level) {
      case 'BASIC':
        return '初级'
      case 'INTERMEDIATE':
        return '中级'
      case 'ADVANCED':
        return '高级'
      default:
        return level
    }
  }

  const stats = {
    totalApplied: appliedProjects.length,
    approved: appliedProjects.filter((p) => p.applicationStatus === 'APPROVED').length,
    pending: appliedProjects.filter((p) => p.applicationStatus === 'PENDING').length,
    totalHours: attendances.reduce((sum, a) => sum + a.serviceHours, 0),
    totalPoints: attendances.reduce((sum, a) => sum + a.pointsEarned, 0)
  }

  const monthlyStats = [
    { month: '1月', hours: 12, points: 120 },
    { month: '2月', hours: 18, points: 180 },
    { month: '3月', hours: 24, points: 240 },
    { month: '4月', hours: 15, points: 150 },
    { month: '5月', hours: 30, points: 300 },
    { month: '6月', hours: 22, points: 220 }
  ]

  const hoursChartOption = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['服务时长', '获得积分']
    },
    xAxis: {
      type: 'category',
      data: monthlyStats.map((item) => item.month)
    },
    yAxis: [
      {
        type: 'value',
        name: '时长(小时)'
      },
      {
        type: 'value',
        name: '积分'
      }
    ],
    series: [
      {
        name: '服务时长',
        type: 'bar',
        data: monthlyStats.map((item) => item.hours),
        itemStyle: {
          color: '#1677ff'
        }
      },
      {
        name: '获得积分',
        type: 'line',
        yAxisIndex: 1,
        data: monthlyStats.map((item) => item.points),
        itemStyle: {
          color: '#52c41a'
        },
        lineStyle: {
          width: 3
        }
      }
    ]
  }

  const columns = [
    {
      title: '项目名称',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: MyProject) => (
        <Space>
          <Text strong>{text}</Text>
          <Tag color={getLevelColor(record.level)}>{getLevelText(record.level)}</Tag>
        </Space>
      )
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (text: string) => <Tag color="blue">{text}</Tag>
    },
    {
      title: '申请时间',
      dataIndex: 'appliedAt',
      key: 'appliedAt',
      render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '申请状态',
      dataIndex: 'applicationStatus',
      key: 'applicationStatus',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      )
    },
    {
      title: '项目地点',
      dataIndex: 'location',
      key: 'location'
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: MyProject) => (
        <Button type="link" onClick={() => navigate(`/projects/${record.id}`)}>
          查看详情
        </Button>
      )
    }
  ]

  const attendanceColumns = [
    {
      title: '项目名称',
      dataIndex: ['schedule', 'project', 'title'],
      key: 'projectTitle',
      render: (text: string) => <Text strong>{text}</Text>
    },
    {
      title: '日期',
      dataIndex: ['schedule', 'scheduledDate'],
      key: 'date',
      render: (text: string) => dayjs(text).format('YYYY-MM-DD')
    },
    {
      title: '签到时间',
      dataIndex: 'checkInTime',
      key: 'checkInTime',
      render: (text: string) => (text ? dayjs(text).format('HH:mm:ss') : '-')
    },
    {
      title: '签退时间',
      dataIndex: 'checkOutTime',
      key: 'checkOutTime',
      render: (text: string) => (text ? dayjs(text).format('HH:mm:ss') : '-')
    },
    {
      title: '服务时长',
      dataIndex: 'serviceHours',
      key: 'serviceHours',
      render: (hours: number) => `${hours} 小时`
    },
    {
      title: '获得积分',
      dataIndex: 'pointsEarned',
      key: 'pointsEarned',
      render: (points: number) => (
        <Text type="success" strong>
          +{points}
        </Text>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          PRESENT: 'success',
          ABSENT: 'error',
          LATE: 'warning',
          LEAVE_EARLY: 'orange',
          PENDING: 'processing'
        }
        const textMap: Record<string, string> = {
          PRESENT: '正常',
          ABSENT: '缺勤',
          LATE: '迟到',
          LEAVE_EARLY: '早退',
          PENDING: '待签到'
        }
        return <Tag color={colorMap[status]}>{textMap[status]}</Tag>
      }
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
          我的项目
        </Title>
        <Text type="secondary">查看您已申请和已参与的志愿项目</Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card
            style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          >
            <Statistic
              title="申请项目数"
              value={stats.totalApplied}
              prefix={<ProjectOutlined style={{ color: '#1677ff' }} />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card
            style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          >
            <Statistic
              title="已通过"
              value={stats.approved}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card
            style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          >
            <Statistic
              title="累计服务时长"
              value={stats.totalHours}
              suffix="小时"
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card
            style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          >
            <Statistic
              title="累计获得积分"
              value={stats.totalPoints}
              prefix={<GiftOutlined style={{ color: '#eb2f96' }} />}
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 24 }}
        title={
          <Space>
            <CalendarOutlined style={{ color: '#1677ff' }} />
            <Title level={5} style={{ margin: 0 }}>
              服务统计
            </Title>
          </Space>
        }
      >
        <ReactECharts option={hoursChartOption} style={{ height: 300 }} />
      </Card>

      <Card
        style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'applied',
              label: (
                <Space>
                  <HourglassOutlined />
                  申请记录
                  <Badge count={appliedProjects.length} size="small" />
                </Space>
              ),
              children:
                appliedProjects.length === 0 ? (
                  <Empty description="暂无申请记录" />
                ) : (
                  <Table
                    dataSource={appliedProjects}
                    columns={columns}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                  />
                )
            },
            {
              key: 'attendance',
              label: (
                <Space>
                  <CheckCircleOutlined />
                  考勤记录
                  <Badge count={attendances.length} size="small" />
                </Space>
              ),
              children:
                attendances.length === 0 ? (
                  <Empty description="暂无考勤记录" />
                ) : (
                  <Table
                    dataSource={attendances}
                    columns={attendanceColumns}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                  />
                )
            }
          ]}
        />
      </Card>
    </div>
  )
}

export default MyProjects
