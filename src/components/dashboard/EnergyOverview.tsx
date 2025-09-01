import * as React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Sun, 
  Zap, 
  Battery, 
  TrendingUp, 
  Leaf,
  DollarSign
} from "lucide-react";

export default function EnergyOverview({ energyData }) {
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

  return (
    <div className="space-y-4">
      {/* Power Source Status */}
      <Card className="glass-card border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-inter">
            <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
              <Sun className="w-4 h-4 text-white" />
            </div>
            Power Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 font-inter">Solar</span>
                <span className={`text-sm font-bold ${getSolarColor(data.solar_percentage)}`}>
                  {data.solar_percentage}%
                </span>
              </div>
              <Progress value={data.solar_percentage} className="h-2 bg-gray-200" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 font-inter">Grid</span>
                <span className="text-sm font-bold text-blue-600">
                  {data.grid_percentage}%
                </span>
              </div>
              <Progress value={data.grid_percentage} className="h-2 bg-gray-200" />
            </div>
          </div>
          
          <div className="flex items-center gap-2 pt-2">
            <div className={`w-3 h-3 rounded-full ${getBatteryColor(data.battery_level)}`}></div>
            <span className="text-sm font-medium text-gray-600 font-inter">
              Battery: {data.battery_level}%
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Energy Usage */}
      <Card className="glass-card border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-inter">
            <Zap className="w-5 h-5 text-blue-500" />
            Energy Usage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 font-inter">
              {data.current_usage?.toFixed(1) || '0.0'} kWh
            </div>
            <p className="text-sm text-gray-500 font-inter">Current usage</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-700 font-inter">
                {data.daily_usage?.toFixed(1) || '0.0'}
              </div>
              <p className="text-xs text-gray-500 font-inter">Daily kWh</p>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600 font-inter">
                ₦{data.cost_savings?.toFixed(0) || '0'}
              </div>
              <p className="text-xs text-gray-500 font-inter">Savings today</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Energy Tips */}
      <Card className="glass-card border-0 shadow-lg bg-gradient-to-br from-green-50 to-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 font-inter mb-1">Energy Tip</h3>
              <p className="text-sm text-gray-600 font-inter">
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