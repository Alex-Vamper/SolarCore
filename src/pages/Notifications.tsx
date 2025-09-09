import * as React from "react";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Bell } from 'lucide-react';
import Layout from '@/layouts/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

      <Card className="glass-card border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="app-text">No New Notifications</CardTitle>
        </CardHeader>
        <CardContent className="p-8 text-center">
          <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="app-text text-lg font-semibold text-gray-900 mb-2">
            You're all caught up!
          </h3>
          <p className="app-text text-gray-600">
            New notifications will appear here when available.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}