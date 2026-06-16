import React, { useEffect, useState } from 'react'
import {
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Select,
  Input,
  Rate,
  message,
  Card,
  Typography,
  Row,
  Col,
  Statistic,
  Tooltip,
  Drawer,
  Descriptions,
  Empty,
  Avatar,
  Divider,
  Alert,
} from 'antd'
import {
  SearchOutlined,
  StarOutlined,
  EditOutlined,
  EyeOutlined,
  UserOutlined,
  CommentOutlined,
  SendOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import type { FilterValue, SorterResult } from 'antd/es/table/interface'
import dayjs from 'dayjs'
import ReactECharts from 'echarts-for-react'
import ReactWordcloud from 'react-wordcloud'
import { reviewApi, projectApi } from '../../services/api'
import type { Review, Project } from '../../types'

const { Title, Text } = Typography
const { Option } = Select
const { TextArea } = Input

interface TableParams {
  pagination: TablePaginationConfig
  sortField: string | null
  sortOrder: string | null
  filters: Record<string, FilterValue | null>
}

interface ReviewFormData {
  projectId: number
  volunteerProfileId: number
  rating: number
  comment: string
  tags: string[]
}

const tagOptions = [
  '工作认真',
  '态度积极',
  '准时到位',
  '专业能力强',
  '沟通顺畅',
  '团队协作好',
  '责任心强',
  '需要改进',
]

const ReviewManagement: React.FC = () => {
  const [form] = Form.useForm<ReviewFormData>()
  const [reviews, setReviews] = useState<Review[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [tableParams, setTableParams] = useState<TableParams>({
    pagination: {
      current: 1,
      pageSize: 10,
    },
    sortField: null,
    sortOrder: null,
    filters: {},
  })
  const [projectFilter, setProjectFilter] = useState<number | ''>('')
  const [ratingFilter, setRatingFilter] = useState<number | ''>('')
  const [searchText, setSearchText] = useState('')
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentReview, setCurrentReview] = useState<Review | null>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingReview, setEditingReview] = useState<Review | null>(null)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [availableVolunteers, setAvailableVolunteers] = useState<
    { id: number; name: string; avatar?: string }[]
  >([])

  const fetchReviews = async () => {
    setLoading(true)
    try {
      const params = {
        page: tableParams.pagination.current || 1,
        pageSize: tableParams.pagination.pageSize || 10,
        ...(projectFilter && { projectId: projectFilter }),
        ...(ratingFilter && { rating: ratingFilter }),
        ...(searchText && { search: searchText }),
        ...(tableParams.sortField && {
          sortBy: tableParams.sortField,
          sortOrder: tableParams.sortOrder === 'ascend' ? 'asc' : 'desc',
        }),
      }

      const result = await reviewApi.getReviews(params)
      setReviews(result.items)
      setTotal(result.total)
    } catch (error) {
      message.error('获取评价列表失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      const result = await projectApi.getMyProjects({ page: 1, pageSize: 100 })
      setProjects(result.items)
    } catch (error) {
      console.error('获取项目列表失败', error)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    fetchReviews()
  }, [tableParams])

  const handleTableChange = (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: SorterResult<Review> | SorterResult<Review>[]
  ) => {
    const sorterResult = Array.isArray(sorter) ? sorter[0] : sorter
    setTableParams({
      pagination,
      sortField: sorterResult.field as string | null,
      sortOrder: sorterResult.order as string | null,
      filters,
    })
  }

  const handleSearch = () => {
    setTableParams((prev) => ({
      ...prev,
      pagination: { ...prev.pagination, current: 1 },
    }))
  }

  const handleReset = () => {
    setProjectFilter('')
    setRatingFilter('')
    setSearchText('')
    setTableParams({
      pagination: { current: 1, pageSize: 10 },
      sortField: null,
      sortOrder: null,
      filters: {},
    })
  }

  const handleViewDetail = (record: Review) => {
    setCurrentReview(record)
    setDetailVisible(true)
  }

  const handleCreate = () => {
    setEditingReview(null)
    setSelectedProject(null)
    setAvailableVolunteers([])
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: Review) => {
    setEditingReview(record)
    setSelectedProject(record.project)
    setAvailableVolunteers([
      {
        id: record.volunteerProfileId,
        name:
          record.volunteerProfile?.user?.realName ||
          record.volunteerProfile?.user?.username ||
          '未知',
        avatar: record.volunteerProfile?.user?.avatar,
      },
    ])
    form.setFieldsValue({
      projectId: record.projectId,
      volunteerProfileId: record.volunteerProfileId,
      rating: record.rating,
      comment: record.comment,
      tags: record.tags,
    })
    setModalVisible(true)
  }

  const handleProjectChange = (projectId: number) => {
    const project = projects.find((p) => p.id === projectId)
    setSelectedProject(project || null)
    if (project?.applications) {
      const volunteers = project.applications
        .filter((a) => a.status === 'ACCEPTED')
        .map((a) => ({
          id: a.volunteerProfileId,
          name:
            a.volunteerProfile?.user?.realName ||
            a.volunteerProfile?.user?.username ||
            '未知',
          avatar: a.volunteerProfile?.user?.avatar,
        }))
      setAvailableVolunteers(volunteers)
    }
    form.setFieldsValue({ volunteerProfileId: undefined })
  }

  const handleSubmit = async (values: ReviewFormData) => {
    try {
      if (editingReview) {
        await reviewApi.updateReview(editingReview.id, values)
        message.success('更新成功')
      } else {
        await reviewApi.createReview(values)
        message.success('评价成功')
      }
      setModalVisible(false)
      setEditingReview(null)
      form.resetFields()
      fetchReviews()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const getRatingStars = (rating: number) => (
    <Rate disabled value={rating} style={{ fontSize: 14, color: '#faad14' }} />
  )

  const columns: ColumnsType<Review> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      sorter: true,
    },
    {
      title: '项目名称',
      dataIndex: ['project', 'title'],
      key: 'projectTitle',
      width: 150,
      ellipsis: true,
      render: (text: string) => (
        <Text strong style={{ color: '#1677ff' }}>
          {text}
        </Text>
      ),
    },
    {
      title: '志愿者',
      key: 'volunteer',
      width: 150,
      render: (_, record) => {
        const volunteer = record.volunteerProfile?.user
        return (
          <Space>
            <Avatar size="small" icon={<UserOutlined />} src={volunteer?.avatar} />
            <Text>{volunteer?.realName || volunteer?.username || '未知'}</Text>
          </Space>
        )
      },
    },
    {
      title: '评分',
      dataIndex: 'rating',
      key: 'rating',
      width: 150,
      sorter: true,
      render: (rating: number) => (
        <Space>
          {getRatingStars(rating)}
          <Text strong style={{ color: '#faad14' }}>
            {rating.toFixed(1)}
          </Text>
        </Space>
      ),
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 200,
      render: (tags: string[]) => (
        <Space wrap size={[4, 4]}>
          {tags?.map((tag, index) => (
            <Tag key={index} color="blue" style={{ margin: 0 }}>
              {tag}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '评价内容',
      dataIndex: 'comment',
      key: 'comment',
      width: 200,
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <Text>{text}</Text>
        </Tooltip>
      ),
    },
    {
      title: '评价时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      sorter: true,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)} />
          </Tooltip>
          <Tooltip title="编辑">
            <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          </Tooltip>
        </Space>
      ),
    },
  ]

  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
      : '0.0'

  const stats = [
    {
      title: '总评价数',
      value: total,
      icon: <CommentOutlined style={{ fontSize: 24, color: '#1677ff' }} />,
      color: '#1677ff',
    },
    {
      title: '平均评分',
      value: averageRating,
      suffix: '分',
      icon: <StarOutlined style={{ fontSize: 24, color: '#faad14' }} />,
      color: '#faad14',
    },
    {
      title: '5星好评',
      value: reviews.filter((r) => r.rating === 5).length,
      icon: <StarOutlined style={{ fontSize: 24, color: '#52c41a' }} />,
      color: '#52c41a',
    },
    {
      title: '待评价',
      value: projects.reduce((acc, p) => {
        const accepted = p.applications?.filter((a) => a.status === 'ACCEPTED').length || 0
        const reviewed = reviews.filter((r) => r.projectId === p.id).length
        return acc + Math.max(0, accepted - reviewed)
      }, 0),
      icon: <EditOutlined style={{ fontSize: 24, color: '#eb2f96' }} />,
      color: '#eb2f96',
    },
  ]

  const ratingChartOption = {
    title: {
      text: '评分分布',
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
          reviews.filter((r) => r.rating === 1).length,
          reviews.filter((r) => r.rating === 2).length,
          reviews.filter((r) => r.rating === 3).length,
          reviews.filter((r) => r.rating === 4).length,
          reviews.filter((r) => r.rating === 5).length,
        ],
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#ff7875' },
              { offset: 1, color: '#ffa940' },
            ],
          },
          borderRadius: [4, 4, 0, 0],
        },
      },
    ],
    grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
  }

  const words = [
    { text: '工作认真', value: 65 },
    { text: '态度积极', value: 58 },
    { text: '准时到位', value: 52 },
    { text: '专业能力强', value: 48 },
    { text: '沟通顺畅', value: 45 },
    { text: '团队协作好', value: 42 },
    { text: '责任心强', value: 38 },
    { text: '乐于助人', value: 35 },
    { text: '耐心细致', value: 32 },
    { text: '效率高', value: 30 },
    { text: '服务热情', value: 28 },
    { text: '守时', value: 26 },
    { text: '需要改进', value: 12 },
    { text: '迟到', value: 8 },
    { text: '沟通待加强', value: 6 },
  ]

  const wordcloudOptions = {
    rotations: 2,
    rotationAngles: [0, 90] as [number, number],
    fontSizes: [16, 48] as [number, number],
    fontWeight: 'bold',
    colors: ['#1677ff', '#52c41a', '#faad14', '#eb2f96', '#722ed1', '#13c2c2'],
    enableTooltip: true,
    deterministic: false,
    fontFamily: 'impact',
    padding: 2,
    scale: 'sqrt' as const,
    spiral: 'archimedean' as const,
    transitionDuration: 1000,
  }

  const wordcloudCallbacks = {
    getWordTooltip: (word: { text: string; value: number }) =>
      `${word.text}: ${word.value}次`,
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          评价管理
        </Title>
        <Text type="secondary">评价志愿者服务表现，记录服务质量</Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {stats.map((stat, index) => (
          <Col xs={12} lg={6} key={index}>
            <Card
              style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
              bodyStyle={{ padding: 20 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: `${stat.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {stat.icon}
                </div>
                <Statistic
                  title={stat.title}
                  value={stat.value}
                  suffix={(stat as any).suffix}
                />
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={14}>
          <Card
            style={{
              borderRadius: 12,
              border: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              height: '100%',
            }}
          >
            <ReactECharts option={ratingChartOption} style={{ height: 280 }} />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card
            title={
              <Space>
                <CommentOutlined />
                <Text strong>满意度词云</Text>
              </Space>
            }
            style={{
              borderRadius: 12,
              border: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              height: '100%',
            }}
          >
            <div style={{ height: 240 }}>
              <ReactWordcloud
                words={words}
                options={wordcloudOptions}
                callbacks={wordcloudCallbacks}
              />
            </div>
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
            placeholder="搜索志愿者姓名或评价内容"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250 }}
            allowClear
          />
          <Select
            placeholder="选择项目"
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
            placeholder="最低评分"
            value={ratingFilter || undefined}
            onChange={setRatingFilter}
            style={{ width: 150 }}
            allowClear
          >
            <Option value={1}>1星及以上</Option>
            <Option value={2}>2星及以上</Option>
            <Option value={3}>3星及以上</Option>
            <Option value={4}>4星及以上</Option>
            <Option value={5}>5星</Option>
          </Select>
          <Space>
            <Button type="primary" onClick={handleSearch}>
              搜索
            </Button>
            <Button onClick={handleReset}>重置</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              新增评价
            </Button>
          </Space>
        </Space>
      </Card>

      <Card
        style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
        bodyStyle={{ padding: 0 }}
      >
        {reviews.length === 0 && !loading ? (
          <Empty
            description={
              <span>
                暂无评价记录，点击 <Text strong style={{ color: '#1677ff' }}>新增评价</Text>{' '}
                开始评价
              </span>
            }
            style={{ padding: '60px 0' }}
          />
        ) : (
          <Table
            columns={columns}
            dataSource={reviews}
            rowKey="id"
            loading={loading}
            pagination={{
              ...tableParams.pagination,
              total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`,
            }}
            onChange={handleTableChange}
            scroll={{ x: 1300 }}
          />
        )}
      </Card>

      <Drawer
        title="评价详情"
        placement="right"
        width={500}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
      >
        {currentReview && (
          <div>
            <Card
              style={{ borderRadius: 8, marginBottom: 16, background: '#fafafa', border: 'none' }}
              bodyStyle={{ padding: 16 }}
            >
              <Space align="center" size={12}>
                <Avatar
                  size={64}
                  icon={<UserOutlined />}
                  src={currentReview.volunteerProfile?.user?.avatar}
                />
                <div>
                  <Text strong style={{ fontSize: 16 }}>
                    {currentReview.volunteerProfile?.user?.realName ||
                      currentReview.volunteerProfile?.user?.username}
                  </Text>
                  <div style={{ marginTop: 4 }}>
                    {getRatingStars(currentReview.rating)}
                    <Text strong style={{ color: '#faad14', marginLeft: 8 }}>
                      {currentReview.rating.toFixed(1)} 分
                    </Text>
                  </div>
                </div>
              </Space>
            </Card>

            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="项目名称">
                {currentReview.project?.title || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="评价人">
                {currentReview.manager?.user?.realName ||
                  currentReview.manager?.user?.username ||
                  '-'}
              </Descriptions.Item>
              <Descriptions.Item label="评价时间">
                {dayjs(currentReview.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="标签">
                <Space wrap size={[4, 4]}>
                  {currentReview.tags?.map((tag, index) => (
                    <Tag key={index} color="blue">
                      {tag}
                    </Tag>
                  ))}
                </Space>
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">评价内容</Divider>
            <Card
              style={{ borderRadius: 8, background: '#fff', border: '1px solid #f0f0f0' }}
              bodyStyle={{ padding: 16 }}
            >
              <Text>{currentReview.comment}</Text>
            </Card>
          </div>
        )}
      </Drawer>

      <Modal
        title={editingReview ? '编辑评价' : '新增评价'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false)
          setEditingReview(null)
          form.resetFields()
        }}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="projectId"
            label="选择项目"
            rules={[{ required: true, message: '请选择项目' }]}
          >
            <Select
              placeholder="请选择要评价的项目"
              showSearch
              optionFilterProp="children"
              onChange={handleProjectChange}
              disabled={!!editingReview}
            >
              {projects
                .filter((p) => p.status === 'ONGOING' || p.status === 'COMPLETED')
                .map((p) => (
                  <Option key={p.id} value={p.id}>
                    {p.title}
                  </Option>
                ))}
            </Select>
          </Form.Item>

          {selectedProject && (
            <Alert
              message={selectedProject.title}
              description={`开始日期: ${dayjs(selectedProject.startDate).format('YYYY-MM-DD')} | 结束日期: ${dayjs(selectedProject.endDate).format('YYYY-MM-DD')}`}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <Form.Item
            name="volunteerProfileId"
            label="选择志愿者"
            rules={[{ required: true, message: '请选择志愿者' }]}
          >
            <Select
              placeholder="请选择要评价的志愿者"
              showSearch
              optionFilterProp="children"
              disabled={!selectedProject || !!editingReview}
            >
              {availableVolunteers.map((v) => (
                <Option key={v.id} value={v.id}>
                  <Space>
                    <Avatar size="small" icon={<UserOutlined />} src={v.avatar} />
                    {v.name}
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="rating"
            label="服务评分"
            rules={[{ required: true, message: '请选择评分' }]}
          >
            <Rate style={{ fontSize: 32, color: '#faad14' }} />
          </Form.Item>

          <Form.Item
            name="tags"
            label="评价标签"
            rules={[{ required: true, message: '请至少选择一个标签' }]}
          >
            <Select mode="multiple" placeholder="选择评价标签" style={{ width: '100%' }}>
              {tagOptions.map((tag) => (
                <Option key={tag} value={tag}>
                  {tag}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="comment"
            label="评价内容"
            rules={[
              { required: true, message: '请输入评价内容' },
              { min: 10, max: 500, message: '评价内容长度在10-500个字符之间' },
            ]}
          >
            <TextArea
              rows={4}
              placeholder="请详细描述志愿者的服务表现..."
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button
                onClick={() => {
                  setModalVisible(false)
                  setEditingReview(null)
                  form.resetFields()
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit" icon={<SendOutlined />}>
                {editingReview ? '保存修改' : '提交评价'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ReviewManagement
