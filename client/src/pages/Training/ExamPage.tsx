import React, { useEffect, useState, useRef } from 'react'
import { Row, Col, Card, Button, Typography, Spin, Radio, Checkbox, Input, Progress, Space, Tag, Modal, message, Result, Divider } from 'antd'
import { ArrowLeftOutlined, ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, SafetyCertificateOutlined, FileTextOutlined } from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'
import { examApi } from '../../services/api'
import type { Exam, ExamQuestion, ExamRecord, ExamAnswer } from '../../types'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

const ExamPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [exam, setExam] = useState<Exam | null>(null)
  const [examRecord, setExamRecord] = useState<ExamRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [examStarted, setExamStarted] = useState(false)
  const [examSubmitted, setExamSubmitted] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string | string[]>>({})
  const [remainingTime, setRemainingTime] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return
      try {
        const [examResult, recordsResult] = await Promise.all([
          examApi.getExamById(Number(id)),
          examApi.getMyExamRecords()
        ])
        setExam(examResult)
        const myRecords = recordsResult.filter(r => r.examId === Number(id))
        if (myRecords.length > 0) {
          setExamRecord(myRecords[myRecords.length - 1])
        }
        setRemainingTime(examResult.durationMinutes * 60)
      } catch (error) {
        console.error('Failed to fetch exam:', error)
        const mockExam: Exam = {
          id: Number(id),
          title: '志愿者服务规范考试',
          description: '本次考试旨在检验您对志愿者服务规范的掌握程度，包括服务礼仪、安全规范、服务职责等内容。',
          totalScore: 100,
          passScore: 70,
          durationMinutes: 30,
          questions: [
            {
              id: 1,
              examId: Number(id),
              questionText: '志愿者在服务过程中，以下哪种做法是正确的？',
              questionType: 'SINGLE_CHOICE',
              options: {
                A: '着装随意，不佩戴统一标识',
                B: '用语文明，态度热情',
                C: '擅自泄露服务对象隐私',
                D: '对服务对象的需求置之不理'
              },
              correctAnswer: 'B',
              score: 10,
              orderIndex: 1,
              createdAt: ''
            },
            {
              id: 2,
              examId: Number(id),
              questionText: '志愿者服务中，安全规范包括以下哪些内容？（多选）',
              questionType: 'MULTIPLE_CHOICE',
              options: {
                A: '了解项目安全注意事项',
                B: '掌握基本的应急处理方法',
                C: '保持通讯畅通',
                D: '独自前往危险区域'
              },
              correctAnswer: 'A,B,C',
              score: 20,
              orderIndex: 2,
              createdAt: ''
            },
            {
              id: 3,
              examId: Number(id),
              questionText: '请简述志愿者的基本服务职责。',
              questionType: 'TEXT',
              options: {},
              correctAnswer: '1. 按时到岗，不擅自离岗；2. 认真完成分配的任务；3. 遇到问题及时向负责人汇报；4. 尊重服务对象的意愿和隐私；5. 保持良好的服务态度。',
              score: 30,
              orderIndex: 3,
              createdAt: ''
            },
            {
              id: 4,
              examId: Number(id),
              questionText: '志愿者在服务过程中与服务对象发生意见分歧时，应该：',
              questionType: 'SINGLE_CHOICE',
              options: {
                A: '与服务对象争论，坚持自己的观点',
                B: '耐心倾听，尊重服务对象的意见，必要时寻求负责人协调',
                C: '直接拒绝继续服务',
                D: '向其他志愿者抱怨'
              },
              correctAnswer: 'B',
              score: 10,
              orderIndex: 4,
              createdAt: ''
            },
            {
              id: 5,
              examId: Number(id),
              questionText: '以下哪些行为违反了志愿者服务规范？（多选）',
              questionType: 'MULTIPLE_CHOICE',
              options: {
                A: '按时到岗，认真完成任务',
                B: '利用志愿服务谋取个人利益',
                C: '尊重服务对象的隐私',
                D: '擅自接受服务对象的贵重礼品'
              },
              correctAnswer: 'B,D',
              score: 20,
              orderIndex: 5,
              createdAt: ''
            },
            {
              id: 6,
              examId: Number(id),
              questionText: '请结合自身经历，谈谈你对志愿服务精神的理解。',
              questionType: 'TEXT',
              options: {},
              correctAnswer: '志愿服务精神包括奉献、友爱、互助、进步。奉献是指不计报酬、不求名利；友爱是指尊重他人、平等待人；互助是指互相帮助、互相扶持；进步是指在服务中提升自己、促进社会进步。',
              score: 10,
              orderIndex: 6,
              createdAt: ''
            }
          ],
          createdAt: ''
        }
        setExam(mockExam)
        setRemainingTime(30 * 60)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [id])

  useEffect(() => {
    if (examStarted && remainingTime > 0 && !examSubmitted) {
      timerRef.current = setInterval(() => {
        setRemainingTime(prev => {
          if (prev <= 1) {
            handleSubmit()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [examStarted, examSubmitted])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleStartExam = async () => {
    if (!exam) return
    try {
      const record = await examApi.startExam(exam.id)
      setExamRecord(record)
      setExamStarted(true)
    } catch (error) {
      console.error('Failed to start exam:', error)
      setExamRecord({
        id: 1,
        examId: exam.id,
        exam: exam,
        volunteerProfileId: 1,
        answers: {},
        score: 0,
        status: 'NOT_TAKEN',
        startedAt: dayjs().toISOString(),
        submittedAt: '',
        createdAt: ''
      })
      setExamStarted(true)
      message.success('考试开始，请认真作答')
    }
  }

  const handleAnswerChange = (questionId: number, value: string | string[]) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }))
  }

  const calculateScore = () => {
    if (!exam) return 0
    let totalScore = 0
    exam.questions.forEach(question => {
      const userAnswer = answers[question.id]
      if (!userAnswer) return

      if (question.questionType === 'SINGLE_CHOICE') {
        if (userAnswer === question.correctAnswer) {
          totalScore += question.score
        }
      } else if (question.questionType === 'MULTIPLE_CHOICE') {
        const correctAnswers = question.correctAnswer.split(',').sort()
        const userAnswers = Array.isArray(userAnswer) ? userAnswer.sort() : userAnswer.split(',').sort()
        if (JSON.stringify(correctAnswers) === JSON.stringify(userAnswers)) {
          totalScore += question.score
        }
      } else if (question.questionType === 'TEXT') {
        if (typeof userAnswer === 'string' && userAnswer.length > 20) {
          totalScore += Math.round(question.score * 0.8)
        }
      }
    })
    return totalScore
  }

  const handleSubmit = async () => {
    if (!exam || !examRecord) return
    setSubmitting(true)

    try {
      const examAnswers: ExamAnswer[] = Object.entries(answers).map(([questionId, answer]) => ({
        questionId: Number(questionId),
        answer: Array.isArray(answer) ? answer.join(',') : answer
      }))

      await examApi.submitExam(exam.id, { examId: exam.id, answers: examAnswers })

      const score = calculateScore()
      const passed = score >= exam.passScore

      setExamRecord(prev => prev ? {
        ...prev,
        answers,
        score,
        status: passed ? 'PASSED' : 'FAILED',
        submittedAt: dayjs().toISOString()
      } : null)

      setExamSubmitted(true)
      message.success(passed ? `恭喜！您已通过考试，得分：${score}分` : `很遗憾，您未通过考试，得分：${score}分`)
    } catch (error) {
      console.error('Failed to submit exam:', error)
      const score = calculateScore()
      const passed = score >= exam.passScore

      setExamRecord(prev => prev ? {
        ...prev,
        answers,
        score,
        status: passed ? 'PASSED' : 'FAILED',
        submittedAt: dayjs().toISOString()
      } : null)

      setExamSubmitted(true)
      message.success(passed ? `恭喜！您已通过考试，得分：${score}分` : `很遗憾，您未通过考试，得分：${score}分`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleConfirmSubmit = () => {
    setShowConfirmModal(true)
  }

  const getAnsweredCount = () => {
    if (!exam) return 0
    return exam.questions.filter(q => answers[q.id] !== undefined && (Array.isArray(answers[q.id]) ? (answers[q.id] as string[]).length > 0 : answers[q.id] !== '')).length
  }

  const renderQuestion = (question: ExamQuestion) => {
    const userAnswer = answers[question.id]
    const isAnswered = userAnswer !== undefined && (Array.isArray(userAnswer) ? userAnswer.length > 0 : userAnswer !== '')

    return (
      <Card
        key={question.id}
        style={{
          borderRadius: 12,
          border: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          marginBottom: 16
        }}
        bodyStyle={{ padding: 24 }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 16 }}>
          <Tag color={isAnswered ? 'success' : 'default'} style={{ marginRight: 12, fontSize: 14 }}>
            {question.orderIndex}
          </Tag>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Title level={5} style={{ margin: 0 }}>
                {question.questionText}
              </Title>
              <Tag color="blue" style={{ fontSize: 14 }}>
                {question.score}分
              </Tag>
            </div>

            {question.questionType === 'SINGLE_CHOICE' && (
              <Radio.Group
                value={userAnswer || ''}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                style={{ width: '100%' }}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  {Object.entries(question.options).map(([key, value]) => (
                    <Radio key={key} value={key} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 8 }}>
                      <span style={{ fontWeight: 600, marginRight: 8 }}>{key}.</span>
                      <span>{value as string}</span>
                    </Radio>
                  ))}
                </Space>
              </Radio.Group>
            )}

            {question.questionType === 'MULTIPLE_CHOICE' && (
              <Checkbox.Group
                value={Array.isArray(userAnswer) ? userAnswer : []}
                onChange={(values) => handleAnswerChange(question.id, values)}
                style={{ width: '100%' }}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  {Object.entries(question.options).map(([key, value]) => (
                    <Checkbox key={key} value={key} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 8 }}>
                      <span style={{ fontWeight: 600, marginRight: 8 }}>{key}.</span>
                      <span>{value as string}</span>
                    </Checkbox>
                  ))}
                </Space>
              </Checkbox.Group>
            )}

            {question.questionType === 'TEXT' && (
              <TextArea
                rows={4}
                placeholder="请输入您的答案..."
                value={typeof userAnswer === 'string' ? userAnswer : ''}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                showCount
                maxLength={500}
              />
            )}
          </div>
        </div>
      </Card>
    )
  }

  const renderResult = () => {
    if (!exam || !examRecord) return null

    const passed = examRecord.status === 'PASSED'

    const scoreChartOption = {
      series: [
        {
          type: 'gauge',
          startAngle: 90,
          endAngle: -270,
          pointer: {
            length: '60%',
            width: 4,
            itemStyle: {
              color: passed ? '#52c41a' : '#ff4d4f'
            }
          },
          progress: {
            show: true,
            overlap: false,
            roundCap: true,
            clip: false,
            itemStyle: {
              color: passed ? '#52c41a' : '#ff4d4f'
            }
          },
          axisLine: {
            lineStyle: {
              width: 18,
              color: [[1, '#f0f0f0']]
            }
          },
          splitLine: {
            show: true,
            length: 10,
            lineStyle: {
              width: 2,
              color: '#999'
            }
          },
          axisTick: {
            show: true,
            length: 5,
            lineStyle: {
              width: 1,
              color: '#999'
            }
          },
          axisLabel: {
            show: true,
            distance: 25,
            fontSize: 12
          },
          data: [
            {
              value: examRecord.score,
              detail: {
                offsetCenter: ['0%', '70%']
              }
            }
          ],
          detail: {
            fontSize: 36,
            fontWeight: 'bold',
            formatter: '{value}分',
            color: passed ? '#52c41a' : '#ff4d4f'
          },
          max: exam.totalScore
        }
      ]
    }

    return (
      <div>
        <Result
          status={passed ? 'success' : 'warning'}
          title={passed ? '恭喜！考试通过' : '很遗憾，考试未通过'}
          subTitle={`您的得分：${examRecord.score}分，及格分数：${exam.passScore}分`}
          extra={[
            <Button key="back" onClick={() => navigate('/training')}>
              返回培训列表
            </Button>,
            !passed && (
              <Button key="retry" type="primary" onClick={() => window.location.reload()}>
                重新考试
              </Button>
            )
          ]}
        />

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={8}>
            <Card
              style={{
                borderRadius: 12,
                border: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}
              bodyStyle={{ padding: 20 }}
            >
              <ReactECharts option={scoreChartOption} style={{ height: 300 }} />
            </Card>
          </Col>

          <Col xs={24} lg={16}>
            <Card
              style={{
                borderRadius: 12,
                border: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}
              title={
                <Space>
                  <FileTextOutlined style={{ color: '#1677ff' }} />
                  <span>答题详情</span>
                </Space>
              }
            >
              {exam.questions.map((question, index) => {
                const userAnswer = examRecord.answers[question.id]
                const isCorrect = question.questionType === 'SINGLE_CHOICE'
                  ? userAnswer === question.correctAnswer
                  : question.questionType === 'MULTIPLE_CHOICE'
                    ? JSON.stringify((Array.isArray(userAnswer) ? userAnswer : (userAnswer || '').split(',')).sort()) === JSON.stringify(question.correctAnswer.split(',').sort())
                    : question.questionType === 'TEXT' && typeof userAnswer === 'string' && userAnswer.length > 20

                return (
                  <div key={question.id} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: index < exam.questions.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                      <Tag color={isCorrect ? 'success' : 'error'} style={{ marginRight: 8 }}>
                        {index + 1}
                      </Tag>
                      <Text strong style={{ flex: 1 }}>{question.questionText}</Text>
                      <Tag color="blue">{question.score}分</Tag>
                      {isCorrect ? (
                        <Tag color="success" icon={<CheckCircleOutlined />}>正确</Tag>
                      ) : (
                        <Tag color="error" icon={<CloseCircleOutlined />}>错误</Tag>
                      )}
                    </div>
                    <div style={{ marginLeft: 36 }}>
                      <div style={{ marginBottom: 4 }}>
                        <Text type="secondary">您的答案：</Text>
                        <Text>{Array.isArray(userAnswer) ? userAnswer.join(', ') : (userAnswer || '未作答')}</Text>
                      </div>
                      <div>
                        <Text type="secondary">正确答案：</Text>
                        <Text style={{ color: '#52c41a' }}>{question.correctAnswer}</Text>
                      </div>
                    </div>
                  </div>
                )
              })}
            </Card>
          </Col>
        </Row>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!exam) {
    return <div style={{ padding: 40, textAlign: 'center' }}>考试不存在</div>
  }

  if (examSubmitted && examRecord) {
    return renderResult()
  }

  if (!examStarted) {
    return (
      <div>
        <div style={{ marginBottom: 24 }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
            style={{ marginBottom: 16 }}
          >
            返回
          </Button>
          <Title level={3} style={{ marginBottom: 8 }}>
            <SafetyCertificateOutlined style={{ marginRight: 8, color: '#faad14' }} />
            {exam.title}
          </Title>
          <Text type="secondary">{exam.description}</Text>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card
              style={{
                borderRadius: 12,
                border: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}
              title={
                <Space>
                  <FileTextOutlined style={{ color: '#1677ff' }} />
                  <span>考试须知</span>
                </Space>
              }
            >
              <div style={{ padding: '20px 0' }}>
                <Paragraph style={{ lineHeight: 2, fontSize: 15 }}>
                  1. 本次考试共有 <Text strong style={{ color: '#1677ff' }}>{exam.questions.length}</Text> 道题目，总分 <Text strong style={{ color: '#1677ff' }}>{exam.totalScore}</Text> 分，及格分数为 <Text strong style={{ color: '#faad14' }}>{exam.passScore}</Text> 分。
                </Paragraph>
                <Paragraph style={{ lineHeight: 2, fontSize: 15 }}>
                  2. 考试时长为 <Text strong style={{ color: '#1677ff' }}>{exam.durationMinutes}</Text> 分钟，开始考试后将自动计时，请在规定时间内完成。
                </Paragraph>
                <Paragraph style={{ lineHeight: 2, fontSize: 15 }}>
                  3. 考试题型包括单选题、多选题和简答题，请仔细阅读题目要求。
                </Paragraph>
                <Paragraph style={{ lineHeight: 2, fontSize: 15 }}>
                  4. 考试过程中请勿刷新页面或关闭浏览器，否则将丢失答题进度。
                </Paragraph>
                <Paragraph style={{ lineHeight: 2, fontSize: 15 }}>
                  5. 考试结束后将自动提交，您可以立即查看考试结果。
                </Paragraph>
                <Paragraph style={{ lineHeight: 2, fontSize: 15 }}>
                  6. 如遇技术问题，请及时联系系统管理员。
                </Paragraph>
              </div>

              <div style={{ textAlign: 'center', paddingTop: 20, borderTop: '1px solid #f0f0f0' }}>
                <Button
                  type="primary"
                  size="large"
                  icon={<FileTextOutlined />}
                  onClick={handleStartExam}
                  style={{ width: 200, height: 48, fontSize: 16 }}
                >
                  开始考试
                </Button>
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card
              style={{
                borderRadius: 12,
                border: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}
              bodyStyle={{ padding: 24 }}
            >
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 64, color: '#faad14', marginBottom: 16 }}>
                  <SafetyCertificateOutlined />
                </div>
                <Title level={4} style={{ marginBottom: 8 }}>准备好开始考试了吗？</Title>
                <Text type="secondary">请确保您有充足的时间完成考试</Text>
              </div>

              <Divider />

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Text type="secondary">考试名称</Text>
                  <Text strong>{exam.title}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Text type="secondary">题目数量</Text>
                  <Text strong>{exam.questions.length}道</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Text type="secondary">考试时长</Text>
                  <Text strong>{exam.durationMinutes}分钟</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Text type="secondary">总分</Text>
                  <Text strong>{exam.totalScore}分</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">及格分数</Text>
                  <Text strong style={{ color: '#faad14' }}>{exam.passScore}分</Text>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    )
  }

  const currentQuestion = exam.questions[currentQuestionIndex]
  const answeredCount = getAnsweredCount()
  const timeWarning = remainingTime < 300

  return (
    <div>
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: '#fff',
        padding: '16px 0',
        borderBottom: '1px solid #f0f0f0',
        marginBottom: 24
      }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={6}>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/training')}
            >
              退出考试
            </Button>
          </Col>
          <Col xs={24} md={12} style={{ textAlign: 'center' }}>
            <Title level={4} style={{ margin: 0 }}>{exam.title}</Title>
          </Col>
          <Col xs={24} md={6} style={{ textAlign: 'right' }}>
            <Space size={24}>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>答题进度</Text>
                <div style={{ fontSize: 16, fontWeight: 600 }}>
                  {answeredCount} / {exam.questions.length}
                </div>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  <ClockCircleOutlined style={{ marginRight: 4 }} />
                  剩余时间
                </Text>
                <div style={{ fontSize: 24, fontWeight: 700, color: timeWarning ? '#ff4d4f' : '#1677ff' }}>
                  {formatTime(remainingTime)}
                </div>
              </div>
            </Space>
          </Col>
        </Row>
        <Progress
          percent={Math.round((answeredCount / exam.questions.length) * 100)}
          showInfo={false}
          style={{ marginTop: 16, marginBottom: -8 }}
        />
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={18}>
          {renderQuestion(currentQuestion)}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
            <Button
              disabled={currentQuestionIndex === 0}
              onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
            >
              上一题
            </Button>
            <Space>
              {currentQuestionIndex < exam.questions.length - 1 ? (
                <Button
                  type="primary"
                  onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                >
                  下一题
                </Button>
              ) : (
                <Button
                  type="primary"
                  onClick={handleConfirmSubmit}
                  loading={submitting}
                >
                  提交试卷
                </Button>
              )}
            </Space>
          </div>
        </Col>

        <Col xs={24} lg={6}>
          <Card
            style={{
              borderRadius: 12,
              border: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              position: 'sticky',
              top: 140
            }}
            title="答题卡"
            bodyStyle={{ padding: 16 }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {exam.questions.map((question, index) => {
                const isAnswered = answers[question.id] !== undefined &&
                  (Array.isArray(answers[question.id])
                    ? (answers[question.id] as string[]).length > 0
                    : answers[question.id] !== '')
                const isCurrent = index === currentQuestionIndex

                return (
                  <Button
                    key={question.id}
                    type={isCurrent ? 'primary' : (isAnswered ? 'default' : 'default')}
                    onClick={() => setCurrentQuestionIndex(index)}
                    style={{
                      width: 40,
                      height: 40,
                      padding: 0,
                      background: isCurrent ? undefined : (isAnswered ? '#f6ffed' : '#fff'),
                      borderColor: isCurrent ? undefined : (isAnswered ? '#52c41a' : '#d9d9d9'),
                      color: isCurrent ? undefined : (isAnswered ? '#52c41a' : '#000')
                    }}
                  >
                    {index + 1}
                  </Button>
                )
              })}
            </div>

            <div style={{ marginBottom: 12 }}>
              <Space size={16}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ width: 12, height: 12, background: '#1677ff', borderRadius: 2, marginRight: 4 }}></div>
                  <Text type="secondary" style={{ fontSize: 12 }}>当前题</Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ width: 12, height: 12, background: '#f6ffed', border: '1px solid #52c41a', borderRadius: 2, marginRight: 4 }}></div>
                  <Text type="secondary" style={{ fontSize: 12 }}>已作答</Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ width: 12, height: 12, background: '#fff', border: '1px solid #d9d9d9', borderRadius: 2, marginRight: 4 }}></div>
                  <Text type="secondary" style={{ fontSize: 12 }}>未作答</Text>
                </div>
              </Space>
            </div>

            <Button
              type="primary"
              block
              onClick={handleConfirmSubmit}
              loading={submitting}
              disabled={answeredCount < exam.questions.length}
            >
              提交试卷
            </Button>
            {answeredCount < exam.questions.length && (
              <Text type="warning" style={{ fontSize: 12, display: 'block', marginTop: 8, textAlign: 'center' }}>
                还有 {exam.questions.length - answeredCount} 道题未作答
              </Text>
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title="确认提交试卷"
        open={showConfirmModal}
        onOk={handleSubmit}
        onCancel={() => setShowConfirmModal(false)}
        okText="确认提交"
        cancelText="继续作答"
        confirmLoading={submitting}
      >
        {answeredCount < exam.questions.length ? (
          <p style={{ color: '#faad14' }}>
            您还有 {exam.questions.length - answeredCount} 道题未作答，确定要提交吗？
          </p>
        ) : (
          <p>您已完成所有题目，确定要提交试卷吗？</p>
        )}
        <p>提交后将无法修改答案。</p>
      </Modal>
    </div>
  )
}

export default ExamPage
