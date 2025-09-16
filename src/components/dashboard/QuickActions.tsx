import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Room, UserSettings } from "@/entities/all";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useSecurityContext } from "@/contexts/SecurityContext";
import { WindowControlService } from "@/services/WindowControlService";
import { SystemsCheckService } from "@/services/SystemsCheckService";
import SystemsCheckModal from "./SystemsCheckModal";
import SystemsCheckStateService from "@/services/SystemsCheckState";
import { 
  Lightbulb, 
  Move, 
  Shield, 
  Lock,
  Unlock,
  Loader2,
  Eye,
  X
} from "lucide-react";

interface QuickActionsProps {
  onAction?: (actionType: string) => void;
}

export default function QuickActions({ onAction }: QuickActionsProps) {
  const navigate = useNavigate();
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [allLightsOn, setAllLightsOn] = useState(false);
  const [windowsOpen, setWindowsOpen] = useState(false);
  const [systemsCheckModalOpen, setSystemsCheckModalOpen] = useState(false);
  const [systemsCheckResults, setSystemsCheckResults] = useState<any[]>([]);
  const [systemsCheckText, setSystemsCheckText] = useState<string[]>([]);
  const [showSystemsResult, setShowSystemsResult] = useState(false);
  const [persistentSystemsCheck, setPersistentSystemsCheck] = useState<any>(null);
  const { isDoorLocked, updateSecurityState } = useSecurityContext();

  useEffect(() => {
    checkLightStatus();
    checkWindowStatus();
    
    // Load persistent systems check result
    const result = SystemsCheckStateService.get();
    if (result && result.isVisible) {
      setPersistentSystemsCheck(result);
      setShowSystemsResult(true);
      setSystemsCheckResults(result.systems);
    }
    
    // Listen for external systems check trigger (from voice command)
    const handleExternalSystemsCheck = () => {
      handleAction('systems_check');
    };
    
    // Listen for systems check result updates
    const handleResultUpdated = (event: CustomEvent) => {
      const result = event.detail;
      if (result && result.isVisible) {
        setPersistentSystemsCheck(result);
        setShowSystemsResult(true);
        setSystemsCheckResults(result.systems);
      } else {
        setPersistentSystemsCheck(null);
        setShowSystemsResult(false);
      }
    };
    
    window.addEventListener('triggerSystemsCheck', handleExternalSystemsCheck);
    window.addEventListener('systemsCheckResultUpdated', handleResultUpdated as EventListener);
    
    return () => {
      window.removeEventListener('triggerSystemsCheck', handleExternalSystemsCheck);
      window.removeEventListener('systemsCheckResultUpdated', handleResultUpdated as EventListener);
    };
  }, []);

  const checkWindowStatus = async () => {
    try {
      const isOpen = await WindowControlService.getWindowState();
      setWindowsOpen(isOpen);
    } catch (error) {
      console.error("Error checking window status:", error);
    }
  };

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

  const handleAction = async (actionType: string) => {
    setLoadingStates(prev => ({ ...prev, [actionType]: true }));
    
    try {
      switch (actionType) {
        case "toggle_lights":
          await handleLightsToggle();
          break;
        case "window_control":
          await handleWindowControl();
          break;
        case "systems_check":
          await handleSystemsCheck();
          break;
        case "lock_toggle":
          await handleLockToggle();
          break;
      }
      
      if (onAction) {
        await onAction(actionType);
      }
    } finally {
      setLoadingStates(prev => ({ ...prev, [actionType]: false }));
    }
  };

  const handleLightsToggle = async () => {
    try {
      const currentUser = await User.me();
      const rooms = await Room.filter({ created_by: currentUser.email });
      
      const newLightStatus = !allLightsOn;
      
      for (const room of rooms) {
        if (room.appliances && room.appliances.length > 0) {
          const updatedAppliances = room.appliances.map(appliance => 
            appliance.type === 'smart_lighting' 
              ? { ...appliance, status: newLightStatus }
              : appliance
          );
          
          await Room.update(room.id!, { appliances: updatedAppliances });
        }
      }
      
      setAllLightsOn(newLightStatus);
      console.log(`${newLightStatus ? 'Turned on' : 'Turned off'} all lights`);
    } catch (error) {
      console.error("Error toggling lights:", error);
    }
  };

  const handleWindowControl = async () => {
    try {
      const result = await WindowControlService.toggleAllWindows();
      if (result.success) {
        setWindowsOpen(result.isOpen);
        console.log(result.message);
      } else {
        console.error(result.message);
      }
    } catch (error) {
      console.error("Error controlling windows:", error);
    }
  };

  const handleSystemsCheck = async () => {
    try {
      setSystemsCheckText([]);
      setShowSystemsResult(false);
      setPersistentSystemsCheck(null);
      
      // Simulate checking systems with scrolling text
      const checkingMessages = [
        "Scanning fire detection systems...",
        "Checking gas leak sensors...",
        "Verifying rain detection systems...",
        "Testing window sensors...",
        "Analyzing security systems...",
        "Evaluating power systems...",
        "Finalizing system diagnostics..."
      ];

      for (let i = 0; i < checkingMessages.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setSystemsCheckText(prev => [...prev, checkingMessages[i]]);
      }

      // Get actual results
      const results = await SystemsCheckService.checkAllSystems();
      setSystemsCheckResults(results);
      setShowSystemsResult(true);
      
      // Save to persistent state
      SystemsCheckStateService.save(results);

      // Check if Ander AI and voice response are enabled
      const userSettings = await UserSettings.list();
      if (userSettings.length > 0) {
        const settings = userSettings[0];
        if (settings.ander_enabled && settings.voice_response_enabled) {
          // Dispatch event to play the "All Systems Check" voice command audio
          window.dispatchEvent(new CustomEvent('playAllSystemsCheckAudio'));
        }
      }
    } catch (error) {
      console.error("Error checking systems:", error);
      setShowSystemsResult(true);
      setSystemsCheckResults([]);
    }
  };

  const handleLockToggle = async () => {
    try {
      const newLockState = !isDoorLocked;
      
      // Update security state
      updateSecurityState({
        isDoorLocked: newLockState,
        isSecurityMode: newLockState
      });

      // TODO: Update actual security system if configured
      console.log(`Door ${newLockState ? 'locked' : 'unlocked'}`);
    } catch (error) {
      console.error("Error toggling lock:", error);
    }
  };

  const actions = [
    {
      id: "toggle_lights",
      title: allLightsOn ? "Turn Off Lights" : "Turn On Lights",
      icon: Lightbulb,
      bgColor: allLightsOn ? "bg-yellow-500 hover:bg-yellow-600" : "bg-gray-500 hover:bg-gray-600",
      iconColor: "text-white",
      description: allLightsOn ? "Turn off all lights" : "Turn on all lights"
    },
    {
      id: "window_control",
      title: windowsOpen ? "Close Windows" : "Open Windows",
      icon: Move,
      bgColor: windowsOpen ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-500 hover:bg-gray-600",
      iconColor: "text-white",
      description: windowsOpen ? "Close all windows" : "Open all windows"
    },
    {
      id: "systems_check",
      title: "Systems Check",
      icon: Shield,
      bgColor: "bg-green-500 hover:bg-green-600",
      iconColor: "text-white",
      description: "Check all safety systems"
    },
    {
      id: "lock_toggle",
      title: isDoorLocked ? "Unlock House" : "Lock House",
      icon: isDoorLocked ? Unlock : Lock,
      bgColor: isDoorLocked ? "bg-orange-500 hover:bg-orange-600" : "bg-blue-600 hover:bg-blue-700",
      iconColor: "text-white",
      description: isDoorLocked ? "Unlock doors and disable security" : "Lock doors and enable security"
    }
  ];

  return (
    <>
      <Card className="glass-card border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="app-heading">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {actions.map((action) => {
              const IconComponent = action.icon;
              const isLoading = loadingStates[action.id];
              
              return (
                <button
                  key={action.id}
                  className={`
                    h-auto p-4 flex flex-col items-center gap-2 
                    ${action.bgColor} 
                    rounded-lg transition-all duration-200 transform 
                    hover:scale-105 hover:shadow-lg hover:animate-shimmer
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${isLoading ? 'cursor-wait' : 'cursor-pointer'}
                    relative overflow-hidden
                  `}
                  onClick={() => handleAction(action.id)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  ) : (
                    <IconComponent className={`w-8 h-8 ${action.iconColor}`} />
                  )}
                  <span className="text-white font-medium text-center text-sm">
                    {action.title}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Systems Check Loading State */}
          {loadingStates["systems_check"] && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg max-h-32 overflow-y-auto">
              <div className="space-y-1">
                {systemsCheckText.map((text, index) => (
                  <div key={index} className="app-text text-sm text-gray-600 animate-pulse">
                    {text}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Systems Check Result - Persistent */}
          {showSystemsResult && !loadingStates["systems_check"] && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg relative">
              <button
                onClick={() => {
                  SystemsCheckStateService.hide();
                  setShowSystemsResult(false);
                  setPersistentSystemsCheck(null);
                }}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close systems check result"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="text-center">
                <Shield className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="app-text font-semibold text-green-800">
                  {systemsCheckResults.length > 0 ? "All systems are optimal." : "No safety systems found."}
                </p>
                {systemsCheckResults.length > 0 ? (
                  <button 
                    className="app-text text-sm text-green-600 hover:underline mt-1"
                    onClick={() => setSystemsCheckModalOpen(true)}
                  >
                    View Details
                  </button>
                ) : (
                  <p className="app-text text-sm text-gray-600 mt-2">
                    Please purchase devices from{" "}
                    <a 
                      href="https://solar-core-powered-living.vercel.app" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      solar-core-powered-living.vercel.app
                    </a>{" "}
                    and add them on the Safety page.
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <SystemsCheckModal
        isOpen={systemsCheckModalOpen}
        onClose={() => setSystemsCheckModalOpen(false)}
        systems={systemsCheckResults}
      />
    </>
  );
}