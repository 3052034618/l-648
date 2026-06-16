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
  Switch,
  Alert,
  Divider,
  Tooltip,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  SafetyOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import type { ColumnsType } from 'antd/es/table'
import { creditApi } from '../../services/api'
import type { CreditThreshold } from '../../types'

const { Option } = Select
const { TextArea } = Input

const CreditSettings: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [thresholds, setThresholds] = useState<CreditThreshold[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [editingThreshold, setEditingThreshold] = useState<CreditThreshold | null>(null)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<boolean | null>(null)
  const [form] = Form.useForm()

  const restrictionTypes = [
    { label: '无限制', value: 'NO_RESTRICTION' },
    { label: '限制报名', value: 'RESTRICT_APPLY' },
    { label: '禁止签到', value: 'FORBID_CHECKIN' },
    { label: '禁止兑换', value: 'FORBID_EXCHANGE' },
    { label: '限制参与活动', value: 'RESTRICT_ACTIVITY' },
    { label: '账号冻结', value: 'ACCOUNT_FREEZE' },
  ]

  const fetchThresholds = async (search?: string, status?: boolean | null) => {
    setLoading(true)
    try {
      const data = await creditApi.getCreditThresholds()
      const sortedData = [...data].sort((a, b) => b.minCreditScore - a.minCreditScore)
      let filtered = sortedData
      if (search) {
        filtered = sortedData.filter(
          (item) =>
            item.name.toLowerCase().includes(search.toLowerCase()) ||
            item.description.toLowerCase().includes(search.toLowerCase()) ||
            item.restriction.toLowerCase().includes(search.toLowerCase())
        )
      }
      if (status !== null) {
        filtered = filtered.filter((item) => item.isActive === status)
      }
      setThresholds(filtered)
    } catch (error) {
      message.error('获取信用分阈值失败')
      const mockThresholds: CreditThreshold[] = [
        {
          id: 1,
          name: '优秀',
          description: '信用分优秀，无任何限制，可享受优先权益',
          minCreditScore: 90,
          restriction: 'NO_RESTRICTION',
          isActive: true,
          createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
        },
        {
          id: 2,
          name: '良好',
          description: '信用分良好，无任何限制',
          minCreditScore: 70,
          restriction: 'NO_RESTRICTION',
          isActive: true,
          createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
        },
        {
          id: 3,
          name: '一般',
          description: '信用分一般，部分功能受限',
          minCreditScore: 50,
          restriction: 'RESTRICT_APPLY',
          isActive: true,
          createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
        },
        {
          id: 4,
          name: '较差',
          description: '信用分较差，禁止签到和兑换',
          minCreditScore: 30,
          restriction: 'FORBID_EXCHANGE',
          isActive: true,
          createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
        },
        {
          id: 5,
          name: '差',
          description: '信用分过低，限制参与所有活动',
          minCreditScore: 10,
          restriction: 'RESTRICT_ACTIVITY',
          isActive: true,
          createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
        },
        {
          id: 6,
          name: '冻结',
          description: '信用分过低，账号冻结',
          minCreditScore: 0,
          restriction: 'ACCOUNT_FREEZE',
          isActive: false,
          createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
        },
      ]
      const sortedData = [...mockThresholds].sort((a, b) => b.minCreditScore - a.minCreditScore)
      let filtered = sortedData
      if (search) {
        filtered = sortedData.filter(
          (item) =>
            item.name.toLowerCase().includes(search.toLowerCase()) ||
            item.description.toLowerCase().includes(search.toLowerCase()) ||
            item.restriction.toLowerCase().includes(search.toLowerCase())
        )
      }
      if (status !== null) {
        filtered = filtered.filter((item) => item.isActive === status)
      }
      setThresholds(filtered)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchThresholds()
  }, [])

  const handleAdd = () => {
    setEditingThreshold(null)
    form.resetFields()
    form.setFieldsValue({
      isActive: true,
      minCreditScore: 50,
      restriction: 'NO_RESTRICTION',
    })
    setModalVisible(true)
  }

  const handleEdit = (threshold: CreditThreshold) => {
    setEditingThreshold(threshold)
    form.setFieldsValue({
      name: threshold.name,
      description: threshold.description,
      minCreditScore: threshold.minCreditScore,
      restriction: threshold.restriction,
      isActive: threshold.isActive,
    })
    setModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await creditApi.deleteCreditThreshold(id)
      message.success('删除成功')
      fetchThresholds(searchText || undefined, statusFilter)
    } catch (error) {
      message.error('删除失败，使用模拟数据')
      setThresholds(thresholds.filter((t) => t.id !== id))
      message.success('删除成功（模拟）')
    }
  }

  const handleToggleStatus = async (threshold: CreditThreshold, checked: boolean) => {
    try {
      await creditApi.updateCreditThreshold(threshold.id, { isActive: checked })
      message.success(`已${checked ? '启用' : '禁用'}阈值`)
      fetchThresholds(searchText || undefined, statusFilter)
    } catch (error) {
      message.error('操作失败，使用模拟数据')
      setThresholds(thresholds.map((t) => (t.id === threshold.id ? { ...t, isActive: checked } : t)))
      message.success(`已${checked ? '启用' : '禁用'}阈值（模拟）`)
    }
  }

  const handleSubmit = async (values: any) => {
    try {
      if (editingThreshold) {
        await creditApi.updateCreditThreshold(editingThreshold.id, values)
        message.success('更新成功')
      } else {
        await creditApi.createCreditThreshold(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      fetchThresholds(searchText || undefined, statusFilter)
    } catch (error) {
      message.error('操作失败，使用模拟数据')
      if (editingThreshold) {
        setThresholds(
          thresholds.map((t) => (t.id === editingThreshold.id ? { ...t, ...values } : t)).sort(
            (a, b) => b.minCreditScore - a.minCreditScore
          )
        )
      } else {
        const newThreshold: CreditThreshold = {
          id: Math.max(...thresholds.map((t) => t.id), 0) + 1,
          ...values,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        setThresholds([...thresholds, newThreshold].sort((a, b) => b.minCreditScore - a.minCreditScore))
      }
      setModalVisible(false)
      message.success(editingThreshold ? '更新成功（模拟）' : '创建成功（模拟）')
    }
  }

  const handleSearch = () => {
    fetchThresholds(searchText || undefined, statusFilter)
  }

  const handleReset = () => {
    setSearchText('')
    setStatusFilter(null)
    fetchThresholds()
  }

  const getRestrictionLabel = (value: string) => {
    const type = restrictionTypes.find((t) => t.value === value)
    return type ? type.label : value
  }

  const getRestrictionColor = (value: string) => {
    const colorMap: Record<string, string> = {
      NO_RESTRICTION: 'green',
      RESTRICT_APPLY: 'gold',
      FORBID_CHECKIN: 'orange',
      FORBID_EXCHANGE: 'red',
      RESTRICT_ACTIVITY: 'volcano',
      ACCOUNT_FREEZE: 'magenta',
    }
    return colorMap[value] || 'default'
  }

  const getCreditLevelIcon = (score: number) => {
    if (score >= 90) return <CheckCircleOutlined className="text-green-500 text-lg" />
    if (score >= 70) return <CheckCircleOutlined className="text-blue-500 text-lg" />
    if (score >= 50) return <InfoCircleOutlined className="text-yellow-500 text-lg" />
    if (score >= 30) return <WarningOutlined className="text-orange-500 text-lg" />
    return <CloseCircleOutlined className="text-red-500 text-lg" />
  }

  const columns: ColumnsType<CreditThreshold> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: '等级标识',
      key: 'icon',
      width: 80,
      render: (_, record) => (
        <div className="flex justify-center">{getCreditLevelIcon(record.minCreditScore)}</div>
      ),
    },
    {
      title: '等级名称',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: '最低信用分',
      dataIndex: 'minCreditScore',
      key: 'minCreditScore',
      sorter: (a, b) => a.minCreditScore - b.minCreditScore,
      render: (text, _record, index) => {
        const nextThreshold = thresholds[index + 1]
        const maxScore = nextThreshold ? nextThreshold.minCreditScore - 1 : 100
        return (
          <Tooltip title={`信用分范围: ${text} - ${maxScore}`}>
            <span className="text-blue-500 font-bold">≥ {text}</span>
          </Tooltip>
        )
      },
    },
    {
      title: '限制措施',
      dataIndex: 'restriction',
      key: 'restriction',
      render: (text) => <Tag color={getRestrictionColor(text)}>{getRestrictionLabel(text)}</Tag>,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (active, record) => (
        <Switch
          checked={active}
          checkedChildren="启用"
          unCheckedChildren="禁用"
          onChange={(checked) => handleToggleStatus(record, checked)}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除该阈值？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const activeThresholds = thresholds.filter((t) => t.isActive)

  const creditDistribution = {
    tooltip: { trigger: 'item' },
    legend: { bottom: '0%' },
    series: [
      {
        name: '信用等级分布',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
        data: [
          { value: 35, name: '优秀 (≥90)', itemStyle: { color: '#52c41a' } },
          { value: 40, name: '良好 (70-89)', itemStyle: { color: '#1890ff' } },
          { value: 15, name: '一般 (50-69)', itemStyle: { color: '#faad14' } },
          { value: 7, name: '较差 (30-49)', itemStyle: { color: '#fa8c16' } },
          { value: 3, name: '差 (0-29)', itemStyle: { color: '#ff4d4f' } },
        ],
      },
    ],
  }

  const creditTrend = {
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月'],
    },
    yAxis: { type: 'value', name: '平均信用分' },
    series: [
      {
        data: [72, 74, 75, 78, 80, 82],
        type: 'line',
        smooth: true,
        areaStyle: { opacity: 0.3 },
        itemStyle: { color: '#52c41a' },
      },
    ],
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">信用分设置</h2>
        <p className="text-gray-500">管理信用分等级阈值和限制措施</p>
      </div>

      <Alert
        message="信用分说明"
        description="信用分是衡量志愿者信用状况的重要指标，范围0-100分。系统将根据信用分自动应用对应的限制措施，请谨慎设置。"
        type="info"
        showIcon
        icon={<SafetyOutlined />}
        className="mb-6"
      />

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="阈值总数"
              value={thresholds.length}
              prefix={<SafetyOutlined className="text-blue-500" />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="已启用阈值"
              value={activeThresholds.length}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="最高信用分要求"
              value={Math.max(...thresholds.map((t) => t.minCreditScore), 0)}
              suffix="分"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="最低信用分要求"
              value={Math.min(...thresholds.map((t) => t.minCreditScore), 0)}
              suffix="分"
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} lg={12}>
          <Card title="用户信用等级分布" size="small">
            <ReactECharts option={creditDistribution} style={{ height: 250 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="平均信用分趋势" size="small">
            <ReactECharts option={creditTrend} style={{ height: 250 }} />
          </Card>
        </Col>
      </Row>

      <Card className="mb-6">
        <div className="flex flex-wrap gap-4 items-end justify-between">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm text-gray-600 mb-1">搜索</label>
              <Input
                placeholder="输入等级名称或描述"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onPressEnter={handleSearch}
                style={{ width: 250 }}
                allowClear
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">状态</label>
              <Select
                placeholder="选择状态"
                value={statusFilter === null ? undefined : statusFilter}
                onChange={(value) => setStatusFilter(value)}
                style={{ width: 150 }}
                allowClear
              >
                <Option value={true}>已启用</Option>
                <Option value={false}>已禁用</Option>
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
            新增阈值
          </Button>
        </div>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={thresholds}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          scroll={{ x: 1100 }}
        />
      </Card>

      <Modal
        title={editingThreshold ? '编辑信用分阈值' : '新增信用分阈值'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="等级名称"
                rules={[
                  { required: true, message: '请输入等级名称' },
                  { max: 20, message: '等级名称不能超过20个字符' },
                ]}
              >
                <Input placeholder="如：优秀、良好、一般" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="minCreditScore"
                label="最低信用分"
                rules={[
                  { required: true, message: '请输入最低信用分' },
                  { type: 'number', min: 0, max: 100, message: '信用分范围0-100' },
                ]}
              >
                <InputNumber style={{ width: '100%' }} min={0} max={100} placeholder="0-100" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="restriction"
            label="限制措施"
            rules={[{ required: true, message: '请选择限制措施' }]}
          >
            <Select placeholder="请选择限制措施">
              {restrictionTypes.map((type) => (
                <Option key={type.value} value={type.value}>
                  <Tag color={getRestrictionColor(type.value)}>{type.label}</Tag>
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="description"
            label="等级描述"
            rules={[
              { required: true, message: '请输入等级描述' },
              { max: 200, message: '描述不能超过200个字符' },
            ]}
          >
            <TextArea rows={3} placeholder="请输入该等级的详细描述" />
          </Form.Item>
          <Form.Item name="isActive" label="是否启用" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
          <Divider />
          <Alert
            message="设置提示"
            description={
              <div>
                <p>• 信用分范围为 0-100 分</p>
                <p>• 系统会自动根据用户信用分匹配对应的等级</p>
                <p>• 限制措施会自动应用于对应用户</p>
                <p>• 建议按照从高到低的顺序设置阈值</p>
              </div>
            }
            type="info"
            showIcon
          />
          <Form.Item className="mb-0 mt-4">
            <Space className="w-full justify-end">
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                {editingThreshold ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default CreditSettings
