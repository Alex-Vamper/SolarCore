import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { UserSettingsService } from '@/entities/UserSettings';
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
  const { session, isNewLogin } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications from admin_notifications where delivery_method = 'push'
  const fetchNotifications = useCallback(async () => {
    if (!session?.user) {
      setLoading(false);
      return;
    }

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

  // Check for missed notifications when user logs in
  const checkForMissedNotifications = useCallback(async () => {
    if (!session?.user) return;

    try {
      // Get user's last login time
      const userSettings = await UserSettingsService.list();
      const lastLoginAt = userSettings[0]?.last_login_at;
      
      // If no last login time, treat as new user and check last 36 hours
      const checkFromTime = lastLoginAt 
        ? new Date(lastLoginAt) 
        : new Date(Date.now() - 36 * 60 * 60 * 1000); // 36 hours ago

      const thirtySevenHoursAgo = new Date(Date.now() - 37 * 60 * 60 * 1000);

      // Don't check if last login was very recent (less than 30 minutes ago)
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      if (lastLoginAt && new Date(lastLoginAt) > thirtyMinutesAgo) {
        return;
      }

      // Fetch notifications from the last 36 hours that were published after the user's last login
      const { data: missedNotifications, error } = await supabase
        .from('admin_notifications')
        .select('*')
        .eq('delivery_method', 'push')
        .gte('created_date', checkFromTime.toISOString())
        .gte('created_date', thirtySevenHoursAgo.toISOString())
        .order('created_date', { ascending: false });

      if (error) throw error;

      if (!missedNotifications?.length) return;

      // Get read status for these notifications
      const { data: readStatuses, error: readError } = await supabase
        .from('user_notification_reads')
        .select('notification_id')
        .eq('user_id', session.user.id)
        .in('notification_id', missedNotifications.map(n => n.id));

      if (readError) throw readError;

      const readIds = new Set(readStatuses?.map(r => r.notification_id) || []);
      const unreadMissedNotifications = missedNotifications.filter(n => !readIds.has(n.id));

      // Show toast popups for missed notifications with delays
      unreadMissedNotifications.slice(0, 5).forEach((notif, index) => {
        setTimeout(() => {
          toast(notif.title, {
            description: `${notif.message} (while you were away)`,
            duration: 6000,
          });
        }, index * 1500); // 1.5 second delay between each toast
      });

      if (unreadMissedNotifications.length > 5) {
        setTimeout(() => {
          toast('More notifications', {
            description: `You have ${unreadMissedNotifications.length - 5} more notifications waiting.`,
            duration: 6000,
          });
        }, 5 * 1500);
      }

    } catch (error) {
      console.error('Error checking for missed notifications:', error);
    }
  }, [session?.user]);

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

  // Check for missed notifications when user logs in
  useEffect(() => {
    if (isNewLogin && session?.user) {
      // Add a small delay to let the UI settle
      const timer = setTimeout(() => {
        checkForMissedNotifications();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isNewLogin, session?.user, checkForMissedNotifications]);

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    getFilteredNotifications,
    checkForMissedNotifications,
    refetch: fetchNotifications
  };
};