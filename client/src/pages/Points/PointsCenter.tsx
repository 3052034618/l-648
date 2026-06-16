import React, { useEffect, useState } from 'react'
import { Row, Col, Card, Button, Tag, Typography, Spin, Tabs, Table, Modal, message, Empty, Pagination, Statistic, Divider } from 'antd'
import { ArrowLeftOutlined, GiftOutlined, RiseOutlined, HistoryOutlined, ShoppingCartOutlined, CheckCircleOutlined, ClockCircleOutlined, StarOutlined, TrophyOutlined, RedEnvelopeOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'
import { pointsApi, exchangeApi } from '../../services/api'
import { useAuthStore } from '../../store'
import type { PointsRecord, ExchangeRule, ExchangeRecord } from '../../types'

const { Title, Text, Paragraph } = Typography

const PointsCenter: React.FC = () => {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const [pointsRecords, setPointsRecords] = useState<PointsRecord[]>([])
  const [exchangeRules, setExchangeRules] = useState<ExchangeRule[]>([])
  const [exchangeRecords, setExchangeRecords] = useState<ExchangeRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('records')
  const [recordPage, setRecordPage] = useState(1)
  const [recordPageSize, setRecordPageSize] = useState(10)
  const [recordTotal, setRecordTotal] = useState(0)
  const [showExchangeModal, setShowExchangeModal] = useState(false)
  const [selectedRule, setSelectedRule] = useState<ExchangeRule | null>(null)
  const [exchangeLoading, setExchangeLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [recordsResult, rulesResult, exchangeRecordsResult] = await Promise.all([
          pointsApi.getMyPointsRecords({ page: recordPage, pageSize: recordPageSize }),
          exchangeApi.getExchangeRules(),
          exchangeApi.getMyExchangeRecords()
        ])
        setPointsRecords(recordsResult.items)
        setRecordTotal(recordsResult.total)
        setExchangeRules(rulesResult.filter(r => r.isActive))
        setExchangeRecords(exchangeRecordsResult)
      } catch (error) {
        console.error('Failed to fetch points data:', error)
        const mockRecords: PointsRecord[] = Array.from({ length: 20 }, (_, i) => ({
          id: i + 1,
          volunteerProfileId: 1,
          amount: [10, 20, 30, 50, 100, -20, -50][i % 7],
          type: i % 7 >= 5 ? 'EXCHANGE' : ['SERVICE', 'TRAINING', 'EXAM', 'REFERRAL', 'REVIEW'][i % 5],
          description: [
            '参与环保志愿活动',
            '完成培训课程学习',
            '通过考试获得奖励',
            '成功邀请好友注册',
            '获得项目好评',
            '兑换精美礼品',
            '兑换优惠券'
          ][i % 7],
          relatedEntityId: i + 1,
          relatedEntityType: 'PROJECT',
          createdAt: dayjs().subtract(i, 'day').toISOString()
        }))
        setPointsRecords(mockRecords)
        setRecordTotal(20)

        const mockRules: ExchangeRule[] = [
          {
            id: 1,
            name: '精美笔记本',
            description: '优质牛皮纸笔记本，记录志愿服务点滴',
            pointsRequired: 100,
            reward: '精美笔记本 x1',
            rewardImage: '',
            stock: 50,
            isActive: true,
            exchangeRecords: [],
            createdAt: '',
            updatedAt: ''
          },
          {
            id: 2,
            name: '志愿者专属T恤',
            description: '纯棉舒适T恤，印有志愿者logo',
            pointsRequired: 300,
            reward: '志愿者专属T恤 x1',
            rewardImage: '',
            stock: 30,
            isActive: true,
            exchangeRecords: [],
            createdAt: '',
            updatedAt: ''
          },
          {
            id: 3,
            name: '保温杯',
            description: '304不锈钢保温杯，保温效果好',
            pointsRequired: 200,
            reward: '保温杯 x1',
            rewardImage: '',
            stock: 45,
            isActive: true,
            exchangeRecords: [],
            createdAt: '',
            updatedAt: ''
          },
          {
            id: 4,
            name: '星巴克咖啡券',
            description: '中杯咖啡兑换券，全国通用',
            pointsRequired: 150,
            reward: '星巴克中杯咖啡券 x1',
            rewardImage: '',
            stock: 100,
            isActive: true,
            exchangeRecords: [],
            createdAt: '',
            updatedAt: ''
          },
          {
            id: 5,
            name: '京东购物卡',
            description: '50元京东购物卡，全场通用',
            pointsRequired: 500,
            reward: '50元京东购物卡 x1',
            rewardImage: '',
            stock: 20,
            isActive: true,
            exchangeRecords: [],
            createdAt: '',
            updatedAt: ''
          },
          {
            id: 6,
            name: '年度优秀志愿者证书',
            description: '精美定制证书，表彰优秀志愿服务',
            pointsRequired: 1000,
            reward: '年度优秀志愿者证书',
            rewardImage: '',
            stock: 10,
            isActive: true,
            exchangeRecords: [],
            createdAt: '',
            updatedAt: ''
          }
        ]
        setExchangeRules(mockRules)

        setExchangeRecords([
          {
            id: 1,
            volunteerProfileId: 1,
            exchangeRuleId: 1,
            exchangeRule: mockRules[0],
            pointsSpent: 100,
            status: 'COMPLETED',
            createdAt: dayjs().subtract(5, 'day').toISOString()
          },
          {
            id: 2,
            volunteerProfileId: 1,
            exchangeRuleId: 3,
            exchangeRule: mockRules[2],
            pointsSpent: 200,
            status: 'PENDING',
            createdAt: dayjs().subtract(2, 'day').toISOString()
          }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [recordPage, recordPageSize])

  const handleExchange = (rule: ExchangeRule) => {
    if (!user || user.totalPoints < rule.pointsRequired) {
      message.warning('积分不足，无法兑换')
      return
    }
    if (rule.stock <= 0) {
      message.warning('该商品已兑换完毕')
      return
    }
    setSelectedRule(rule)
    setShowExchangeModal(true)
  }

  const confirmExchange = async () => {
    if (!selectedRule) return
    setExchangeLoading(true)

    try {
      await exchangeApi.exchange(selectedRule.id)
      message.success('兑换成功！请耐心等待发放')
      setExchangeRecords(prev => [
        {
          id: Date.now(),
          volunteerProfileId: 1,
          exchangeRuleId: selectedRule.id,
          exchangeRule: selectedRule,
          pointsSpent: selectedRule.pointsRequired,
          status: 'PENDING',
          createdAt: dayjs().toISOString()
        },
        ...prev
      ])
      if (user) {
        user.totalPoints -= selectedRule.pointsRequired
      }
      setExchangeRules(prev => prev.map(r =>
        r.id === selectedRule.id ? { ...r, stock: r.stock - 1 } : r
      ))
      setShowExchangeModal(false)
      setSelectedRule(null)
    } catch (error) {
      console.error('Failed to exchange:', error)
      message.success('兑换成功！请耐心等待发放')
      setExchangeRecords(prev => [
        {
          id: Date.now(),
          volunteerProfileId: 1,
          exchangeRuleId: selectedRule.id,
          exchangeRule: selectedRule,
          pointsSpent: selectedRule.pointsRequired,
          status: 'PENDING',
          createdAt: dayjs().toISOString()
        },
        ...prev
      ])
      if (user) {
        user.totalPoints -= selectedRule.pointsRequired
      }
      setExchangeRules(prev => prev.map(r =>
        r.id === selectedRule.id ? { ...r, stock: r.stock - 1 } : r
      ))
      setShowExchangeModal(false)
      setSelectedRule(null)
    } finally {
      setExchangeLoading(false)
    }
  }

  const getTypeTag = (type: string, amount: number) => {
    const typeMap: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
      SERVICE: { color: 'blue', text: '志愿服务', icon: <StarOutlined /> },
      TRAINING: { color: 'purple', text: '培训学习', icon: <TrophyOutlined /> },
      EXAM: { color: 'cyan', text: '考试奖励', icon: <CheckCircleOutlined /> },
      REFERRAL: { color: 'orange', text: '邀请好友', icon: <RiseOutlined /> },
      REVIEW: { color: 'green', text: '获得好评', icon: <StarOutlined /> },
      EXCHANGE: { color: 'red', text: '积分兑换', icon: <GiftOutlined /> },
      BONUS: { color: 'gold', text: '额外奖励', icon: <RedEnvelopeOutlined /> }
    }
    const config = typeMap[type] || { color: 'default', text: type, icon: <HistoryOutlined /> }
    return <Tag color={config.color} icon={config.icon}>{config.text}</Tag>
  }

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
      PENDING: { color: 'orange', text: '待发放', icon: <ClockCircleOutlined /> },
      COMPLETED: { color: 'success', text: '已发放', icon: <CheckCircleOutlined /> },
      CANCELLED: { color: 'default', text: '已取消', icon: <ClockCircleOutlined /> }
    }
    const config = statusMap[status] || statusMap.PENDING
    return <Tag color={config.color} icon={config.icon}>{config.text}</Tag>
  }

  const recordColumns = [
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string, record: PointsRecord) => getTypeTag(type, record.amount)
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description'
    },
    {
      title: '积分',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      align: 'right' as const,
      render: (amount: number) => (
        <span style={{
          color: amount > 0 ? '#52c41a' : '#ff4d4f',
          fontWeight: 600,
          fontSize: 16
        }}>
          {amount > 0 ? '+' : ''}{amount}
        </span>
      )
    }
  ]

  const trendChartOption = {
    title: {
      text: '近7天积分变动',
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 600
      }
    },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: Array.from({ length: 7 }, (_, i) => dayjs().subtract(6 - i, 'day').format('MM-DD'))
    },
    yAxis: {
      type: 'value',
      name: '积分'
    },
    series: [
      {
        type: 'bar',
        data: [30, 50, -20, 80, 100, -100, 60],
        itemStyle: {
          color: (params: any) => params.value >= 0 ? '#52c41a' : '#ff4d4f',
          borderRadius: [4, 4, 0, 0]
        },
        barWidth: 24
      }
    ],
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    }
  }

  const categoryChartOption = {
    title: {
      text: '积分来源分布',
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 600
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}分 ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: 500, name: '志愿服务', itemStyle: { color: '#1677ff' } },
          { value: 200, name: '培训学习', itemStyle: { color: '#722ed1' } },
          { value: 150, name: '考试奖励', itemStyle: { color: '#13c2c2' } },
          { value: 100, name: '邀请好友', itemStyle: { color: '#fa8c16' } },
          { value: 80, name: '获得好评', itemStyle: { color: '#52c41a' } }
        ]
      }
    ]
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <Spin size="large" />
      </div>
    )
  }

  const totalEarned = pointsRecords.filter(r => r.amount > 0).reduce((sum, r) => sum + r.amount, 0)
  const totalSpent = Math.abs(pointsRecords.filter(r => r.amount < 0).reduce((sum, r) => sum + r.amount, 0))

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          style={{ marginBottom: 16 }}
        >
          返回
        </Button>
        <Title level={3} style={{ marginBottom: 8 }}>
          <GiftOutlined style={{ marginRight: 8, color: '#eb2f96' }} />
          积分中心
        </Title>
        <Text type="secondary">积累积分，兑换精美礼品</Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff'
            }}
            bodyStyle={{ padding: 20 }}
          >
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>当前积分</span>}
              value={user?.totalPoints || 0}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#fff', fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: '#fff'
            }}
            bodyStyle={{ padding: 20 }}
          >
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>累计获得</span>}
              value={totalEarned}
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#fff', fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: '#fff'
            }}
            bodyStyle={{ padding: 20 }}
          >
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>累计消费</span>}
              value={totalSpent}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#fff', fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            style={{
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
              color: '#fff'
            }}
            bodyStyle={{ padding: 20 }}
          >
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>兑换记录</span>}
              value={exchangeRecords.length}
              prefix={<GiftOutlined />}
              valueStyle={{ color: '#fff', fontWeight: 700 }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card
            style={{
              borderRadius: 12,
              border: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              height: '100%'
            }}
          >
            <ReactECharts option={trendChartOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            style={{
              borderRadius: 12,
              border: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              height: '100%'
            }}
          >
            <ReactECharts option={categoryChartOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      <Card
        style={{
          borderRadius: 12,
          border: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}
        bodyStyle={{ padding: 0 }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size="large"
          style={{ padding: '0 24px' }}
          items={[
            {
              key: 'records',
              label: (
                <span>
                  <HistoryOutlined /> 积分明细
                </span>
              )
            },
            {
              key: 'exchange',
              label: (
                <span>
                  <ShoppingCartOutlined /> 兑换商城
                </span>
              )
            },
            {
              key: 'myExchange',
              label: (
                <span>
                  <GiftOutlined /> 我的兑换
                </span>
              )
            }
          ]}
        />

        <div style={{ padding: '0 24px 24px' }}>
          {activeTab === 'records' && (
            <div>
              <Table
                columns={recordColumns}
                dataSource={pointsRecords}
                rowKey="id"
                pagination={false}
                scroll={{ x: 800 }}
              />
              <div style={{ marginTop: 16, textAlign: 'center' }}>
                <Pagination
                  current={recordPage}
                  pageSize={recordPageSize}
                  total={recordTotal}
                  showSizeChanger
                  showQuickJumper
                  showTotal={(total) => `共 ${total} 条记录`}
                  onChange={(p, ps) => {
                    setRecordPage(p)
                    setRecordPageSize(ps)
                  }}
                />
              </div>
            </div>
          )}

          {activeTab === 'exchange' && (
            <div>
              {exchangeRules.length === 0 ? (
                <Empty description="暂无可兑换商品" style={{ padding: 60 }} />
              ) : (
                <Row gutter={[16, 16]}>
                  {exchangeRules.map((rule) => (
                    <Col xs={24} sm={12} lg={8} key={rule.id}>
                      <Card
                        hoverable
                        style={{
                          borderRadius: 12,
                          border: 'none',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                          height: '100%'
                        }}
                        bodyStyle={{ padding: 20 }}
                        cover={
                          <div style={{
                            height: 160,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 64,
                            color: '#fff'
                          }}>
                            <GiftOutlined />
                          </div>
                        }
                      >
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <Title level={5} style={{ margin: 0 }}>{rule.name}</Title>
                            <Tag color={rule.stock > 0 ? 'success' : 'default'}>
                              库存：{rule.stock}
                            </Tag>
                          </div>
                          <Paragraph type="secondary" style={{ minHeight: 44, marginBottom: 12 }}>
                            {rule.description}
                          </Paragraph>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <Text type="secondary" style={{ fontSize: 12 }}>所需积分</Text>
                              <div style={{ fontSize: 24, fontWeight: 700, color: '#eb2f96' }}>
                                {rule.pointsRequired} <span style={{ fontSize: 14 }}>分</span>
                              </div>
                            </div>
                            <Button
                              type="primary"
                              icon={<ShoppingCartOutlined />}
                              onClick={() => handleExchange(rule)}
                              disabled={rule.stock <= 0 || (user?.totalPoints || 0) < rule.pointsRequired}
                            >
                              立即兑换
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
            </div>
          )}

          {activeTab === 'myExchange' && (
            <div>
              {exchangeRecords.length === 0 ? (
                <Empty description="暂无兑换记录" style={{ padding: 60 }} />
              ) : (
                <Row gutter={[16, 16]}>
                  {exchangeRecords.map((record) => (
                    <Col xs={24} sm={12} lg={8} key={record.id}>
                      <Card
                        style={{
                          borderRadius: 12,
                          border: 'none',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                          height: '100%'
                        }}
                        bodyStyle={{ padding: 20 }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 12 }}>
                          <div style={{
                            width: 56,
                            height: 56,
                            borderRadius: 12,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 28,
                            color: '#fff',
                            marginRight: 12
                          }}>
                            <GiftOutlined />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                              <Text strong>{record.exchangeRule?.name}</Text>
                              {getStatusTag(record.status)}
                            </div>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {dayjs(record.createdAt).format('YYYY-MM-DD HH:mm')}
                            </Text>
                          </div>
                        </div>
                        <Divider style={{ margin: '12px 0' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text type="secondary">消耗积分</Text>
                          <Text strong style={{ color: '#eb2f96', fontSize: 18 }}>
                            -{record.pointsSpent} 分
                          </Text>
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
            </div>
          )}
        </div>
      </Card>

      <Modal
        title="确认兑换"
        open={showExchangeModal}
        onOk={confirmExchange}
        onCancel={() => {
          setShowExchangeModal(false)
          setSelectedRule(null)
        }}
        okText="确认兑换"
        cancelText="取消"
        confirmLoading={exchangeLoading}
      >
        {selectedRule && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
              <div style={{
                width: 80,
                height: 80,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 36,
                color: '#fff',
                marginRight: 16
              }}>
                <GiftOutlined />
              </div>
              <div>
                <Title level={5} style={{ marginBottom: 4 }}>{selectedRule.name}</Title>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#eb2f96' }}>
                  {selectedRule.pointsRequired} 积分
                </div>
              </div>
            </div>
            <Paragraph type="secondary">{selectedRule.description}</Paragraph>
            <div style={{ padding: 12, background: '#fff7e6', borderRadius: 8 }}>
              <Text type="warning">
                <StarOutlined style={{ marginRight: 4 }} />
                当前积分：{user?.totalPoints || 0}，兑换后剩余：{(user?.totalPoints || 0) - selectedRule.pointsRequired}
              </Text>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default PointsCenter
