import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Bell, Zap, Shield, Settings } from 'lucide-react';
import { NotificationItem } from './NotificationItem';
import { useNotifications, type NotificationFilter } from '@/hooks/useNotifications';

export const NotificationTabs = () => {
  const { notifications, loading, unreadCount, markAsRead, getFilteredNotifications } = useNotifications();
  const [activeTab, setActiveTab] = useState<NotificationFilter['type']>('all');

  const filteredNotifications = getFilteredNotifications({ type: activeTab });

  const getTabContent = (tabType: NotificationFilter['type']) => {
    const tabNotifications = getFilteredNotifications({ type: tabType });
    
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-pulse text-muted-foreground">Loading notifications...</div>
        </div>
      );
    }

    if (tabNotifications.length === 0) {
      const emptyMessages = {
        all: "No notifications available",
        system: "No system notifications",
        energy: "Energy notifications will appear here",
        safety: "Safety notifications will appear here"
      };

      return (
        <div className="text-center py-12">
          <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">All Clear!</h3>
          <p className="text-muted-foreground">{emptyMessages[tabType]}</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {tabNotifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onRead={markAsRead}
          />
        ))}
      </div>
    );
  };

  return (
    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as NotificationFilter['type'])}>
      <TabsList className="grid w-full grid-cols-4 mb-6">
        <TabsTrigger value="all" className="flex items-center gap-2">
          <Bell className="w-4 h-4" />
          <span className="hidden sm:inline">All</span>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
              {unreadCount}
            </Badge>
          )}
        </TabsTrigger>
        
        <TabsTrigger value="energy" className="flex items-center gap-2">
          <Zap className="w-4 h-4" />
          <span className="hidden sm:inline">Energy</span>
        </TabsTrigger>
        
        <TabsTrigger value="safety" className="flex items-center gap-2">
          <Shield className="w-4 h-4" />
          <span className="hidden sm:inline">Safety</span>
        </TabsTrigger>
        
        <TabsTrigger value="system" className="flex items-center gap-2">
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline">System</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="all">
        {getTabContent('all')}
      </TabsContent>

      <TabsContent value="energy">
        {getTabContent('energy')}
      </TabsContent>

      <TabsContent value="safety">
        {getTabContent('safety')}
      </TabsContent>

      <TabsContent value="system">
        {getTabContent('system')}
      </TabsContent>
    </Tabs>
  );
};