import { useState, useEffect } from "react";
import { User, UserSettings, EnergySystem, SafetySystem, Room } from "@/entities/all";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

import SetupWizard from "../components/onboarding/SetupWizard";
import EnergyOverview from "../components/dashboard/EnergyOverview";
import QuickActions from "../components/dashboard/QuickActions";
import SafetyStatus from "../components/dashboard/SafetyStatus";
import RoomBox from "../components/automation/RoomBox";
import LandingPage from "./LandingPage";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userSettings, setUserSettings] = useState(null);
  const [energyData, setEnergyData] = useState(null);
  const [safetyData, setSafetyData] = useState([]);
  const [quickAccessRooms, setQuickAccessRooms] = useState([]);
  
  // State machine for controlling the view
  const [view, setView] = useState('loading'); // 'loading', 'landing', 'setup', 'dashboard'

  useEffect(() => {
    const landingPageSeen = sessionStorage.getItem('landingPageSeen');
    if (landingPageSeen) {
      // If landing page was seen this session, skip it.
      loadData(true);
    } else {
      // Otherwise, load data and then show landing page.
      loadData(false);
    }
  }, []);

  const loadData = async (skipLanding: boolean) => {
    setView('loading');
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      const settingsResult = await UserSettings.filter({ created_by: currentUser.email });
      const userSetting = settingsResult.length > 0 ? settingsResult[0] : null;
      setUserSettings(userSetting);

      if (userSetting?.setup_completed) {
        const [energyResult, safetyResult, roomsResult] = await Promise.all([
            EnergySystem.filter({ created_by: currentUser.email }),
            SafetySystem.filter({ created_by: currentUser.email }),
            Room.filter({ created_by: currentUser.email }, 'created_at', 'desc')
        ]);
        
        setEnergyData(energyResult[0] || null);
        setSafetyData(safetyResult);
        setQuickAccessRooms(roomsResult);
        
        if (skipLanding) {
          setView('dashboard');
          return;
        }
      }
      
      // Default to landing page if not skipping or setup not complete
      setView('landing');

    } catch (error) {
      console.error("Error loading data:", error);
      setView('landing'); // Fallback to landing on error
    }
  };

  const handleSetupComplete = async (setupData: any) => {
    setView('loading');
    try {
      // 1. Create UserSettings
      await UserSettings.create({
        setup_completed: true,
        building_type: setupData.buildingType,
        building_name: setupData.buildingName,
        total_rooms: setupData.rooms.length,
        energy_mode: setupData.energySource === "mixed" ? "auto_switch" : 
                    setupData.energySource === "solar" ? "solar_only" : "grid_only"
      });

      // 2. Create Rooms
      const roomPromises = setupData.rooms.map((room: any, index: number) => {
        return Room.create({
            name: room.name,
            appliances: [],
            dome_count: 0,
            occupancy_status: false,
            order: index
        });
      });
      await Promise.all(roomPromises);

      // 3. Create EnergySystem
      await EnergySystem.create({
        energy_source: setupData.energySource,
        solar_percentage: setupData.energySource === "solar" ? 100 : 65,
        grid_percentage: setupData.energySource === "grid" ? 100 : 35,
        battery_level: 78,
        current_usage: 0,
        daily_usage: 0,
        cost_savings: 0
      });

      // 4. Reload all data and switch to dashboard view
      await loadData(true); // pass true to skip landing page after setup
    } catch (error) {
      console.error("Error completing setup:", error);
      setView('landing'); // Go back to landing on error
    }
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

  const handleGetStarted = () => {
    sessionStorage.setItem('landingPageSeen', 'true');
    if (userSettings?.setup_completed) {
      setView('dashboard');
    } else {
      setView('setup');
    }
  };

  // --- Render logic based on view state ---

  if (view === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-solarcore-gray">
        <div className="text-center">
          <div className="w-16 h-16 gradient-solarcore rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <div className="w-8 h-8 bg-white rounded-full"></div>
          </div>
          <p className="text-gray-600 font-inter">Loading your smart home...</p>
        </div>
      </div>
    );
  }

  if (view === 'landing') {
    return <LandingPage onGetStarted={handleGetStarted} />;
  }

  if (view === 'setup') {
    return <SetupWizard onComplete={handleSetupComplete} />;
  }
  
  if (view === 'dashboard') {
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

  // Fallback case
  return <LandingPage onGetStarted={handleGetStarted} />;
}
