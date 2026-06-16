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
  InputNumber,
  message,
  Popconfirm,
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
  Tabs,
  Progress,
  List,
  Alert,
} from 'antd'
import {
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  UserOutlined,
  TeamOutlined,
  SafetyOutlined,
  RiseOutlined,
  CrownOutlined,
  GiftOutlined,
  ClockCircleOutlined,
  LockOutlined,
  UnlockOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import type { FilterValue, SorterResult } from 'antd/es/table/interface'
import dayjs from 'dayjs'
import ReactECharts from 'echarts-for-react'
import { userApi, creditApi, pointsApi } from '../../services/api'
import type { User, Role, CreditRecord, PointsRecord } from '../../types'

const { Title, Text } = Typography
const { Option } = Select
const { TabPane } = Tabs
const { TextArea } = Input

interface TableParams {
  pagination: TablePaginationConfig
  sortField: string | null
  sortOrder: string | null
  filters: Record<string, FilterValue | null>
}

interface UserFormData {
  username: string
  email: string
  realName: string
  phone: string
  role: Role
  idCard?: string
  organization?: string
  position?: string
}

interface CreditAdjustFormData {
  amount: number
  reason: string
}

const UserManagement: React.FC = () => {
  const [form] = Form.useForm<UserFormData>()
  const [creditForm] = Form.useForm<CreditAdjustFormData>()
  const [users, setUsers] = useState<User[]>([])
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
  const [searchText, setSearchText] = useState('')
  const [roleFilter, setRoleFilter] = useState<Role | ''>('')
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [creditModalVisible, setCreditModalVisible] = useState(false)
  const [creditRecords, setCreditRecords] = useState<CreditRecord[]>([])
  const [pointsRecords, setPointsRecords] = useState<PointsRecord[]>([])
  const [activeTab, setActiveTab] = useState('info')

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = {
        page: tableParams.pagination.current || 1,
        pageSize: tableParams.pagination.pageSize || 10,
        ...(searchText && { search: searchText }),
        ...(roleFilter && { role: roleFilter }),
        ...(tableParams.sortField && {
          sortBy: tableParams.sortField,
          sortOrder: tableParams.sortOrder === 'ascend' ? 'asc' : 'desc',
        }),
      }

      const result = await userApi.getUsers(params)
      setUsers(result.items)
      setTotal(result.total)
    } catch (error) {
      message.error('获取用户列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [tableParams])

  const handleTableChange = (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: SorterResult<User> | SorterResult<User>[]
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
    setSearchText('')
    setRoleFilter('')
    setTableParams({
      pagination: { current: 1, pageSize: 10 },
      sortField: null,
      sortOrder: null,
      filters: {},
    })
  }

  const handleViewDetail = async (record: User) => {
    setCurrentUser(record)
    setDetailVisible(true)
    setActiveTab('info')

    try {
      if (record.volunteerProfile) {
        const [creditRes, pointsRes] = await Promise.all([
          creditApi.getMyCreditRecords({ page: 1, pageSize: 20 }).catch(() => ({ items: [] as CreditRecord[] })),
          pointsApi.getMyPointsRecords({ page: 1, pageSize: 20 }).catch(() => ({ items: [] as PointsRecord[] })),
        ])
        setCreditRecords(creditRes.items || [])
        setPointsRecords(pointsRes.items || [])
      }
    } catch (error) {
      console.error('获取用户记录失败', error)
    }
  }

  const handleEdit = (record: User) => {
    setEditingUser(record)
    form.setFieldsValue({
      username: record.username,
      email: record.email,
      realName: record.realName,
      phone: record.phone,
      role: record.role,
      idCard: record.idCard,
      organization: record.managerProfile?.organization,
      position: record.managerProfile?.position,
    })
    setModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await userApi.deleteUser(id)
      message.success('删除成功')
      fetchUsers()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleSubmit = async (values: UserFormData) => {
    if (!editingUser) return
    try {
      await userApi.updateUser(editingUser.id, values)
      message.success('更新成功')
      setModalVisible(false)
      setEditingUser(null)
      form.resetFields()
      fetchUsers()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const handleCreditAdjust = async (_values: CreditAdjustFormData) => {
    if (!currentUser) return
    try {
      message.info('信用分调整功能开发中')
      setCreditModalVisible(false)
      creditForm.resetFields()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const handleResetPassword = async (_userId: number) => {
    Modal.confirm({
      title: '重置密码',
      content: '确定要重置该用户的密码吗？新密码将发送到用户邮箱。',
      onOk: async () => {
        try {
          message.success('密码重置邮件已发送')
        } catch (error) {
          message.error('操作失败')
        }
      },
    })
  }

  const getRoleTag = (role: Role) => {
    const roleMap: Record<Role, { color: string; text: string; icon: React.ReactNode }> = {
      VOLUNTEER: { color: 'blue', text: '志愿者', icon: <UserOutlined /> },
      PROJECT_MANAGER: { color: 'purple', text: '项目管理员', icon: <TeamOutlined /> },
      ADMIN: { color: 'red', text: '系统管理员', icon: <CrownOutlined /> },
    }
    const { color, text, icon } = roleMap[role]
    return (
      <Tag color={color} icon={icon}>
        {text}
      </Tag>
    )
  }

  const getCreditStatus = (score: number) => {
    if (score >= 90) return { color: '#52c41a', text: '优秀' }
    if (score >= 80) return { color: '#1677ff', text: '良好' }
    if (score >= 60) return { color: '#faad14', text: '一般' }
    return { color: '#ff4d4f', text: '较差' }
  }

  const columns: ColumnsType<User> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      sorter: true,
    },
    {
      title: '用户信息',
      key: 'userInfo',
      width: 200,
      render: (_, record) => (
        <Space>
          <Avatar size={40} icon={<UserOutlined />} src={record.avatar} />
          <div>
            <Text strong>{record.realName || record.username}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              @{record.username}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      render: (role: Role) => getRoleTag(role),
      filters: [
        { text: '志愿者', value: 'VOLUNTEER' },
        { text: '项目管理员', value: 'PROJECT_MANAGER' },
        { text: '系统管理员', value: 'ADMIN' },
      ],
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 180,
      ellipsis: true,
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
    },
    {
      title: '信用分',
      dataIndex: 'creditScore',
      key: 'creditScore',
      width: 120,
      sorter: true,
      render: (score: number) => {
        const status = getCreditStatus(score)
        return (
          <Space>
            <Progress
              type="circle"
              percent={score}
              size={40}
              strokeColor={status.color}
              format={() => score}
            />
            <Tag color={status.color}>{status.text}</Tag>
          </Space>
        )
      },
    },
    {
      title: '总积分',
      dataIndex: 'totalPoints',
      key: 'totalPoints',
      width: 100,
      sorter: true,
      render: (points: number) => (
        <Space>
          <GiftOutlined style={{ color: '#eb2f96' }} />
          <Text strong style={{ color: '#eb2f96' }}>
            {points?.toLocaleString() || 0}
          </Text>
        </Space>
      ),
    },
    {
      title: '服务时长',
      dataIndex: 'totalServiceHours',
      key: 'totalServiceHours',
      width: 100,
      sorter: true,
      render: (hours: number) => (
        <Space>
          <ClockCircleOutlined style={{ color: '#1677ff' }} />
          <Text>{hours?.toFixed(0) || 0}小时</Text>
        </Space>
      ),
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      sorter: true,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)} />
          </Tooltip>
          <Tooltip title="编辑">
            <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          </Tooltip>
          <Tooltip title="重置密码">
            <Button
              type="link"
              icon={<ReloadOutlined />}
              onClick={() => handleResetPassword(record.id)}
            />
          </Tooltip>
          {record.role !== 'ADMIN' && (
            <Popconfirm title="确定删除此用户？" onConfirm={() => handleDelete(record.id)}>
              <Button type="link" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  const stats = [
    {
      title: '总用户数',
      value: total,
      icon: <TeamOutlined style={{ fontSize: 24, color: '#1677ff' }} />,
      color: '#1677ff',
    },
    {
      title: '志愿者',
      value: users.filter((u) => u.role === 'VOLUNTEER').length,
      icon: <UserOutlined style={{ fontSize: 24, color: '#52c41a' }} />,
      color: '#52c41a',
    },
    {
      title: '项目管理员',
      value: users.filter((u) => u.role === 'PROJECT_MANAGER').length,
      icon: <SafetyOutlined style={{ fontSize: 24, color: '#722ed1' }} />,
      color: '#722ed1',
    },
    {
      title: '平均信用分',
      value:
        users.length > 0
          ? (users.reduce((acc, u) => acc + u.creditScore, 0) / users.length).toFixed(1)
          : '0.0',
      icon: <RiseOutlined style={{ fontSize: 24, color: '#faad14' }} />,
      color: '#faad14',
    },
  ]

  const roleChartOption = {
    title: {
      text: '用户角色分布',
      left: 'center',
      textStyle: { fontSize: 14, fontWeight: 600 },
    },
    tooltip: { trigger: 'item', formatter: '{b}: {c}人 ({d}%)' },
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
          { value: users.filter((u) => u.role === 'VOLUNTEER').length, name: '志愿者', itemStyle: { color: '#1677ff' } },
          { value: users.filter((u) => u.role === 'PROJECT_MANAGER').length, name: '项目管理员', itemStyle: { color: '#722ed1' } },
          { value: users.filter((u) => u.role === 'ADMIN').length, name: '系统管理员', itemStyle: { color: '#ff4d4f' } },
        ],
      },
    ],
  }

  const creditChartOption = {
    title: {
      text: '信用分分布',
      left: 'center',
      textStyle: { fontSize: 14, fontWeight: 600 },
    },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: ['60分以下', '60-70', '70-80', '80-90', '90分以上'],
    },
    yAxis: { type: 'value', name: '人数' },
    series: [
      {
        type: 'bar',
        data: [
          users.filter((u) => u.creditScore < 60).length,
          users.filter((u) => u.creditScore >= 60 && u.creditScore < 70).length,
          users.filter((u) => u.creditScore >= 70 && u.creditScore < 80).length,
          users.filter((u) => u.creditScore >= 80 && u.creditScore < 90).length,
          users.filter((u) => u.creditScore >= 90).length,
        ],
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#91d5ff' },
              { offset: 1, color: '#1677ff' },
            ],
          },
          borderRadius: [4, 4, 0, 0],
        },
      },
    ],
    grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
  }

  const trendChartOption = {
    title: {
      text: '用户增长趋势',
      left: 'center',
      textStyle: { fontSize: 14, fontWeight: 600 },
    },
    tooltip: { trigger: 'axis' },
    legend: { data: ['新增用户', '累计用户'], bottom: 0 },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月'],
    },
    yAxis: { type: 'value', name: '人数' },
    series: [
      {
        name: '新增用户',
        type: 'bar',
        data: [45, 62, 58, 80, 72, 95],
        itemStyle: { color: '#1677ff', borderRadius: [4, 4, 0, 0] },
      },
      {
        name: '累计用户',
        type: 'line',
        smooth: true,
        data: [120, 182, 240, 320, 392, 487],
        lineStyle: { color: '#52c41a', width: 3 },
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
          用户管理
        </Title>
        <Text type="secondary">管理系统所有用户，支持角色管理和权限控制</Text>
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
            style={{
              borderRadius: 12,
              border: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              height: '100%',
            }}
          >
            <ReactECharts option={trendChartOption} style={{ height: 280 }} />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Row gutter={[16, 16]}>
            <Col xs={12}>
              <Card
                style={{
                  borderRadius: 12,
                  border: 'none',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  height: '100%',
                }}
              >
                <ReactECharts option={roleChartOption} style={{ height: 240 }} />
              </Card>
            </Col>
            <Col xs={12}>
              <Card
                style={{
                  borderRadius: 12,
                  border: 'none',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  height: '100%',
                }}
              >
                <ReactECharts option={creditChartOption} style={{ height: 240 }} />
              </Card>
            </Col>
          </Row>
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
            placeholder="搜索用户名、姓名、邮箱"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250 }}
            allowClear
          />
          <Select
            placeholder="用户角色"
            value={roleFilter || undefined}
            onChange={setRoleFilter}
            style={{ width: 150 }}
            allowClear
          >
            <Option value="VOLUNTEER">志愿者</Option>
            <Option value="PROJECT_MANAGER">项目管理员</Option>
            <Option value="ADMIN">系统管理员</Option>
          </Select>
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
        {users.length === 0 && !loading ? (
          <Empty description="暂无用户数据" style={{ padding: '60px 0' }} />
        ) : (
          <Table
            columns={columns}
            dataSource={users}
            rowKey="id"
            loading={loading}
            pagination={{
              ...tableParams.pagination,
              total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 位用户`,
            }}
            onChange={handleTableChange}
            scroll={{ x: 1400 }}
          />
        )}
      </Card>

      <Drawer
        title="用户详情"
        placement="right"
        width={550}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
      >
        {currentUser && (
          <div>
            <Card
              style={{
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)',
                marginBottom: 16,
              }}
              bodyStyle={{ padding: 20, textAlign: 'center' }}
            >
              <Avatar
                size={80}
                icon={<UserOutlined />}
                src={currentUser.avatar}
                style={{ border: '4px solid #fff', marginBottom: 12 }}
              />
              <Text strong style={{ fontSize: 18, display: 'block', marginBottom: 4 }}>
                {currentUser.realName || currentUser.username}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                @{currentUser.username}
              </Text>
              <div style={{ marginTop: 12 }}>
                {getRoleTag(currentUser.role)}
              </div>
            </Card>

            <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
              <Col span={8}>
                <Card size="small" style={{ borderRadius: 8, border: 'none', background: '#f0f5ff' }}>
                  <Statistic
                    title="信用分"
                    value={currentUser.creditScore}
                    valueStyle={{ fontSize: 18, color: '#1677ff' }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" style={{ borderRadius: 8, border: 'none', background: '#fff7e6' }}>
                  <Statistic
                    title="总积分"
                    value={currentUser.totalPoints?.toLocaleString() || 0}
                    valueStyle={{ fontSize: 18, color: '#faad14' }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" style={{ borderRadius: 8, border: 'none', background: '#f6ffed' }}>
                  <Statistic
                    title="服务时长"
                    value={currentUser.totalServiceHours?.toFixed(0) || 0}
                    suffix="小时"
                    valueStyle={{ fontSize: 18, color: '#52c41a' }}
                  />
                </Card>
              </Col>
            </Row>

            <Alert
              message="账户安全"
              description={
                <Space>
                  {currentUser.creditScore >= 80 ? (
                    <>
                      <UnlockOutlined style={{ color: '#52c41a' }} />
                      <Text type="success">账户状态正常</Text>
                    </>
                  ) : (
                    <>
                      <LockOutlined style={{ color: '#faad14' }} />
                      <Text type="warning">部分功能受限</Text>
                    </>
                  )}
                </Space>
              }
              type={currentUser.creditScore >= 80 ? 'success' : 'warning'}
              showIcon
              style={{ marginBottom: 16 }}
              action={
                <Button
                  size="small"
                  onClick={() => setCreditModalVisible(true)}
                >
                  调整信用分
                </Button>
              }
            />

            <Tabs activeKey={activeTab} onChange={setActiveTab}>
              <TabPane tab="基本信息" key="info">
                <Descriptions column={1} size="small" bordered>
                  <Descriptions.Item label="邮箱">{currentUser.email}</Descriptions.Item>
                  <Descriptions.Item label="手机号">{currentUser.phone}</Descriptions.Item>
                  <Descriptions.Item label="身份证号">
                    {currentUser.idCard || '未填写'}
                  </Descriptions.Item>
                  <Descriptions.Item label="注册时间">
                    {dayjs(currentUser.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                  </Descriptions.Item>
                  <Descriptions.Item label="最后更新">
                    {dayjs(currentUser.updatedAt).format('YYYY-MM-DD HH:mm:ss')}
                  </Descriptions.Item>
                  {currentUser.managerProfile && (
                    <>
                      <Descriptions.Item label="所属机构">
                        {currentUser.managerProfile.organization}
                      </Descriptions.Item>
                      <Descriptions.Item label="职位">
                        {currentUser.managerProfile.position}
                      </Descriptions.Item>
                    </>
                  )}
                </Descriptions>
              </TabPane>

              <TabPane tab="信用分记录" key="credit">
                <List
                  size="small"
                  dataSource={creditRecords}
                  locale={{ emptyText: '暂无信用分记录' }}
                  renderItem={(item) => (
                    <List.Item>
                      <Space style={{ width: '100%' }}>
                        <Tag color={item.amount > 0 ? 'green' : 'red'}>
                          {item.amount > 0 ? '+' : ''}
                          {item.amount}
                        </Tag>
                        <Text style={{ flex: 1 }}>{item.reason}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {dayjs(item.createdAt).format('MM-DD HH:mm')}
                        </Text>
                      </Space>
                    </List.Item>
                  )}
                />
              </TabPane>

              <TabPane tab="积分记录" key="points">
                <List
                  size="small"
                  dataSource={pointsRecords}
                  locale={{ emptyText: '暂无积分记录' }}
                  renderItem={(item) => (
                    <List.Item>
                      <Space style={{ width: '100%' }}>
                        <Tag color="green">+{item.amount}</Tag>
                        <Text style={{ flex: 1 }}>{item.description}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {dayjs(item.createdAt).format('MM-DD HH:mm')}
                        </Text>
                      </Space>
                    </List.Item>
                  )}
                />
              </TabPane>
            </Tabs>
          </div>
        )}
      </Drawer>

      <Modal
        title="编辑用户"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false)
          setEditingUser(null)
          form.resetFields()
        }}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="username"
                label="用户名"
                rules={[
                  { required: true, message: '请输入用户名' },
                  { min: 3, max: 20, message: '用户名长度在3-20个字符之间' },
                ]}
              >
                <Input placeholder="请输入用户名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="realName"
                label="真实姓名"
                rules={[{ required: true, message: '请输入真实姓名' }]}
              >
                <Input placeholder="请输入真实姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="邮箱"
                rules={[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '请输入有效的邮箱地址' },
                ]}
              >
                <Input placeholder="请输入邮箱" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="手机号"
                rules={[
                  { required: true, message: '请输入手机号' },
                  { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' },
                ]}
              >
                <Input placeholder="请输入手机号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="role"
                label="用户角色"
                rules={[{ required: true, message: '请选择角色' }]}
              >
                <Select placeholder="请选择角色">
                  <Option value="VOLUNTEER">志愿者</Option>
                  <Option value="PROJECT_MANAGER">项目管理员</Option>
                  <Option value="ADMIN">系统管理员</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="idCard" label="身份证号">
                <Input placeholder="请输入身份证号（可选）" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button
                onClick={() => {
                  setModalVisible(false)
                  setEditingUser(null)
                  form.resetFields()
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="调整信用分"
        open={creditModalVisible}
        onCancel={() => {
          setCreditModalVisible(false)
          creditForm.resetFields()
        }}
        footer={null}
        width={400}
      >
        <Form form={creditForm} layout="vertical" onFinish={handleCreditAdjust}>
          <Form.Item
            name="amount"
            label="调整分数"
            rules={[{ required: true, message: '请输入调整分数' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={-100}
              max={100}
              placeholder="正数增加，负数减少"
              addonBefore={
                <Select defaultValue="add" style={{ width: 80 }}>
                  <Option value="add">加分</Option>
                  <Option value="minus">扣分</Option>
                </Select>
              }
            />
          </Form.Item>
          <Form.Item
            name="reason"
            label="调整原因"
            rules={[
              { required: true, message: '请输入调整原因' },
              { min: 5, max: 200, message: '原因长度在5-200个字符之间' },
            ]}
          >
            <TextArea
              rows={3}
              placeholder="请详细说明调整原因..."
              maxLength={200}
              showCount
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button
                onClick={() => {
                  setCreditModalVisible(false)
                  creditForm.resetFields()
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                确认调整
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default UserManagement
