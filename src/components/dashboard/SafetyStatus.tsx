import * as React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Flame, 
  Droplets, 
  CheckCircle, 
  AlertTriangle,
  Activity
} from "lucide-react";

export default function SafetyStatus({ safetyData }) {
  const getStatusColor = (status) => {
    switch (status) {
      case "safe": return "bg-green-100 text-green-800 border-green-200";
      case "alert": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "active": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "safe": return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "alert": return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case "active": return <Activity className="w-4 h-4 text-red-600" />;
      default: return <Shield className="w-4 h-4 text-gray-600" />;
    }
  };

  const fireSystems = safetyData.filter(system => system.system_type === "fire_detection");
  const rainSystems = safetyData.filter(system => system.system_type === "window_rain");

  return (
    <div className="space-y-4">
      {/* Fire Safety */}
      <Card className="glass-card border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-inter">
            <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
              <Flame className="w-4 h-4 text-white" />
            </div>
            Fire Safety
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {fireSystems.length > 0 ? (
            fireSystems.map((system) => (
              <div key={system.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(system.status)}
                  <div>
                    <div className="font-medium font-inter">{system.room_name}</div>
                    <div className="text-sm text-gray-500 font-inter">
                      Smoke: {system.sensor_readings?.smoke_level || 0}% | 
                      Temp: {system.sensor_readings?.temperature || 25}°C
                    </div>
                  </div>
                </div>
                <Badge className={getStatusColor(system.status)}>
                  {system.status}
                </Badge>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-gray-500">
              <Shield className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="font-inter">No fire detection systems configured</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rain Detection */}
      <Card className="glass-card border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-inter">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <Droplets className="w-4 h-4 text-white" />
            </div>
            Rain Detection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {rainSystems.length > 0 ? (
            rainSystems.map((system) => (
              <div key={system.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(system.status)}
                  <div>
                    <div className="font-medium font-inter">{system.room_name}</div>
                    <div className="text-sm text-gray-500 font-inter">
                      Window: {system.sensor_readings?.window_status || "closed"} | 
                      Rain: {system.sensor_readings?.rain_detected ? "Yes" : "No"}
                    </div>
                  </div>
                </div>
                <Badge className={getStatusColor(system.status)}>
                  {system.status}
                </Badge>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-gray-500">
              <Droplets className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="font-inter">No rain detection systems configured</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}