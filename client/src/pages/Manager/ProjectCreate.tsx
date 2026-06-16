import React, { useEffect, useState } from 'react'
import {
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Button,
  Card,
  Typography,
  Row,
  Col,
  Space,
  message,
  Steps,
  Upload,
  Divider,
  Alert,
  Tag,
} from 'antd'
import {
  ArrowLeftOutlined,
  SaveOutlined,
  PlusOutlined,
  DeleteOutlined,
  UploadOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import type { UploadProps } from 'antd'
import dayjs from 'dayjs'
import { projectApi, skillApi, trainingApi } from '../../services/api'
import type {
  ProjectCreateData,
  Skill,
  Training,
  Project,
} from '../../types'

const { Title, Text } = Typography
const { Option } = Select
const { TextArea } = Input

interface FormData extends ProjectCreateData {
  coverImage?: string
}

const ProjectCreate: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [form] = Form.useForm<FormData>()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [skills, setSkills] = useState<Skill[]>([])
  const [trainings, setTrainings] = useState<Training[]>([])
  const [isEdit, setIsEdit] = useState(false)
  const [_project, setProject] = useState<Project | null>(null)

  const steps = [
    {
      title: '基本信息',
      description: '填写项目基本资料',
    },
    {
      title: '技能要求',
      description: '设置所需技能',
    },
    {
      title: '培训要求',
      description: '关联培训课程',
    },
    {
      title: '确认发布',
      description: '预览并发布项目',
    },
  ]

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [skillsRes, trainingsRes] = await Promise.all([
          skillApi.getSkills({ page: 1, pageSize: 100 }),
          trainingApi.getTrainings({ page: 1, pageSize: 100 }),
        ])
        setSkills(skillsRes.items)
        setTrainings(trainingsRes.items)

        if (id) {
          setIsEdit(true)
          const projectData = await projectApi.getProjectById(Number(id))
          setProject(projectData)
          form.setFieldsValue({
            title: projectData.title,
            description: projectData.description,
            category: projectData.category,
            level: projectData.level,
            location: projectData.location,
            latitude: projectData.latitude,
            longitude: projectData.longitude,
            startDate: projectData.startDate,
            endDate: projectData.endDate,
            maxParticipants: projectData.maxParticipants,
            minParticipants: projectData.minParticipants,
            pointsPerHour: projectData.pointsPerHour,
            requiredTrainingIds: projectData.requiredTrainingIds,
            requiredSkills: projectData.requiredSkills.map((rs) => ({
              skillId: rs.skillId,
              minProficiency: rs.minProficiency,
              requiredCount: rs.requiredCount,
            })),
            coverImage: projectData.coverImage,
          })
        }
      } catch (error) {
        message.error('获取数据失败')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id, form])

  const uploadProps: UploadProps = {
    name: 'file',
    action: '/api/upload',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
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
      return true
    },
    onChange(info) {
      if (info.file.status === 'done') {
        form.setFieldsValue({ coverImage: info.file.response.data.url })
        message.success('上传成功')
      } else if (info.file.status === 'error') {
        message.error('上传失败')
      }
    },
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      const formattedValues: ProjectCreateData = {
        ...values,
        startDate: dayjs(values.startDate).format('YYYY-MM-DD'),
        endDate: dayjs(values.endDate).format('YYYY-MM-DD'),
      }

      if (isEdit && id) {
        await projectApi.updateProject(Number(id), formattedValues)
        message.success('项目更新成功')
      } else {
        await projectApi.createProject(formattedValues)
        message.success('项目创建成功')
      }
      navigate('/manager/projects')
    } catch (error) {
      message.error(isEdit ? '更新失败' : '创建失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleNext = async () => {
    try {
      const fieldsToValidate =
        currentStep === 0
          ? ['title', 'description', 'category', 'level', 'location', 'startDate', 'endDate', 'maxParticipants', 'minParticipants', 'pointsPerHour']
          : currentStep === 1
          ? ['requiredSkills']
          : []
      await form.validateFields(fieldsToValidate)
      setCurrentStep(currentStep + 1)
    } catch {
      message.warning('请完成当前步骤的必填项')
    }
  }

  const handlePrev = () => {
    setCurrentStep(currentStep - 1)
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Row gutter={24}>
            <Col span={24}>
              <Card
                style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                bodyStyle={{ padding: 24 }}
              >
                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item
                      name="coverImage"
                      label="项目封面"
                      extra="建议尺寸: 800x400px, 不超过2MB"
                    >
                      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                        <div
                          style={{
                            width: 200,
                            height: 100,
                            borderRadius: 8,
                            border: '2px dashed #d9d9d9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            background: form.getFieldValue('coverImage') ? 'transparent' : '#fafafa',
                          }}
                        >
                          {form.getFieldValue('coverImage') ? (
                            <img
                              src={form.getFieldValue('coverImage')}
                              alt="封面"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <Text type="secondary">暂无封面</Text>
                          )}
                        </div>
                        <Upload {...uploadProps}>
                          <Button icon={<UploadOutlined />}>上传封面</Button>
                        </Upload>
                      </div>
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item
                      name="title"
                      label="项目名称"
                      rules={[
                        { required: true, message: '请输入项目名称' },
                        { min: 5, max: 100, message: '项目名称长度在5-100个字符之间' },
                      ]}
                    >
                      <Input placeholder="请输入项目名称" maxLength={100} showCount />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item
                      name="description"
                      label="项目描述"
                      rules={[
                        { required: true, message: '请输入项目描述' },
                        { min: 20, max: 1000, message: '项目描述长度在20-1000个字符之间' },
                      ]}
                    >
                      <TextArea
                        rows={6}
                        placeholder="请详细描述项目内容、目标和意义..."
                        maxLength={1000}
                        showCount
                      />
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
                        <Option value="BASIC">初级 - 适合新手</Option>
                        <Option value="INTERMEDIATE">中级 - 需要一定经验</Option>
                        <Option value="ADVANCED">高级 - 需要丰富经验</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="pointsPerHour"
                      label="每小时积分"
                      rules={[
                        { required: true, message: '请输入每小时积分' },
                        { type: 'number', min: 1, max: 100, message: '积分范围1-100' },
                      ]}
                    >
                      <InputNumber
                        min={1}
                        max={100}
                        style={{ width: '100%' }}
                        placeholder="每小时积分"
                        addonAfter="分/小时"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={16}>
                    <Form.Item
                      name="location"
                      label="服务地点"
                      rules={[{ required: true, message: '请输入服务地点' }]}
                    >
                      <Input placeholder="请输入详细服务地点" />
                    </Form.Item>
                  </Col>
                  <Col span={4}>
                    <Form.Item
                      name="latitude"
                      label="纬度"
                      rules={[{ type: 'number', min: -90, max: 90, message: '纬度范围-90到90' }]}
                    >
                      <InputNumber style={{ width: '100%' }} placeholder="纬度" precision={6} />
                    </Form.Item>
                  </Col>
                  <Col span={4}>
                    <Form.Item
                      name="longitude"
                      label="经度"
                      rules={[{ type: 'number', min: -180, max: 180, message: '经度范围-180到180' }]}
                    >
                      <InputNumber style={{ width: '100%' }} placeholder="经度" precision={6} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="startDate"
                      label="开始日期"
                      rules={[{ required: true, message: '请选择开始日期' }]}
                    >
                      <DatePicker style={{ width: '100%' }} placeholder="选择开始日期" minDate={dayjs()} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="endDate"
                      label="结束日期"
                      rules={[
                        { required: true, message: '请选择结束日期' },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (!value || !getFieldValue('startDate') || dayjs(value).isAfter(getFieldValue('startDate'))) {
                              return Promise.resolve()
                            }
                            return Promise.reject(new Error('结束日期必须晚于开始日期'))
                          },
                        }),
                      ]}
                    >
                      <DatePicker style={{ width: '100%' }} placeholder="选择结束日期" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="项目周期">
                      <Text type="secondary">
                        {form.getFieldValue('startDate') && form.getFieldValue('endDate')
                          ? `${dayjs(form.getFieldValue('endDate')).diff(dayjs(form.getFieldValue('startDate')), 'day') + 1} 天`
                          : '请选择日期范围'}
                      </Text>
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="minParticipants"
                      label="最少参与人数"
                      rules={[
                        { required: true, message: '请输入最少参与人数' },
                        { type: 'number', min: 1, message: '最少1人' },
                      ]}
                    >
                      <InputNumber min={1} style={{ width: '100%' }} placeholder="最少人数" addonAfter="人" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="maxParticipants"
                      label="最大参与人数"
                      rules={[
                        { required: true, message: '请输入最大参与人数' },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (!value || !getFieldValue('minParticipants') || value > getFieldValue('minParticipants')) {
                              return Promise.resolve()
                            }
                            return Promise.reject(new Error('最大人数必须大于最少人数'))
                          },
                        }),
                      ]}
                    >
                      <InputNumber min={1} style={{ width: '100%' }} placeholder="最大人数" addonAfter="人" />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        )

      case 1:
        return (
          <Card
            style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
            bodyStyle={{ padding: 24 }}
          >
            <Alert
              message="技能要求说明"
              description="添加项目所需的技能及熟练度要求，系统会根据这些条件匹配合适的志愿者。"
              type="info"
              showIcon
              icon={<InfoCircleOutlined />}
              style={{ marginBottom: 24 }}
            />
            <Form.Item
              name="requiredSkills"
              label="所需技能列表"
              rules={[
                { required: true, message: '请至少添加一项技能要求' },
                {
                  validator: (_, value) => {
                    if (!value || value.length === 0) {
                      return Promise.reject(new Error('请至少添加一项技能要求'))
                    }
                    const skillIds = value.map((v: { skillId: number }) => v.skillId)
                    if (new Set(skillIds).size !== skillIds.length) {
                      return Promise.reject(new Error('不能重复添加相同技能'))
                    }
                    return Promise.resolve()
                  },
                },
              ]}
            >
              <Form.List name="requiredSkills">
                {(fields, { add, remove }) => (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {fields.map(({ key, name, ...restField }) => (
                      <Card
                        key={key}
                        size="small"
                        style={{
                          borderRadius: 8,
                          border: '1px solid #f0f0f0',
                        }}
                        bodyStyle={{ padding: 16 }}
                      >
                        <Space align="center" size={16} wrap>
                          <Form.Item
                            {...restField}
                            name={[name, 'skillId']}
                            rules={[{ required: true, message: '请选择技能' }]}
                            style={{ marginBottom: 0, minWidth: 200 }}
                          >
                            <Select placeholder="选择技能" style={{ width: 200 }} showSearch optionFilterProp="children">
                              {skills.map((skill) => (
                                <Option key={skill.id} value={skill.id}>
                                  <Space>
                                    <Text>{skill.name}</Text>
                                    <Tag color="blue">{skill.category}</Tag>
                                  </Space>
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>
                          <Form.Item
                            {...restField}
                            name={[name, 'minProficiency']}
                            rules={[
                              { required: true, message: '请输入熟练度' },
                              { type: 'number', min: 1, max: 10, message: '熟练度范围1-10' },
                            ]}
                            style={{ marginBottom: 0 }}
                          >
                            <InputNumber
                              min={1}
                              max={10}
                              placeholder="熟练度"
                              style={{ width: 120 }}
                              addonAfter="/10"
                            />
                          </Form.Item>
                          <Form.Item
                            {...restField}
                            name={[name, 'requiredCount']}
                            rules={[
                              { required: true, message: '请输入人数' },
                              { type: 'number', min: 1, message: '最少1人' },
                            ]}
                            style={{ marginBottom: 0 }}
                          >
                            <InputNumber
                              min={1}
                              placeholder="人数"
                              style={{ width: 120 }}
                              addonAfter="人"
                            />
                          </Form.Item>
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => remove(name)}
                          >
                            删除
                          </Button>
                        </Space>
                      </Card>
                    ))}
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      block
                      icon={<PlusOutlined />}
                      style={{ height: 48, borderRadius: 8 }}
                    >
                      添加技能要求
                    </Button>
                  </div>
                )}
              </Form.List>
            </Form.Item>
          </Card>
        )

      case 2:
        return (
          <Card
            style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
            bodyStyle={{ padding: 24 }}
          >
            <Alert
              message="培训要求说明"
              description="选择志愿者必须完成的培训课程，只有完成相关培训的志愿者才能申请本项目。"
              type="info"
              showIcon
              icon={<InfoCircleOutlined />}
              style={{ marginBottom: 24 }}
            />
            <Form.Item name="requiredTrainingIds" label="必填培训课程">
              <Select
                mode="multiple"
                placeholder="选择所需培训课程（可选）"
                style={{ width: '100%' }}
                showSearch
                optionFilterProp="children"
                maxTagCount="responsive"
              >
                {trainings.map((training) => (
                  <Option key={training.id} value={training.id}>
                    <Space>
                      <Text strong>{training.title}</Text>
                      <Tag color="blue">{training.category}</Tag>
                      <Tag color="orange">{training.durationMinutes}分钟</Tag>
                    </Space>
                  </Option>
                ))}
              </Select>
            </Form.Item>
            {form.getFieldValue('requiredTrainingIds')?.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Text type="secondary">
                  已选择 {form.getFieldValue('requiredTrainingIds').length} 门培训课程
                </Text>
              </div>
            )}
          </Card>
        )

      case 3:
        const formData = form.getFieldsValue()
        return (
          <Card
            style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
            bodyStyle={{ padding: 24 }}
          >
            <Title level={5} style={{ marginBottom: 16 }}>
              项目信息预览
            </Title>
            <Divider />
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Space align="center" size={16}>
                  <div
                    style={{
                      width: 120,
                      height: 60,
                      borderRadius: 8,
                      overflow: 'hidden',
                      background: '#fafafa',
                      border: '1px solid #f0f0f0',
                    }}
                  >
                    {formData.coverImage ? (
                      <img
                        src={formData.coverImage}
                        alt="封面"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          无封面
                        </Text>
                      </div>
                    )}
                  </div>
                  <div>
                    <Text strong style={{ fontSize: 18 }}>
                      {formData.title}
                    </Text>
                    <div style={{ marginTop: 4 }}>
                      <Tag color="blue">{formData.category}</Tag>
                      <Tag color={formData.level === 'BASIC' ? 'green' : formData.level === 'INTERMEDIATE' ? 'orange' : 'red'}>
                        {formData.level === 'BASIC' ? '初级' : formData.level === 'INTERMEDIATE' ? '中级' : '高级'}
                      </Tag>
                      <Tag color="purple">{formData.pointsPerHour}分/小时</Tag>
                    </div>
                  </div>
                </Space>
              </Col>
              <Col span={24}>
                <Card size="small" style={{ background: '#fafafa', border: 'none' }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    项目描述
                  </Text>
                  <div style={{ marginTop: 4 }}>{formData.description}</div>
                </Card>
              </Col>
              <Col span={12}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  服务地点
                </Text>
                <div style={{ marginTop: 4 }}>{formData.location || '-'}</div>
              </Col>
              <Col span={12}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  项目周期
                </Text>
                <div style={{ marginTop: 4 }}>
                  {formData.startDate && formData.endDate
                    ? `${dayjs(formData.startDate).format('YYYY-MM-DD')} 至 ${dayjs(formData.endDate).format('YYYY-MM-DD')}`
                    : '-'}
                </div>
              </Col>
              <Col span={8}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  参与人数
                </Text>
                <div style={{ marginTop: 4 }}>
                  {formData.minParticipants}-{formData.maxParticipants}人
                </div>
              </Col>
              <Col span={8}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  技能要求
                </Text>
                <div style={{ marginTop: 4 }}>
                  {formData.requiredSkills?.length || 0}项
                </div>
              </Col>
              <Col span={8}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  培训要求
                </Text>
                <div style={{ marginTop: 4 }}>
                  {formData.requiredTrainingIds?.length || 0}门
                </div>
              </Col>
              {formData.requiredSkills && formData.requiredSkills.length > 0 && (
                <Col span={24}>
                  <Divider style={{ margin: '16px 0' }} />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    技能详情
                  </Text>
                  <div style={{ marginTop: 8 }}>
                    <Space wrap size={[8, 8]}>
                      {formData.requiredSkills.map((rs: { skillId: number; minProficiency: number; requiredCount: number }, index: number) => {
                        const skill = skills.find((s) => s.id === rs.skillId)
                        return (
                          <Tag key={index} color="blue">
                            {skill?.name || '未知技能'}: 熟练度{rs.minProficiency}+, 需要{rs.requiredCount}人
                          </Tag>
                        )
                      })}
                    </Space>
                  </div>
                </Col>
              )}
            </Row>
          </Card>
        )

      default:
        return null
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <div>加载中...</div>
      </div>
    )
  }

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <Space align="center">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/manager/projects')}
            style={{ border: 'none', background: 'transparent' }}
          />
          <div>
            <Title level={3} style={{ margin: 0 }}>
              {isEdit ? '编辑项目' : '创建新项目'}
            </Title>
            <Text type="secondary">
              {isEdit ? '修改项目信息' : '填写项目信息，创建新的志愿服务项目'}
            </Text>
          </div>
        </Space>
      </div>

      <Card
        style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 24 }}
        bodyStyle={{ padding: 24 }}
      >
        <Steps current={currentStep} items={steps} />
      </Card>

      <Form form={form} layout="vertical" style={{ marginBottom: 24 }}>
        {renderStepContent()}
      </Form>

      <Card
        style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
        bodyStyle={{ padding: 20 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            {currentStep < 3 && (
              <Button onClick={handlePrev} disabled={currentStep === 0}>
                上一步
              </Button>
            )}
          </Space>
          <Space>
            {currentStep < 3 ? (
              <Button type="primary" onClick={handleNext}>
                下一步
              </Button>
            ) : (
              <Button type="primary" icon={<SaveOutlined />} onClick={handleSubmit} loading={submitting}>
                {isEdit ? '保存修改' : '发布项目'}
              </Button>
            )}
          </Space>
        </div>
      </Card>
    </div>
  )
}

export default ProjectCreate
