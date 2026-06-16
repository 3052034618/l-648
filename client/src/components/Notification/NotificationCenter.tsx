import React, { useEffect, useState } from 'react'
import { List, Button, Empty, Spin, Space, Typography, Divider } from 'antd'
import { CheckOutlined, ReloadOutlined, BellOutlined } from '@ant-design/icons'
import NotificationItem from './NotificationItem'
import { useNotificationStore } from '../../store'


const { Text, Title } = Typography

interface NotificationCenterProps {
  onClose: () => void
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ onClose }) => {
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAllAsRead,
    fetchUnreadCount
  } = useNotificationStore()

  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const pageSize = 20

  useEffect(() => {
    loadNotifications(true)
    fetchUnreadCount()
  }, [fetchUnreadCount])

  const loadNotifications = async (refresh = false) => {
    const currentPage = refresh ? 1 : page
    try {
      await fetchNotifications({ page: currentPage, pageSize })
      if (refresh) {
        setPage(2)
        setHasMore(true)
      } else {
        setPage(currentPage + 1)
      }
    } catch (error) {
      setHasMore(false)
    }
  }

  const handleLoadMore = () => {
    loadNotifications(false)
  }

  const handleMarkAllRead = () => {
    markAllAsRead()
  }

  const handleRefresh = () => {
    loadNotifications(true)
    fetchUnreadCount()
  }

  const loadMore =
    hasMore && !loading ? (
      <div style={{ textAlign: 'center', marginTop: 12, padding: 12 }}>
        <Button onClick={handleLoadMore} loading={loading}>
          加载更多
        </Button>
      </div>
    ) : null

  return (
    <div
      style={{
        width: 400,
        maxHeight: 500,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Space>
          <BellOutlined style={{ fontSize: 18, color: '#1677ff' }} />
          <Title level={5} style={{ margin: 0 }}>
            通知中心
          </Title>
          {unreadCount > 0 && (
            <Text type="danger" style={{ fontSize: 12 }}>
              {unreadCount} 条未读
            </Text>
          )}
        </Space>
        <Space size={8}>
          <Button
            type="text"
            icon={<ReloadOutlined />}
            size="small"
            onClick={handleRefresh}
            loading={loading}
          />
          {unreadCount > 0 && (
            <Button
              type="text"
              icon={<CheckOutlined />}
              size="small"
              onClick={handleMarkAllRead}
            >
              全部已读
            </Button>
          )}
        </Space>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading && notifications.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <Spin />
          </div>
        ) : notifications.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="暂无通知"
            style={{ padding: 40 }}
          />
        ) : (
          <List
            itemLayout="vertical"
            dataSource={notifications}
            renderItem={(item) => (
              <div key={item.id}>
                <NotificationItem notification={item} />
                <Divider style={{ margin: 0 }} />
              </div>
            )}
            loadMore={loadMore}
            style={{ border: 'none' }}
          />
        )}
      </div>

      <div
        style={{
          padding: '12px 20px',
          borderTop: '1px solid #f0f0f0',
          textAlign: 'center'
        }}
      >
        <Button type="link" onClick={onClose}>
          关闭
        </Button>
      </div>
    </div>
  )
}

export default NotificationCenter
