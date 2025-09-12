import * as React from "react";
import { Bell } from 'lucide-react';
import { NotificationTabs } from '@/components/notifications/NotificationTabs';

export default function Notifications() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="w-8 h-8 text-primary" />
          <h1 className="app-text text-3xl font-bold text-gray-900">Notifications</h1>
        </div>
        <p className="app-text text-gray-600">
          Stay updated with your smart home system alerts and updates
        </p>
      </div>

      <NotificationTabs />
    </div>
  );
}