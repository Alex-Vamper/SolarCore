import { useState, useEffect } from "react";
import { User, UserSettings, EnergySystem, SafetySystem, Room } from "@/entities/all";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

import EnergyOverview from "../components/dashboard/EnergyOverview";
import QuickActions from "../components/dashboard/QuickActions";
import SafetyStatus from "../components/dashboard/SafetyStatus";
import RoomBox from "../components/automation/RoomBox";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [energyData, setEnergyData] = useState(null);
  const [safetyData, setSafetyData] = useState([]);
  const [quickAccessRooms, setQuickAccessRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      const [energyResult, safetyResult, roomsResult] = await Promise.all([
        EnergySystem.filter({ created_by: currentUser.email }),
        SafetySystem.filter({ created_by: currentUser.email }),
        Room.filter({ created_by: currentUser.email }, 'created_at', 'desc')
      ]);
      
      setEnergyData(energyResult[0] || null);
      setSafetyData(safetyResult);
      setQuickAccessRooms(roomsResult.slice(0, 3)); // Show top 3 rooms for quick access
      
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  const handleQuickAction = async (actionType: string) => {
    console.log(`Executing quick action: ${actionType}`);
    
    switch (actionType) {
      case "lights_off":
        break;
      case "night_mode":
        break;
      case "fire_alert":
        navigate(createPageUrl("Safety"));
        break;
      case "security_mode":
        break;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <div className="w-8 h-8 bg-white rounded-full"></div>
          </div>
          <p className="text-gray-600 font-inter">Loading your smart home...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Welcome Header */}
      <div className="text-center py-6">
        <h1 className="text-2xl font-bold text-gray-900 font-inter">
          Welcome back, {user?.full_name?.split(' ')[0] || 'User'}!
        </h1>
        <p className="text-gray-600 font-inter mt-1">
          Your smart home is running smoothly
        </p>
      </div>

      {/* Energy Overview */}
      <EnergyOverview energyData={energyData} />

      {/* Quick Actions */}
      <QuickActions onAction={handleQuickAction} />
      
      {/* Quick Access Rooms */}
      {quickAccessRooms.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 font-inter">Quick Access Rooms</h3>
          <div className="space-y-3">
            {quickAccessRooms.map((room: any) => (
              <RoomBox key={room.id} room={room} dragHandleProps={null} />
            ))}
          </div>
        </div>
      )}

      {/* Safety Status */}
      <SafetyStatus safetyData={safetyData} />
    </div>
  );
}