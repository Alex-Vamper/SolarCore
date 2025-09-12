import { formatDistanceToNow } from 'date-fns';
import { Bell, Zap, Shield, Settings } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Notification } from '@/hooks/useNotifications';

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => void;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'system':
      return <Settings className="w-5 h-5 text-muted-foreground" />;
    case 'energy':
      return <Zap className="w-5 h-5 text-green-600" />;
    case 'safety':
      return <Shield className="w-5 h-5 text-red-600" />;
    default:
      return <Bell className="w-5 h-5 text-muted-foreground" />;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'system':
      return 'bg-blue-50 border-blue-200';
    case 'energy':
      return 'bg-green-50 border-green-200';
    case 'safety':
      return 'bg-red-50 border-red-200';
    default:
      return 'bg-gray-50 border-gray-200';
  }
};

export const NotificationItem = ({ notification, onRead }: NotificationItemProps) => {
  const handleClick = () => {
    if (!notification.isRead) {
      onRead(notification.id);
    }
  };

  const timeAgo = formatDistanceToNow(new Date(notification.created_at), { addSuffix: true });

  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
        notification.isRead ? 'opacity-70' : getNotificationColor(notification.notification_type)
      }`}
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {getNotificationIcon(notification.notification_type)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-gray-900 text-sm truncate">
                {notification.title}
              </h3>
              {!notification.isRead && (
                <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1" />
              )}
            </div>
            
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {notification.message}
            </p>
            
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-gray-500">{timeAgo}</span>
              <Badge 
                variant="secondary" 
                className="text-xs capitalize"
              >
                {notification.notification_type}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};