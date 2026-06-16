import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Space,
  Card,
  Row,
  Col,
  Statistic,
  DatePicker,
  Select,
  Tag,
  message,
  Tabs,
  Progress,
  List,
  Descriptions,
  Empty,
  Divider,
} from 'antd'
import {
  FileTextOutlined,
  DownloadOutlined,
  EnterOutlined,
  BarChartOutlined,
  PieChartOutlined,
  LineChartOutlined,
  TeamOutlined,
  ProjectOutlined,
  ClockCircleOutlined,
  GiftOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import type { ColumnsType } from 'antd/es/table'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { adminApi, statisticsApi } from '../../services/api'
import type { MonthlyReport, PaginationResult, StatisticsData } from '../../types'

const { Option } = Select
const { TabPane } = Tabs

const ReportCenter: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [reports, setReports] = useState<MonthlyReport[]>([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(dayjs().subtract(1, 'month'))
  const [reportType, setReportType] = useState<string>('monthly')
  const [statistics, setStatistics] = useState<StatisticsData | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  const fetchReports = async (page = 1, pageSize = 10) => {
    setLoading(true)
    try {
      const response: PaginationResult<MonthlyReport> = await adminApi.getMonthlyReports({
        page,
        pageSize,
      })
      setReports(response.items)
      setPagination({
        current: response.page,
        pageSize: response.pageSize,
        total: response.total,
      })
    } catch (error) {
      message.error('获取报表列表失败')
      const mockReports: MonthlyReport[] = Array.from({ length: 12 }, (_, i) => {
        const month = dayjs().subtract(i, 'month')
        return {
          id: i + 1,
          reportMonth: month.format('YYYY-MM'),
          totalVolunteers: 100 + i * 15,
          totalProjects: 20 + i * 2,
          totalServiceHours: 5000 + i * 300,
          totalPointsDistributed: 25000 + i * 1500,
          projects: [],
          status: ['GENERATED', 'GENERATED', 'EXPORTED', 'PENDING'][i % 4] as any,
          createdAt: month.endOf('month').toISOString(),
          generatedAt: month.endOf('month').toISOString(),
          exportedAt: i % 4 === 2 ? month.endOf('month').add(1, 'day').toISOString() : undefined,
          filePath: i % 4 === 2 ? `/reports/${month.format('YYYY-MM')}.xlsx` : undefined,
        }
      })
      setReports(mockReports.slice((page - 1) * pageSize, page * pageSize))
      setPagination({ current: page, pageSize, total: mockReports.length })
    } finally {
      setLoading(false)
    }
  }

  const fetchStatistics = async () => {
    try {
      const data = await statisticsApi.getStatistics()
      setStatistics(data)
    } catch (error) {
      setStatistics({
        totalVolunteers: 528,
        totalProjects: 86,
        totalServiceHours: 28560,
        totalPointsDistributed: 142800,
        ongoingProjects: 23,
        pendingApplications: 45,
        todayAttendance: 67,
        averageRating: 4.7,
        volunteerCount: 528,
        projectCount: 86,
        newVolunteersThisMonth: 42,
        activeProjects: 23,
        completedProjects: 63,
        attendanceRate: 92.5,
      })
    }
  }

  useEffect(() => {
    fetchReports()
    fetchStatistics()
  }, [])

  const handleGenerateReport = async () => {
    const monthStr = selectedMonth.format('YYYY-MM')
    setGenerating(true)
    try {
      await adminApi.generateMonthlyReport(monthStr)
      message.success(`已生成 ${monthStr} 月度报表`)
      fetchReports(pagination.current, pagination.pageSize)
    } catch (error: any) {
      console.error('Failed to generate report:', error)
      message.error(error?.response?.data?.message || error?.message || '生成报表失败，请稍后重试')
    } finally {
      setGenerating(false)
    }
  }

  const handleExportReport = async (id: number) => {
    try {
      const result = await adminApi.exportReport(id)
      message.success('导出成功')
      if (result.filePath) {
        window.open(result.filePath, '_blank')
      }
      fetchReports(pagination.current, pagination.pageSize)
    } catch (error: any) {
      console.error('Failed to export report:', error)
      message.error(error?.response?.data?.message || error?.message || '导出失败，请稍后重试')
    }
  }

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      PENDING: { color: 'default', text: '待生成' },
      GENERATED: { color: 'blue', text: '已生成' },
      EXPORTED: { color: 'green', text: '已导出' },
    }
    const config = statusMap[status] || { color: 'default', text: status }
    return <Tag color={config.color}>{config.text}</Tag>
  }

  const columns: ColumnsType<MonthlyReport> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: '报表月份',
      dataIndex: 'reportMonth',
      key: 'reportMonth',
      sorter: (a, b) => a.reportMonth.localeCompare(b.reportMonth),
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: '志愿者总数',
      dataIndex: 'totalVolunteers',
      key: 'totalVolunteers',
      sorter: (a, b) => a.totalVolunteers - b.totalVolunteers,
    },
    {
      title: '项目总数',
      dataIndex: 'totalProjects',
      key: 'totalProjects',
      sorter: (a, b) => a.totalProjects - b.totalProjects,
    },
    {
      title: '服务总时长(小时)',
      dataIndex: 'totalServiceHours',
      key: 'totalServiceHours',
      sorter: (a, b) => a.totalServiceHours - b.totalServiceHours,
      render: (text) => text.toLocaleString(),
    },
    {
      title: '发放积分总数',
      dataIndex: 'totalPointsDistributed',
      key: 'totalPointsDistributed',
      sorter: (a, b) => a.totalPointsDistributed - b.totalPointsDistributed,
      render: (text) => text.toLocaleString(),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
    },
    {
      title: '生成时间',
      dataIndex: 'generatedAt',
      key: 'generatedAt',
      render: (text) => (text ? new Date(text).toLocaleString('zh-CN') : '-'),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          {record.status !== 'EXPORTED' && (
            <Button
              type="link"
              icon={<DownloadOutlined />}
              onClick={() => handleExportReport(record.id)}
            >
              导出Excel
            </Button>
          )}
          {record.status === 'EXPORTED' && (
            <Button type="link" icon={<DownloadOutlined />} onClick={() => message.success('开始下载')}>
              下载
            </Button>
          )}
        </Space>
      ),
    },
  ]

  const volunteerTrendOption = {
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    },
    yAxis: { type: 'value', name: '新增志愿者' },
    series: [
      {
        data: [25, 32, 28, 45, 38, 52, 48, 60, 55, 42, 35, 42],
        type: 'bar',
        itemStyle: { color: '#1890ff', borderRadius: [4, 4, 0, 0] },
      },
    ],
  }

  const projectCategoryOption = {
    tooltip: { trigger: 'item' },
    legend: { bottom: '0%' },
    series: [
      {
        name: '项目分类',
        type: 'pie',
        radius: ['40%', '70%'],
        data: [
          { value: 25, name: '社区服务', itemStyle: { color: '#52c41a' } },
          { value: 20, name: '教育辅导', itemStyle: { color: '#1890ff' } },
          { value: 15, name: '医疗护理', itemStyle: { color: '#fa8c16' } },
          { value: 12, name: '环境保护', itemStyle: { color: '#722ed1' } },
          { value: 10, name: '文化艺术', itemStyle: { color: '#eb2f96' } },
          { value: 8, name: '其他', itemStyle: { color: '#8c8c8c' } },
        ],
      },
    ],
  }

  const serviceHoursTrend = {
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月'],
    },
    yAxis: { type: 'value', name: '服务时长(小时)' },
    series: [
      {
        data: [3200, 4500, 3800, 5200, 4800, 6100],
        type: 'line',
        smooth: true,
        areaStyle: { opacity: 0.3 },
        itemStyle: { color: '#52c41a' },
      },
    ],
  }

  const pointsDistribution = {
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月'],
    },
    yAxis: { type: 'value', name: '积分发放' },
    series: [
      {
        data: [18000, 22000, 19500, 28000, 25000, 32000],
        type: 'bar',
        itemStyle: { color: '#fa8c16', borderRadius: [4, 4, 0, 0] },
      },
    ],
  }

  const recentActivities = [
    { id: 1, type: 'project', title: '社区环保活动已完成', time: '10分钟前', icon: <ProjectOutlined /> },
    { id: 2, type: 'volunteer', title: '新注册志愿者 15 人', time: '30分钟前', icon: <TeamOutlined /> },
    { id: 3, type: 'attendance', title: '今日签到率 95%', time: '1小时前', icon: <CheckCircleOutlined /> },
    { id: 4, type: 'report', title: '2024年12月报表已生成', time: '2小时前', icon: <FileTextOutlined /> },
    { id: 5, type: 'points', title: '本月已发放积分 32,000', time: '3小时前', icon: <GiftOutlined /> },
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">报表中心</h2>
        <p className="text-gray-500">查看系统数据统计和导出各类报表</p>
      </div>

      {statistics && (
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="志愿者总数"
                value={statistics.totalVolunteers}
                prefix={<TeamOutlined className="text-blue-500" />}
                valueStyle={{ color: '#1890ff' }}
              />
              <div className="text-xs text-green-500 mt-1">
                ↑ 本月新增 {statistics.newVolunteersThisMonth} 人
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="项目总数"
                value={statistics.totalProjects}
                prefix={<ProjectOutlined className="text-green-500" />}
                valueStyle={{ color: '#52c41a' }}
              />
              <div className="text-xs text-gray-500 mt-1">
                进行中 {statistics.activeProjects} / 已完成 {statistics.completedProjects}
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="服务总时长"
                value={statistics.totalServiceHours}
                suffix="小时"
                prefix={<ClockCircleOutlined className="text-orange-500" />}
                valueStyle={{ color: '#fa8c16' }}
              />
              <div className="text-xs text-gray-500 mt-1">今日签到 {statistics.todayAttendance} 人</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="发放积分总数"
                value={statistics.totalPointsDistributed}
                prefix={<GiftOutlined className="text-purple-500" />}
                valueStyle={{ color: '#722ed1' }}
              />
              <div className="text-xs text-gray-500 mt-1">平均评分 {statistics.averageRating} 分</div>
            </Card>
          </Col>
        </Row>
      )}

      <Card className="mb-6">
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane
            tab={
              <span>
                <BarChartOutlined /> 数据概览
              </span>
            }
            key="overview"
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <Card title="志愿者增长趋势" size="small" extra={<LineChartOutlined />}>
                  <ReactECharts option={volunteerTrendOption} style={{ height: 300 }} />
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card title="项目分类分布" size="small" extra={<PieChartOutlined />}>
                  <ReactECharts option={projectCategoryOption} style={{ height: 300 }} />
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card title="服务时长趋势" size="small" extra={<LineChartOutlined />}>
                  <ReactECharts option={serviceHoursTrend} style={{ height: 300 }} />
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card title="积分发放统计" size="small" extra={<BarChartOutlined />}>
                  <ReactECharts option={pointsDistribution} style={{ height: 300 }} />
                </Card>
              </Col>
            </Row>

            <Divider />

            <Row gutter={[16, 16]}>
              <Col xs={24} lg={16}>
                <Card title="关键指标" size="small">
                  {statistics && (
                    <Descriptions column={2} size="small">
                      <Descriptions.Item label="志愿者总数">{statistics.totalVolunteers} 人</Descriptions.Item>
                      <Descriptions.Item label="本月新增">{statistics.newVolunteersThisMonth} 人</Descriptions.Item>
                      <Descriptions.Item label="项目总数">{statistics.totalProjects} 个</Descriptions.Item>
                      <Descriptions.Item label="进行中项目">{statistics.activeProjects} 个</Descriptions.Item>
                      <Descriptions.Item label="服务总时长">{statistics.totalServiceHours.toLocaleString()} 小时</Descriptions.Item>
                      <Descriptions.Item label="今日签到">{statistics.todayAttendance} 人</Descriptions.Item>
                      <Descriptions.Item label="发放积分">{statistics.totalPointsDistributed.toLocaleString()}</Descriptions.Item>
                      <Descriptions.Item label="平均评分">{statistics.averageRating} 分</Descriptions.Item>
                      <Descriptions.Item label="待审核申请">{statistics.pendingApplications} 个</Descriptions.Item>
                      <Descriptions.Item label="出勤率">
                        <Progress
                          percent={statistics.attendanceRate}
                          size="small"
                          status="success"
                        />
                      </Descriptions.Item>
                    </Descriptions>
                  )}
                </Card>
              </Col>
              <Col xs={24} lg={8}>
                <Card title="最近动态" size="small">
                  <List
                    dataSource={recentActivities}
                    renderItem={(item) => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={item.icon}
                          title={item.title}
                          description={item.time}
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
            </Row>
          </TabPane>

          <TabPane
            tab={
              <span>
                <FileTextOutlined /> 月度报表
              </span>
            }
            key="monthly"
          >
            <div className="flex flex-wrap gap-4 items-center mb-4 justify-between">
              <div className="flex flex-wrap gap-4 items-center">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">选择月份</label>
                  <DatePicker
                    picker="month"
                    value={selectedMonth}
                    onChange={(date) => date && setSelectedMonth(date)}
                    allowClear={false}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">报表类型</label>
                  <Select value={reportType} onChange={setReportType} style={{ width: 150 }}>
                    <Option value="monthly">月度报表</Option>
                    <Option value="quarterly">季度报表</Option>
                    <Option value="yearly">年度报表</Option>
                  </Select>
                </div>
                <Button
                  type="primary"
                  icon={generating ? <LoadingOutlined /> : <EnterOutlined />}
                  onClick={handleGenerateReport}
                  loading={generating}
                  className="mt-5"
                >
                  {generating ? '生成中...' : '生成报表'}
                </Button>
              </div>
              <div className="text-sm text-gray-500 mt-5">
                提示：生成报表可能需要几秒钟时间
              </div>
            </div>

            {reports.length > 0 ? (
              <Table
                columns={columns}
                dataSource={reports}
                rowKey="id"
                loading={loading}
                pagination={{
                  ...pagination,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total) => `共 ${total} 条记录`,
                  onChange: (page, pageSize) => fetchReports(page, pageSize),
                }}
                scroll={{ x: 1200 }}
              />
            ) : (
              <Empty description="暂无报表记录" />
            )}
          </TabPane>
        </Tabs>
      </Card>
    </div>
  )
}

export default ReportCenter
