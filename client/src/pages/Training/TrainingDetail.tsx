import React, { useEffect, useState, useRef } from 'react'
import { Row, Col, Card, Button, Tag, Typography, Spin, Space, Divider, Steps, message, Modal } from 'antd'
import { ArrowLeftOutlined, PlayCircleOutlined, PauseCircleOutlined, CheckCircleOutlined, ClockCircleOutlined, BookOutlined, FileTextOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'
import { trainingApi, examApi } from '../../services/api'
import type { Training, TrainingRecord, Exam, ExamRecord } from '../../types'

const { Title, Text, Paragraph } = Typography
const { Step } = Steps

const TrainingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [training, setTraining] = useState<Training | null>(null)
  const [myRecord, setMyRecord] = useState<TrainingRecord | null>(null)
  const [exam, setExam] = useState<Exam | null>(null)
  const [examRecords, setExamRecords] = useState<ExamRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentSection, setCurrentSection] = useState(0)
  const [showExamModal, setShowExamModal] = useState(false)
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const levels = [
    { value: 'BASIC', label: '初级', color: 'blue' },
    { value: 'INTERMEDIATE', label: '中级', color: 'orange' },
    { value: 'ADVANCED', label: '高级', color: 'red' }
  ]

  const trainingSections = [
    { title: '课程介绍', duration: '5分钟' },
    { title: '理论知识', duration: '20分钟' },
    { title: '案例分析', duration: '15分钟' },
    { title: '实践操作', duration: '25分钟' },
    { title: '课程总结', duration: '5分钟' }
  ]

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return
      try {
        const [trainingResult, recordsResult] = await Promise.all([
          trainingApi.getTrainingById(Number(id)),
          trainingApi.getMyTrainingRecords()
        ])
        setTraining(trainingResult)
        const record = recordsResult.find(r => r.trainingId === Number(id))
        setMyRecord(record || null)
        setCurrentSection(Math.floor((record?.progress || 0) / 20))

        if (trainingResult.examId) {
          const [examResult, examRecordsResult] = await Promise.all([
            examApi.getExamById(trainingResult.examId),
            examApi.getMyExamRecords()
          ])
          setExam(examResult)
          setExamRecords(examRecordsResult.filter(r => r.examId === trainingResult.examId))
        }
      } catch (error) {
        console.error('Failed to fetch training detail:', error)
        const mockTraining: Training = {
          id: Number(id),
          title: '志愿者服务规范培训',
          description: '本培训将全面介绍志愿者服务的基本规范和要求，帮助志愿者更好地开展志愿服务工作。',
          content: `## 课程介绍\n\n志愿者服务是一项光荣而有意义的工作。作为志愿者，我们需要了解并遵守基本的服务规范，以确保服务质量和自身安全。\n\n## 理论知识\n\n### 1. 服务礼仪\n- 着装整洁，佩戴统一标识\n- 用语文明，态度热情\n- 尊重服务对象的隐私和意愿\n\n### 2. 安全规范\n- 了解项目安全注意事项\n- 掌握基本的应急处理方法\n- 保持通讯畅通\n\n### 3. 服务职责\n- 按时到岗，不擅自离岗\n- 认真完成分配的任务\n- 遇到问题及时向负责人汇报\n\n## 案例分析\n\n通过实际案例分析，我们将学习如何应对各种突发情况，以及如何提供高质量的志愿服务。\n\n## 实践操作\n\n在这一部分，我们将进行模拟演练，让大家亲身体验志愿服务的各个环节。\n\n## 课程总结\n\n希望通过本次培训，大家能够掌握志愿者服务的基本规范，在今后的志愿服务中能够更加专业、高效地开展工作。`,
          category: '服务规范',
          level: 'BASIC',
          durationMinutes: 90,
          passScore: 70,
          examId: 1,
          createdAt: dayjs().subtract(7, 'day').toISOString(),
          updatedAt: dayjs().subtract(7, 'day').toISOString()
        }
        setTraining(mockTraining)
        setMyRecord({
          id: 1,
          trainingId: Number(id),
          training: mockTraining,
          volunteerProfileId: 1,
          status: 'IN_PROGRESS',
          progress: 65,
          createdAt: '',
          updatedAt: ''
        })
        setCurrentSection(3)
        setExam({
          id: 1,
          title: '志愿者服务规范考试',
          description: '本次考试旨在检验您对志愿者服务规范的掌握程度',
          totalScore: 100,
          passScore: 70,
          durationMinutes: 30,
          questions: [],
          createdAt: '',
          updatedAt: ''
        })
        setExamRecords([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  useEffect(() => {
    if (isPlaying && myRecord) {
      progressIntervalRef.current = setInterval(async () => {
        const newProgress = Math.min(myRecord.progress + 1, 100)
        try {
          await trainingApi.updateProgress(Number(id), newProgress)
          setMyRecord(prev => prev ? { ...prev, progress: newProgress } : null)
          if (newProgress >= 100) {
            setIsPlaying(false)
            setMyRecord(prev => prev ? { ...prev, status: 'COMPLETED', progress: 100 } : null)
            message.success('恭喜！您已完成本课程学习')
          }
        } catch (error) {
          console.error('Failed to update progress:', error)
          setMyRecord(prev => prev ? { ...prev, progress: newProgress } : null)
          if (newProgress >= 100) {
            setIsPlaying(false)
            setMyRecord(prev => prev ? { ...prev, status: 'COMPLETED', progress: 100 } : null)
            message.success('恭喜！您已完成本课程学习')
          }
        }
      }, 1000)
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }, [isPlaying, myRecord, id])

  const handleStartLearning = async () => {
    if (!training) return
    try {
      if (!myRecord) {
        const record = await trainingApi.startTraining(training.id)
        setMyRecord(record)
      }
      setIsPlaying(true)
    } catch (error) {
      console.error('Failed to start training:', error)
      setMyRecord({
        id: 1,
        trainingId: training.id,
        training: training,
        volunteerProfileId: 1,
        status: 'IN_PROGRESS',
        progress: 0,
        createdAt: dayjs().toISOString(),
        updatedAt: dayjs().toISOString()
      })
      setIsPlaying(true)
      message.success('开始学习')
    }
  }

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying)
  }

  const handleSectionClick = (index: number) => {
    setCurrentSection(index)
  }

  const handleStartExam = () => {
    if (myRecord?.status !== 'COMPLETED') {
      message.warning('请先完成课程学习再参加考试')
      return
    }
    setShowExamModal(true)
  }

  const confirmStartExam = () => {
    setShowExamModal(false)
    if (exam) {
      navigate(`/exam/${exam.id}`)
    }
  }

  const getLevelTag = (level: string) => {
    const config = levels.find(l => l.value === level)
    if (!config) return null
    return <Tag color={config.color}>{config.label}</Tag>
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

  const renderContent = (content: string) => {
    const sections = content.split('## ').filter(Boolean)
    return sections.map((section, index) => {
      const lines = section.trim().split('\n')
      const title = lines[0]
      const body = lines.slice(1).join('\n').trim()
      return (
        <div key={index} style={{ marginBottom: 24 }}>
          <Title level={4} style={{ color: '#1677ff', marginBottom: 12 }}>
            {title}
          </Title>
          <Paragraph style={{ lineHeight: 1.8, fontSize: 15 }}>
            {body.split('\n').map((line, i) => (
              <React.Fragment key={i}>
                {line}
                {i < body.split('\n').length - 1 && <br />}
              </React.Fragment>
            ))}
          </Paragraph>
        </div>
      )
    })
  }

  const progressChartOption = {
    series: [
      {
        type: 'gauge',
        startAngle: 90,
        endAngle: -270,
        pointer: {
          show: false
        },
        progress: {
          show: true,
          overlap: false,
          roundCap: true,
          clip: false,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: '#1677ff' },
                { offset: 1, color: '#52c41a' }
              ]
            }
          }
        },
        axisLine: {
          lineStyle: {
            width: 18,
            color: [[1, '#f0f0f0']]
          }
        },
        splitLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        axisLabel: {
          show: false
        },
        data: [
          {
            value: myRecord?.progress || 0,
            detail: {
              offsetCenter: ['0%', '0%']
            }
          }
        ],
        detail: {
          fontSize: 32,
          fontWeight: 'bold',
          formatter: '{value}%',
          color: '#1677ff'
        }
      }
    ]
  }

  const latestExamRecord = examRecords.length > 0 ? examRecords[examRecords.length - 1] : null

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!training) {
    return <div style={{ padding: 40, textAlign: 'center' }}>培训不存在</div>
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/training')}
          style={{ marginBottom: 16 }}
        >
          返回培训列表
        </Button>
        <Title level={3} style={{ marginBottom: 8 }}>
          {training.title}
        </Title>
        <Space size={[8, 8]} wrap>
          {getLevelTag(training.level)}
          <Tag color="purple">{training.category}</Tag>
          {myRecord && getStatusTag(myRecord.status)}
          <Text type="secondary">
            <ClockCircleOutlined style={{ marginRight: 4 }} />
            时长：{training.durationMinutes}分钟
          </Text>
          {training.examId && (
            <Text type="secondary">
              <FileTextOutlined style={{ marginRight: 4 }} />
              及格分数：{training.passScore}分
            </Text>
          )}
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            style={{
              borderRadius: 12,
              border: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              marginBottom: 16
            }}
            title={
              <Space>
                <BookOutlined style={{ color: '#1677ff' }} />
                <span>课程内容</span>
              </Space>
            }
            extra={
              myRecord?.status !== 'COMPLETED' && (
                <Button
                  type={isPlaying ? 'default' : 'primary'}
                  icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                  onClick={myRecord ? handleTogglePlay : handleStartLearning}
                >
                  {isPlaying ? '暂停学习' : (myRecord ? '继续学习' : '开始学习')}
                </Button>
              )
            }
          >
            <div style={{ marginBottom: 24, padding: 20, background: '#f5f5f5', borderRadius: 8 }}>
              <Steps
                direction="vertical"
                current={currentSection}
                size="small"
              >
                {trainingSections.map((section, index) => (
                  <Step
                    key={index}
                    title={
                      <span
                        style={{
                          cursor: 'pointer',
                          color: index <= currentSection ? '#1677ff' : undefined
                        }}
                        onClick={() => handleSectionClick(index)}
                      >
                        {section.title}
                      </span>
                    }
                    description={section.duration}
                    status={index < currentSection ? 'finish' : index === currentSection ? 'process' : 'wait'}
                  />
                ))}
              </Steps>
            </div>

            {renderContent(training.content)}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            style={{
              borderRadius: 12,
              border: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              marginBottom: 16
            }}
            bodyStyle={{ padding: 20 }}
          >
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <ReactECharts option={progressChartOption} style={{ height: 200 }} />
              <Text type="secondary">学习进度</Text>
            </div>

            <Divider style={{ margin: '16px 0' }} />

            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text type="secondary">当前章节</Text>
                <Text strong>{trainingSections[currentSection]?.title}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text type="secondary">总时长</Text>
                <Text strong>{training.durationMinutes}分钟</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">学习状态</Text>
                {myRecord ? getStatusTag(myRecord.status) : getStatusTag('NOT_STARTED')}
              </div>
            </div>
          </Card>

          {exam && (
            <Card
              style={{
                borderRadius: 12,
                border: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                marginBottom: 16
              }}
              title={
                <Space>
                  <SafetyCertificateOutlined style={{ color: '#faad14' }} />
                  <span>结业考试</span>
                </Space>
              }
            >
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text type="secondary">考试名称</Text>
                  <Text strong>{exam.title}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text type="secondary">考试时长</Text>
                  <Text strong>{exam.durationMinutes}分钟</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text type="secondary">总分</Text>
                  <Text strong>{exam.totalScore}分</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">及格分数</Text>
                  <Text strong style={{ color: '#faad14' }}>{exam.passScore}分</Text>
                </div>
              </div>

              {latestExamRecord && (
                <div style={{ padding: 12, background: latestExamRecord.status === 'PASSED' ? '#f6ffed' : '#fff2f0', borderRadius: 8, marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text type="secondary">上次考试成绩</Text>
                    <Tag color={latestExamRecord.status === 'PASSED' ? 'success' : 'error'}>
                      {latestExamRecord.status === 'PASSED' ? '已通过' : '未通过'}
                    </Tag>
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: latestExamRecord.status === 'PASSED' ? '#52c41a' : '#ff4d4f', textAlign: 'center' }}>
                    {latestExamRecord.score}分
                  </div>
                </div>
              )}

              <Button
                type="primary"
                block
                size="large"
                icon={<FileTextOutlined />}
                onClick={handleStartExam}
                disabled={myRecord?.status !== 'COMPLETED'}
              >
                {myRecord?.status !== 'COMPLETED' ? '请先完成学习' : (latestExamRecord ? '重新考试' : '开始考试')}
              </Button>
            </Card>
          )}

          <Card
            style={{
              borderRadius: 12,
              border: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}
            title={
              <Space>
                <FileTextOutlined style={{ color: '#722ed1' }} />
                <span>课程简介</span>
              </Space>
            }
          >
            <Paragraph style={{ lineHeight: 1.8 }}>
              {training.description}
            </Paragraph>
          </Card>
        </Col>
      </Row>

      <Modal
        title="确认参加考试"
        open={showExamModal}
        onOk={confirmStartExam}
        onCancel={() => setShowExamModal(false)}
        okText="确认开始"
        cancelText="取消"
      >
        <p>考试规则：</p>
        <ul>
          <li>考试时长：{exam?.durationMinutes}分钟</li>
          <li>总分：{exam?.totalScore}分，及格分数：{exam?.passScore}分</li>
          <li>开始考试后将自动计时，请在规定时间内完成</li>
          <li>考试过程中请勿刷新页面，否则将丢失答题进度</li>
        </ul>
      </Modal>
    </div>
  )
}

export default TrainingDetail
