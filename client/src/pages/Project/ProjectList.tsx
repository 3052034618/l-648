import React, { useEffect, useState } from 'react'
import {
  Row,
  Col,
  Card,
  Input,
  Select,
  Button,
  Tag,
  Space,
  Typography,
  Spin,
  Pagination,
  Empty,
  Badge
} from 'antd'
import {
  SearchOutlined,
  FilterOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  StarOutlined,
  ArrowRightOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { projectApi } from '../../api'
import type { Project, ProjectLevel, ProjectStatus } from '../../types'

const { Title, Text } = Typography
const { Search } = Input
const { Option } = Select

const statusColors: Record<ProjectStatus, string> = {
  DRAFT: 'default',
  PUBLISHED: 'blue',
  ONGOING: 'processing',
  COMPLETED: 'success',
  CANCELLED: 'error'
}

const statusText: Record<ProjectStatus, string> = {
  DRAFT: '草稿',
  PUBLISHED: '已发布',
  ONGOING: '进行中',
  COMPLETED: '已完成',
  CANCELLED: '已取消'
}

const levelColors: Record<ProjectLevel, string> = {
  BASIC: 'green',
  INTERMEDIATE: 'orange',
  ADVANCED: 'red'
}

const levelText: Record<ProjectLevel, string> = {
  BASIC: '初级',
  INTERMEDIATE: '中级',
  ADVANCED: '高级'
}

const ProjectList: React.FC = () => {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<string | undefined>()
  const [category, setCategory] = useState<string | undefined>()
  const [level, setLevel] = useState<string | undefined>()
  const [page, setPage] = useState(1)
  const [pageSize] = useState(8)
  const [total, setTotal] = useState(0)
  const [categories, setCategories] = useState<string[]>([])

  useEffect(() => {
    fetchProjects()
  }, [page, status, category, level, keyword])

  const fetchProjects = async () => {
    setLoading(true)
    try {
      const params = {
        page,
        pageSize,
        status,
        category
      }
      const result = await projectApi.getProjects(params)
      let filteredItems = result.items
      if (keyword) {
        filteredItems = filteredItems.filter(
          (p) =>
            p.title.toLowerCase().includes(keyword.toLowerCase()) ||
            p.description.toLowerCase().includes(keyword.toLowerCase()) ||
            p.location.toLowerCase().includes(keyword.toLowerCase())
        )
      }
      if (level) {
        filteredItems = filteredItems.filter((p) => p.level === level)
      }
      setProjects(filteredItems)
      setTotal(result.total)
      const cats = [...new Set(result.items.map((p) => p.category))]
      setCategories(cats)
    } catch (error) {
      console.error('Failed to fetch projects:', error)
      setProjects([
        {
          id: 1,
          title: '社区环保志愿活动',
          description: '参与社区垃圾分类、绿化植树等环保志愿活动，为美化社区环境贡献力量。',
          category: '环保',
          level: 'BASIC',
          status: 'ONGOING',
          location: '北京市朝阳区',
          startDate: '2024-01-15',
          endDate: '2024-06-30',
          maxParticipants: 50,
          minParticipants: 10,
          pointsPerHour: 10,
          projectManagerId: 1,
          projectManager: {
            id: 1,
            userId: 1,
            organization: '社区志愿者协会',
            position: '项目主管',
            user: {
              id: 1,
              username: 'manager1',
              email: 'manager@example.com',
              realName: '张三',
              phone: '13800138000',
              role: 'PROJECT_MANAGER',
              creditScore: 100,
              totalPoints: 0,
              totalServiceHours: 0,
              createdAt: '2024-01-01',
              updatedAt: '2024-01-01'
            },
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01'
          },
          requiredSkills: [],
          requiredTrainingIds: [],
          schedules: [],
          applications: [],
          createdAt: '2024-01-10',
          updatedAt: '2024-01-10'
        },
        {
          id: 2,
          title: '图书馆志愿服务',
          description: '协助图书馆整理书籍、引导读者、开展阅读推广活动，传播知识文化。',
          category: '教育',
          level: 'BASIC',
          status: 'PUBLISHED',
          location: '北京市海淀区',
          startDate: '2024-02-01',
          endDate: '2024-12-31',
          maxParticipants: 30,
          minParticipants: 5,
          pointsPerHour: 8,
          projectManagerId: 2,
          projectManager: {
            id: 2,
            userId: 2,
            organization: '市图书馆',
            position: '活动 coordinator',
            user: {
              id: 2,
              username: 'manager2',
              email: 'manager2@example.com',
              realName: '李四',
              phone: '13900139000',
              role: 'PROJECT_MANAGER',
              creditScore: 100,
              totalPoints: 0,
              totalServiceHours: 0,
              createdAt: '2024-01-01',
              updatedAt: '2024-01-01'
            },
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01'
          },
          requiredSkills: [],
          requiredTrainingIds: [],
          schedules: [],
          applications: [],
          createdAt: '2024-01-15',
          updatedAt: '2024-01-15'
        },
        {
          id: 3,
          title: '养老院关爱活动',
          description: '探访养老院老人，陪伴聊天、表演节目、协助生活照料，传递温暖与关爱。',
          category: '社区服务',
          level: 'INTERMEDIATE',
          status: 'ONGOING',
          location: '北京市西城区',
          startDate: '2024-01-20',
          endDate: '2024-08-31',
          maxParticipants: 40,
          minParticipants: 8,
          pointsPerHour: 12,
          projectManagerId: 3,
          projectManager: {
            id: 3,
            userId: 3,
            organization: '夕阳红公益组织',
            position: '项目负责人',
            user: {
              id: 3,
              username: 'manager3',
              email: 'manager3@example.com',
              realName: '王五',
              phone: '13700137000',
              role: 'PROJECT_MANAGER',
              creditScore: 100,
              totalPoints: 0,
              totalServiceHours: 0,
              createdAt: '2024-01-01',
              updatedAt: '2024-01-01'
            },
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01'
          },
          requiredSkills: [],
          requiredTrainingIds: [],
          schedules: [],
          applications: [],
          createdAt: '2024-01-12',
          updatedAt: '2024-01-12'
        },
        {
          id: 4,
          title: '医疗义诊辅助',
          description: '协助专业医疗团队开展义诊活动，负责导诊、登记、维持秩序等工作。',
          category: '医疗',
          level: 'ADVANCED',
          status: 'PUBLISHED',
          location: '北京市丰台区',
          startDate: '2024-03-01',
          endDate: '2024-09-30',
          maxParticipants: 25,
          minParticipants: 10,
          pointsPerHour: 15,
          projectManagerId: 4,
          projectManager: {
            id: 4,
            userId: 4,
            organization: '仁爱医疗基金会',
            position: '医务社工',
            user: {
              id: 4,
              username: 'manager4',
              email: 'manager4@example.com',
              realName: '赵六',
              phone: '13600136000',
              role: 'PROJECT_MANAGER',
              creditScore: 100,
              totalPoints: 0,
              totalServiceHours: 0,
              createdAt: '2024-01-01',
              updatedAt: '2024-01-01'
            },
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01'
          },
          requiredSkills: [],
          requiredTrainingIds: [],
          schedules: [],
          applications: [],
          createdAt: '2024-02-01',
          updatedAt: '2024-02-01'
        }
      ])
      setTotal(4)
      setCategories(['环保', '教育', '社区服务', '医疗'])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setKeyword(value)
    setPage(1)
  }

  const handleReset = () => {
    setKeyword('')
    setStatus(undefined)
    setCategory(undefined)
    setLevel(undefined)
    setPage(1)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ marginBottom: 8 }}>
          项目列表
        </Title>
        <Text type="secondary">浏览并申请感兴趣的志愿项目</Text>
      </div>

      <Card
        style={{
          marginBottom: 24,
          borderRadius: 12,
          border: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="搜索项目名称、描述或地点"
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              onSearch={handleSearch}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </Col>
          <Col xs={24} sm={8} md={5}>
            <Select
              placeholder="选择状态"
              allowClear
              style={{ width: '100%' }}
              size="large"
              value={status}
              onChange={(value) => {
                setStatus(value)
                setPage(1)
              }}
            >
              <Option value="PUBLISHED">已发布</Option>
              <Option value="ONGOING">进行中</Option>
              <Option value="COMPLETED">已完成</Option>
            </Select>
          </Col>
          <Col xs={24} sm={8} md={5}>
            <Select
              placeholder="选择分类"
              allowClear
              style={{ width: '100%' }}
              size="large"
              value={category}
              onChange={(value) => {
                setCategory(value)
                setPage(1)
              }}
            >
              {categories.map((cat) => (
                <Option key={cat} value={cat}>
                  {cat}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={8} md={5}>
            <Select
              placeholder="选择难度"
              allowClear
              style={{ width: '100%' }}
              size="large"
              value={level}
              onChange={(value) => {
                setLevel(value)
                setPage(1)
              }}
            >
              <Option value="BASIC">初级</Option>
              <Option value="INTERMEDIATE">中级</Option>
              <Option value="ADVANCED">高级</Option>
            </Select>
          </Col>
          <Col xs={24} sm={24} md={1}>
            <Button
              icon={<FilterOutlined />}
              size="large"
              onClick={handleReset}
              style={{ width: '100%' }}
            >
              重置
            </Button>
          </Col>
        </Row>
      </Card>

      {projects.length === 0 ? (
        <Empty description="暂无项目" />
      ) : (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            {projects.map((project) => (
              <Col xs={24} sm={12} lg={8} key={project.id}>
                <Card
                  hoverable
                  style={{
                    borderRadius: 12,
                    border: 'none',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    transition: 'all 0.3s'
                  }}
                  bodyStyle={{ padding: 0 }}
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <div
                    style={{
                      height: 160,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: '12px 12px 0 0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: 48
                    }}
                  >
                    <StarOutlined />
                  </div>
                  <div style={{ padding: 20 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: 12
                      }}
                    >
                      <Tag color={statusColors[project.status]}>{statusText[project.status]}</Tag>
                      <Tag color={levelColors[project.level]}>{levelText[project.level]}</Tag>
                    </div>
                    <Title level={5} style={{ marginBottom: 8, fontSize: 16 }} ellipsis>
                      {project.title}
                    </Title>
                    <Text
                      type="secondary"
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        marginBottom: 12
                      }}
                    >
                      {project.description}
                    </Text>
                    <Space direction="vertical" size={8} style={{ width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <EnvironmentOutlined style={{ color: '#999' }} />
                        <Text type="secondary" style={{ fontSize: 13 }}>
                          {project.location}
                        </Text>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <ClockCircleOutlined style={{ color: '#999' }} />
                        <Text type="secondary" style={{ fontSize: 13 }}>
                          {dayjs(project.startDate).format('YYYY-MM-DD')} ~{' '}
                          {dayjs(project.endDate).format('YYYY-MM-DD')}
                        </Text>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <TeamOutlined style={{ color: '#999' }} />
                        <Text type="secondary" style={{ fontSize: 13 }}>
                          {project.applications?.length || 0}/{project.maxParticipants} 人报名
                        </Text>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginTop: 8
                        }}
                      >
                        <Badge
                          count={`${project.pointsPerHour} 积分/小时`}
                          style={{ backgroundColor: '#52c41a' }}
                        />
                        <Button type="link" style={{ padding: 0 }} icon={<ArrowRightOutlined />}>
                          查看详情
                        </Button>
                      </div>
                    </Space>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Pagination
              current={page}
              pageSize={pageSize}
              total={total}
              onChange={setPage}
              showSizeChanger={false}
            />
          </div>
        </>
      )}
    </div>
  )
}

export default ProjectList
