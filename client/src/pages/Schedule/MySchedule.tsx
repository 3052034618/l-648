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
  List,
  Avatar,
  Modal,
  Descriptions,
  Divider,
  Statistic
} from 'antd'
import {
  CalendarOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  ProjectOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  QrcodeOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import ReactECharts from 'echarts-for-react'
import { scheduleApi, attendanceApi } from '../../api'
import { useAuthStore } from '../../store'
import type { Schedule } from '../../types'

const { Title, Text } = Typography

const MySchedule: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [selectedDate, setSelectedDate] = useState(dayjs())
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null)

  useEffect(() => {
    fetchSchedules()
  }, [selectedDate])

  const fetchSchedules = async () => {
    setLoading(true)
    try {
      const result = await scheduleApi.getMySchedules({ page: 1, pageSize: 100 })
      setSchedules(result.items)
    } catch (error) {
      console.error('Failed to fetch schedules:', error)
      const mockSchedules: Schedule[] = []
      const baseDate = dayjs()
      for (let i = -5; i <= 10; i++) {
        const date = baseDate.add(i, 'day')
        if (i !== 0 && i !== 3 && i !== 7) continue
        mockSchedules.push({
          id: i + 100,
          projectId: 1,
          scheduledDate: date.format('YYYY-MM-DD'),
          startTime: i % 2 === 0 ? '09:00' : '14:00',
          endTime: i % 2 === 0 ? '12:00' : '17:00',
          status: i < 0 ? 'CONFIRMED' : i === 0 ? 'CONFIRMED' : 'PENDING',
          volunteerProfileId: 1,
          project: {
            id: 1,
            title: i % 2 === 0 ? '社区环保志愿活动' : '图书馆志愿服务',
            category: i % 2 === 0 ? '环保' : '教育',
            location: i % 2 === 0 ? '北京市朝阳区' : '北京市海淀区',
            status: 'ONGOING'
          } as any,
          volunteerProfile: {} as any,
          createdAt: date.format('YYYY-MM-DD'),
          updatedAt: date.format('YYYY-MM-DD')
        })
      }
      setSchedules(mockSchedules)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'success'
      case 'CANCELLED':
        return 'error'
      case 'PENDING':
        return 'warning'
      default:
        return 'default'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return '已确认'
      case 'CANCELLED':
        return '已取消'
      case 'PENDING':
        return '待确认'
      default:
        return status
    }
  }

  const generateCalendarDays = () => {
    const startOfMonth = selectedDate.startOf('month')
    const endOfMonth = selectedDate.endOf('month')
    const startDay = startOfMonth.day()
    const daysInMonth = endOfMonth.date()

    const days: { date: dayjs.Dayjs; schedules: Schedule[] }[] = []

    for (let i = 0; i < startDay; i++) {
      const date = startOfMonth.subtract(startDay - i, 'day')
      days.push({ date, schedules: [] })
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const date = startOfMonth.date(i)
      const daySchedules = schedules.filter((s) =>
        dayjs(s.scheduledDate).isSame(date, 'day')
      )
      days.push({ date, schedules: daySchedules })
    }

    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) {
      const date = endOfMonth.add(i, 'day')
      days.push({ date, schedules: [] })
    }

    return days
  }

  const calendarDays = generateCalendarDays()
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']

  const todaySchedules = schedules.filter((s) =>
    dayjs(s.scheduledDate).isSame(dayjs(), 'day')
  )

  const upcomingSchedules = schedules
    .filter((s) => dayjs(s.scheduledDate).isAfter(dayjs(), 'day'))
    .sort((a, b) => dayjs(a.scheduledDate).valueOf() - dayjs(b.scheduledDate).valueOf())
    .slice(0, 5)

  const stats = {
    total: schedules.length,
    confirmed: schedules.filter((s) => s.status === 'CONFIRMED').length,
    pending: schedules.filter((s) => s.status === 'PENDING').length,
    thisMonth: schedules.filter((s) =>
      dayjs(s.scheduledDate).isSame(selectedDate, 'month')
    ).length
  }

  const weeklyStats = [
    { day: '周一', hours: 4 },
    { day: '周二', hours: 0 },
    { day: '周三', hours: 6 },
    { day: '周四', hours: 3 },
    { day: '周五', hours: 0 },
    { day: '周六', hours: 8 },
    { day: '周日', hours: 5 }
  ]

  const weeklyChartOption = {
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: weeklyStats.map((item) => item.day)
    },
    yAxis: {
      type: 'value',
      name: '时长(小时)'
    },
    series: [
      {
        data: weeklyStats.map((item) => item.hours),
        type: 'bar',
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#667eea' },
              { offset: 1, color: '#764ba2' }
            ]
          }
        },
        barWidth: '50%'
      }
    ],
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    }
  }

  const prevMonth = () => {
    setSelectedDate(selectedDate.subtract(1, 'month'))
  }

  const nextMonth = () => {
    setSelectedDate(selectedDate.add(1, 'month'))
  }

  const today = () => {
    setSelectedDate(dayjs())
  }

  const handleViewDetail = (schedule: Schedule) => {
    setSelectedSchedule(schedule)
    setDetailModalVisible(true)
  }

  const handleCheckIn = (schedule: Schedule) => {
    navigate(`/check-in?scheduleId=${schedule.id}`)
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
          我的排班
        </Title>
        <Text type="secondary">查看和管理您的志愿活动排班安排</Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <Statistic
              title="本月排班"
              value={stats.thisMonth}
              prefix={<CalendarOutlined style={{ color: '#1677ff' }} />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <Statistic
              title="已确认"
              value={stats.confirmed}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <Statistic
              title="待确认"
              value={stats.pending}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <Statistic
              title="今日排班"
              value={todaySchedules.length}
              prefix={<ProjectOutlined style={{ color: '#eb2f96' }} />}
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card
            style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space>
                  <CalendarOutlined style={{ color: '#1677ff' }} />
                  <Title level={5} style={{ margin: 0 }}>
                    {selectedDate.format('YYYY年MM月')}
                  </Title>
                </Space>
                <Space>
                  <Button icon={<ArrowLeftOutlined />} onClick={prevMonth} size="small" />
                  <Button onClick={today} size="small">
                    今天
                  </Button>
                  <Button icon={<ArrowRightOutlined />} onClick={nextMonth} size="small" />
                </Space>
              </div>
            }
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
              {weekDays.map((day) => (
                <div
                  key={day}
                  style={{
                    textAlign: 'center',
                    padding: '12px 0',
                    fontWeight: 600,
                    color: '#666'
                  }}
                >
                  {day}
                </div>
              ))}
              {calendarDays.map((dayData, index) => {
                const isCurrentMonth = dayData.date.isSame(selectedDate, 'month')
                const isToday = dayData.date.isSame(dayjs(), 'day')
                const hasSchedule = dayData.schedules.length > 0

                return (
                  <div
                    key={index}
                    style={{
                      minHeight: 100,
                      padding: 8,
                      borderRadius: 8,
                      background: isToday
                        ? 'rgba(22, 119, 255, 0.1)'
                        : isCurrentMonth
                        ? '#fff'
                        : '#fafafa',
                      border: isToday ? '1px solid #1677ff' : '1px solid #f0f0f0',
                      position: 'relative'
                    }}
                  >
                    <div
                      style={{
                        fontWeight: isToday ? 600 : 400,
                        color: isToday ? '#1677ff' : isCurrentMonth ? '#333' : '#ccc',
                        marginBottom: 4
                      }}
                    >
                      {dayData.date.date()}
                    </div>
                    {dayData.schedules.slice(0, 2).map((schedule) => (
                      <div
                        key={schedule.id}
                        onClick={() => handleViewDetail(schedule)}
                        style={{
                          fontSize: 11,
                          padding: '4px 6px',
                          borderRadius: 4,
                          marginBottom: 4,
                          background: schedule.status === 'CONFIRMED' ? '#e6f7ff' : '#fff7e6',
                          color: schedule.status === 'CONFIRMED' ? '#1677ff' : '#faad14',
                          cursor: 'pointer',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {schedule.startTime} {schedule.project?.title}
                      </div>
                    ))}
                    {dayData.schedules.length > 2 && (
                      <div style={{ fontSize: 11, color: '#999', textAlign: 'center' }}>
                        +{dayData.schedules.length - 2} 更多
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          {todaySchedules.length > 0 && (
            <Card
              style={{
                borderRadius: 12,
                border: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                marginBottom: 24
              }}
              title={
                <Space>
                  <Badge dot color="#52c41a" />
                  <Title level={5} style={{ margin: 0 }}>
                    今日排班
                  </Title>
                </Space>
              }
            >
              <List
                dataSource={todaySchedules}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Button
                        type="primary"
                        size="small"
                        icon={<QrcodeOutlined />}
                        onClick={() => handleCheckIn(item)}
                      >
                        签到
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar style={{ backgroundColor: '#52c41a' }}>
                          <ClockCircleOutlined />
                        </Avatar>
                      }
                      title={item.project?.title}
                      description={
                        <Space direction="vertical" size={4}>
                          <div style={{ fontSize: 12 }}>
                            {item.startTime} - {item.endTime}
                          </div>
                          <div style={{ fontSize: 12, color: '#999' }}>
                            <EnvironmentOutlined /> {item.project?.location}
                          </div>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          )}

          <Card
            style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 24 }}
            title={
              <Space>
                <ClockCircleOutlined style={{ color: '#faad14' }} />
                <Title level={5} style={{ margin: 0 }}>
                  即将到来
                </Title>
              </Space>
            }
          >
            {upcomingSchedules.length === 0 ? (
              <Empty description="暂无即将到来的排班" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <List
                dataSource={upcomingSchedules}
                renderItem={(item) => (
                  <List.Item onClick={() => handleViewDetail(item)} style={{ cursor: 'pointer' }}>
                    <List.Item.Meta
                      avatar={
                        <Avatar style={{ backgroundColor: '#1677ff' }}>
                          {dayjs(item.scheduledDate).format('DD')}
                        </Avatar>
                      }
                      title={item.project?.title}
                      description={
                        <Space direction="vertical" size={4}>
                          <div style={{ fontSize: 12 }}>
                            {dayjs(item.scheduledDate).format('MM月DD日')} {item.startTime} - {item.endTime}
                          </div>
                          <Tag color={getStatusColor(item.status)} style={{ margin: 0 }}>
                            {getStatusText(item.status)}
                          </Tag>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>

          <Card
            style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
            title={
              <Space>
                <ProjectOutlined style={{ color: '#722ed1' }} />
                <Title level={5} style={{ margin: 0 }}>
                  本周时长分布
                </Title>
              </Space>
            }
          >
            <ReactECharts option={weeklyChartOption} style={{ height: 200 }} />
          </Card>
        </Col>
      </Row>

      <Modal
        title="排班详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
          selectedSchedule &&
            dayjs(selectedSchedule.scheduledDate).isSame(dayjs(), 'day') &&
            selectedSchedule.status === 'CONFIRMED' && (
              <Button key="checkin" type="primary" onClick={() => handleCheckIn(selectedSchedule)}>
                去签到
              </Button>
            )
        ]}
      >
        {selectedSchedule && (
          <div>
            <Title level={4} style={{ marginBottom: 16 }}>
              {selectedSchedule.project?.title}
            </Title>
            <Tag color={getStatusColor(selectedSchedule.status)} style={{ marginBottom: 16 }}>
              {getStatusText(selectedSchedule.status)}
            </Tag>
            <Divider />
            <Descriptions column={1} size="small">
              <Descriptions.Item label="日期">
                {dayjs(selectedSchedule.scheduledDate).format('YYYY年MM月DD日')}
              </Descriptions.Item>
              <Descriptions.Item label="时间">
                {selectedSchedule.startTime} - {selectedSchedule.endTime}
              </Descriptions.Item>
              <Descriptions.Item label="地点">
                <Space>
                  <EnvironmentOutlined />
                  {selectedSchedule.project?.location}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="项目分类">
                <Tag color="blue">{selectedSchedule.project?.category}</Tag>
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default MySchedule
