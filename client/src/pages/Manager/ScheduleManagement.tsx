import React, { useEffect, useState } from 'react'
import {
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Select,
  DatePicker,
  TimePicker,
  message,
  Popconfirm,
  Card,
  Typography,
  Row,
  Col,
  Statistic,
  Tooltip,
  Alert,
  Empty,
  Switch,
} from 'antd'
import {
  EditOutlined,
  DeleteOutlined,
  RobotOutlined,
  CalendarOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import type { FilterValue, SorterResult } from 'antd/es/table/interface'
import dayjs from 'dayjs'
import ReactECharts from 'echarts-for-react'
import { scheduleApi, projectApi } from '../../services/api'
import type { Schedule, ScheduleStatus, Project } from '../../types'

const { Title, Text } = Typography
const { Option } = Select
const { RangePicker } = DatePicker

interface TableParams {
  pagination: TablePaginationConfig
  sortField: string | null
  sortOrder: string | null
  filters: Record<string, FilterValue | null>
}

const ScheduleManagement: React.FC = () => {
  const [form] = Form.useForm()
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
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
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null)
  const [projectFilter, setProjectFilter] = useState<number | ''>('')
  const [statusFilter, setStatusFilter] = useState<ScheduleStatus | ''>('')
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null)
  const [generateModalVisible, setGenerateModalVisible] = useState(false)
  const [generateForm] = Form.useForm()
  const [autoConfirm, setAutoConfirm] = useState(false)

  const fetchSchedules = async () => {
    setLoading(true)
    try {
      const params = {
        page: tableParams.pagination.current || 1,
        pageSize: tableParams.pagination.pageSize || 10,
        ...(projectFilter && { projectId: projectFilter }),
        ...(statusFilter && { status: statusFilter }),
        ...(dateRange && dateRange[0] && dateRange[1] && {
          startDate: dateRange[0].format('YYYY-MM-DD'),
          endDate: dateRange[1].format('YYYY-MM-DD'),
        }),
        ...(tableParams.sortField && {
          sortBy: tableParams.sortField,
          sortOrder: tableParams.sortOrder === 'ascend' ? 'asc' : 'desc',
        }),
      }

      const result = await scheduleApi.getSchedules(params)
      setSchedules(result.items)
      setTotal(result.total)
    } catch (error) {
      message.error('获取排班列表失败')
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
    fetchSchedules()
    fetchProjects()
  }, [tableParams])

  const handleTableChange = (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: SorterResult<Schedule> | SorterResult<Schedule>[]
  ) => {
    const sorterResult = Array.isArray(sorter) ? sorter[0] : sorter
    setTableParams({
      pagination,
      sortField: sorterResult.field as string | null,
      sortOrder: sorterResult.order as string | null,
      filters,
    })
  }

  const handleGenerate = async () => {
    try {
      const values = await generateForm.validateFields()
      setGenerating(true)
      const result = await scheduleApi.generateSchedules({
        projectId: values.projectId,
        startDate: values.dateRange[0].format('YYYY-MM-DD'),
        endDate: values.dateRange[1].format('YYYY-MM-DD'),
      })
      const schedules = Array.isArray(result) ? result : (result as any).schedules || []
      message.success(`成功生成 ${schedules.length} 条排班`)
      if (autoConfirm && schedules.length > 0) {
        let confirmedCount = 0
        let failedCount = 0
        for (const s of schedules) {
          try {
            await scheduleApi.updateSchedule(s.id, { status: 'CONFIRMED' as ScheduleStatus })
            confirmedCount++
          } catch {
            failedCount++
          }
        }
        if (failedCount === 0) {
          message.success(`已自动确认全部 ${confirmedCount} 条排班`)
        } else {
          message.warning(`已确认 ${confirmedCount} 条，${failedCount} 条确认失败`)
        }
      }
      setGenerateModalVisible(false)
      generateForm.resetFields()
      fetchSchedules()
    } catch (error: any) {
      message.error(error?.response?.data?.error || error?.message || '生成排班失败，请稍后重试')
    } finally {
      setGenerating(false)
    }
  }

  const handleEdit = (record: Schedule) => {
    setEditingSchedule(record)
    form.setFieldsValue({
      projectId: record.projectId,
      volunteerProfileId: record.volunteerProfileId,
      scheduledDate: dayjs(record.scheduledDate),
      startTime: dayjs(record.startTime, 'HH:mm'),
      endTime: dayjs(record.endTime, 'HH:mm'),
      status: record.status,
    })
    setModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await scheduleApi.deleteSchedule(id)
      message.success('删除成功')
      fetchSchedules()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleSubmit = async (values: any) => {
    try {
      const formattedValues = {
        ...values,
        scheduledDate: values.scheduledDate.format('YYYY-MM-DD'),
        startTime: values.startTime.format('HH:mm'),
        endTime: values.endTime.format('HH:mm'),
      }
      if (editingSchedule) {
        await scheduleApi.updateSchedule(editingSchedule.id, formattedValues)
        message.success('更新成功')
      }
      setModalVisible(false)
      setEditingSchedule(null)
      form.resetFields()
      fetchSchedules()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const handleConfirm = async (id: number) => {
    try {
      await scheduleApi.updateSchedule(id, { status: 'CONFIRMED' })
      message.success('已确认排班')
      fetchSchedules()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const handleCancel = async (id: number) => {
    try {
      await scheduleApi.updateSchedule(id, { status: 'CANCELLED' })
      message.success('已取消排班')
      fetchSchedules()
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
    setProjectFilter('')
    setStatusFilter('')
    setDateRange(null)
    setTableParams({
      pagination: { current: 1, pageSize: 10 },
      sortField: null,
      sortOrder: null,
      filters: {},
    })
  }

  const getStatusTag = (status: ScheduleStatus) => {
    const statusMap: Record<ScheduleStatus, { color: string; text: string }> = {
      PENDING: { color: 'warning', text: '待确认' },
      CONFIRMED: { color: 'success', text: '已确认' },
      CANCELLED: { color: 'error', text: '已取消' },
    }
    const { color, text } = statusMap[status]
    return <Tag color={color}>{text}</Tag>
  }

  const columns: ColumnsType<Schedule> = [
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
      width: 120,
      render: (_, record) => {
        const volunteer = record.volunteerProfile?.user
        return (
          <Space>
            <UserOutlined />
            <Text>{volunteer?.realName || volunteer?.username || '未知'}</Text>
          </Space>
        )
      },
    },
    {
      title: '排班日期',
      dataIndex: 'scheduledDate',
      key: 'scheduledDate',
      width: 120,
      sorter: true,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      width: 100,
    },
    {
      title: '结束时间',
      dataIndex: 'endTime',
      key: 'endTime',
      width: 100,
    },
    {
      title: '服务时长',
      key: 'duration',
      width: 100,
      render: (_, record) => {
        const start = dayjs(record.startTime, 'HH:mm')
        const end = dayjs(record.endTime, 'HH:mm')
        const hours = end.diff(start, 'minute') / 60
        return <Text>{hours.toFixed(1)} 小时</Text>
      },
    },
    {
      title: '签到状态',
      key: 'attendance',
      width: 100,
      render: (_, record) => {
        if (!record.attendance) return <Tag color="default">未签到</Tag>
        const statusMap: Record<string, { color: string; text: string }> = {
          PENDING: { color: 'default', text: '待签到' },
          PRESENT: { color: 'success', text: '已签到' },
          ABSENT: { color: 'error', text: '缺勤' },
          LATE: { color: 'warning', text: '迟到' },
          LEAVE_EARLY: { color: 'orange', text: '早退' },
        }
        const status = statusMap[record.attendance.status]
        return status ? <Tag color={status.color}>{status.text}</Tag> : null
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: ScheduleStatus) => getStatusTag(status),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          {record.status === 'PENDING' && (
            <Tooltip title="确认">
              <Button type="link" size="small" onClick={() => handleConfirm(record.id)}>
                确认
              </Button>
            </Tooltip>
          )}
          {record.status === 'CONFIRMED' && (
            <Tooltip title="取消">
              <Button type="link" size="small" danger onClick={() => handleCancel(record.id)}>
                取消
              </Button>
            </Tooltip>
          )}
          <Tooltip title="编辑">
            <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          </Tooltip>
          <Popconfirm title="确定删除此排班？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const stats = [
    {
      title: '总排班次',
      value: total,
      icon: <CalendarOutlined style={{ fontSize: 24, color: '#1677ff' }} />,
      color: '#1677ff',
    },
    {
      title: '待确认',
      value: schedules.filter((s) => s.status === 'PENDING').length,
      icon: <WarningOutlined style={{ fontSize: 24, color: '#faad14' }} />,
      color: '#faad14',
    },
    {
      title: '已确认',
      value: schedules.filter((s) => s.status === 'CONFIRMED').length,
      icon: <CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a' }} />,
      color: '#52c41a',
    },
    {
      title: '已完成签到',
      value: schedules.filter((s) => s.attendance?.status === 'PRESENT').length,
      icon: <ClockCircleOutlined style={{ fontSize: 24, color: '#eb2f96' }} />,
      color: '#eb2f96',
    },
  ]

  const weeklyChartOption = {
    title: {
      text: '本周排班统计',
      left: 'center',
      textStyle: { fontSize: 14, fontWeight: 600 },
    },
    tooltip: { trigger: 'axis' },
    legend: { data: ['排班数', '实际签到'], bottom: 0 },
    xAxis: {
      type: 'category',
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    },
    yAxis: { type: 'value', name: '人次' },
    series: [
      {
        name: '排班数',
        type: 'bar',
        data: [12, 15, 8, 20, 18, 25, 15],
        itemStyle: { color: '#1677ff', borderRadius: [4, 4, 0, 0] },
      },
      {
        name: '实际签到',
        type: 'bar',
        data: [10, 14, 8, 18, 17, 23, 14],
        itemStyle: { color: '#52c41a', borderRadius: [4, 4, 0, 0] },
      },
    ],
    grid: { left: '3%', right: '4%', bottom: '15%', top: '15%', containLabel: true },
  }

  const distributionChartOption = {
    title: {
      text: '项目排班分布',
      left: 'center',
      textStyle: { fontSize: 14, fontWeight: 600 },
    },
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'vertical', left: 'left' },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
        label: { show: false, position: 'center' },
        emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
        labelLine: { show: false },
        data: projects.slice(0, 5).map((p) => ({
          value: p.schedules?.length || Math.floor(Math.random() * 50),
          name: p.title,
        })),
      },
    ],
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          排班管理
        </Title>
        <Text type="secondary">管理志愿服务排班，支持智能自动排班</Text>
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
                <Statistic title={stat.title} value={stat.value} />
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={14}>
          <Card
            style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', height: '100%' }}
          >
            <ReactECharts option={weeklyChartOption} style={{ height: 280 }} />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card
            style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', height: '100%' }}
          >
            <ReactECharts option={distributionChartOption} style={{ height: 280 }} />
          </Card>
        </Col>
      </Row>

      <Card
        style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 24 }}
        bodyStyle={{ padding: 20 }}
      >
        <Space wrap size={[16, 16]} style={{ width: '100%' }}>
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
            placeholder="排班状态"
            value={statusFilter || undefined}
            onChange={setStatusFilter}
            style={{ width: 150 }}
            allowClear
          >
            <Option value="PENDING">待确认</Option>
            <Option value="CONFIRMED">已确认</Option>
            <Option value="CANCELLED">已取消</Option>
          </Select>
          <RangePicker value={dateRange} onChange={setDateRange} />
          <Space>
            <Button type="primary" onClick={handleSearch}>
              搜索
            </Button>
            <Button onClick={handleReset}>重置</Button>
            <Button
              type="primary"
              icon={<RobotOutlined />}
              onClick={() => setGenerateModalVisible(true)}
            >
              智能排班
            </Button>
          </Space>
        </Space>
      </Card>

      <Card
        style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
        bodyStyle={{ padding: 0 }}
      >
        {schedules.length === 0 && !loading ? (
          <Empty
            description={
              <span>
                暂无排班数据，点击 <Text strong style={{ color: '#1677ff' }}>智能排班</Text> 自动生成
              </span>
            }
            style={{ padding: '60px 0' }}
          />
        ) : (
          <Table
            columns={columns}
            dataSource={schedules}
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
        )}
      </Card>

      <Modal
        title="智能排班"
        open={generateModalVisible}
        onCancel={() => {
          setGenerateModalVisible(false)
          generateForm.resetFields()
        }}
        footer={null}
        width={500}
      >
        <Alert
          message="智能排班说明"
          description="系统将根据项目技能要求、志愿者可用时间和历史表现，自动生成最优排班方案。"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />
        <Form form={generateForm} layout="vertical" onFinish={handleGenerate}>
          <Form.Item
            name="projectId"
            label="选择项目"
            rules={[{ required: true, message: '请选择项目' }]}
          >
            <Select placeholder="请选择要排班的项目" showSearch optionFilterProp="children">
              {projects
                .filter((p) => p.status === 'PUBLISHED' || p.status === 'ONGOING')
                .map((p) => (
                  <Option key={p.id} value={p.id}>
                    {p.title}
                  </Option>
                ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="dateRange"
            label="排班日期范围"
            rules={[{ required: true, message: '请选择日期范围' }]}
          >
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="自动确认排班">
            <Switch checked={autoConfirm} onChange={setAutoConfirm} />
            <Text type="secondary" style={{ marginLeft: 8 }}>
              生成后自动确认所有排班
            </Text>
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button
                onClick={() => {
                  setGenerateModalVisible(false)
                  generateForm.resetFields()
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={generating} icon={<RobotOutlined />}>
                生成排班
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingSchedule ? '编辑排班' : '新建排班'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false)
          setEditingSchedule(null)
          form.resetFields()
        }}
        footer={null}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="projectId"
            label="项目"
            rules={[{ required: true, message: '请选择项目' }]}
          >
            <Select placeholder="请选择项目" showSearch optionFilterProp="children">
              {projects.map((p) => (
                <Option key={p.id} value={p.id}>
                  {p.title}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="scheduledDate"
            label="排班日期"
            rules={[{ required: true, message: '请选择日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="startTime"
                label="开始时间"
                rules={[{ required: true, message: '请选择开始时间' }]}
              >
                <TimePicker style={{ width: '100%' }} format="HH:mm" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="endTime"
                label="结束时间"
                rules={[{ required: true, message: '请选择结束时间' }]}
              >
                <TimePicker style={{ width: '100%' }} format="HH:mm" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="请选择状态">
              <Option value="PENDING">待确认</Option>
              <Option value="CONFIRMED">已确认</Option>
              <Option value="CANCELLED">已取消</Option>
            </Select>
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button
                onClick={() => {
                  setModalVisible(false)
                  setEditingSchedule(null)
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

export default ScheduleManagement
