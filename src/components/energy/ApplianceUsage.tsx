import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Home, 
  Lightbulb, 
  Fan, 
  Zap, 
  Snowflake,
  TrendingUp,
  TrendingDown,
  Power,
  Camera,
  Wind,
  Layers,
  Move
} from "lucide-react";

const APPLIANCE_ICONS = {
  smart_lighting: Lightbulb,
  smart_hvac: Snowflake,
  smart_shading: Layers,
  smart_socket: Zap,
  smart_camera: Camera,
  motion_sensor: Move,
  air_quality: Wind
};

const APPLIANCE_COLORS = {
  smart_lighting: "text-yellow-500",
  smart_hvac: "text-cyan-500",
  smart_shading: "text-blue-500",
  smart_socket: "text-green-500",
  smart_camera: "text-purple-500",
  motion_sensor: "text-orange-500",
  air_quality: "text-teal-500"
};

export default function ApplianceUsage({ rooms }) {
  const [selectedRoom, setSelectedRoom] = useState("all");
  const [sortBy, setSortBy] = useState("usage");
  const [timeFilter, setTimeFilter] = useState("daily");

  const getAllAppliances = () => {
    const allAppliances = [];
    rooms.forEach(room => {
      if (room.appliances && room.appliances.length > 0) {
        room.appliances.forEach(appliance => {
          allAppliances.push({
            ...appliance,
            room_name: room.name,
            room_id: room.id,
            // Default all usage data to 0 until real backend data is available
            daily_usage: 0, // kWh
            weekly_usage: 0,
            monthly_usage: 0,
            daily_cost: 0, // Will be calculated from actual usage when available
            weekly_cost: 0,
            monthly_cost: 0
          });
        });
      }
    });
    return allAppliances;
  };

  const filteredAppliances = getAllAppliances()
    .filter(appliance => selectedRoom === "all" || appliance.room_name === selectedRoom)
    .sort((a, b) => {
      if (sortBy === "usage") {
        return b[`${timeFilter}_usage`] - a[`${timeFilter}_usage`];
      } else if (sortBy === "alphabetical") {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

  const getUsageValue = (appliance) => {
    return appliance[`${timeFilter}_usage`] || 0;
  };

  const getCostValue = (appliance) => {
    return appliance[`${timeFilter}_cost`] || 0;
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={selectedRoom}
          onChange={(e) => setSelectedRoom(e.target.value)}
          className="flex-1 p-2 border border-gray-300 rounded-lg bg-white font-inter"
        >
          <option value="all">All Rooms</option>
          {rooms.map(room => (
            <option key={room.id} value={room.name}>{room.name}</option>
          ))}
        </select>
        
        <select
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value)}
          className="flex-1 p-2 border border-gray-300 rounded-lg bg-white font-inter"
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
        
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="flex-1 p-2 border border-gray-300 rounded-lg bg-white font-inter"
        >
          <option value="usage">Sort by Usage</option>
          <option value="alphabetical">Sort A-Z</option>
        </select>
      </div>

      {/* Appliance Cards */}
      <div className="space-y-3">
        {filteredAppliances.length > 0 ? (
          filteredAppliances.map((appliance, index) => {
            const IconComponent = APPLIANCE_ICONS[appliance.type] || Zap;
            const iconColor = APPLIANCE_COLORS[appliance.type] || "text-gray-500";
            
            return (
              <Card key={`${appliance.room_id}-${appliance.name}-${index}`} className="glass-card border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        appliance.status ? 'bg-yellow-50' : 'bg-gray-50'
                      }`}>
                        <IconComponent className={`w-5 h-5 ${
                          appliance.status ? 'text-yellow-600' : iconColor
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium font-inter">{appliance.name}</div>
                        <div className="text-sm text-gray-500 font-inter">
                          {appliance.room_name} • {appliance.series}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-semibold text-gray-900 font-inter">
                          {getUsageValue(appliance).toFixed(2)} kWh
                        </div>
                        <div className="text-sm text-gray-500 font-inter">
                          ₦{getCostValue(appliance).toFixed(0)}
                        </div>
                      </div>
                      
                      <Button
                        size="icon"
                        onClick={() => {
                          console.log(`Toggle ${appliance.name} in ${appliance.room_name}`);
                        }}
                        className={`transition-all duration-300 rounded-full w-8 h-8 ${
                          appliance.status
                            ? 'bg-yellow-400 text-white shadow-lg shadow-yellow-400/50'
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                      >
                        <Power className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {appliance.status && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Power className="w-3 h-3" />
                        <span className="font-inter">Currently using {appliance.power_usage || 0}W</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="text-center py-12">
            <Home className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 font-inter">No appliances found in selected room</p>
          </div>
        )}
      </div>
    </div>
  );
}