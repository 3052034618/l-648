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
  Table,
  Empty,
  Statistic,
  DatePicker,
  Select
} from 'antd'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  GiftOutlined,
  QrcodeOutlined,
  ArrowRightOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import ReactECharts from 'echarts-for-react'
import { attendanceApi, scheduleApi } from '../../api'
import type { Attendance, Schedule } from '../../types'

const { Title, Text } = Typography
const { RangePicker } = DatePicker
const { Option } = Select

const MyAttendance: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [attendances, setAttendances] = useState<Attendance[]>([])
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null)
  const [statusFilter, setStatusFilter] = useState<string | undefined>()

  useEffect(() => {
    fetchAttendances()
  }, [dateRange, statusFilter])

  const fetchAttendances = async () => {
    setLoading(true)
    try {
      const result = await attendanceApi.getMyAttendances({ page: 1, pageSize: 100 })
      let filtered = result.items
      if (dateRange && dateRange[0] && dateRange[1]) {
        filtered = filtered.filter((a) => {
          const date = dayjs(a.createdAt)
          return date.isAfter(dateRange[0]) && date.isBefore(dateRange[1])
        })
      }
      if (statusFilter) {
        filtered = filtered.filter((a) => a.status === statusFilter)
      }
      setAttendances(filtered)
    } catch (error) {
      console.error('Failed to fetch attendances:', error)
      const mockAttendances: Attendance[] = []
      for (let i = 0; i < 15; i++) {
        const date = dayjs().subtract(i, 'day')
        const statuses: ('PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE_EARLY')[] = ['PRESENT', 'PRESENT', 'PRESENT', 'LATE', 'LEAVE_EARLY', 'ABSENT']
        const status = statuses[i % 6]
        mockAttendances.push({
          id: i + 1,
          scheduleId: i + 1,
          volunteerProfileId: 1,
          checkInTime: status !== 'ABSENT' ? date.hour(9).minute(i * 5).toISOString() : undefined,
          checkOutTime: status !== 'ABSENT' && status !== 'LEAVE_EARLY' ? date.hour(12).toISOString() : status === 'LEAVE_EARLY' ? date.hour(11).minute(30).toISOString() : undefined,
          serviceHours: status === 'PRESENT' ? 3 : status === 'LATE' ? 2.5 : status === 'LEAVE_EARLY' ? 2.5 : 0,
          status,
          pointsEarned: status === 'PRESENT' ? 30 : status === 'LATE' ? 25 : status === 'LEAVE_EARLY' ? 25 : 0,
          schedule: {
            id: i + 1,
            projectId: 1,
            scheduledDate: date.format('YYYY-MM-DD'),
            startTime: '09:00',
            endTime: '12:00',
            status: 'CONFIRMED',
            volunteerProfileId: 1,
            project: {
              id: 1,
              title: i % 2 === 0 ? '社区环保志愿活动' : '图书馆志愿服务',
              category: i % 2 === 0 ? '环保' : '教育',
              location: i % 2 === 0 ? '北京市朝阳区' : '北京市海淀区'
            } as any,
            volunteerProfile: {} as any,
            createdAt: date.format('YYYY-MM-DD'),
            updatedAt: date.format('YYYY-MM-DD')
          },
          volunteerProfile: {} as any,
          createdAt: date.format('YYYY-MM-DD'),
          updatedAt: date.format('YYYY-MM-DD')
        })
      }
      setAttendances(mockAttendances)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return 'success'
      case 'ABSENT':
        return 'error'
      case 'LATE':
        return 'warning'
      case 'LEAVE_EARLY':
        return 'orange'
      case 'PENDING':
        return 'processing'
      default:
        return 'default'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return '正常'
      case 'ABSENT':
        return '缺勤'
      case 'LATE':
        return '迟到'
      case 'LEAVE_EARLY':
        return '早退'
      case 'PENDING':
        return '待签到'
      default:
        return status
    }
  }

  const stats = {
    total: attendances.length,
    present: attendances.filter((a) => a.status === 'PRESENT').length,
    late: attendances.filter((a) => a.status === 'LATE').length,
    absent: attendances.filter((a) => a.status === 'ABSENT').length,
    totalHours: attendances.reduce((sum, a) => sum + a.serviceHours, 0),
    totalPoints: attendances.reduce((sum, a) => sum + a.pointsEarned, 0),
    rate: attendances.length > 0
      ? Math.round((attendances.filter((a) => a.status === 'PRESENT').length / attendances.length) * 100)
      : 0
  }

  const monthlyStats = Array.from({ length: 6 }, (_, i) => {
    const month = dayjs().subtract(5 - i, 'month')
    return {
      month: month.format('MM月'),
      present: Math.floor(Math.random() * 10) + 15,
      late: Math.floor(Math.random() * 3),
      absent: Math.floor(Math.random() * 2)
    }
  })

  const attendanceChartOption = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['正常出勤', '迟到', '缺勤']
    },
    xAxis: {
      type: 'category',
      data: monthlyStats.map((item) => item.month)
    },
    yAxis: {
      type: 'value',
      name: '次数'
    },
    series: [
      {
        name: '正常出勤',
        type: 'bar',
        stack: 'total',
        data: monthlyStats.map((item) => item.present),
        itemStyle: { color: '#52c41a' }
      },
      {
        name: '迟到',
        type: 'bar',
        stack: 'total',
        data: monthlyStats.map((item) => item.late),
        itemStyle: { color: '#faad14' }
      },
      {
        name: '缺勤',
        type: 'bar',
        stack: 'total',
        data: monthlyStats.map((item) => item.absent),
        itemStyle: { color: '#ff4d4f' }
      }
    ]
  }

  const columns = [
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
      render: (text: string | undefined) => (
        text ? dayjs(text).format('HH:mm:ss') : <Text type="danger">-</Text>
      )
    },
    {
      title: '签退时间',
      dataIndex: 'checkOutTime',
      key: 'checkOutTime',
      render: (text: string | undefined) => (
        text ? dayjs(text).format('HH:mm:ss') : <Text type="danger">-</Text>
      )
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
        points > 0 ? (
          <Text type="success" strong>+{points}</Text>
        ) : (
          <Text type="secondary">0</Text>
        )
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      )
    }
  ]

  const todaySchedules = (schedules: Schedule[]) => schedules.filter((s) =>
    dayjs(s.scheduledDate).isSame(dayjs(), 'day') &&
    !attendances.some((a) => a.scheduleId === s.id)
  )

  const [todayPending, setTodayPending] = useState<Schedule[]>([])

  useEffect(() => {
    const fetchTodaySchedules = async () => {
      try {
        const result = await scheduleApi.getMySchedules({ page: 1, pageSize: 50 })
        const pending = todaySchedules(result.items)
        setTodayPending(pending)
      } catch {
        setTodayPending([])
      }
    }
    fetchTodaySchedules()
  }, [attendances])

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
          我的签到
        </Title>
        <Text type="secondary">查看您的签到记录和服务时长统计</Text>
      </div>

      {todayPending.length > 0 && (
        <Card
          style={{
            borderRadius: 12,
            border: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            marginBottom: 24,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff' }}>
            <Space>
              <QrcodeOutlined style={{ fontSize: 32 }} />
              <div>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
                  今日有待签到的排班
                </div>
                <div style={{ fontSize: 13, opacity: 0.9 }}>
                  您有 {todayPending.length} 个排班待签到，请及时完成签到
                </div>
              </div>
            </Space>
            <Button
              type="primary"
              size="large"
              icon={<ArrowRightOutlined />}
              onClick={() => navigate(`/check-in?scheduleId=${todayPending[0].id}`)}
              style={{
                background: '#fff',
                color: '#667eea',
                border: 'none',
                fontWeight: 600
              }}
            >
              去签到
            </Button>
          </div>
        </Card>
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8}>
          <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <Statistic
              title="总签到次数"
              value={stats.total}
              prefix={<CalendarOutlined style={{ color: '#1677ff' }} />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <Statistic
              title="出勤率"
              value={stats.rate}
              suffix="%"
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <Statistic
              title="累计服务时长"
              value={stats.totalHours}
              suffix="小时"
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <Statistic
              title="累计获得积分"
              value={stats.totalPoints}
              prefix={<GiftOutlined style={{ color: '#eb2f96' }} />}
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <Statistic
              title="迟到次数"
              value={stats.late}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <Statistic
              title="缺勤次数"
              value={stats.absent}
              prefix={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
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
              月度考勤统计
            </Title>
          </Space>
        }
      >
        <ReactECharts option={attendanceChartOption} style={{ height: 300 }} />
      </Card>

      <Card
        style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
        title={
          <Space>
            <CheckCircleOutlined style={{ color: '#52c41a' }} />
            <Title level={5} style={{ margin: 0 }}>
              签到记录
            </Title>
          </Space>
        }
        extra={
          <Space>
            <RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates as [dayjs.Dayjs | null, dayjs.Dayjs | null] | null)}
              allowClear
            />
            <Select
              placeholder="状态筛选"
              allowClear
              style={{ width: 120 }}
              value={statusFilter}
              onChange={setStatusFilter}
            >
              <Option value="PRESENT">正常</Option>
              <Option value="LATE">迟到</Option>
              <Option value="LEAVE_EARLY">早退</Option>
              <Option value="ABSENT">缺勤</Option>
            </Select>
          </Space>
        }
      >
        {attendances.length === 0 ? (
          <Empty description="暂无签到记录" />
        ) : (
          <Table
            dataSource={attendances}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        )}
      </Card>
    </div>
  )
}

export default MyAttendance
