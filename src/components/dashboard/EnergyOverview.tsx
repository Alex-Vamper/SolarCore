import * as React from "react";
import { useState, useEffect } from "react";
import { UserSettings } from "@/entities/all";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Sun, 
  Zap, 
  Battery, 
  TrendingUp, 
  Leaf,
  DollarSign,
  AlertCircle
} from "lucide-react";

export default function EnergyOverview({ energyData }) {
  const [userSettings, setUserSettings] = useState(null);
  
  // Load user settings to check power source
  useEffect(() => {
    const loadUserSettings = async () => {
      try {
        const settings = await UserSettings.list();
        if (settings && settings.length > 0) {
          setUserSettings(settings[0]);
        }
      } catch (error) {
        console.error('Error loading user settings:', error);
      }
    };
    loadUserSettings();
  }, []);

  // Provide default values if energyData is null or undefined
  const defaultEnergyData = {
    solar_percentage: 0,
    grid_percentage: 0,
    battery_level: 0,
    current_usage: 0,
    daily_usage: 0,
    cost_savings: 0
  };

  const data = energyData || defaultEnergyData;
  const powerSource = userSettings?.power_source || 'grid_only';
  const hasSolarId = userSettings?.solar_system_id;
  const hasGridId = userSettings?.grid_meter_id;
  
  // Adjust data based on power source
  const adjustedData = {
    ...data,
    solar_percentage: powerSource === 'grid_only' ? 0 : data.solar_percentage,
    grid_percentage: powerSource === 'solar_only' ? 0 : data.grid_percentage,
    battery_level: powerSource === 'grid_only' ? 0 : data.battery_level,
    cost_savings: powerSource === 'grid_only' ? 0 : data.cost_savings
  };

  const getSolarColor = (percentage) => {
    if (percentage >= 70) return "text-green-600";
    if (percentage >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  const getBatteryColor = (level) => {
    if (level >= 60) return "bg-green-500";
    if (level >= 30) return "bg-yellow-500";
    return "bg-red-500";
  };

  // Don't show energy dashboard if no digital power source
  if (powerSource === 'no_digital') {
    return (
      <Card className="glass-card border-0 shadow-lg">
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="app-text font-semibold text-gray-900 mb-2">No Digital Energy System</h3>
          <p className="app-text text-gray-600">
            Digital energy monitoring is not available for your setup. Please configure your power source in settings to enable energy tracking.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Power Source Status - Only show if has solar or mixed */}
      {(powerSource === 'solar_only' || powerSource === 'solar_grid') && (
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
            {!hasSolarId && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                <p className="app-text text-yellow-800 flex items-center gap-2">
                  <AlertCircle className="app-icon" />
                  Solar System ID not configured. Please add it in settings for accurate monitoring.
                </p>
              </div>
            )}
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
            
            {powerSource !== 'grid_only' && (
              <div className="flex items-center gap-2 pt-2">
                <div className={`w-3 h-3 rounded-full ${getBatteryColor(adjustedData.battery_level)}`}></div>
                <span className="app-text font-medium text-gray-600">
                  Battery: {adjustedData.battery_level}%
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Energy Usage */}
      <Card className="glass-card border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="app-heading flex items-center gap-2">
            <Zap className="app-icon text-blue-500" />
            Energy Usage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="app-heading font-bold text-gray-900">
              {data.current_usage?.toFixed(1) || '0.0'} kWh
            </div>
            <p className="app-text text-gray-500">Current usage</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="app-text font-semibold text-gray-700">
                {data.daily_usage?.toFixed(1) || '0.0'}
              </div>
              <p className="app-text text-gray-500">Daily kWh</p>
            </div>
            <div className="text-center">
              <div className="app-text font-semibold text-green-600">
                ₦{data.cost_savings?.toFixed(0) || '0'}
              </div>
              <p className="app-text text-gray-500">Savings today</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Energy Tips */}
      <Card className="glass-card border-0 shadow-lg bg-gradient-to-br from-green-50 to-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Leaf className="app-icon text-white" />
            </div>
            <div>
              <h3 className="app-text font-semibold text-gray-900 mb-1">Energy Tip</h3>
              <p className="app-text text-gray-600">
                {data.solar_percentage > 50 
                  ? "Your solar panels are performing well today! Consider running heavy appliances now to maximize solar usage."
                  : "Solar generation is low. Consider using energy-efficient appliances to reduce costs."
                }
              </p>
              <Badge className="mt-2 bg-green-100 text-green-800 border-green-200">
                {data.solar_percentage > 50 ? "Optimal time" : "Energy saving"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}