import React from "react";
import { Card } from "@/components/ui/card";
import { Battery, Zap, Sun, TrendingUp } from "lucide-react";

interface EnergyOverviewProps {
  energyData: any;
}

export default function EnergyOverview({ energyData }: EnergyOverviewProps) {
  if (!energyData) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 font-inter">Energy Overview</h2>
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 glass-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-solarcore-yellow/20 rounded-lg flex items-center justify-center">
              <Sun className="w-5 h-5 text-solarcore-yellow" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-inter">Solar</p>
              <p className="text-lg font-bold text-gray-900 font-inter">{energyData.solar_percentage}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 glass-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-solarcore-success/20 rounded-lg flex items-center justify-center">
              <Battery className="w-5 h-5 text-solarcore-success" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-inter">Battery</p>
              <p className="text-lg font-bold text-gray-900 font-inter">{energyData.battery_level}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 glass-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-inter">Usage</p>
              <p className="text-lg font-bold text-gray-900 font-inter">{energyData.daily_usage} kWh</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 glass-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-inter">Savings</p>
              <p className="text-lg font-bold text-gray-900 font-inter">${energyData.cost_savings}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}