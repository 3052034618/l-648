import React from 'react'
import { List, Tag, Tooltip, Button } from 'antd'
import {
  BellOutlined,
  ProjectOutlined,
  BookOutlined,
  GiftOutlined,
  WarningOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  RiseOutlined,
  CalendarOutlined,
  FileTextOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { Notification, NotificationType, NotificationStatus } from '../../types'
import { useNotificationStore } from '../../store'

const typeConfig: Partial<Record<NotificationType, { icon: React.ReactNode; color: string; label: string }>> = {
  TASK_ASSIGNMENT: {
    icon: <ProjectOutlined />,
    color: 'blue',
    label: '任务分配'
  },
  ATTENDANCE_ABNORMAL: {
    icon: <WarningOutlined />,
    color: 'red',
    label: '考勤异常'
  },
  TRAINING_PASSED: {
    icon: <TrophyOutlined />,
    color: 'green',
    label: '培训通过'
  },
  TRAINING_FAILED: {
    icon: <BookOutlined />,
    color: 'orange',
    label: '培训未通过'
  },
  POINTS_CHANGED: {
    icon: <GiftOutlined />,
    color: 'gold',
    label: '积分变动'
  },
  CREDIT_CHANGED: {
    icon: <RiseOutlined />,
    color: 'purple',
    label: '信用分变动'
  },
  SCHEDULE_UPDATED: {
    icon: <CalendarOutlined />,
    color: 'cyan',
    label: '排班更新'
  },
  PROJECT_CREATED: {
    icon: <FileTextOutlined />,
    color: 'geekblue',
    label: '新项目'
  },
  EXAM_REMINDER: {
    icon: <ClockCircleOutlined />,
    color: 'magenta',
    label: '考试提醒'
  },
  SYSTEM_ANNOUNCEMENT: {
    icon: <BellOutlined />,
    color: 'blue',
    label: '系统公告'
  }
}

interface NotificationItemProps {
  notification: Notification
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification }) => {
  const { markAsRead } = useNotificationStore()
  const config = typeConfig[notification.type] ?? typeConfig.SYSTEM_ANNOUNCEMENT ?? { icon: <BellOutlined />, color: 'default', label: '通知' }
  const isUnread = notification.status === 'UNREAD' as NotificationStatus

  const handleClick = async () => {
    if (isUnread) {
      await markAsRead(notification.id)
    }
  }

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation()
    markAsRead(notification.id)
  }

  return (
    <List.Item
      style={{
        padding: '12px 16px',
        background: isUnread ? '#f0f7ff' : 'transparent',
        borderLeft: isUnread ? '3px solid #1677ff' : '3px solid transparent',
        cursor: 'pointer',
        transition: 'background 0.3s'
      }}
      onClick={handleClick}
      actions={[
        isUnread && (
          <Tooltip key="read" title="标记已读">
            <Button type="text" icon={<CheckOutlined />} size="small" onClick={handleMarkAsRead} />
          </Tooltip>
        )
      ].filter(Boolean)}
    >
      <List.Item.Meta
        avatar={
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: `${config.color}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: config.color,
              fontSize: 18
            }}
          >
            {config.icon}
          </div>
        }
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: isUnread ? 600 : 400 }}>
              {notification.title}
            </span>
            <Tag color={config.color} style={{ margin: 0 }}>
              {config.label}
            </Tag>
            {isUnread && (
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#1677ff'
                }}
              />
            )}
          </div>
        }
        description={
          <div>
            <div style={{ color: '#595959', marginBottom: 4 }}>
              {notification.content}
            </div>
            <div style={{ color: '#8c8c8c', fontSize: 12 }}>
              {dayjs(notification.createdAt).format('YYYY-MM-DD HH:mm')}
            </div>
          </div>
        }
      />
    </List.Item>
  )
}

export default NotificationItem
