import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  message,
  Popconfirm,
  Card,
  Row,
  Col,
  Statistic,
  InputNumber,
  Drawer,
  Divider,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  BookOutlined,
  QuestionOutlined,
  EyeOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import type { ColumnsType, TableProps } from 'antd/es/table'
import { trainingApi, examApi } from '../../services/api'
import type { Training, Exam, ExamQuestion, PaginationResult, ProjectLevel } from '../../types'

const { Option } = Select
const { TextArea } = Input

const TrainingManagement: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [trainings, setTrainings] = useState<Training[]>([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [modalVisible, setModalVisible] = useState(false)
  const [questionModalVisible, setQuestionModalVisible] = useState(false)
  const [examDrawerVisible, setExamDrawerVisible] = useState(false)
  const [editingTraining, setEditingTraining] = useState<Training | null>(null)
  const [editingQuestion, setEditingQuestion] = useState<ExamQuestion | null>(null)
  const [currentExam, setCurrentExam] = useState<Exam | null>(null)
  const [searchText, setSearchText] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [levelFilter, setLevelFilter] = useState<string | null>(null)
  const [form] = Form.useForm()
  const [questionForm] = Form.useForm()

  const trainingCategories = ['安全培训', '技能培训', '礼仪培训', '法律法规', '应急处理', '其他']
  const levels: ProjectLevel[] = ['BASIC', 'INTERMEDIATE', 'ADVANCED']
  const levelLabels: Record<ProjectLevel, string> = { BASIC: '初级', INTERMEDIATE: '中级', ADVANCED: '高级' }
  const questionTypes = ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_BLANK']
  const questionTypeLabels = {
    SINGLE_CHOICE: '单选题',
    MULTIPLE_CHOICE: '多选题',
    TRUE_FALSE: '判断题',
    FILL_BLANK: '填空题',
  }

  const fetchTrainings = async (page = 1, pageSize = 10, category?: string, level?: string, search?: string) => {
    setLoading(true)
    try {
      const response: PaginationResult<Training> = await trainingApi.getTrainings({
        page,
        pageSize,
        ...(category && { category }),
        ...(level && { level }),
      })
      let filteredItems = response.items
      if (search) {
        filteredItems = filteredItems.filter(
          (item) =>
            item.title.toLowerCase().includes(search.toLowerCase()) ||
            item.description.toLowerCase().includes(search.toLowerCase())
        )
      }
      setTrainings(filteredItems)
      setPagination({
        current: response.page,
        pageSize: response.pageSize,
        total: search ? filteredItems.length : response.total,
      })
    } catch (error) {
      message.error('获取培训列表失败')
      const mockTrainings: Training[] = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        title: ['志愿服务基础', '急救技能培训', '沟通技巧', '安全防护知识', '礼仪规范'][i % 5] + (i + 1),
        description: `这是一门关于${trainingCategories[i % trainingCategories.length]}的专业培训课程，旨在提升志愿者的专业能力和服务水平。`,
        content: `# ${['志愿服务基础', '急救技能培训', '沟通技巧', '安全防护知识', '礼仪规范'][i % 5]}\n\n## 课程简介\n本课程将系统介绍相关知识和技能...\n\n## 学习目标\n- 掌握基本概念\n- 熟悉操作流程\n- 理解注意事项`,
        category: trainingCategories[i % trainingCategories.length],
        level: levels[i % 3],
        durationMinutes: [60, 90, 120, 180][i % 4],
        passScore: [60, 70, 80][i % 3],
        createdAt: new Date(Date.now() - i * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - i * 43200000).toISOString(),
      }))
      let filteredItems = mockTrainings
      if (search) {
        filteredItems = mockTrainings.filter(
          (item) =>
            item.title.toLowerCase().includes(search.toLowerCase()) ||
            item.description.toLowerCase().includes(search.toLowerCase())
        )
      }
      if (category) {
        filteredItems = filteredItems.filter((item) => item.category === category)
      }
      if (level) {
        filteredItems = filteredItems.filter((item) => item.level === level)
      }
      setTrainings(filteredItems.slice((page - 1) * pageSize, page * pageSize))
      setPagination({ current: page, pageSize, total: filteredItems.length })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTrainings()
  }, [])

  const handleTableChange: TableProps<Training>['onChange'] = (pag) => {
    fetchTrainings(
      pag.current || 1,
      pag.pageSize || 10,
      categoryFilter || undefined,
      levelFilter || undefined,
      searchText || undefined
    )
  }

  const handleAdd = () => {
    setEditingTraining(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (training: Training) => {
    setEditingTraining(training)
    form.setFieldsValue({
      title: training.title,
      description: training.description,
      content: training.content,
      category: training.category,
      level: training.level,
      durationMinutes: training.durationMinutes,
      passScore: training.passScore,
    })
    setModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await trainingApi.deleteTraining(id)
      message.success('删除成功')
      fetchTrainings(
        pagination.current,
        pagination.pageSize,
        categoryFilter || undefined,
        levelFilter || undefined,
        searchText || undefined
      )
    } catch (error) {
      message.error('删除失败，使用模拟数据')
      setTrainings(trainings.filter((t) => t.id !== id))
      setPagination({ ...pagination, total: pagination.total - 1 })
      message.success('删除成功（模拟）')
    }
  }

  const handleSubmit = async (values: any) => {
    try {
      if (editingTraining) {
        await trainingApi.updateTraining(editingTraining.id, values)
        message.success('更新成功')
      } else {
        await trainingApi.createTraining(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      fetchTrainings(
        pagination.current,
        pagination.pageSize,
        categoryFilter || undefined,
        levelFilter || undefined,
        searchText || undefined
      )
    } catch (error) {
      message.error('操作失败，使用模拟数据')
      if (editingTraining) {
        setTrainings(trainings.map((t) => (t.id === editingTraining.id ? { ...t, ...values } : t)))
      } else {
        const newTraining: Training = {
          id: Math.max(...trainings.map((t) => t.id), 0) + 1,
          ...values,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        setTrainings([newTraining, ...trainings])
        setPagination({ ...pagination, total: pagination.total + 1 })
      }
      setModalVisible(false)
      message.success(editingTraining ? '更新成功（模拟）' : '创建成功（模拟）')
    }
  }

  const handleManageExam = async (training: Training) => {
    try {
      if (training.examId) {
        const exam = await examApi.getExamById(training.examId)
        setCurrentExam(exam)
      } else {
        setCurrentExam({
          id: 0,
          title: `${training.title} - 考试`,
          description: `检验《${training.title}》的学习成果`,
          totalScore: 100,
          passScore: training.passScore,
          durationMinutes: 60,
          questions: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      }
      setExamDrawerVisible(true)
    } catch (error) {
      setCurrentExam({
        id: 0,
        title: `${training.title} - 考试`,
        description: `检验《${training.title}》的学习成果`,
        totalScore: 100,
        passScore: training.passScore,
        durationMinutes: 60,
        questions: Array.from({ length: 5 }, (_, i) => ({
          id: i + 1,
          examId: 0,
          questionText: `${['单选题', '多选题', '判断题', '单选题', '多选题'][i]}示例题目${i + 1}？`,
          questionType: questionTypes[i % 4],
          options: {
            A: '选项A',
            B: '选项B',
            C: '选项C',
            D: '选项D',
          },
          correctAnswer: ['A', 'AB', 'true', 'B', 'CD'][i],
          score: [20, 20, 20, 20, 20][i],
          orderIndex: i + 1,
          createdAt: new Date().toISOString(),
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      setExamDrawerVisible(true)
    }
  }

  const handleAddQuestion = () => {
    setEditingQuestion(null)
    questionForm.resetFields()
    questionForm.setFieldsValue({
      questionType: 'SINGLE_CHOICE',
      score: 10,
      options: { A: '', B: '', C: '', D: '' },
    })
    setQuestionModalVisible(true)
  }

  const handleEditQuestion = (question: ExamQuestion) => {
    setEditingQuestion(question)
    questionForm.setFieldsValue({
      questionText: question.questionText,
      questionType: question.questionType,
      options: question.options,
      correctAnswer: question.correctAnswer,
      score: question.score,
    })
    setQuestionModalVisible(true)
  }

  const handleQuestionSubmit = (values: any) => {
    if (!currentExam) return

    const newQuestion: ExamQuestion = {
      id: editingQuestion ? editingQuestion.id : Math.max(...currentExam.questions.map((q) => q.id), 0) + 1,
      examId: currentExam.id,
      ...values,
      orderIndex: editingQuestion
        ? editingQuestion.orderIndex
        : (currentExam.questions.length || 0) + 1,
      createdAt: editingQuestion ? editingQuestion.createdAt : new Date().toISOString(),
    }

    let updatedQuestions: ExamQuestion[]
    if (editingQuestion) {
      updatedQuestions = currentExam.questions.map((q) =>
        q.id === editingQuestion.id ? newQuestion : q
      )
    } else {
      updatedQuestions = [...currentExam.questions, newQuestion]
    }

    const totalScore = updatedQuestions.reduce((sum, q) => sum + q.score, 0)
    setCurrentExam({
      ...currentExam,
      questions: updatedQuestions,
      totalScore,
    })
    setQuestionModalVisible(false)
    message.success(editingQuestion ? '题目更新成功' : '题目添加成功')
  }

  const handleDeleteQuestion = (questionId: number) => {
    if (!currentExam) return
    const updatedQuestions = currentExam.questions.filter((q) => q.id !== questionId)
    const totalScore = updatedQuestions.reduce((sum, q) => sum + q.score, 0)
    setCurrentExam({
      ...currentExam,
      questions: updatedQuestions,
      totalScore,
    })
    message.success('题目删除成功')
  }

  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    if (!currentExam) return
    const questions = [...currentExam.questions]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= questions.length) return

    const temp = questions[index]
    questions[index] = questions[newIndex]
    questions[newIndex] = temp

    const reorderedQuestions = questions.map((q, i) => ({ ...q, orderIndex: i + 1 }))
    setCurrentExam({ ...currentExam, questions: reorderedQuestions })
  }

  const handleSearch = () => {
    fetchTrainings(
      1,
      pagination.pageSize,
      categoryFilter || undefined,
      levelFilter || undefined,
      searchText || undefined
    )
  }

  const handleReset = () => {
    setSearchText('')
    setCategoryFilter(null)
    setLevelFilter(null)
    fetchTrainings(1, pagination.pageSize)
  }

  const columns: ColumnsType<Training> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: '培训名称',
      dataIndex: 'title',
      key: 'title',
      sorter: (a, b) => a.title.localeCompare(b.title),
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      filters: trainingCategories.map((cat) => ({ text: cat, value: cat })),
      onFilter: (value, record) => record.category === value,
      render: (text) => <Tag color="geekblue">{text}</Tag>,
    },
    {
      title: '难度',
      dataIndex: 'level',
      key: 'level',
      filters: levels.map((l) => ({ text: levelLabels[l], value: l })),
      onFilter: (value, record) => record.level === value,
      render: (text: ProjectLevel) => (
        <Tag color={text === 'BASIC' ? 'green' : text === 'INTERMEDIATE' ? 'gold' : 'red'}>
          {levelLabels[text]}
        </Tag>
      ),
    },
    {
      title: '时长(分钟)',
      dataIndex: 'durationMinutes',
      key: 'durationMinutes',
      sorter: (a, b) => a.durationMinutes - b.durationMinutes,
    },
    {
      title: '及格分数',
      dataIndex: 'passScore',
      key: 'passScore',
      sorter: (a, b) => a.passScore - b.passScore,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      render: (text) => new Date(text).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 240,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button type="link" icon={<QuestionOutlined />} onClick={() => handleManageExam(record)}>
            题目
          </Button>
          <Popconfirm title="确定删除该培训？" onConfirm={() => handleDelete(record.id)} okText="确定" cancelText="取消">
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const categoryStats = trainingCategories.reduce((acc, cat) => {
    acc[cat] = trainings.filter((t) => t.category === cat).length
    return acc
  }, {} as Record<string, number>)

  const categoryChartOption = {
    tooltip: { trigger: 'item' },
    legend: { bottom: '0%' },
    series: [
      {
        name: '培训分类',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
        data: Object.entries(categoryStats)
          .filter(([_, count]) => count > 0)
          .map(([name, value]) => ({ name, value })),
      },
    ],
  }

  const levelStats = levels.reduce((acc, l) => {
    acc[levelLabels[l]] = trainings.filter((t) => t.level === l).length
    return acc
  }, {} as Record<string, number>)

  const levelChartOption = {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: Object.keys(levelStats) },
    yAxis: { type: 'value' },
    series: [{ data: Object.values(levelStats), type: 'bar', itemStyle: { color: '#52c41a' } }],
  }

  const questionColumns: ColumnsType<ExamQuestion> = [
    {
      title: '序号',
      dataIndex: 'orderIndex',
      key: 'orderIndex',
      width: 70,
    },
    {
      title: '题型',
      dataIndex: 'questionType',
      key: 'questionType',
      width: 100,
      render: (text) => <Tag>{questionTypeLabels[text as keyof typeof questionTypeLabels]}</Tag>,
    },
    {
      title: '题目',
      dataIndex: 'questionText',
      key: 'questionText',
      ellipsis: true,
    },
    {
      title: '分值',
      dataIndex: 'score',
      key: 'score',
      width: 80,
    },
    {
      title: '正确答案',
      dataIndex: 'correctAnswer',
      key: 'correctAnswer',
      width: 100,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record, index) => (
        <Space size="small">
          <Button
            type="text"
            icon={<ArrowUpOutlined />}
            disabled={index === 0}
            onClick={() => handleMoveQuestion(index, 'up')}
          />
          <Button
            type="text"
            icon={<ArrowDownOutlined />}
            disabled={index === (currentExam?.questions.length || 0) - 1}
            onClick={() => handleMoveQuestion(index, 'down')}
          />
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEditQuestion(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除该题目？"
            onConfirm={() => handleDeleteQuestion(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">培训管理</h2>
        <p className="text-gray-500">管理培训课程、考试题目和学习内容</p>
      </div>

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="培训总数"
              value={pagination.total}
              prefix={<BookOutlined className="text-blue-500" />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="总学习时长"
              value={trainings.reduce((sum, t) => sum + t.durationMinutes, 0)}
              suffix="分钟"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} md={12} lg={6}>
          <Card title="培训分类分布" size="small" className="h-full">
            <ReactECharts option={categoryChartOption} style={{ height: 150 }} />
          </Card>
        </Col>
        <Col xs={24} md={12} lg={6}>
          <Card title="难度分布" size="small" className="h-full">
            <ReactECharts option={levelChartOption} style={{ height: 150 }} />
          </Card>
        </Col>
      </Row>

      <Card className="mb-6">
        <div className="flex flex-wrap gap-4 items-end justify-between">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm text-gray-600 mb-1">搜索培训</label>
              <Input
                placeholder="输入培训名称或描述"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onPressEnter={handleSearch}
                style={{ width: 250 }}
                allowClear
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">分类</label>
              <Select
                placeholder="选择分类"
                value={categoryFilter}
                onChange={(value) => setCategoryFilter(value)}
                style={{ width: 150 }}
                allowClear
              >
                {trainingCategories.map((cat) => (
                  <Option key={cat} value={cat}>
                    {cat}
                  </Option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">难度</label>
              <Select
                placeholder="选择难度"
                value={levelFilter}
                onChange={(value) => setLevelFilter(value)}
                style={{ width: 120 }}
                allowClear
              >
                {levels.map((l) => (
                  <Option key={l} value={l}>
                    {levelLabels[l]}
                  </Option>
                ))}
              </Select>
            </div>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                搜索
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                重置
              </Button>
            </Space>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增培训
          </Button>
        </div>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={trainings}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1000 }}
        />
      </Card>

      <Modal
        title={editingTraining ? '编辑培训' : '新增培训'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                name="title"
                label="培训名称"
                rules={[
                  { required: true, message: '请输入培训名称' },
                  { max: 100, message: '培训名称不能超过100个字符' },
                ]}
              >
                <Input placeholder="请输入培训名称" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="category"
                label="培训分类"
                rules={[{ required: true, message: '请选择培训分类' }]}
              >
                <Select placeholder="请选择分类">
                  {trainingCategories.map((cat) => (
                    <Option key={cat} value={cat}>
                      {cat}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="level"
                label="难度级别"
                rules={[{ required: true, message: '请选择难度级别' }]}
              >
                <Select placeholder="请选择难度">
                  {levels.map((l) => (
                    <Option key={l} value={l}>
                      {levelLabels[l]}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="durationMinutes"
                label="培训时长(分钟)"
                rules={[
                  { required: true, message: '请输入培训时长' },
                  { type: 'number', min: 1, message: '时长至少1分钟' },
                ]}
              >
                <InputNumber style={{ width: '100%' }} min={1} placeholder="请输入时长" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="passScore"
                label="及格分数"
                rules={[
                  { required: true, message: '请输入及格分数' },
                  { type: 'number', min: 1, max: 100, message: '分数在1-100之间' },
                ]}
              >
                <InputNumber style={{ width: '100%' }} min={1} max={100} placeholder="请输入分数" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="description"
            label="培训简介"
            rules={[
              { required: true, message: '请输入培训简介' },
              { max: 500, message: '简介不能超过500个字符' },
            ]}
          >
            <TextArea rows={3} placeholder="请输入培训简介" />
          </Form.Item>
          <Form.Item
            name="content"
            label="培训内容"
            rules={[{ required: true, message: '请输入培训内容' }]}
          >
            <TextArea rows={8} placeholder="支持Markdown格式，输入培训详细内容" />
          </Form.Item>
          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                {editingTraining ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="考试题目管理"
        placement="right"
        width={900}
        open={examDrawerVisible}
        onClose={() => setExamDrawerVisible(false)}
        extra={
          <Space>
            <Button onClick={() => setExamDrawerVisible(false)}>关闭</Button>
            <Button type="primary" onClick={() => message.success('保存成功')}>
              保存考试
            </Button>
          </Space>
        }
      >
        {currentExam && (
          <>
            <Card size="small" className="mb-4">
              <Row gutter={16}>
                <Col span={12}>
                  <div className="text-gray-500 text-sm">考试名称</div>
                  <div className="font-medium">{currentExam.title}</div>
                </Col>
                <Col span={6}>
                  <div className="text-gray-500 text-sm">题目数量</div>
                  <div className="font-medium">{currentExam.questions.length} 题</div>
                </Col>
                <Col span={6}>
                  <div className="text-gray-500 text-sm">总分</div>
                  <div className="font-medium">{currentExam.totalScore} 分</div>
                </Col>
              </Row>
            </Card>

            <div className="mb-4 flex justify-between items-center">
              <span className="text-gray-600">题目列表</span>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddQuestion}>
                添加题目
              </Button>
            </div>

            <Table
              columns={questionColumns}
              dataSource={currentExam.questions}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </>
        )}
      </Drawer>

      <Modal
        title={editingQuestion ? '编辑题目' : '添加题目'}
        open={questionModalVisible}
        onCancel={() => setQuestionModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={questionForm} layout="vertical" onFinish={handleQuestionSubmit}>
          <Form.Item
            name="questionType"
            label="题目类型"
            rules={[{ required: true, message: '请选择题目类型' }]}
          >
            <Select>
              {questionTypes.map((type) => (
                <Option key={type} value={type}>
                  {questionTypeLabels[type as keyof typeof questionTypeLabels]}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="questionText"
            label="题目内容"
            rules={[
              { required: true, message: '请输入题目内容' },
              { max: 1000, message: '题目内容不能超过1000个字符' },
            ]}
          >
            <TextArea rows={3} placeholder="请输入题目内容" />
          </Form.Item>
          <Form.Item noStyle shouldUpdate>
            {({ getFieldValue }) => {
              const type = getFieldValue('questionType')
              if (type === 'TRUE_FALSE') {
                return (
                  <Form.Item
                    name="correctAnswer"
                    label="正确答案"
                    rules={[{ required: true, message: '请选择正确答案' }]}
                  >
                    <Select>
                      <Option value="true">正确</Option>
                      <Option value="false">错误</Option>
                    </Select>
                  </Form.Item>
                )
              }
              if (type === 'FILL_BLANK') {
                return (
                  <Form.Item
                    name="correctAnswer"
                    label="正确答案"
                    rules={[{ required: true, message: '请输入正确答案' }]}
                  >
                    <Input placeholder="请输入正确答案" />
                  </Form.Item>
                )
              }
              return (
                <>
                  <Divider orientation="left">选项设置</Divider>
                  <Row gutter={16}>
                    {['A', 'B', 'C', 'D'].map((opt) => (
                      <Col span={12} key={opt}>
                        <Form.Item name={['options', opt]} label={`选项 ${opt}`}>
                          <Input placeholder={`请输入选项 ${opt} 内容`} />
                        </Form.Item>
                      </Col>
                    ))}
                  </Row>
                  <Form.Item
                    name="correctAnswer"
                    label={type === 'MULTIPLE_CHOICE' ? '正确答案（多个用逗号分隔）' : '正确答案'}
                    rules={[{ required: true, message: '请输入正确答案' }]}
                  >
                    <Input placeholder={type === 'MULTIPLE_CHOICE' ? '如：A,B,C' : '如：A'} />
                  </Form.Item>
                </>
              )
            }}
          </Form.Item>
          <Form.Item
            name="score"
            label="题目分值"
            rules={[
              { required: true, message: '请输入题目分值' },
              { type: 'number', min: 1, message: '分值至少1分' },
            ]}
          >
            <InputNumber style={{ width: '100%' }} min={1} placeholder="请输入分值" />
          </Form.Item>
          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button onClick={() => setQuestionModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                {editingQuestion ? '更新' : '添加'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default TrainingManagement
