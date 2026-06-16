import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Card,
  Row,
  Col,
  Statistic,
  InputNumber,
  Switch,
  Upload,
  Image,
  Progress,
  Empty,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  ShopOutlined,
  InboxOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import type { ColumnsType } from 'antd/es/table'
import type { UploadProps } from 'antd/es/upload/interface'
import { exchangeApi } from '../../services/api'
import type { ExchangeRule } from '../../types'

const { Option } = Select
const { TextArea } = Input
const { Dragger } = Upload

const ExchangeRules: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [rules, setRules] = useState<ExchangeRule[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRule, setEditingRule] = useState<ExchangeRule | null>(null)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<boolean | null>(null)
  const [rewardImage, setRewardImage] = useState<string | null>(null)
  const [form] = Form.useForm()

  const fetchRules = async (search?: string, status?: boolean | null) => {
    setLoading(true)
    try {
      const data = await exchangeApi.getExchangeRules()
      let filtered = data
      if (search) {
        filtered = data.filter(
          (item) =>
            item.name.toLowerCase().includes(search.toLowerCase()) ||
            item.description.toLowerCase().includes(search.toLowerCase()) ||
            item.reward.toLowerCase().includes(search.toLowerCase())
        )
      }
      if (status !== null) {
        filtered = filtered.filter((item) => item.isActive === status)
      }
      setRules(filtered)
    } catch (error) {
      message.error('获取兑换规则失败')
      const mockRules: ExchangeRule[] = [
        {
          id: 1,
          name: '精美笔记本',
          description: '高品质皮质笔记本，适合记录志愿服务心得',
          reward: '精美皮质笔记本 x1',
          pointsRequired: 500,
          stock: 100,
          isActive: true,
          rewardImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200&h=200&fit=crop',
          exchangeRecords: [],
          createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
        },
        {
          id: 2,
          name: '保温杯',
          description: '304不锈钢保温杯，500ml大容量',
          reward: '品牌保温杯 x1',
          pointsRequired: 800,
          stock: 50,
          isActive: true,
          rewardImage: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=200&h=200&fit=crop',
          exchangeRecords: [],
          createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 8 * 86400000).toISOString(),
        },
        {
          id: 3,
          name: '志愿者证书',
          description: '年度优秀志愿者荣誉证书',
          reward: '荣誉证书 x1',
          pointsRequired: 2000,
          stock: 20,
          isActive: true,
          rewardImage: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=200&h=200&fit=crop',
          exchangeRecords: [],
          createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
        },
        {
          id: 4,
          name: '电影票兑换券',
          description: '全国通用2D/3D电影票一张',
          reward: '电影票兑换券 x1',
          pointsRequired: 600,
          stock: 0,
          isActive: false,
          rewardImage: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=200&h=200&fit=crop',
          exchangeRecords: [],
          createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        },
        {
          id: 5,
          name: '品牌T恤',
          description: '定制款志愿者纪念T恤，纯棉材质',
          reward: '志愿者纪念T恤 x1',
          pointsRequired: 1200,
          stock: 30,
          isActive: true,
          rewardImage: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200&h=200&fit=crop',
          exchangeRecords: [],
          createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
        },
        {
          id: 6,
          name: '咖啡代金券',
          description: '知名咖啡品牌50元代金券',
          reward: '50元代金券 x1',
          pointsRequired: 300,
          stock: 200,
          isActive: true,
          rewardImage: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=200&h=200&fit=crop',
          exchangeRecords: [],
          createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]
      let filtered = mockRules
      if (search) {
        filtered = mockRules.filter(
          (item) =>
            item.name.toLowerCase().includes(search.toLowerCase()) ||
            item.description.toLowerCase().includes(search.toLowerCase()) ||
            item.reward.toLowerCase().includes(search.toLowerCase())
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
    setRewardImage(null)
    form.setFieldsValue({
      isActive: true,
      stock: 100,
    })
    setModalVisible(true)
  }

  const handleEdit = (rule: ExchangeRule) => {
    setEditingRule(rule)
    setRewardImage(rule.rewardImage || null)
    form.setFieldsValue({
      name: rule.name,
      description: rule.description,
      reward: rule.reward,
      pointsRequired: rule.pointsRequired,
      stock: rule.stock,
      isActive: rule.isActive,
    })
    setModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await exchangeApi.deleteExchangeRule(id)
      message.success('删除成功')
      fetchRules(searchText || undefined, statusFilter)
    } catch (error) {
      message.error('删除失败，使用模拟数据')
      setRules(rules.filter((r) => r.id !== id))
      message.success('删除成功（模拟）')
    }
  }

  const handleToggleStatus = async (rule: ExchangeRule, checked: boolean) => {
    try {
      await exchangeApi.updateExchangeRule(rule.id, { isActive: checked })
      message.success(`已${checked ? '启用' : '禁用'}规则`)
      fetchRules(searchText || undefined, statusFilter)
    } catch (error) {
      message.error('操作失败，使用模拟数据')
      setRules(rules.map((r) => (r.id === rule.id ? { ...r, isActive: checked } : r)))
      message.success(`已${checked ? '启用' : '禁用'}规则（模拟）`)
    }
  }

  const handleSubmit = async (values: any) => {
    const submitData = { ...values, rewardImage }
    try {
      if (editingRule) {
        await exchangeApi.updateExchangeRule(editingRule.id, submitData)
        message.success('更新成功')
      } else {
        await exchangeApi.createExchangeRule(submitData)
        message.success('创建成功')
      }
      setModalVisible(false)
      fetchRules(searchText || undefined, statusFilter)
    } catch (error) {
      message.error('操作失败，使用模拟数据')
      if (editingRule) {
        setRules(rules.map((r) => (r.id === editingRule.id ? { ...r, ...submitData } : r)))
      } else {
        const newRule: ExchangeRule = {
          id: Math.max(...rules.map((r) => r.id), 0) + 1,
          ...submitData,
          exchangeRecords: [],
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

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    showUploadList: false,
    beforeUpload: (file) => {
      const isImage = file.type.startsWith('image/')
      if (!isImage) {
        message.error('只能上传图片文件!')
        return false
      }
      const isLt2M = file.size / 1024 / 1024 < 2
      if (!isLt2M) {
        message.error('图片大小不能超过 2MB!')
        return false
      }
      const reader = new FileReader()
      reader.onload = (e) => {
        setRewardImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      return false
    },
  }

  const columns: ColumnsType<ExchangeRule> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: '礼品图片',
      dataIndex: 'rewardImage',
      key: 'rewardImage',
      width: 80,
      render: (image) =>
        image ? (
          <Image width={50} height={50} src={image} style={{ borderRadius: 4, objectFit: 'cover' }} />
        ) : (
          <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
            <InboxOutlined className="text-gray-400" />
          </div>
        ),
    },
    {
      title: '礼品名称',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: '兑换内容',
      dataIndex: 'reward',
      key: 'reward',
      ellipsis: true,
    },
    {
      title: '所需积分',
      dataIndex: 'pointsRequired',
      key: 'pointsRequired',
      sorter: (a, b) => a.pointsRequired - b.pointsRequired,
      render: (text) => <span className="text-orange-500 font-bold">{text}</span>,
    },
    {
      title: '库存',
      dataIndex: 'stock',
      key: 'stock',
      sorter: (a, b) => a.stock - b.stock,
      render: (stock) => (
        <div className="flex items-center gap-2">
          <Progress
            percent={Math.min((stock / 200) * 100, 100)}
            size="small"
            showInfo={false}
            status={stock === 0 ? 'exception' : stock < 20 ? 'normal' : 'success'}
          />
          <span className={stock === 0 ? 'text-red-500' : stock < 20 ? 'text-orange-500' : ''}>
            {stock}
          </span>
        </div>
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
          checkedChildren="启用"
          unCheckedChildren="禁用"
          onChange={(checked) => handleToggleStatus(record, checked)}
          disabled={record.stock === 0}
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
            title="确定删除该兑换规则？"
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
  const totalStock = rules.reduce((sum, r) => sum + r.stock, 0)
  const avgPoints = rules.length > 0 ? Math.round(rules.reduce((sum, r) => sum + r.pointsRequired, 0) / rules.length) : 0

  const pointsDistribution = {
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: activeRules.map((r) => r.name),
      axisLabel: { rotate: 30, interval: 0 },
    },
    yAxis: { type: 'value', name: '积分' },
    series: [
      {
        data: activeRules.map((r) => r.pointsRequired),
        type: 'bar',
        itemStyle: {
          color: '#1890ff',
          borderRadius: [4, 4, 0, 0],
        },
      },
    ],
  }

  const stockChart = {
    tooltip: { trigger: 'item' },
    legend: { bottom: '0%' },
    series: [
      {
        name: '库存分布',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
        data: activeRules
          .filter((r) => r.stock > 0)
          .map((r) => ({ name: r.name, value: r.stock })),
      },
    ],
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">兑换规则管理</h2>
        <p className="text-gray-500">管理积分商城的礼品和兑换规则</p>
      </div>

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="礼品总数"
              value={rules.length}
              prefix={<ShopOutlined className="text-blue-500" />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="可兑换礼品"
              value={activeRules.length}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总库存"
              value={totalStock}
              suffix="件"
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="平均兑换积分"
              value={avgPoints}
              suffix="分"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} lg={12}>
          <Card title="礼品积分要求" size="small">
            <ReactECharts option={pointsDistribution} style={{ height: 250 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="库存分布" size="small">
            <ReactECharts option={stockChart} style={{ height: 250 }} />
          </Card>
        </Col>
      </Row>

      <Card className="mb-6">
        <div className="flex flex-wrap gap-4 items-end justify-between">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm text-gray-600 mb-1">搜索礼品</label>
              <Input
                placeholder="输入礼品名称或描述"
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
                <Option value={true}>可兑换</Option>
                <Option value={false}>已下架</Option>
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
            新增礼品
          </Button>
        </div>
      </Card>

      <Card>
        {rules.length > 0 ? (
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
        ) : (
          <Empty description="暂无兑换规则" />
        )}
      </Card>

      <Modal
        title={editingRule ? '编辑兑换规则' : '新增兑换规则'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                name="name"
                label="礼品名称"
                rules={[
                  { required: true, message: '请输入礼品名称' },
                  { max: 50, message: '礼品名称不能超过50个字符' },
                ]}
              >
                <Input placeholder="请输入礼品名称" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="pointsRequired"
                label="所需积分"
                rules={[
                  { required: true, message: '请输入所需积分' },
                  { type: 'number', min: 1, message: '积分至少为1' },
                ]}
              >
                <InputNumber style={{ width: '100%' }} min={1} placeholder="请输入积分" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="description"
            label="礼品描述"
            rules={[
              { required: true, message: '请输入礼品描述' },
              { max: 200, message: '描述不能超过200个字符' },
            ]}
          >
            <TextArea rows={3} placeholder="请输入礼品详细描述" />
          </Form.Item>
          <Form.Item
            name="reward"
            label="兑换内容"
            rules={[
              { required: true, message: '请输入兑换内容' },
              { max: 100, message: '兑换内容不能超过100个字符' },
            ]}
          >
            <Input placeholder="如：精美笔记本 x1" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="stock"
                label="库存数量"
                rules={[
                  { required: true, message: '请输入库存数量' },
                  { type: 'number', min: 0, message: '库存不能为负数' },
                ]}
              >
                <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入库存" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="isActive" label="是否上架" valuePropName="checked">
                <Switch checkedChildren="上架" unCheckedChildren="下架" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="礼品图片">
            <div className="flex items-start gap-4">
              {rewardImage ? (
                <div className="relative">
                  <Image width={120} height={120} src={rewardImage} style={{ borderRadius: 8, objectFit: 'cover' }} />
                  <Button
                    type="text"
                    danger
                    size="small"
                    className="absolute -top-2 -right-2"
                    onClick={() => setRewardImage(null)}
                  >
                    <DeleteOutlined />
                  </Button>
                </div>
              ) : (
                <Dragger {...uploadProps} style={{ width: 120, height: 120, padding: 0 }}>
                  <p className="text-2xl text-gray-400">
                    <UploadOutlined />
                  </p>
                  <p className="text-xs text-gray-400">点击上传图片</p>
                </Dragger>
              )}
              <div className="text-xs text-gray-500 mt-2">
                <p>• 支持 JPG、PNG、GIF 格式</p>
                <p>• 图片大小不超过 2MB</p>
                <p>• 建议尺寸 300x300 像素</p>
              </div>
            </div>
          </Form.Item>
          <Form.Item className="mb-0">
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

export default ExchangeRules
