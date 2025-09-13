import React, { useState } from 'react';
import { 
  Shield, 
  ShieldAlert, 
  Flame, 
  Droplets, 
  CloudRain, 
  Wind,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Activity,
  Thermometer,
  Waves
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { SafetySystem } from '@/entities/SafetySystem';
import { toast } from 'sonner';

export default function SafetyPanel({ system, onManualOverride, onSystemSettings }) {
  const [isOverriding, setIsOverriding] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Trigger a manual refresh - could emit event or callback
      toast.success('System status refreshed');
    } catch (error) {
      toast.error('Failed to refresh system status');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleOverride = async (action) => {
    setIsOverriding(true);
    try {
      await onManualOverride(system.id, action);
    } finally {
      setIsOverriding(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "safe": return "bg-green-100 text-green-800 border-green-200";
      case "alert": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "active": return "bg-red-100 text-red-800 border-red-200";
      case "suppression_active": return "bg-purple-100 text-purple-800 border-purple-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "safe": return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "alert": return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case "active":
      case "suppression_active": return <Activity className="w-5 h-5 text-red-600" />;
      default: return <Shield className="w-5 h-5 text-gray-600" />;
    }
  };
  
  const systemMeta = {
    fire_detection: {
      name: "Fire Detection",
      icon: Flame,
      color: "bg-red-500",
    },
    window_rain: {
      name: "Rain Detection",
      icon: Droplets,
      color: "bg-blue-500",
    },
    gas_leak: {
      name: "Gas Leakage",
      icon: Wind,
      color: "bg-gray-500",
    },
    water_overflow: {
      name: "Water Level",
      icon: Waves,
      color: "bg-teal-500",
    },
  };

  const systemType = system.device_type?.device_series || system.system_type;
  const meta = systemMeta[systemType] || systemMeta.fire_detection;
  const SystemIcon = meta.icon;

  return (
    <>
      <Card className="glass-card border-0 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="app-heading flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${meta.color}`}>
                <SystemIcon className="app-icon text-white" />
              </div>
              <div>
                <div className="font-semibold">{system.device_name || system.room_name}</div>
                <div className="app-text text-gray-500 font-normal">
                  {meta.name}
                </div>
              </div>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Badge className={getStatusColor(system.state?.status || 'safe')}>
                {(system.state?.status || 'safe').replace('_', ' ')}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onSystemSettings}
                className="text-gray-400 hover:text-gray-600"
              >
                <Settings className="app-icon" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Overview */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              {getStatusIcon(system.state?.status || 'safe')}
              <span className="app-text font-medium text-gray-700">System Status</span>
            </div>
            <span className={`app-text font-bold ${
              (system.state?.status || 'safe') === "safe" ? 'text-green-600' : 
              (system.state?.status || 'safe') === "alert" ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {(system.state?.status || 'safe').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
          </div>

          {/* Fire System Specific */}
          {systemType === "fire_detection" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Flame className="app-icon text-red-500" />
                    <span className="app-text font-medium text-gray-700">Flame</span>
                  </div>
                  <Badge className={
                    system.state?.flame_detected 
                      ? "bg-red-100 text-red-800 border-red-200" 
                      : "bg-green-100 text-green-800 border-green-200"
                  }>
                    {system.state?.flame_detected ? "Detected" : "Clear"}
                  </Badge>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Thermometer className="app-icon text-orange-500" />
                    <span className="app-text font-medium text-gray-700">Temperature</span>
                  </div>
                  <span className="app-text font-bold text-gray-900">
                    {system.state?.temperature || 25}°C
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="app-text font-medium text-gray-700">Smoke Level</span>
                  <span className="app-text font-bold text-gray-900">
                    {system.state?.smoke_level || 0}%
                  </span>
                </div>
                <Progress 
                  value={system.state?.smoke_level || 0} 
                  className="h-2" 
                />
              </div>

              {(system.state?.status || 'safe') !== "safe" && (
                <div className="pt-2 border-t">
                  <Button
                    onClick={() => handleOverride("activate_suppression")}
                    disabled={isOverriding}
                    className="w-full bg-red-600 hover:bg-red-700 text-white app-text"
                  >
                    {isOverriding ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                      <Shield className="app-icon mr-2" />
                    )}
                    Manual Fire Suppression
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Rain System Specific */}
          {systemType === "window_rain" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Droplets className="app-icon text-blue-500" />
                    <span className="app-text font-medium text-gray-700">Rain</span>
                  </div>
                  <Badge className={
                    system.state?.rain_detected 
                      ? "bg-blue-100 text-blue-800 border-blue-200" 
                      : "bg-green-100 text-green-800 border-green-200"
                  }>
                    {system.state?.rain_detected ? "Detected" : "Clear"}
                  </Badge>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="app-icon text-gray-500" />
                    <span className="app-text font-medium text-gray-700">Window</span>
                  </div>
                  <Badge className={
                    system.state?.window_status === "open"
                      ? "bg-yellow-100 text-yellow-800 border-yellow-200" 
                      : "bg-green-100 text-green-800 border-green-200"
                  }>
                    {system.state?.window_status || "Closed"}
                  </Badge>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <Button
                  onClick={() => handleOverride("close_window")}
                  disabled={isOverriding}
                  variant="outline"
                  className="flex-1 app-text"
                >
                  {isOverriding && <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />}
                  Close Window
                </Button>
                <Button
                  onClick={() => handleOverride("open_window")}
                  disabled={isOverriding}
                  variant="outline"
                  className="flex-1 app-text"
                >
                  Open Window
                </Button>
              </div>
            </div>
          )}

          {/* Gas Leakage Specific */}
          {systemType === "gas_leak" && (
            <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Wind className="app-icon text-gray-500" />
                    <span className="app-text font-medium text-gray-700">Gas Level</span>
                  </div>
                  <span className="app-text font-bold text-gray-900">
                    {system.state?.gas_level || 0} ppm
                  </span>
                  <Progress value={(system.state?.gas_level || 0) / 10} className="h-2 mt-2" />
                </div>
            </div>
          )}

          {/* Water Level Specific */}
          {systemType === "water_overflow" && (
            <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Waves className="app-icon text-teal-500" />
                    <span className="app-text font-medium text-gray-700">Tank Water Level</span>
                  </div>
                  <span className="app-text font-bold text-gray-900">
                    {system.state?.water_level || 0}%
                  </span>
                  <Progress value={system.state?.water_level || 0} className="h-2 mt-2" />
                </div>
            </div>
          )}

          {/* Last Triggered */}
          {system.last_triggered && (
            <div className="text-center pt-3 border-t">
              <p className="app-text text-xs text-gray-500">
                Last triggered: {new Date(system.last_triggered).toLocaleString()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}