import { Bell } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

interface NotificationIndicatorProps {
  className?: string;
}

export const NotificationIndicator = ({ className = "w-5 h-5 text-gray-600" }: NotificationIndicatorProps) => {
  const { unreadCount } = useNotifications();

  return (
    <div className="relative">
      <Bell className={className} />
      {unreadCount > 0 && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
          <span className="text-[10px] text-white font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        </div>
      )}
    </div>
  );
};