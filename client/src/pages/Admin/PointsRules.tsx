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
  Divider,
  List,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  GiftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import type { ColumnsType } from 'antd/es/table'
import { pointsApi } from '../../services/api'
import type { PointsRule } from '../../types'

const { Option } = Select
const { TextArea } = Input

const PointsRules: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [rules, setRules] = useState<PointsRule[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRule, setEditingRule] = useState<PointsRule | null>(null)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<boolean | null>(null)
  const [form] = Form.useForm()

  const conditionTypes = [
    { label: '志愿服务时长', value: 'service_hours', unit: '小时' },
    { label: '完成项目数量', value: 'project_count', unit: '个' },
    { label: '培训通过', value: 'training_passed', unit: '次' },
    { label: '获得好评', value: 'good_review', unit: '次' },
    { label: '连续签到', value: 'continuous_checkin', unit: '天' },
    { label: '推荐新用户', value: 'referral', unit: '人' },
    { label: '特殊贡献', value: 'special_contribution', unit: '次' },
  ]

  const fetchRules = async (search?: string, status?: boolean | null) => {
    setLoading(true)
    try {
      const data = await pointsApi.getPointsRules()
      let filtered = data
      if (search) {
        filtered = data.filter(
          (item) =>
            item.name.toLowerCase().includes(search.toLowerCase()) ||
            item.description.toLowerCase().includes(search.toLowerCase())
        )
      }
      if (status !== null) {
        filtered = filtered.filter((item) => item.isActive === status)
      }
      setRules(filtered)
    } catch (error) {
      message.error('获取积分规则失败')
      const mockRules: PointsRule[] = [
        {
          id: 1,
          name: '志愿服务每小时',
          description: '参与志愿服务每小时获得积分',
          points: 10,
          condition: { type: 'service_hours', threshold: 1 },
          isActive: true,
          createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
        },
        {
          id: 2,
          name: '完成项目奖励',
          description: '成功完成一个项目获得积分',
          points: 50,
          condition: { type: 'project_count', threshold: 1 },
          isActive: true,
          createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 8 * 86400000).toISOString(),
        },
        {
          id: 3,
          name: '培训通过奖励',
          description: '通过培训考试获得积分',
          points: 30,
          condition: { type: 'training_passed', threshold: 1 },
          isActive: true,
          createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
        },
        {
          id: 4,
          name: '获得5星好评',
          description: '获得5星评价奖励积分',
          points: 20,
          condition: { type: 'good_review', threshold: 5, rating: 5 },
          isActive: true,
          createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        },
        {
          id: 5,
          name: '连续签到7天',
          description: '连续签到7天奖励积分',
          points: 100,
          condition: { type: 'continuous_checkin', threshold: 7 },
          isActive: false,
          createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
        },
        {
          id: 6,
          name: '推荐新用户',
          description: '成功推荐新用户注册并完成认证',
          points: 100,
          condition: { type: 'referral', threshold: 1 },
          isActive: true,
          createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]
      let filtered = mockRules
      if (search) {
        filtered = mockRules.filter(
          (item) =>
            item.name.toLowerCase().includes(search.toLowerCase()) ||
            item.description.toLowerCase().includes(search.toLowerCase())
        )
      }
      if (status !== null) {
        filtered = filtered.filter((item) => item.isActive === status)
      }
      setRules(filtered)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRules()
  }, [])

  const handleAdd = () => {
    setEditingRule(null)
    form.resetFields()
    form.setFieldsValue({
      isActive: true,
      condition: { type: 'service_hours', threshold: 1 },
    })
    setModalVisible(true)
  }

  const handleEdit = (rule: PointsRule) => {
    setEditingRule(rule)
    form.setFieldsValue({
      name: rule.name,
      description: rule.description,
      points: rule.points,
      isActive: rule.isActive,
      condition: rule.condition,
    })
    setModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await pointsApi.deletePointsRule(id)
      message.success('删除成功')
      fetchRules(searchText || undefined, statusFilter)
    } catch (error) {
      message.error('删除失败，使用模拟数据')
      setRules(rules.filter((r) => r.id !== id))
      message.success('删除成功（模拟）')
    }
  }

  const handleToggleStatus = async (rule: PointsRule, checked: boolean) => {
    try {
      await pointsApi.updatePointsRule(rule.id, { isActive: checked })
      message.success(`已${checked ? '启用' : '禁用'}规则`)
      fetchRules(searchText || undefined, statusFilter)
    } catch (error) {
      message.error('操作失败，使用模拟数据')
      setRules(rules.map((r) => (r.id === rule.id ? { ...r, isActive: checked } : r)))
      message.success(`已${checked ? '启用' : '禁用'}规则（模拟）`)
    }
  }

  const handleSubmit = async (values: any) => {
    try {
      if (editingRule) {
        await pointsApi.updatePointsRule(editingRule.id, values)
        message.success('更新成功')
      } else {
        await pointsApi.createPointsRule(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      fetchRules(searchText || undefined, statusFilter)
    } catch (error) {
      message.error('操作失败，使用模拟数据')
      if (editingRule) {
        setRules(rules.map((r) => (r.id === editingRule.id ? { ...r, ...values } : r)))
      } else {
        const newRule: PointsRule = {
          id: Math.max(...rules.map((r) => r.id), 0) + 1,
          ...values,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        setRules([newRule, ...rules])
      }
      setModalVisible(false)
      message.success(editingRule ? '更新成功（模拟）' : '创建成功（模拟）')
    }
  }

  const handleSearch = () => {
    fetchRules(searchText || undefined, statusFilter)
  }

  const handleReset = () => {
    setSearchText('')
    setStatusFilter(null)
    fetchRules()
  }

  const getConditionLabel = (condition: Record<string, any>) => {
    const type = conditionTypes.find((t) => t.value === condition.type)
    if (!type) return JSON.stringify(condition)
    return `${type.label} ≥ ${condition.threshold} ${type.unit}`
  }

  const columns: ColumnsType<PointsRule> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: '规则名称',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '触发条件',
      dataIndex: 'condition',
      key: 'condition',
      render: (condition) => <Tag color="purple">{getConditionLabel(condition)}</Tag>,
    },
    {
      title: '积分奖励',
      dataIndex: 'points',
      key: 'points',
      sorter: (a, b) => a.points - b.points,
      render: (text) => (
        <span className="text-orange-500 font-bold text-lg">+{text}</span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (active, record) => (
        <Switch
          checked={active}
          checkedChildren={<CheckCircleOutlined />}
          unCheckedChildren={<CloseCircleOutlined />}
          onChange={(checked) => handleToggleStatus(record, checked)}
        />
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      sorter: (a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
      render: (text) => new Date(text).toLocaleString('zh-CN'),
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
            title="确定删除该规则？"
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

  const activeRules = rules.filter((r) => r.isActive)
  const inactiveRules = rules.filter((r) => !r.isActive)

  const pointsDistribution = {
    tooltip: { trigger: 'item' },
    legend: { bottom: '0%' },
    series: [
      {
        name: '积分分布',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
        data: activeRules.map((r) => ({ name: r.name, value: r.points })),
      },
    ],
  }

  const pointsTrend = {
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月'],
    },
    yAxis: { type: 'value', name: '积分发放' },
    series: [
      {
        data: [12500, 15800, 18200, 21500, 24800, 28600],
        type: 'line',
        smooth: true,
        areaStyle: { opacity: 0.3 },
        itemStyle: { color: '#fa8c16' },
      },
    ],
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">积分规则管理</h2>
        <p className="text-gray-500">管理积分获取规则和奖励机制</p>
      </div>

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="规则总数"
              value={rules.length}
              prefix={<GiftOutlined className="text-orange-500" />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="已启用规则"
              value={activeRules.length}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="已禁用规则"
              value={inactiveRules.length}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="单次最高奖励"
              value={Math.max(...rules.map((r) => r.points), 0)}
              suffix="积分"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} lg={12}>
          <Card title="活跃规则积分分布" size="small">
            <ReactECharts option={pointsDistribution} style={{ height: 250 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="积分发放趋势" size="small">
            <ReactECharts option={pointsTrend} style={{ height: 250 }} />
          </Card>
        </Col>
      </Row>

      <Card className="mb-6">
        <div className="flex flex-wrap gap-4 items-end justify-between">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm text-gray-600 mb-1">搜索规则</label>
              <Input
                placeholder="输入规则名称或描述"
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
            新增规则
          </Button>
        </div>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={rules}
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
        title={editingRule ? '编辑积分规则' : '新增积分规则'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="规则名称"
            rules={[
              { required: true, message: '请输入规则名称' },
              { max: 50, message: '规则名称不能超过50个字符' },
            ]}
          >
            <Input placeholder="请输入规则名称" />
          </Form.Item>
          <Form.Item
            name="description"
            label="规则描述"
            rules={[
              { required: true, message: '请输入规则描述' },
              { max: 200, message: '规则描述不能超过200个字符' },
            ]}
          >
            <TextArea rows={3} placeholder="请输入规则描述" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name={['condition', 'type']}
                label="条件类型"
                rules={[{ required: true, message: '请选择条件类型' }]}
              >
                <Select placeholder="请选择条件类型">
                  {conditionTypes.map((type) => (
                    <Option key={type.value} value={type.value}>
                      {type.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name={['condition', 'threshold']}
                label="触发阈值"
                rules={[
                  { required: true, message: '请输入触发阈值' },
                  { type: 'number', min: 1, message: '阈值至少为1' },
                ]}
              >
                <InputNumber style={{ width: '100%' }} min={1} placeholder="请输入阈值" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="points"
            label="奖励积分"
            rules={[
              { required: true, message: '请输入奖励积分' },
              { type: 'number', min: 1, message: '积分至少为1' },
            ]}
          >
            <InputNumber style={{ width: '100%' }} min={1} placeholder="请输入奖励积分数值" />
          </Form.Item>
          <Form.Item name="isActive" label="是否启用" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
          <Divider />
          <Card size="small" title="条件说明" type="inner">
            <List
              size="small"
              dataSource={conditionTypes}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta title={item.label} description={`阈值单位：${item.unit}`} />
                </List.Item>
              )}
            />
          </Card>
          <Form.Item className="mb-0 mt-4">
            <Space className="w-full justify-end">
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                {editingRule ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default PointsRules
