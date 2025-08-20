
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { User, Room } from "@/entities/all";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Power, 
  Shield, 
  Home as HomeIcon, 
  Moon,
  Lightbulb
} from "lucide-react";

export default function QuickActions({ onAction }) {
  const [isLoading, setIsLoading] = useState(null);
  const [allLightsOn, setAllLightsOn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkLightStatus();
  }, []);

  const checkLightStatus = async () => {
    try {
      const currentUser = await User.me();
      const rooms = await Room.filter({ created_by: currentUser.email });
      
      const hasActiveLights = rooms.some(room => 
        room.appliances?.some(app => app.type === 'smart_lighting' && app.status)
      );
      
      setAllLightsOn(hasActiveLights);
    } catch (error) {
      console.error("Error checking light status:", error);
    }
  };

  const handleAction = async (actionType) => {
    setIsLoading(actionType);
    try {
      if (actionType === "toggle_lights") {
        await handleLightsToggle();
      } else if (actionType === "night_mode") {
        await handleNightMode();
      } else if (actionType === "fire_safety") {
        navigate(createPageUrl("Safety"));
      } else if (actionType === "security_mode") {
        await handleSecurityMode();
        navigate(createPageUrl("Safety"));
      }
      
      if (onAction) {
        await onAction(actionType);
      }
    } finally {
      setIsLoading(null);
    }
  };

  const handleLightsToggle = async () => {
    try {
      const currentUser = await User.me();
      const rooms = await Room.filter({ created_by: currentUser.email });
      
      const newLightStatus = !allLightsOn;
      
      const updatePromises = rooms.map(room => {
        const hasLights = room.appliances?.some(app => app.type === 'smart_lighting');
        if (!hasLights) return Promise.resolve();
        
        const updatedAppliances = room.appliances.map(app => 
          app.type === 'smart_lighting' ? { ...app, status: newLightStatus } : app
        );
        
        return Room.update(room.id, { appliances: updatedAppliances });
      });
      
      await Promise.all(updatePromises);
      setAllLightsOn(newLightStatus);
    } catch (error) {
      console.error("Error toggling lights:", error);
    }
  };

  const handleNightMode = async () => {
    try {
      const currentUser = await User.me();
      const rooms = await Room.filter({ created_by: currentUser.email });
      
      const updatePromises = rooms.map(room => {
        const hasDomes = room.appliances?.some(app => app.series?.toLowerCase().includes('solardome'));
        if (!hasDomes) return Promise.resolve();
        
        const updatedAppliances = room.appliances.map(app => 
          app.series?.toLowerCase().includes('solardome')
            ? { ...app, status: true, intensity: 20, color_tint: "warm" }
            : app
        );
        
        return Room.update(room.id, { appliances: updatedAppliances });
      });
      
      await Promise.all(updatePromises);
    } catch (error) {
      console.error("Error setting night mode:", error);
    }
  };

  const handleSecurityMode = async () => {
    try {
      const currentUser = await User.me();
      const rooms = await Room.filter({ created_by: currentUser.email });
      
      // Turn off all appliances (now implicitly includes dome_light types)
      const updatePromises = rooms.map(room => {
        if (!room.appliances?.length) return Promise.resolve();
        
        const updatedAppliances = room.appliances.map(app => ({ ...app, status: false }));
        return Room.update(room.id, { appliances: updatedAppliances });
      });
      
      await Promise.all(updatePromises);
      setAllLightsOn(false);
    } catch (error) {
      console.error("Error activating security mode:", error);
    }
  };

  const actions = [
    {
      id: "toggle_lights",
      title: allLightsOn ? "All Lights Off" : "All Lights On",
      icon: allLightsOn ? Power : Lightbulb,
      color: allLightsOn ? "bg-red-500 hover:bg-red-600" : "bg-yellow-500 hover:bg-yellow-600",
      description: allLightsOn ? "Turn off all lights" : "Turn on all lights"
    },
    {
      id: "night_mode",
      title: "Night Mode",
      icon: Moon,
      color: "bg-indigo-500 hover:bg-indigo-600",
      description: "Dim all dome lights"
    },
    {
      id: "fire_safety",
      title: "Fire Safety",
      icon: Shield,
      color: "bg-orange-500 hover:bg-orange-600",
      description: "Check fire systems"
    },
    {
      id: "security_mode",
      title: "Lock House",
      icon: HomeIcon,
      color: "bg-red-600 hover:bg-red-700",
      description: "Secure & power down"
    }
  ];

  return (
    <Card className="glass-card border-0 shadow-lg">
      <CardContent className="p-4">
        <h3 className="font-semibold text-gray-900 font-inter mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => (
            <Button
              key={action.id}
              variant="outline"
              className={`${action.color} text-white border-0 h-auto p-3 flex flex-col items-center gap-2 transition-all duration-200 hover:scale-105 hover:shadow-lg`}
              onClick={() => handleAction(action.id)}
              disabled={isLoading === action.id}
            >
              {isLoading === action.id ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <action.icon className="w-5 h-5" />
              )}
              <div className="text-center">
                <div className="text-sm font-medium">{action.title}</div>
                <div className="text-xs opacity-80">{action.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
