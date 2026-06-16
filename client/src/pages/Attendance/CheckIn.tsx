import React, { useEffect, useState, useMemo } from 'react'
import {
  Row,
  Col,
  Card,
  Button,
  Tag,
  Space,
  Typography,
  Spin,
  message,
  Statistic,
  Descriptions,
  Divider
} from 'antd'
import {
  EnvironmentOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  QrcodeOutlined,
  ProjectOutlined,
  ArrowLeftOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons'
import { useNavigate, useSearchParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { attendanceApi, scheduleApi } from '../../api'
import { useAuthStore } from '../../store'
import type { Schedule, Attendance } from '../../types'

const { Title, Text } = Typography

const customIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

const projectIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

const CheckIn: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const scheduleId = searchParams.get('scheduleId')
  const user = useAuthStore((state) => state.user)
  const [loading, setLoading] = useState(true)
  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [attendance, setAttendance] = useState<Attendance | null>(null)
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null)
  const [checkInLoading, setCheckInLoading] = useState(false)
  const [checkOutLoading, setCheckOutLoading] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [distance, setDistance] = useState<number | null>(null)
  const [withinRange, setWithinRange] = useState(false)
  const [countdown, setCountdown] = useState('00:00:00')

  const SIGN_IN_RANGE = 200

  const now = dayjs()
  const scheduleStartTime = useMemo(
    () => (schedule ? dayjs(`${schedule.scheduledDate} ${schedule.startTime}`) : null),
    [schedule]
  )
  const scheduleEndTime = useMemo(
    () => (schedule ? dayjs(`${schedule.scheduledDate} ${schedule.endTime}`) : null),
    [schedule]
  )
  const canCheckIn = useMemo(
    () => scheduleStartTime && now.isAfter(scheduleStartTime.subtract(30, 'minute')) && now.isBefore(scheduleEndTime),
    [scheduleStartTime, scheduleEndTime, now]
  )
  const canCheckOut = useMemo(
    () => !!(attendance && attendance.checkInTime && !attendance.checkOutTime),
    [attendance]
  )

  useEffect(() => {
    fetchData()
    getCurrentLocation()
  }, [scheduleId])

  useEffect(() => {
    const updateCountdown = () => {
      if (!scheduleStartTime || !scheduleEndTime) return
      
      const targetTime = canCheckOut ? scheduleEndTime : scheduleStartTime
      const diff = targetTime.diff(dayjs())
      
      if (diff <= 0) {
        setCountdown('00:00:00')
        return
      }
      
      const hours = Math.floor(diff / 3600000)
      const minutes = Math.floor((diff % 3600000) / 60000)
      const seconds = Math.floor((diff % 60000) / 1000)
      setCountdown(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      )
    }

    updateCountdown()
    const timer = setInterval(updateCountdown, 1000)
    return () => clearInterval(timer)
  }, [scheduleStartTime, scheduleEndTime, canCheckOut])

  const fetchData = async () => {
    setLoading(true)
    try {
      if (scheduleId) {
        const s = await scheduleApi.getScheduleById(parseInt(scheduleId))
        setSchedule(s)

        const attendances = await attendanceApi.getAttendances({ page: 1, pageSize: 100, scheduleId: parseInt(scheduleId) })
        const existingAttendance = attendances.items.find(
          (a) => a.volunteerProfile?.user?.id === user?.id
        )
        if (existingAttendance) {
          setAttendance(existingAttendance)
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
      setSchedule({
        id: 1,
        projectId: 1,
        scheduledDate: dayjs().format('YYYY-MM-DD'),
        startTime: '09:00',
        endTime: '12:00',
        status: 'CONFIRMED',
        volunteerProfileId: 1,
        project: {
          id: 1,
          title: '社区环保志愿活动',
          category: '环保',
          level: 'BASIC',
          status: 'ONGOING',
          location: '北京市朝阳区',
          latitude: 39.9042,
          longitude: 116.4074,
          startDate: dayjs().format('YYYY-MM-DD'),
          endDate: dayjs().add(6, 'month').format('YYYY-MM-DD'),
          maxParticipants: 50,
          minParticipants: 10,
          pointsPerHour: 10,
          projectManagerId: 1
        } as any,
        volunteerProfile: {} as any,
        createdAt: dayjs().format('YYYY-MM-DD'),
        updatedAt: dayjs().format('YYYY-MM-DD')
      })
    } finally {
      setLoading(false)
    }
  }

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude
          setCurrentLocation([lat, lng])
          setLocationError(null)
          if (schedule?.project?.latitude && schedule?.project?.longitude) {
            const d = calculateDistance(
              lat,
              lng,
              schedule.project.latitude,
              schedule.project.longitude
            )
            setDistance(d)
            setWithinRange(d <= SIGN_IN_RANGE)
          }
        },
        (error) => {
          setLocationError('无法获取您的位置，请检查浏览器定位权限')
          console.error('Geolocation error:', error)
          setCurrentLocation([39.9042, 116.4074])
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      )
    } else {
      setLocationError('您的浏览器不支持地理定位')
      setCurrentLocation([39.9042, 116.4074])
    }
  }

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const handleCheckIn = async () => {
    if (!scheduleId || !currentLocation) return
    if (!withinRange) {
      message.error('您不在签到范围内，请前往项目地点后再签到')
      return
    }

    setCheckInLoading(true)
    try {
      const result = await attendanceApi.checkIn({
        scheduleId: parseInt(scheduleId),
        latitude: currentLocation[0],
        longitude: currentLocation[1]
      })
      setAttendance(result)
      message.success('签到成功！')
    } catch (error) {
      console.error('Check in failed:', error)
      message.error('签到失败，请稍后重试')
    } finally {
      setCheckInLoading(false)
    }
  }

  const handleCheckOut = async () => {
    if (!attendance?.id || !currentLocation) return

    setCheckOutLoading(true)
    try {
      const result = await attendanceApi.checkOut(attendance.id, {
        latitude: currentLocation[0],
        longitude: currentLocation[1]
      })
      setAttendance(result)
      message.success(`签退成功！服务时长 ${result.serviceHours} 小时，获得 ${result.pointsEarned} 积分`)
    } catch (error) {
      console.error('Check out failed:', error)
      message.error('签退失败，请稍后重试')
    } finally {
      setCheckOutLoading(false)
    }
  }

  const formatDistance = (d: number | null) => {
    if (d === null) return '-'
    if (d < 1000) return `${Math.round(d)} 米`
    return `${(d / 1000).toFixed(2)} 公里`
  }

  const mapCenter: [number, number] = schedule?.project?.latitude && schedule?.project?.longitude
    ? [(schedule.project.latitude + (currentLocation?.[0] || schedule.project.latitude)) / 2,
       (schedule.project.longitude + (currentLocation?.[1] || schedule.project.longitude)) / 2]
    : currentLocation || [39.9042, 116.4074]

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/attendance')}
        style={{ marginBottom: 24 }}
      >
        返回签到记录
      </Button>

      {schedule && (
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            <Card
              style={{
                borderRadius: 12,
                border: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                marginBottom: 24
              }}
              title={
                <Space>
                  <EnvironmentOutlined style={{ color: '#1677ff' }} />
                  <Title level={5} style={{ margin: 0 }}>
                    签到位置
                  </Title>
                </Space>
              }
            >
              <div style={{ height: 400, borderRadius: 8, overflow: 'hidden' }}>
                <MapContainer
                  center={mapCenter}
                  zoom={15}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {schedule.project?.latitude && schedule.project?.longitude && (
                    <>
                      <Marker
                        position={[schedule.project.latitude, schedule.project.longitude]}
                        icon={projectIcon}
                      >
                        <Popup>
                          <div>
                            <div style={{ fontWeight: 600 }}>{schedule.project.title}</div>
                            <div style={{ fontSize: 12 }}>{schedule.project.location}</div>
                          </div>
                        </Popup>
                      </Marker>
                      <Circle
                        center={[schedule.project.latitude, schedule.project.longitude]}
                        radius={SIGN_IN_RANGE}
                        pathOptions={{
                          color: '#52c41a',
                          fillColor: '#52c41a',
                          fillOpacity: 0.1
                        }}
                      />
                    </>
                  )}
                  {currentLocation && (
                    <Marker position={currentLocation} icon={customIcon}>
                      <Popup>
                        <div>
                          <div style={{ fontWeight: 600 }}>我的位置</div>
                          <div style={{ fontSize: 12 }}>
                            {withinRange ? (
                              <Text type="success">在签到范围内</Text>
                            ) : (
                              <Text type="danger">不在签到范围内</Text>
                            )}
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  )}
                </MapContainer>
              </div>

              {locationError && (
                <div style={{ marginTop: 16, padding: 12, background: '#fff2f0', borderRadius: 8 }}>
                  <Space>
                    <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                    <Text type="danger">{locationError}</Text>
                  </Space>
                </div>
              )}
            </Card>

            <Card
              style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
              title={
                <Space>
                  <ProjectOutlined style={{ color: '#1677ff' }} />
                  <Title level={5} style={{ margin: 0 }}>
                    项目信息
                  </Title>
                </Space>
              }
            >
              <Descriptions column={1} size="middle">
                <Descriptions.Item label="项目名称">
                  <Text strong>{schedule.project?.title}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="项目分类">
                  <Tag color="blue">{schedule.project?.category}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="服务地点">
                  <Space>
                    <EnvironmentOutlined />
                    {schedule.project?.location}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="服务时间">
                  <Space>
                    <ClockCircleOutlined />
                    {dayjs(schedule.scheduledDate).format('YYYY年MM月DD日')}
                    {' '}
                    {schedule.startTime} - {schedule.endTime}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="积分标准">
                  <Space>
                    <SafetyCertificateOutlined style={{ color: '#52c41a' }} />
                    <Text type="success" strong>
                      {schedule.project?.pointsPerHour} 积分/小时
                    </Text>
                  </Space>
                </Descriptions.Item>
              </Descriptions>
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
                <div
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: '50%',
                    background: attendance?.checkInTime
                      ? 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)'
                      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    color: '#fff',
                    fontSize: 40
                  }}
                >
                  {attendance?.checkInTime ? (
                    <CheckCircleOutlined />
                  ) : (
                    <QrcodeOutlined />
                  )}
                </div>
                <Title level={4} style={{ marginBottom: 8 }}>
                  {attendance?.checkInTime ? '已签到' : '待签到'}
                </Title>
                <Text type="secondary">
                  {attendance?.checkInTime
                    ? '您已完成签到，记得签退哦'
                    : canCheckIn
                    ? '您现在可以开始签到'
                    : '尚未到签到时间'}
                </Text>
              </div>

              <Divider />

              <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={12}>
                  <Statistic
                    title="距项目距离"
                    value={formatDistance(distance)}
                    valueStyle={{
                      fontSize: 16,
                      color: withinRange ? '#52c41a' : '#ff4d4f'
                    }}
                  />
                </Col>
                <Col xs={12}>
                  <Statistic
                    title="签到状态"
                    value={withinRange ? '在范围内' : '超出范围'}
                    valueStyle={{
                      fontSize: 16,
                      color: withinRange ? '#52c41a' : '#ff4d4f'
                    }}
                  />
                </Col>
              </Row>

              {attendance && (
                <>
                  <Divider />
                  <Descriptions column={1} size="small" style={{ marginBottom: 24 }}>
                    <Descriptions.Item label="签到时间">
                      {attendance.checkInTime
                        ? dayjs(attendance.checkInTime).format('YYYY-MM-DD HH:mm:ss')
                        : '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="签退时间">
                      {attendance.checkOutTime
                        ? dayjs(attendance.checkOutTime).format('YYYY-MM-DD HH:mm:ss')
                        : '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="服务时长">
                      {attendance.serviceHours > 0 ? `${attendance.serviceHours} 小时` : '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="获得积分">
                      {attendance.pointsEarned > 0 ? (
                        <Text type="success" strong>+{attendance.pointsEarned}</Text>
                      ) : (
                        '-'
                      )}
                    </Descriptions.Item>
                  </Descriptions>
                </>
              )}

              {!attendance?.checkOutTime && scheduleStartTime && (
                <>
                  <Divider />
                  <div style={{ textAlign: 'center', marginBottom: 16 }}>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      {canCheckOut ? '距离签退截止时间' : '距离签到开始时间'}
                    </Text>
                    <div style={{ fontSize: 24, fontWeight: 600, color: '#1677ff', marginTop: 8 }}>
                      {countdown}
                    </div>
                  </div>
                </>
              )}

              {!attendance?.checkInTime ? (
                <Button
                  type="primary"
                  size="large"
                  block
                  loading={checkInLoading}
                  disabled={!canCheckIn || !withinRange}
                  onClick={handleCheckIn}
                  style={{ height: 48, fontSize: 16 }}
                >
                  <QrcodeOutlined /> 立即签到
                </Button>
              ) : !attendance?.checkOutTime ? (
                <Button
                  type="primary"
                  size="large"
                  block
                  loading={checkOutLoading}
                  disabled={!withinRange}
                  onClick={handleCheckOut}
                  style={{ height: 48, fontSize: 16, background: '#52c41a', borderColor: '#52c41a' }}
                >
                  <CheckCircleOutlined /> 立即签退
                </Button>
              ) : (
                <Button
                  type="primary"
                  size="large"
                  block
                  disabled
                  style={{ height: 48, fontSize: 16 }}
                >
                  <CheckCircleOutlined /> 已完成签到签退
                </Button>
              )}

              {!withinRange && !attendance?.checkOutTime && (
                <div
                  style={{
                    marginTop: 16,
                    padding: 12,
                    background: '#fff7e6',
                    borderRadius: 8,
                    textAlign: 'center'
                  }}
                >
                  <Text type="warning" style={{ fontSize: 12 }}>
                    您当前不在签到范围内，请前往项目地点（{formatDistance(SIGN_IN_RANGE)}米内）后再进行签到/签退
                  </Text>
                </div>
              )}
            </Card>
          </Col>
        </Row>
      )}
    </div>
  )
}

export default CheckIn
