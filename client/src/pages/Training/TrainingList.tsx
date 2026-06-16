import React, { useEffect, useState } from 'react'
import { Row, Col, Card, Input, Select, Tag, Button, Space, Typography, Spin, Empty, Pagination, Progress } from 'antd'
import { SearchOutlined, BookOutlined, PlayCircleOutlined, CheckCircleOutlined, ClockCircleOutlined, TrophyOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { trainingApi, examApi } from '../../services/api'
import type { Training, TrainingRecord, Exam } from '../../types'

const { Title, Text } = Typography
const { Search } = Input
const { Option } = Select

const TrainingList: React.FC = () => {
  const navigate = useNavigate()
  const [trainings, setTrainings] = useState<Training[]>([])
  const [myRecords, setMyRecords] = useState<TrainingRecord[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState<string>('')
  const [level, setLevel] = useState<string>('')
  const [status, setStatus] = useState<string>('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(8)
  const [total, setTotal] = useState(0)

  const categories = ['安全教育', '技能培训', '服务规范', '应急处理', '法律法规', '其他']
  const levels = [
    { value: 'BASIC', label: '初级', color: 'blue' },
    { value: 'INTERMEDIATE', label: '中级', color: 'orange' },
    { value: 'ADVANCED', label: '高级', color: 'red' }
  ]

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [trainingsResult, recordsResult, examsResult] = await Promise.all([
          trainingApi.getTrainings({ page, pageSize, category, level }),
          trainingApi.getMyTrainingRecords(),
          examApi.getExams({ page: 1, pageSize: 100 })
        ])
        setTrainings(trainingsResult.items)
        setTotal(trainingsResult.total)
        setMyRecords(recordsResult)
        setExams(examsResult.items)
      } catch (error) {
        console.error('Failed to fetch trainings:', error)
        const mockTrainings: Training[] = Array.from({ length: 12 }, (_, i) => ({
          id: i + 1,
          title: ['志愿者服务规范', '应急救援基础', '沟通技巧培训', '环境保护知识', '老年护理基础', '儿童心理辅导', '消防安全知识', '医疗急救常识', '社区服务礼仪', '法律法规普及', '残疾人服务技巧', '活动策划与组织'][i],
          description: '本培训将全面介绍相关知识和技能，帮助志愿者更好地开展志愿服务工作。通过理论学习和实践操作，掌握必备的服务技能。',
          content: '培训内容包括理论知识讲解、案例分析、实践操作等多个环节。',
          category: categories[i % categories.length],
          level: ['BASIC', 'INTERMEDIATE', 'ADVANCED'][i % 3] as 'BASIC' | 'INTERMEDIATE' | 'ADVANCED',
          durationMinutes: [60, 90, 120, 150, 180][i % 5],
          passScore: 60 + (i % 4) * 10,
          examId: i % 3 === 0 ? i + 1 : undefined,
          createdAt: dayjs().subtract(i, 'day').toISOString(),
          updatedAt: dayjs().subtract(i, 'day').toISOString()
        }))
        setTrainings(mockTrainings)
        setTotal(12)
        setMyRecords([
          { id: 1, trainingId: 1, training: mockTrainings[0], volunteerProfileId: 1, status: 'COMPLETED', progress: 100, completedAt: dayjs().subtract(7, 'day').toISOString(), createdAt: '', updatedAt: '' },
          { id: 2, trainingId: 2, training: mockTrainings[1], volunteerProfileId: 1, status: 'IN_PROGRESS', progress: 65, createdAt: '', updatedAt: '' },
          { id: 3, trainingId: 3, training: mockTrainings[2], volunteerProfileId: 1, status: 'NOT_STARTED', progress: 0, createdAt: '', updatedAt: '' }
        ])
        setExams([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [page, pageSize, category, level])

  const getTrainingStatus = (trainingId: number) => {
    const record = myRecords.find(r => r.trainingId === trainingId)
    return record?.status || 'NOT_STARTED'
  }

  const getTrainingProgress = (trainingId: number) => {
    const record = myRecords.find(r => r.trainingId === trainingId)
    return record?.progress || 0
  }

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
      COMPLETED: { color: 'success', text: '已完成', icon: <CheckCircleOutlined /> },
      IN_PROGRESS: { color: 'processing', text: '学习中', icon: <PlayCircleOutlined /> },
      NOT_STARTED: { color: 'default', text: '未开始', icon: <ClockCircleOutlined /> },
      FAILED: { color: 'error', text: '未通过', icon: <ClockCircleOutlined /> }
    }
    const config = statusMap[status] || statusMap.NOT_STARTED
    return <Tag color={config.color} icon={config.icon}>{config.text}</Tag>
  }

  const getLevelTag = (level: string) => {
    const config = levels.find(l => l.value === level)
    if (!config) return null
    return <Tag color={config.color}>{config.label}</Tag>
  }

  const filteredTrainings = trainings.filter(training => {
    if (keyword) {
      const lowerKeyword = keyword.toLowerCase()
      if (!training.title.toLowerCase().includes(lowerKeyword) &&
          !training.description.toLowerCase().includes(lowerKeyword) &&
          !training.category.toLowerCase().includes(lowerKeyword)) {
        return false
      }
    }
    if (status) {
      const trainingStatus = getTrainingStatus(training.id)
      if (trainingStatus !== status) return false
    }
    return true
  })

  const handleCardClick = (trainingId: number) => {
    navigate(`/training/${trainingId}`)
  }

  const handleStartExam = (e: React.MouseEvent, examId: number) => {
    e.stopPropagation()
    navigate(`/exam/${examId}`)
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
          <BookOutlined style={{ marginRight: 8, color: '#1677ff' }} />
          培训中心
        </Title>
        <Text type="secondary">提升专业技能，更好地开展志愿服务</Text>
      </div>

      <Card
        style={{
          borderRadius: 12,
          border: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          marginBottom: 24
        }}
        bodyStyle={{ padding: 20 }}
      >
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="搜索培训课程..."
              prefix={<SearchOutlined />}
              allowClear
              size="large"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </Col>
          <Col xs={24} sm={12} md={5}>
            <Select
              placeholder="选择分类"
              allowClear
              size="large"
              style={{ width: '100%' }}
              value={category || undefined}
              onChange={(value) => setCategory(value || '')}
            >
              {categories.map(cat => (
                <Option key={cat} value={cat}>{cat}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={5}>
            <Select
              placeholder="选择难度"
              allowClear
              size="large"
              style={{ width: '100%' }}
              value={level || undefined}
              onChange={(value) => setLevel(value || '')}
            >
              {levels.map(l => (
                <Option key={l.value} value={l.value}>{l.label}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={5}>
            <Select
              placeholder="学习状态"
              allowClear
              size="large"
              style={{ width: '100%' }}
              value={status || undefined}
              onChange={(value) => setStatus(value || '')}
            >
              <Option value="NOT_STARTED">未开始</Option>
              <Option value="IN_PROGRESS">学习中</Option>
              <Option value="COMPLETED">已完成</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={1}>
            <Button
              type="primary"
              size="large"
              onClick={() => { setPage(1) }}
              style={{ width: '100%' }}
            >
              筛选
            </Button>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card
            style={{
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff'
            }}
            bodyStyle={{ padding: 20 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 8 }}>已完成培训</div>
                <div style={{ fontSize: 32, fontWeight: 700 }}>
                  {myRecords.filter(r => r.status === 'COMPLETED').length}
                </div>
              </div>
              <div style={{ fontSize: 48, opacity: 0.3 }}>
                <TrophyOutlined />
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card
            style={{
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: '#fff'
            }}
            bodyStyle={{ padding: 20 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 8 }}>学习中课程</div>
                <div style={{ fontSize: 32, fontWeight: 700 }}>
                  {myRecords.filter(r => r.status === 'IN_PROGRESS').length}
                </div>
              </div>
              <div style={{ fontSize: 48, opacity: 0.3 }}>
                <PlayCircleOutlined />
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card
            style={{
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: '#fff'
            }}
            bodyStyle={{ padding: 20 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 8 }}>累计学习时长</div>
                <div style={{ fontSize: 32, fontWeight: 700 }}>
                  {myRecords.reduce((sum, r) => sum + (r.training?.durationMinutes || 0) * (r.progress / 100), 0).toFixed(0)} 分钟
                </div>
              </div>
              <div style={{ fontSize: 48, opacity: 0.3 }}>
                <ClockCircleOutlined />
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {filteredTrainings.length === 0 ? (
        <Empty description="暂无匹配的培训课程" style={{ padding: 60 }} />
      ) : (
        <>
          <Row gutter={[16, 16]}>
            {filteredTrainings.map((training) => {
              const trainingStatus = getTrainingStatus(training.id)
              const progress = getTrainingProgress(training.id)
              const hasExam = exams.some(e => training.examId === e.id)

              return (
                <Col xs={24} sm={12} lg={6} key={training.id}>
                  <Card
                    hoverable
                    style={{
                      borderRadius: 12,
                      border: 'none',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      height: '100%',
                      cursor: 'pointer'
                    }}
                    bodyStyle={{ padding: 20 }}
                    onClick={() => handleCardClick(training.id)}
                  >
                    <div style={{ marginBottom: 12 }}>
                      <Space size={[8, 8]} wrap>
                        {getLevelTag(training.level)}
                        {getStatusTag(trainingStatus)}
                        <Tag color="purple">{training.category}</Tag>
                      </Space>
                    </div>

                    <Title level={5} style={{ marginBottom: 8, minHeight: 48 }}>
                      {training.title}
                    </Title>

                    <Text type="secondary" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 42, marginBottom: 16 }}>
                      {training.description}
                    </Text>

                    {trainingStatus !== 'NOT_STARTED' && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>学习进度</Text>
                          <Text style={{ fontSize: 12, fontWeight: 600, color: '#1677ff' }}>{progress}%</Text>
                        </div>
                        <Progress percent={progress} size="small" showInfo={false} />
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
                      <Space size={[12, 0]}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          <ClockCircleOutlined style={{ marginRight: 4 }} />
                          {training.durationMinutes}分钟
                        </Text>
                        {hasExam && (
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            <CheckCircleOutlined style={{ marginRight: 4 }} />
                            含考试
                          </Text>
                        )}
                      </Space>
                      {trainingStatus === 'COMPLETED' && hasExam && (
                        <Button
                          type="primary"
                          size="small"
                          onClick={(e) => handleStartExam(e, training.examId!)}
                        >
                          参加考试
                        </Button>
                      )}
                    </div>
                  </Card>
                </Col>
              )
            })}
          </Row>

          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <Pagination
              current={page}
              pageSize={pageSize}
              total={total}
              showSizeChanger
              showQuickJumper
              showTotal={(total) => `共 ${total} 条记录`}
              onChange={(p, ps) => {
                setPage(p)
                setPageSize(ps)
              }}
            />
          </div>
        </>
      )}
    </div>
  )
}

export default TrainingList
