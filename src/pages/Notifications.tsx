import * as React from "react";

import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Bell } from 'lucide-react';

export default function Notifications() {
  return (
    <div className="p-4 space-y-6">
      <Link to={createPageUrl('Dashboard')}>
        <Button variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </Link>
      <div className="text-center py-6">
        <Bell className="w-12 h-12 text-blue-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 font-inter">
          Notifications
        </h1>
        <p className="text-gray-600 font-inter mt-1">
          Stay updated with important events.
        </p>
      </div>
      <div className="text-center py-20">
        <p className="text-gray-500 font-inter">Notification system coming soon.</p>
      </div>
    </div>
  );
}