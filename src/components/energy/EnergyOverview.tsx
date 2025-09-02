import React, { useState, useEffect } from "react";
import { UserSettings } from "@/entities/all";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  AlertTriangle, 
  Sun, 
  Zap, 
  Battery,
  Calendar,
  Clock,
  AlertCircle,
  Settings
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function EnergyOverview({ energyData }) {
  const [timeFilter, setTimeFilter] = useState("today");
  const [userSettings, setUserSettings] = useState(null);
  const navigate = useNavigate();
  
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
  
  const data = energyData || {
    solar_percentage: 0,
    grid_percentage: 0,
    battery_level: 0,
    current_usage: 0,
    daily_usage: 0,
    cost_savings: 0
  };

  const powerSource = userSettings?.power_source || 'grid_only';
  const hasSolarId = userSettings?.solar_system_id;
  const hasGridId = userSettings?.grid_meter_id;
  
  // Adjust data based on power source configuration
  const adjustedData = {
    ...data,
    solar_percentage: powerSource === 'grid_only' ? 0 : data.solar_percentage,
    grid_percentage: powerSource === 'solar_only' ? 0 : data.grid_percentage,
    battery_level: powerSource === 'grid_only' ? 0 : data.battery_level,
    cost_savings: powerSource === 'grid_only' ? 0 : data.cost_savings
  };

  const getUsageByFilter = () => {
    switch (timeFilter) {
      case "today": return data.daily_usage || 0;
      case "week": return (data.daily_usage || 0) * 7;
      case "month": return (data.daily_usage || 0) * 30;
      case "hour": return (data.current_usage || 0);
      default: return data.daily_usage || 0;
    }
  };

  const timeFilters = [
    { id: "hour", label: "Hour", icon: Clock },
    { id: "today", label: "Today", icon: Calendar },
    { id: "week", label: "Week", icon: Calendar },
    { id: "month", label: "Month", icon: Calendar }
  ];

  return (
    <div className="space-y-4">
      {/* Time Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {timeFilters.map((filter) => (
          <Button
            key={filter.id}
            variant={timeFilter === filter.id ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeFilter(filter.id)}
            className="app-text flex items-center gap-2 whitespace-nowrap"
          >
            <filter.icon className="app-icon" />
            {filter.label}
          </Button>
        ))}
      </div>

      {/* Usage Summary */}
      <Card className="glass-card border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="app-heading flex items-center gap-2">
            <TrendingUp className="app-icon text-blue-600" />
            Energy Usage - {timeFilter.charAt(0).toUpperCase() + timeFilter.slice(1)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-4">
            <div className="app-heading font-bold text-gray-900">
              {getUsageByFilter().toFixed(1)} kWh
            </div>
            <p className="app-text text-gray-500">Total consumption</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="app-text font-semibold text-green-700">
                ₦{data.cost_savings?.toFixed(0) || '0'}
              </div>
              <div className="app-text text-gray-600">Savings</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="app-text font-semibold text-blue-700">
                {data.current_usage?.toFixed(1) || '0.0'} kW
              </div>
              <div className="app-text text-gray-600">Current</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Power Source Split - Only show relevant sources */}
      {powerSource !== 'no_digital' ? (
        <Card className="glass-card border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="app-heading flex items-center gap-2">
              <Sun className="app-icon text-yellow-600" />
              Power Source Split
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Show warnings for missing system IDs */}
            {powerSource !== 'grid_only' && !hasSolarId && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                <p className="app-text text-yellow-800 flex items-center gap-2">
                  <AlertCircle className="app-icon" />
                  Solar System ID not configured. 
                  <Button 
                    variant="link" 
                    className="app-text p-0 h-auto text-yellow-800 underline" 
                    onClick={() => navigate('/app/settings')}
                  >
                    Configure in settings
                  </Button>
                </p>
              </div>
            )}
            {powerSource !== 'solar_only' && !hasGridId && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                <p className="app-text text-yellow-800 flex items-center gap-2">
                  <AlertCircle className="app-icon" />
                  Grid Meter ID not configured. 
                  <Button 
                    variant="link" 
                    className="app-text p-0 h-auto text-yellow-800 underline" 
                    onClick={() => navigate('/app/settings')}
                  >
                    Configure in settings
                  </Button>
                </p>
              </div>
            )}

            <div className="space-y-4">
              {/* Only show solar if not grid-only */}
              {powerSource !== 'grid_only' && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sun className="app-icon text-yellow-500" />
                    <span className="app-text font-medium">Solar</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${adjustedData.solar_percentage}%` }}
                      />
                    </div>
                    <span className="app-text text-sm font-bold text-yellow-600 w-12 text-right">
                      {adjustedData.solar_percentage}%
                    </span>
                  </div>
                </div>
              )}
              
              {/* Only show grid if not solar-only */}
              {powerSource !== 'solar_only' && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="app-icon text-blue-500" />
                    <span className="app-text font-medium">Grid</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${adjustedData.grid_percentage}%` }}
                      />
                    </div>
                    <span className="app-text text-sm font-bold text-blue-600 w-12 text-right">
                      {adjustedData.grid_percentage}%
                    </span>
                  </div>
                </div>
              )}
              
              {/* Only show battery if not grid-only */}
              {powerSource !== 'grid_only' && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Battery className="app-icon text-green-500" />
                    <span className="app-text font-medium">Battery</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${adjustedData.battery_level}%` }}
                      />
                    </div>
                    <span className="app-text text-sm font-bold text-green-600 w-12 text-right">
                      {adjustedData.battery_level}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="glass-card border-0 shadow-lg">
          <CardContent className="p-6 text-center">
            <AlertCircle className="app-icon text-yellow-500 mx-auto mb-4" />
            <h3 className="app-text font-semibold text-gray-900 mb-2">No Digital Energy System</h3>
            <p className="app-text text-gray-600 mb-4">
              Digital energy monitoring is not available for your setup.
            </p>
            <Button 
              variant="outline" 
              className="app-text flex items-center gap-2"
              onClick={() => navigate('/app/settings')}
            >
              <Settings className="app-icon" />
              Configure Power Source
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Usage Alerts */}
      <Card className="glass-card border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="app-heading flex items-center gap-2">
            <AlertTriangle className="app-icon text-orange-600" />
            Usage Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.current_usage > 2 ? (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="app-icon text-orange-600" />
                  <span className="app-text font-medium text-orange-800">High Usage Alert</span>
                </div>
                <p className="app-text text-orange-700">
                  Current usage is {data.current_usage.toFixed(1)} kW - consider reducing load
                </p>
              </div>
            ) : (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    <p className="app-text">Normal</p>
                  </Badge>
                  <span className="app-text font-medium text-green-800">Usage Normal</span>
                </div>
                <p className="app-text text-green-700">
                  Your energy consumption is within normal ranges
                </p>
              </div>
            )}
            
            {data.solar_percentage > 70 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Sun className="app-icon text-blue-600" />
                  <span className="app-text font-medium text-blue-800">Optimal Solar Time</span>
                </div>
                <p className="app-text text-blue-700">
                  Great time to run heavy appliances - you're on {data.solar_percentage}% solar power
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}