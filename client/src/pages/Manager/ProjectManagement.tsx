import React, { useEffect, useState } from 'react'
import {
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  message,
  Popconfirm,
  Card,
  Typography,
  Row,
  Col,
  Statistic,
  Tooltip,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  ProjectOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import type { FilterValue, SorterResult } from 'antd/es/table/interface'
import dayjs from 'dayjs'
import { projectApi, skillApi } from '../../services/api'
import type { Project, ProjectStatus, ProjectLevel, ProjectCreateData } from '../../types'

const { Title, Text } = Typography
const { RangePicker } = DatePicker
const { Option } = Select
const { TextArea } = Input

interface TableParams {
  pagination: TablePaginationConfig
  sortField: string | null
  sortOrder: string | null
  filters: Record<string, FilterValue | null>
}

const ProjectManagement: React.FC = () => {
  const navigate = useNavigate()
  const [form] = Form.useForm<ProjectCreateData>()
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
  const [modalVisible, setModalVisible] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | ''>('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null)
  const [skills, setSkills] = useState<{ id: number; name: string }[]>([])

  const fetchProjects = async () => {
    setLoading(true)
    try {
      const params = {
        page: tableParams.pagination.current || 1,
        pageSize: tableParams.pagination.pageSize || 10,
        ...(searchText && { search: searchText }),
        ...(statusFilter && { status: statusFilter }),
        ...(categoryFilter && { category: categoryFilter }),
        ...(dateRange && dateRange[0] && dateRange[1] && {
          startDate: dateRange[0].format('YYYY-MM-DD'),
          endDate: dateRange[1].format('YYYY-MM-DD'),
        }),
        ...(tableParams.sortField && {
          sortBy: tableParams.sortField,
          sortOrder: tableParams.sortOrder === 'ascend' ? 'asc' : 'desc',
        }),
      }

      const result = await projectApi.getMyProjects(params)
      setProjects(result.items)
      setTotal(result.total)
    } catch (error) {
      message.error('获取项目列表失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchSkills = async () => {
    try {
      const result = await skillApi.getSkills({ page: 1, pageSize: 100 })
      setSkills(result.items.map((s) => ({ id: s.id, name: s.name })))
    } catch (error) {
      console.error('获取技能列表失败', error)
    }
  }

  useEffect(() => {
    fetchProjects()
    fetchSkills()
  }, [tableParams])

  const handleTableChange = (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: SorterResult<Project> | SorterResult<Project>[]
  ) => {
    const sorterResult = Array.isArray(sorter) ? sorter[0] : sorter
    setTableParams({
      pagination,
      sortField: sorterResult.field as string | null,
      sortOrder: sorterResult.order as string | null,
      filters,
    })
  }

  const handleCreate = () => {
    navigate('/manager/projects/create')
  }

  const handleEdit = (record: Project) => {
    setEditingProject(record)
    form.setFieldsValue({
      title: record.title,
      description: record.description,
      category: record.category,
      level: record.level,
      location: record.location,
      startDate: record.startDate,
      endDate: record.endDate,
      maxParticipants: record.maxParticipants,
      minParticipants: record.minParticipants,
      pointsPerHour: record.pointsPerHour,
      requiredTrainingIds: record.requiredTrainingIds,
      requiredSkills: record.requiredSkills.map((rs) => ({
        skillId: rs.skillId,
        minProficiency: rs.minProficiency,
        requiredCount: rs.requiredCount,
      })),
    })
    setModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await projectApi.deleteProject(id)
      message.success('删除成功')
      fetchProjects()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleSubmit = async (values: ProjectCreateData) => {
    try {
      const formattedValues = {
        ...values,
        startDate: dayjs(values.startDate).format('YYYY-MM-DD'),
        endDate: dayjs(values.endDate).format('YYYY-MM-DD'),
      }
      if (editingProject) {
        await projectApi.updateProject(editingProject.id, formattedValues)
        message.success('更新成功')
      }
      setModalVisible(false)
      setEditingProject(null)
      form.resetFields()
      fetchProjects()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const handleSearch = () => {
    setTableParams((prev) => ({
      ...prev,
      pagination: { ...prev.pagination, current: 1 },
    }))
  }

  const handleReset = () => {
    setSearchText('')
    setStatusFilter('')
    setCategoryFilter('')
    setDateRange(null)
    setTableParams({
      pagination: { current: 1, pageSize: 10 },
      sortField: null,
      sortOrder: null,
      filters: {},
    })
  }

  const getStatusTag = (status: ProjectStatus) => {
    const statusMap: Record<ProjectStatus, { color: string; text: string }> = {
      DRAFT: { color: 'default', text: '草稿' },
      PUBLISHED: { color: 'blue', text: '已发布' },
      ONGOING: { color: 'processing', text: '进行中' },
      COMPLETED: { color: 'success', text: '已完成' },
      CANCELLED: { color: 'error', text: '已取消' },
    }
    const { color, text } = statusMap[status]
    return <Tag color={color}>{text}</Tag>
  }

  const getLevelTag = (level: ProjectLevel) => {
    const levelMap: Record<ProjectLevel, { color: string; text: string }> = {
      BASIC: { color: 'green', text: '初级' },
      INTERMEDIATE: { color: 'orange', text: '中级' },
      ADVANCED: { color: 'red', text: '高级' },
    }
    const { color, text } = levelMap[level]
    return <Tag color={color}>{text}</Tag>
  }

  const columns: ColumnsType<Project> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      sorter: true,
    },
    {
      title: '项目名称',
      dataIndex: 'title',
      key: 'title',
      sorter: true,
      render: (text: string) => (
        <Text strong style={{ color: '#1677ff' }}>
          {text}
        </Text>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      filters: [
        { text: '环保', value: '环保' },
        { text: '教育', value: '教育' },
        { text: '医疗', value: '医疗' },
        { text: '社区服务', value: '社区服务' },
      ],
    },
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: (level: ProjectLevel) => getLevelTag(level),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: ProjectStatus) => getStatusTag(status),
    },
    {
      title: '地点',
      dataIndex: 'location',
      key: 'location',
      width: 150,
      ellipsis: true,
    },
    {
      title: '开始日期',
      dataIndex: 'startDate',
      key: 'startDate',
      width: 120,
      sorter: true,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '结束日期',
      dataIndex: 'endDate',
      key: 'endDate',
      width: 120,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '参与人数',
      key: 'participants',
      width: 100,
      render: (_, record) => (
        <span>
          {record.applications?.filter((a) => a.status === 'ACCEPTED').length || 0}
          <Text type="secondary">/{record.maxParticipants}</Text>
        </span>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/manager/projects/${record.id}`)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          </Tooltip>
          <Tooltip title="排班管理">
            <Button
              type="link"
              icon={<ClockCircleOutlined />}
              onClick={() => navigate(`/manager/projects/${record.id}/schedules`)}
            />
          </Tooltip>
          <Popconfirm title="确定删除此项目？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const stats = [
    {
      title: '总项目数',
      value: total,
      icon: <ProjectOutlined style={{ fontSize: 24, color: '#1677ff' }} />,
      color: '#1677ff',
    },
    {
      title: '进行中',
      value: projects.filter((p) => p.status === 'ONGOING').length,
      icon: <ClockCircleOutlined style={{ fontSize: 24, color: '#faad14' }} />,
      color: '#faad14',
    },
    {
      title: '已完成',
      value: projects.filter((p) => p.status === 'COMPLETED').length,
      icon: <CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a' }} />,
      color: '#52c41a',
    },
    {
      title: '总参与人数',
      value: projects.reduce(
        (acc, p) => acc + (p.applications?.filter((a) => a.status === 'ACCEPTED').length || 0),
        0
      ),
      icon: <TeamOutlined style={{ fontSize: 24, color: '#eb2f96' }} />,
      color: '#eb2f96',
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          项目管理
        </Title>
        <Text type="secondary">管理您创建的所有志愿服务项目</Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {stats.map((stat, index) => (
          <Col xs={12} lg={6} key={index}>
            <Card
              style={{
                borderRadius: 12,
                border: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}
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
                <Statistic title={stat.title} value={stat.value} />
              </div>
            </Card>
          </Col>
        ))}
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
            placeholder="搜索项目名称"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 200 }}
            allowClear
          />
          <Select
            placeholder="项目状态"
            value={statusFilter || undefined}
            onChange={setStatusFilter}
            style={{ width: 150 }}
            allowClear
          >
            <Option value="DRAFT">草稿</Option>
            <Option value="PUBLISHED">已发布</Option>
            <Option value="ONGOING">进行中</Option>
            <Option value="COMPLETED">已完成</Option>
            <Option value="CANCELLED">已取消</Option>
          </Select>
          <Select
            placeholder="项目分类"
            value={categoryFilter || undefined}
            onChange={setCategoryFilter}
            style={{ width: 150 }}
            allowClear
          >
            <Option value="环保">环保</Option>
            <Option value="教育">教育</Option>
            <Option value="医疗">医疗</Option>
            <Option value="社区服务">社区服务</Option>
            <Option value="其他">其他</Option>
          </Select>
          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            placeholder={['开始日期', '结束日期']}
          />
          <Space>
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
              搜索
            </Button>
            <Button onClick={handleReset}>重置</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              创建项目
            </Button>
          </Space>
        </Space>
      </Card>

      <Card
        style={{
          borderRadius: 12,
          border: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}
        bodyStyle={{ padding: 0 }}
      >
        <Table
          columns={columns}
          dataSource={projects}
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
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title={editingProject ? '编辑项目' : '创建项目'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false)
          setEditingProject(null)
          form.resetFields()
        }}
        footer={null}
        width={800}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="title"
                label="项目名称"
                rules={[{ required: true, message: '请输入项目名称' }]}
              >
                <Input placeholder="请输入项目名称" maxLength={100} showCount />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                name="description"
                label="项目描述"
                rules={[{ required: true, message: '请输入项目描述' }]}
              >
                <TextArea rows={4} placeholder="请输入项目描述" maxLength={1000} showCount />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="category"
                label="项目分类"
                rules={[{ required: true, message: '请选择项目分类' }]}
              >
                <Select placeholder="请选择项目分类">
                  <Option value="环保">环保</Option>
                  <Option value="教育">教育</Option>
                  <Option value="医疗">医疗</Option>
                  <Option value="社区服务">社区服务</Option>
                  <Option value="其他">其他</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="level"
                label="项目级别"
                rules={[{ required: true, message: '请选择项目级别' }]}
              >
                <Select placeholder="请选择项目级别">
                  <Option value="BASIC">初级</Option>
                  <Option value="INTERMEDIATE">中级</Option>
                  <Option value="ADVANCED">高级</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="location"
                label="服务地点"
                rules={[{ required: true, message: '请输入服务地点' }]}
              >
                <Input placeholder="请输入服务地点" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="startDate"
                label="开始日期"
                rules={[{ required: true, message: '请选择开始日期' }]}
              >
                <DatePicker style={{ width: '100%' }} placeholder="选择开始日期" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="endDate"
                label="结束日期"
                rules={[{ required: true, message: '请选择结束日期' }]}
              >
                <DatePicker style={{ width: '100%' }} placeholder="选择结束日期" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="pointsPerHour"
                label="每小时积分"
                rules={[{ required: true, message: '请输入每小时积分' }]}
              >
                <InputNumber min={1} max={100} style={{ width: '100%' }} placeholder="每小时积分" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="minParticipants"
                label="最少参与人数"
                rules={[{ required: true, message: '请输入最少参与人数' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} placeholder="最少参与人数" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="maxParticipants"
                label="最大参与人数"
                rules={[{ required: true, message: '请输入最大参与人数' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} placeholder="最大参与人数" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                name="requiredSkills"
                label="所需技能"
                rules={[{ required: true, message: '请添加所需技能' }]}
              >
                <Form.List name="requiredSkills">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map(({ key, name, ...restField }) => (
                        <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                          <Form.Item
                            {...restField}
                            name={[name, 'skillId']}
                            rules={[{ required: true, message: '请选择技能' }]}
                            style={{ marginBottom: 0 }}
                          >
                            <Select placeholder="选择技能" style={{ width: 200 }}>
                              {skills.map((skill) => (
                                <Option key={skill.id} value={skill.id}>
                                  {skill.name}
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>
                          <Form.Item
                            {...restField}
                            name={[name, 'minProficiency']}
                            rules={[{ required: true, message: '请输入熟练度要求' }]}
                            style={{ marginBottom: 0 }}
                          >
                            <InputNumber
                              min={1}
                              max={10}
                              placeholder="熟练度"
                              style={{ width: 120 }}
                            />
                          </Form.Item>
                          <Form.Item
                            {...restField}
                            name={[name, 'requiredCount']}
                            rules={[{ required: true, message: '请输入所需人数' }]}
                            style={{ marginBottom: 0 }}
                          >
                            <InputNumber
                              min={1}
                              placeholder="所需人数"
                              style={{ width: 120 }}
                            />
                          </Form.Item>
                          <DeleteOutlined onClick={() => remove(name)} />
                        </Space>
                      ))}
                      <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                        添加技能
                      </Button>
                    </>
                  )}
                </Form.List>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item style={{ marginTop: 24, textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button
                onClick={() => {
                  setModalVisible(false)
                  setEditingProject(null)
                  form.resetFields()
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                提交
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ProjectManagement
