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
  Input,
  message,
  Card,
  Typography,
  Row,
  Col,
  Statistic,
  Tooltip,
  Alert,
  Drawer,
  Descriptions,
  Empty,
  Radio,
} from 'antd'
import {
  SearchOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  EyeOutlined,
  EditOutlined,
  EnvironmentOutlined,
  UserOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import type { FilterValue, SorterResult } from 'antd/es/table/interface'
import dayjs from 'dayjs'
import ReactECharts from 'echarts-for-react'
import { attendanceApi, projectApi } from '../../services/api'
import type { Attendance, AttendanceStatus, Project } from '../../types'

const { Title, Text } = Typography
const { Option } = Select
const { RangePicker } = DatePicker
const { TextArea } = Input

interface TableParams {
  pagination: TablePaginationConfig
  sortField: string | null
  sortOrder: string | null
  filters: Record<string, FilterValue | null>
}

interface HandleFormData {
  status: AttendanceStatus
  remark: string
}

const AttendanceManagement: React.FC = () => {
  const [attendances, setAttendances] = useState<Attendance[]>([])
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
  const [statusFilter, setStatusFilter] = useState<AttendanceStatus | ''>('')
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null)
  const [searchText, setSearchText] = useState('')
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentAttendance, setCurrentAttendance] = useState<Attendance | null>(null)
  const [handleModalVisible, setHandleModalVisible] = useState(false)
  const [handleForm] = Form.useForm<HandleFormData>()
  const [abnormalCount, setAbnormalCount] = useState(0)

  const fetchAttendances = async () => {
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
        ...(searchText && { search: searchText }),
        ...(tableParams.sortField && {
          sortBy: tableParams.sortField,
          sortOrder: tableParams.sortOrder === 'ascend' ? 'asc' : 'desc',
        }),
      }

      const result = await attendanceApi.getAttendances(params)
      setAttendances(result.items)
      setAbnormalCount(
        result.items.filter((a) => a.status === 'ABSENT' || a.status === 'LATE' || a.status === 'LEAVE_EARLY').length
      )
      setTotal(result.total)
    } catch (error) {
      message.error('获取签到记录失败')
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
    fetchAttendances()
    fetchProjects()
  }, [tableParams])

  const handleTableChange = (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: SorterResult<Attendance> | SorterResult<Attendance>[]
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
    setStatusFilter('')
    setDateRange(null)
    setSearchText('')
    setTableParams({
      pagination: { current: 1, pageSize: 10 },
      sortField: null,
      sortOrder: null,
      filters: {},
    })
  }

  const handleViewDetail = (record: Attendance) => {
    setCurrentAttendance(record)
    setDetailVisible(true)
  }

  const handleHandleAbnormal = (record: Attendance) => {
    setCurrentAttendance(record)
    handleForm.setFieldsValue({
      status: record.status,
      remark: '',
    })
    setHandleModalVisible(true)
  }

  const handleSubmitHandle = async (values: HandleFormData) => {
    if (!currentAttendance) return
    try {
      await attendanceApi.updateAttendance(currentAttendance.id, {
        status: values.status,
      })
      message.success('处理成功')
      setHandleModalVisible(false)
      handleForm.resetFields()
      fetchAttendances()
    } catch (error) {
      message.error('处理失败')
    }
  }

  const getStatusTag = (status: AttendanceStatus) => {
    const statusMap: Record<AttendanceStatus, { color: string; text: string; icon: React.ReactNode }> = {
      PENDING: { color: 'default', text: '待签到', icon: <ClockCircleOutlined /> },
      PRESENT: { color: 'success', text: '正常', icon: <CheckCircleOutlined /> },
      ABSENT: { color: 'error', text: '缺勤', icon: <CloseCircleOutlined /> },
      LATE: { color: 'warning', text: '迟到', icon: <WarningOutlined /> },
      LEAVE_EARLY: { color: 'orange', text: '早退', icon: <ExclamationCircleOutlined /> },
    }
    const { color, text, icon } = statusMap[status]
    return (
      <Tag color={color} icon={icon}>
        {text}
      </Tag>
    )
  }

  const columns: ColumnsType<Attendance> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      sorter: true,
    },
    {
      title: '项目名称',
      dataIndex: ['schedule', 'project', 'title'],
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
      title: '签到日期',
      key: 'date',
      width: 120,
      render: (_, record) =>
        record.checkInTime ? dayjs(record.checkInTime).format('YYYY-MM-DD') : '-',
    },
    {
      title: '签到时间',
      dataIndex: 'checkInTime',
      key: 'checkInTime',
      width: 100,
      sorter: true,
      render: (time: string) => (time ? dayjs(time).format('HH:mm:ss') : '-'),
    },
    {
      title: '签退时间',
      dataIndex: 'checkOutTime',
      key: 'checkOutTime',
      width: 100,
      render: (time: string) => (time ? dayjs(time).format('HH:mm:ss') : '-'),
    },
    {
      title: '服务时长',
      dataIndex: 'serviceHours',
      key: 'serviceHours',
      width: 100,
      sorter: true,
      render: (hours: number) => `${hours?.toFixed(1) || 0} 小时`,
    },
    {
      title: '获得积分',
      dataIndex: 'pointsEarned',
      key: 'pointsEarned',
      width: 100,
      render: (points: number) => (
        <Text type="success" strong>
          +{points || 0}
        </Text>
      ),
    },
    {
      title: '签到地点',
      key: 'location',
      width: 120,
      render: (_, record) => {
        if (record.checkInLatitude && record.checkInLongitude) {
          return (
            <Tooltip
              title={`纬度: ${record.checkInLatitude.toFixed(6)}, 经度: ${record.checkInLongitude.toFixed(6)}`}
            >
              <Space>
                <EnvironmentOutlined style={{ color: '#52c41a' }} />
                <Text>已定位</Text>
              </Space>
            </Tooltip>
          )
        }
        return <Text type="secondary">无定位</Text>
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: AttendanceStatus) => getStatusTag(status),
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
          {['ABSENT', 'LATE', 'LEAVE_EARLY'].includes(record.status) && (
            <Tooltip title="处理异常">
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => handleHandleAbnormal(record)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ]

  const stats = [
    {
      title: '总签到记录',
      value: total,
      icon: <CalendarOutlined style={{ fontSize: 24, color: '#1677ff' }} />,
      color: '#1677ff',
    },
    {
      title: '正常签到',
      value: attendances.filter((a) => a.status === 'PRESENT').length,
      icon: <CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a' }} />,
      color: '#52c41a',
    },
    {
      title: '异常记录',
      value: abnormalCount,
      icon: <WarningOutlined style={{ fontSize: 24, color: '#faad14' }} />,
      color: '#faad14',
    },
    {
      title: '总服务时长',
      value: attendances.reduce((acc, a) => acc + (a.serviceHours || 0), 0).toFixed(1),
      suffix: '小时',
      icon: <ClockCircleOutlined style={{ fontSize: 24, color: '#eb2f96' }} />,
      color: '#eb2f96',
    },
  ]

  const statusChartOption = {
    title: {
      text: '签到状态分布',
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
        data: [
          { value: attendances.filter((a) => a.status === 'PRESENT').length, name: '正常', itemStyle: { color: '#52c41a' } },
          { value: attendances.filter((a) => a.status === 'LATE').length, name: '迟到', itemStyle: { color: '#faad14' } },
          { value: attendances.filter((a) => a.status === 'LEAVE_EARLY').length, name: '早退', itemStyle: { color: '#fa8c16' } },
          { value: attendances.filter((a) => a.status === 'ABSENT').length, name: '缺勤', itemStyle: { color: '#ff4d4f' } },
          { value: attendances.filter((a) => a.status === 'PENDING').length, name: '待签到', itemStyle: { color: '#8c8c8c' } },
        ],
      },
    ],
  }

  const trendChartOption = {
    title: {
      text: '近7日签到趋势',
      left: 'center',
      textStyle: { fontSize: 14, fontWeight: 600 },
    },
    tooltip: { trigger: 'axis' },
    legend: { data: ['应到人数', '实到人数'], bottom: 0 },
    xAxis: {
      type: 'category',
      data: Array.from({ length: 7 }, (_, i) =>
        dayjs().subtract(6 - i, 'day').format('MM-DD')
      ),
    },
    yAxis: { type: 'value', name: '人数' },
    series: [
      {
        name: '应到人数',
        type: 'line',
        smooth: true,
        data: [45, 52, 48, 60, 55, 50, 58],
        lineStyle: { color: '#1677ff', width: 2 },
        itemStyle: { color: '#1677ff' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(22, 119, 255, 0.3)' },
              { offset: 1, color: 'rgba(22, 119, 255, 0.05)' },
            ],
          },
        },
      },
      {
        name: '实到人数',
        type: 'line',
        smooth: true,
        data: [42, 50, 46, 55, 52, 48, 55],
        lineStyle: { color: '#52c41a', width: 2 },
        itemStyle: { color: '#52c41a' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(82, 196, 26, 0.3)' },
              { offset: 1, color: 'rgba(82, 196, 26, 0.05)' },
            ],
          },
        },
      },
    ],
    grid: { left: '3%', right: '4%', bottom: '15%', top: '15%', containLabel: true },
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          签到管理
        </Title>
        <Text type="secondary">查看签到记录，处理异常签到情况</Text>
      </div>

      {abnormalCount > 0 && (
        <Alert
          message={`有 ${abnormalCount} 条异常签到待处理`}
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          style={{ marginBottom: 24, borderRadius: 8 }}
          action={
            <Button size="small" type="primary" onClick={() => setStatusFilter('ABSENT')}>
              立即处理
            </Button>
          }
        />
      )}

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
            style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', height: '100%' }}
          >
            <ReactECharts option={trendChartOption} style={{ height: 280 }} />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card
            style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', height: '100%' }}
          >
            <ReactECharts option={statusChartOption} style={{ height: 280 }} />
          </Card>
        </Col>
      </Row>

      <Card
        style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 24 }}
        bodyStyle={{ padding: 20 }}
      >
        <Space wrap size={[16, 16]} style={{ width: '100%' }}>
          <Input
            placeholder="搜索志愿者姓名"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 200 }}
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
            placeholder="签到状态"
            value={statusFilter || undefined}
            onChange={setStatusFilter}
            style={{ width: 150 }}
            allowClear
          >
            <Option value="PENDING">待签到</Option>
            <Option value="PRESENT">正常</Option>
            <Option value="ABSENT">缺勤</Option>
            <Option value="LATE">迟到</Option>
            <Option value="LEAVE_EARLY">早退</Option>
          </Select>
          <RangePicker value={dateRange} onChange={setDateRange} />
          <Space>
            <Button type="primary" onClick={handleSearch}>
              搜索
            </Button>
            <Button onClick={handleReset}>重置</Button>
          </Space>
        </Space>
      </Card>

      <Card
        style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
        bodyStyle={{ padding: 0 }}
      >
        {attendances.length === 0 && !loading ? (
          <Empty description="暂无签到记录" style={{ padding: '60px 0' }} />
        ) : (
          <Table
            columns={columns}
            dataSource={attendances}
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
        title="签到详情"
        placement="right"
        width={600}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
      >
        {currentAttendance && (
          <div>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="项目名称">
                {currentAttendance.schedule?.project?.title || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="志愿者">
                {currentAttendance.volunteerProfile?.user?.realName ||
                  currentAttendance.volunteerProfile?.user?.username ||
                  '-'}
              </Descriptions.Item>
              <Descriptions.Item label="排班日期">
                {currentAttendance.schedule?.scheduledDate
                  ? dayjs(currentAttendance.schedule.scheduledDate).format('YYYY-MM-DD')
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="应到时间">
                {currentAttendance.schedule?.startTime || '-'} - {currentAttendance.schedule?.endTime || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="实际签到时间">
                {currentAttendance.checkInTime
                  ? dayjs(currentAttendance.checkInTime).format('YYYY-MM-DD HH:mm:ss')
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="实际签退时间">
                {currentAttendance.checkOutTime
                  ? dayjs(currentAttendance.checkOutTime).format('YYYY-MM-DD HH:mm:ss')
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="服务时长">
                {currentAttendance.serviceHours?.toFixed(1) || 0} 小时
              </Descriptions.Item>
              <Descriptions.Item label="获得积分">
                +{currentAttendance.pointsEarned || 0} 分
              </Descriptions.Item>
              <Descriptions.Item label="签到状态">
                {getStatusTag(currentAttendance.status)}
              </Descriptions.Item>
              <Descriptions.Item label="签到位置">
                {currentAttendance.checkInLatitude && currentAttendance.checkInLongitude ? (
                  <Space>
                    <EnvironmentOutlined />
                    纬度: {currentAttendance.checkInLatitude.toFixed(6)}
                    <br />
                    经度: {currentAttendance.checkInLongitude.toFixed(6)}
                  </Space>
                ) : (
                  '无定位信息'
                )}
              </Descriptions.Item>
            </Descriptions>
            {['ABSENT', 'LATE', 'LEAVE_EARLY'].includes(currentAttendance.status) && (
              <Button
                type="primary"
                block
                style={{ marginTop: 24 }}
                onClick={() => {
                  setDetailVisible(false)
                  handleHandleAbnormal(currentAttendance)
                }}
              >
                处理异常
              </Button>
            )}
          </div>
        )}
      </Drawer>

      <Modal
        title="处理异常签到"
        open={handleModalVisible}
        onCancel={() => {
          setHandleModalVisible(false)
          handleForm.resetFields()
        }}
        footer={null}
        width={500}
      >
        {currentAttendance && (
          <Alert
            message={`志愿者 ${currentAttendance.volunteerProfile?.user?.realName || '未知'} 的签到异常`}
            description={`当前状态: ${currentAttendance.status === 'ABSENT' ? '缺勤' : currentAttendance.status === 'LATE' ? '迟到' : '早退'}`}
            type="warning"
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}
        <Form form={handleForm} layout="vertical" onFinish={handleSubmitHandle}>
          <Form.Item
            name="status"
            label="最终判定"
            rules={[{ required: true, message: '请选择判定结果' }]}
          >
            <Radio.Group>
              <Radio value="PRESENT">判定为正常</Radio>
              <Radio value="LATE">判定为迟到</Radio>
              <Radio value="LEAVE_EARLY">判定为早退</Radio>
              <Radio value="ABSENT">维持缺勤</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="remark" label="处理备注">
            <TextArea rows={3} placeholder="请输入处理备注（可选）" maxLength={500} showCount />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button
                onClick={() => {
                  setHandleModalVisible(false)
                  handleForm.resetFields()
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                确认处理
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default AttendanceManagement
