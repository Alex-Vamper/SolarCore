import React, { useState, useEffect } from "react";
import { User, EnergySystem, Room } from "@/entities/all";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, 
  Sun, 
  Battery, 
  TrendingUp, 
  Home,
  Receipt
} from "lucide-react";

import EnergyOverview from "../components/energy/EnergyOverview";
import ApplianceUsage from "../components/energy/ApplianceUsage";
import BillingRecharges from "../components/energy/BillingRecharges";

export default function Energy() {
  const [energyData, setEnergyData] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await User.me();
      const [energyResponse, roomsResponse] = await Promise.all([
        EnergySystem.filter({ created_by: currentUser.email }),
        Room.filter({ created_by: currentUser.email })
      ]);
      
      setEnergyData(energyResponse[0] || null);
      setRooms(roomsResponse);
    } catch (error) {
      console.error("Error loading energy data:", error);
    }
    setIsLoading(false);
  };

  const getCurrentSource = () => {
    if (!energyData) return { type: "grid", color: "text-blue-600", icon: Zap };
    
    if (energyData.solar_percentage > energyData.grid_percentage) {
      return { type: "solar", color: "text-yellow-600", icon: Sun };
    } else if (energyData.battery_level > 50 && energyData.grid_percentage === 0) {
      return { type: "battery", color: "text-green-600", icon: Battery };
    } else {
      return { type: "grid", color: "text-blue-600", icon: Zap };
    }
  };

  const currentSource = getCurrentSource();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600 font-inter">Loading energy data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="text-center py-4">
        <h1 className="text-2xl font-bold text-gray-900 font-inter">Energy Hub</h1>
        <p className="text-gray-600 font-inter mt-1">Monitor and manage your energy consumption</p>
      </div>

      {/* Current Status Sticky Header */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl p-4 mb-4 shadow-sm z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              currentSource.type === 'solar' ? 'bg-yellow-500' :
              currentSource.type === 'battery' ? 'bg-green-500' : 'bg-blue-500'
            }`}>
              <currentSource.icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-semibold text-gray-900 font-inter">
                Running on {currentSource.type.charAt(0).toUpperCase() + currentSource.type.slice(1)}
              </div>
              <div className="text-sm text-gray-500 font-inter">
                {energyData?.current_usage?.toFixed(1) || '0.0'} kWh current usage
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-gray-900 font-inter">
              {energyData?.daily_usage?.toFixed(1) || '0.0'} kWh
            </div>
            <div className="text-sm text-gray-500 font-inter">Today</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="overview" className="flex items-center gap-1 text-xs">
            <TrendingUp className="w-3 h-3" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="appliances" className="flex items-center gap-1 text-xs">
            <Home className="w-3 h-3" />
            Appliances
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-1 text-xs">
            <Receipt className="w-3 h-3" />
            Billing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <EnergyOverview energyData={energyData} />
        </TabsContent>

        <TabsContent value="appliances" className="space-y-4">
          <ApplianceUsage rooms={rooms} />
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <BillingRecharges energyData={energyData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}