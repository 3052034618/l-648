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
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  ToolOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { TablePaginationConfig } from 'antd/es/table'
import { skillApi } from '../../services/api'
import type { Skill, PaginationResult } from '../../types'

const { Option } = Select
const { TextArea } = Input

const SkillManagement: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [skills, setSkills] = useState<Skill[]>([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [modalVisible, setModalVisible] = useState(false)
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null)
  const [searchText, setSearchText] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [form] = Form.useForm()

  const skillCategories = [
    '医疗护理',
    '教育辅导',
    '社区服务',
    '环境保护',
    '文化艺术',
    '体育健身',
    '科技服务',
    '法律援助',
    '心理咨询',
    '其他',
  ]

  const fetchSkills = async (page = 1, pageSize = 10, category?: string, search?: string) => {
    setLoading(true)
    try {
      const response: PaginationResult<Skill> = await skillApi.getSkills({
        page,
        pageSize,
        ...(category && { category }),
      })
      let filteredItems = response.items
      if (search) {
        filteredItems = filteredItems.filter(
          (item) =>
            item.name.toLowerCase().includes(search.toLowerCase()) ||
            item.description?.toLowerCase().includes(search.toLowerCase())
        )
      }
      setSkills(filteredItems)
      setPagination({
        current: response.page,
        pageSize: response.pageSize,
        total: search ? filteredItems.length : response.total,
      })
    } catch (error) {
      message.error('获取技能列表失败')
      const mockSkills: Skill[] = Array.from({ length: 15 }, (_, i) => ({
        id: i + 1,
        name: ['急救技能', '手语基础', '心理疏导', '老年护理', '儿童辅导'][i % 5] + (i + 1),
        category: skillCategories[i % skillCategories.length],
        description: `这是${skillCategories[i % skillCategories.length]}领域的专业技能，需要经过专业培训和考核。`,
        createdAt: new Date(Date.now() - i * 86400000).toISOString(),
      }))
      let filteredItems = mockSkills
      if (search) {
        filteredItems = mockSkills.filter(
          (item) =>
            item.name.toLowerCase().includes(search.toLowerCase()) ||
            item.description?.toLowerCase().includes(search.toLowerCase())
        )
      }
      if (category) {
        filteredItems = filteredItems.filter((item) => item.category === category)
      }
      setSkills(filteredItems.slice((page - 1) * pageSize, page * pageSize))
      setPagination({ current: page, pageSize, total: filteredItems.length })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSkills()
  }, [])

  const handleTableChange = (pag: TablePaginationConfig) => {
    fetchSkills(
      pag.current || 1,
      pag.pageSize || 10,
      categoryFilter || undefined,
      searchText || undefined
    )
  }

  const handleAdd = () => {
    setEditingSkill(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (skill: Skill) => {
    setEditingSkill(skill)
    form.setFieldsValue({
      name: skill.name,
      category: skill.category,
      description: skill.description,
    })
    setModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await skillApi.deleteSkill(id)
      message.success('删除成功')
      fetchSkills(pagination.current, pagination.pageSize, categoryFilter || undefined, searchText || undefined)
    } catch (error) {
      message.error('删除失败，使用模拟数据')
      setSkills(skills.filter((s) => s.id !== id))
      setPagination({ ...pagination, total: pagination.total - 1 })
      message.success('删除成功（模拟）')
    }
  }

  const handleSubmit = async (values: any) => {
    try {
      if (editingSkill) {
        await skillApi.updateSkill(editingSkill.id, values)
        message.success('更新成功')
      } else {
        await skillApi.createSkill(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      fetchSkills(pagination.current, pagination.pageSize, categoryFilter || undefined, searchText || undefined)
    } catch (error) {
      message.error('操作失败，使用模拟数据')
      if (editingSkill) {
        setSkills(skills.map((s) => (s.id === editingSkill.id ? { ...s, ...values } : s)))
      } else {
        const newSkill: Skill = {
          id: Math.max(...skills.map((s) => s.id), 0) + 1,
          ...values,
          createdAt: new Date().toISOString(),
        }
        setSkills([newSkill, ...skills])
        setPagination({ ...pagination, total: pagination.total + 1 })
      }
      setModalVisible(false)
      message.success(editingSkill ? '更新成功（模拟）' : '创建成功（模拟）')
    }
  }

  const handleSearch = () => {
    fetchSkills(1, pagination.pageSize, categoryFilter || undefined, searchText || undefined)
  }

  const handleReset = () => {
    setSearchText('')
    setCategoryFilter(null)
    fetchSkills(1, pagination.pageSize)
  }

  const columns: ColumnsType<Skill> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: '技能名称',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: '技能分类',
      dataIndex: 'category',
      key: 'category',
      filters: skillCategories.map((cat) => ({ text: cat, value: cat })),
      onFilter: (value, record) => record.category === value,
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
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
      width: 160,
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除该技能？" onConfirm={() => handleDelete(record.id)} okText="确定" cancelText="取消">
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const categoryStats = skillCategories.reduce((acc, cat) => {
    acc[cat] = skills.filter((s) => s.category === cat).length
    return acc
  }, {} as Record<string, number>)

  const topCategories = Object.entries(categoryStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">技能管理</h2>
        <p className="text-gray-500">管理系统中的所有技能类型和分类</p>
      </div>

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="技能总数"
              value={pagination.total}
              prefix={<ToolOutlined className="text-blue-500" />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        {topCategories.map(([cat, count], index) => (
          <Col xs={24} sm={12} md={8} lg={6} key={cat}>
            <Card>
              <Statistic
                title={`${cat}技能`}
                value={count}
                valueStyle={{ color: ['#52c41a', '#faad14', '#722ed1'][index] }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Card className="mb-6">
        <div className="flex flex-wrap gap-4 items-end justify-between">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm text-gray-600 mb-1">搜索技能</label>
              <Input
                placeholder="输入技能名称或描述"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onPressEnter={handleSearch}
                style={{ width: 250 }}
                allowClear
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">技能分类</label>
              <Select
                placeholder="选择分类"
                value={categoryFilter}
                onChange={(value) => setCategoryFilter(value)}
                style={{ width: 200 }}
                allowClear
              >
                {skillCategories.map((cat) => (
                  <Option key={cat} value={cat}>
                    {cat}
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
            新增技能
          </Button>
        </div>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={skills}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 800 }}
        />
      </Card>

      <Modal
        title={editingSkill ? '编辑技能' : '新增技能'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="技能名称"
            rules={[
              { required: true, message: '请输入技能名称' },
              { max: 50, message: '技能名称不能超过50个字符' },
            ]}
          >
            <Input placeholder="请输入技能名称" />
          </Form.Item>
          <Form.Item
            name="category"
            label="技能分类"
            rules={[{ required: true, message: '请选择技能分类' }]}
          >
            <Select placeholder="请选择技能分类">
              {skillCategories.map((cat) => (
                <Option key={cat} value={cat}>
                  {cat}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="description"
            label="技能描述"
            rules={[{ max: 500, message: '描述不能超过500个字符' }]}
          >
            <TextArea rows={4} placeholder="请输入技能描述" />
          </Form.Item>
          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                {editingSkill ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default SkillManagement
