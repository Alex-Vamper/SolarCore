import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Shield, 
  Flame, 
  Droplets, 
  AlertTriangle,
  CheckCircle,
  Settings,
  Activity,
  Thermometer,
  Wind,
  Waves
} from "lucide-react";

export default function SafetyPanel({ system, onManualOverride, onSystemSettings }) {
  const [isOverriding, setIsOverriding] = useState(false);

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

  const meta = systemMeta[system.system_type] || systemMeta.fire_detection;
  const SystemIcon = meta.icon;

  return (
    <>
      <Card className="glass-card border-0 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-lg font-inter">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${meta.color}`}>
                <SystemIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-semibold">{system.room_name}</div>
                <div className="text-sm text-gray-500 font-normal">
                  {meta.name}
                </div>
              </div>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(system.status)}>
                {system.status.replace('_', ' ')}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                onClick={onSystemSettings}
                className="text-gray-400 hover:text-gray-600"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Overview */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              {getStatusIcon(system.status)}
              <span className="text-sm font-medium text-gray-700 font-inter">System Status</span>
            </div>
            <span className={`text-sm font-bold ${
              system.status === "safe" ? 'text-green-600' : 
              system.status === "alert" ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {system.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
          </div>

          {/* Fire System Specific */}
          {system.system_type === "fire_detection" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Flame className="w-4 h-4 text-red-500" />
                    <span className="text-sm font-medium text-gray-700 font-inter">Flame</span>
                  </div>
                  <Badge className={
                    system.sensor_readings?.flame_detected 
                      ? "bg-red-100 text-red-800 border-red-200" 
                      : "bg-green-100 text-green-800 border-green-200"
                  }>
                    {system.sensor_readings?.flame_detected ? "Detected" : "Clear"}
                  </Badge>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Thermometer className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-medium text-gray-700 font-inter">Temperature</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900 font-inter">
                    {system.sensor_readings?.temperature || 25}°C
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 font-inter">Smoke Level</span>
                  <span className="text-sm font-bold text-gray-900 font-inter">
                    {system.sensor_readings?.smoke_level || 0}%
                  </span>
                </div>
                <Progress 
                  value={system.sensor_readings?.smoke_level || 0} 
                  className="h-2" 
                />
              </div>

              {system.status !== "safe" && (
                <div className="pt-2 border-t">
                  <Button
                    onClick={() => handleOverride("activate_suppression")}
                    disabled={isOverriding}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-inter"
                  >
                    {isOverriding ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                      <Shield className="w-4 h-4 mr-2" />
                    )}
                    Manual Fire Suppression
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Rain System Specific */}
          {system.system_type === "window_rain" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Droplets className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium text-gray-700 font-inter">Rain</span>
                  </div>
                  <Badge className={
                    system.sensor_readings?.rain_detected 
                      ? "bg-blue-100 text-blue-800 border-blue-200" 
                      : "bg-green-100 text-green-800 border-green-200"
                  }>
                    {system.sensor_readings?.rain_detected ? "Detected" : "Clear"}
                  </Badge>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700 font-inter">Window</span>
                  </div>
                  <Badge className={
                    system.sensor_readings?.window_status === "open"
                      ? "bg-yellow-100 text-yellow-800 border-yellow-200" 
                      : "bg-green-100 text-green-800 border-green-200"
                  }>
                    {system.sensor_readings?.window_status || "Closed"}
                  </Badge>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <Button
                  onClick={() => handleOverride("close_window")}
                  disabled={isOverriding}
                  variant="outline"
                  className="flex-1 font-inter"
                >
                  {isOverriding && <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />}
                  Close Window
                </Button>
                <Button
                  onClick={() => handleOverride("open_window")}
                  disabled={isOverriding}
                  variant="outline"
                  className="flex-1 font-inter"
                >
                  Open Window
                </Button>
              </div>
            </div>
          )}

          {/* Gas Leakage Specific */}
          {system.system_type === "gas_leak" && (
            <div className="space-y-3">
               <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Wind className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700 font-inter">Gas Level</span>
                  </div>
                  <span className="text-lg font-bold text-gray-900 font-inter">
                    {system.sensor_readings?.gas_level || 0} ppm
                  </span>
                  <Progress value={(system.sensor_readings?.gas_level || 0) / 10} className="h-2 mt-2" />
                </div>
            </div>
          )}

          {/* Water Level Specific */}
          {system.system_type === "water_overflow" && (
            <div className="space-y-3">
               <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Waves className="w-4 h-4 text-teal-500" />
                    <span className="text-sm font-medium text-gray-700 font-inter">Tank Water Level</span>
                  </div>
                  <span className="text-lg font-bold text-gray-900 font-inter">
                    {system.sensor_readings?.water_level || 0}%
                  </span>
                   <Progress value={system.sensor_readings?.water_level || 0} className="h-2 mt-2" />
                </div>
            </div>
          )}

          {/* Last Triggered */}
          {system.last_triggered && (
            <div className="text-center pt-3 border-t">
              <p className="text-xs text-gray-500 font-inter">
                Last triggered: {new Date(system.last_triggered).toLocaleString()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}