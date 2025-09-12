import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Notification {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  target_audience: string;
  delivery_method: string;
  delivery_status: string;
  created_at: string;
  sent_at?: string;
  created_by: string;
  isRead?: boolean;
}

export interface NotificationFilter {
  type: 'all' | 'system' | 'energy' | 'safety';
}

export const useNotifications = () => {
  const { session } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications from admin_notifications where delivery_method = 'push'
  const fetchNotifications = useCallback(async () => {
    if (!session?.user) return;

    try {
      setLoading(true);

      // Fetch system notifications (admin_notifications with delivery_method = 'push')
      const { data: adminNotifications, error: adminError } = await supabase
        .from('admin_notifications')
        .select('*')
        .eq('delivery_method', 'push')
        .order('created_date', { ascending: false });

      if (adminError) throw adminError;

      // Fetch read status for current user
      const { data: readStatuses, error: readError } = await supabase
        .from('user_notification_reads')
        .select('notification_id')
        .eq('user_id', session.user.id);

      if (readError) throw readError;

      const readIds = new Set(readStatuses?.map(r => r.notification_id) || []);

      // Map admin notifications to our notification interface
      const systemNotifications: Notification[] = (adminNotifications || []).map(notif => ({
        id: notif.id,
        title: notif.title,
        message: notif.message,
        notification_type: 'system',
        target_audience: notif.target_audience,
        delivery_method: notif.delivery_method,
        delivery_status: notif.delivery_status,
        created_at: notif.created_date,
        sent_at: notif.sent_at,
        created_by: notif.created_by,
        isRead: readIds.has(notif.id)
      }));

      setNotifications(systemNotifications);
      
      // Calculate unread count
      const unread = systemNotifications.filter(n => !n.isRead).length;
      setUnreadCount(unread);

    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [session?.user]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!session?.user) return;

    try {
      await supabase
        .from('user_notification_reads')
        .upsert({
          user_id: session.user.id,
          notification_id: notificationId,
          read_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,notification_id'
        });

      // Update local state optimistically
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));

    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [session?.user]);

  // Filter notifications by type
  const getFilteredNotifications = useCallback((filter: NotificationFilter) => {
    switch (filter.type) {
      case 'system':
        return notifications.filter(n => n.notification_type === 'system');
      case 'energy':
        return []; // Placeholder for future implementation
      case 'safety':
        return []; // Placeholder for future implementation
      case 'all':
      default:
        return notifications;
    }
  }, [notifications]);

  // Set up real-time subscription for new notifications
  useEffect(() => {
    if (!session?.user) return;

    const channel = supabase
      .channel('notification-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_notifications',
          filter: `delivery_method=eq.push`
        },
        (payload) => {
          const newNotification: Notification = {
            id: payload.new.id,
            title: payload.new.title,
            message: payload.new.message,
            notification_type: 'system',
            target_audience: payload.new.target_audience,
            delivery_method: payload.new.delivery_method,
            delivery_status: payload.new.delivery_status,
            created_at: payload.new.created_date,
            sent_at: payload.new.sent_at,
            created_by: payload.new.created_by,
            isRead: false
          };

          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);

          // Show toast notification
          toast(newNotification.title, {
            description: newNotification.message,
            duration: 5000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    getFilteredNotifications,
    refetch: fetchNotifications
  };
};