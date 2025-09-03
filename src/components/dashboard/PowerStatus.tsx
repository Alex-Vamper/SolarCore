import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Sun, 
  Grid3x3, 
  Battery, 
  AlertCircle,
  WifiOff
} from "lucide-react";

interface PowerStatusProps {
  userSettings: any;
  energyData: any;
}

export default function PowerStatus({ userSettings, energyData }: PowerStatusProps) {
  const powerSource = userSettings?.power_source || 'grid_only';
  const hasSolarId = userSettings?.solar_system_id;
  const hasGridId = userSettings?.grid_meter_id;
  
  // Don't show if no digital connection
  if (powerSource === 'no_digital') {
    return null;
  }

  // Provide default values if energyData is null
  const defaultEnergyData = {
    solar_percentage: 0,
    grid_percentage: 0,
    battery_level: 0,
  };

  const data = energyData || defaultEnergyData;
  
  // Adjust data based on power source
  const adjustedData = {
    ...data,
    solar_percentage: powerSource === 'grid_only' ? 0 : data.solar_percentage,
    grid_percentage: powerSource === 'solar_only' ? 0 : data.grid_percentage,
    battery_level: powerSource === 'grid_only' ? 0 : data.battery_level,
  };

  const getSolarColor = (percentage: number) => {
    if (percentage >= 70) return "text-green-600";
    if (percentage >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  const getBatteryColor = (level: number) => {
    if (level >= 60) return "bg-green-500";
    if (level >= 30) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <Card className="glass-card border-0 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="app-heading flex items-center gap-2">
          <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
            <Sun className="app-icon text-white" />
          </div>
          Power Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Warning if IDs not configured */}
        {((powerSource === 'solar_only' || powerSource === 'solar_grid') && !hasSolarId) && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
            <p className="app-text text-yellow-800 flex items-center gap-2">
              <AlertCircle className="app-icon" />
              Solar System ID not configured. Please add it in settings for accurate monitoring.
            </p>
          </div>
        )}
        {((powerSource === 'grid_only' || powerSource === 'solar_grid') && !hasGridId) && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
            <p className="app-text text-blue-800 flex items-center gap-2">
              <AlertCircle className="app-icon" />
              Grid Meter ID not configured. Please add it in settings for accurate monitoring.
            </p>
          </div>
        )}

        {/* Power Source Bars */}
        <div className="grid grid-cols-2 gap-4">
          {powerSource !== 'grid_only' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="app-text font-medium text-gray-600">Solar</span>
                <span className={`app-text font-bold ${getSolarColor(adjustedData.solar_percentage)}`}>
                  {adjustedData.solar_percentage}%
                </span>
              </div>
              <Progress value={adjustedData.solar_percentage} className="h-2 bg-gray-200" />
            </div>
          )}
          {powerSource !== 'solar_only' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="app-text font-medium text-gray-600">Grid</span>
                <span className="app-text font-bold text-blue-600">
                  {adjustedData.grid_percentage}%
                </span>
              </div>
              <Progress value={adjustedData.grid_percentage} className="h-2 bg-gray-200" />
            </div>
          )}
        </div>
        
        {/* Battery Level - only show for solar */}
        {powerSource !== 'grid_only' && (
          <div className="flex items-center gap-2 pt-2">
            <Battery className="app-icon text-gray-500" />
            <span className="app-text font-medium text-gray-600">
              Battery: {adjustedData.battery_level}%
            </span>
            <div className="flex-1">
              <Progress value={adjustedData.battery_level} className={`h-2 ${getBatteryColor(adjustedData.battery_level)}`} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}