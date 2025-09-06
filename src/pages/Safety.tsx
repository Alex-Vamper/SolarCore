import { useState, useEffect } from "react";
import { User, SafetySystem, Room, UserSettings } from "@/entities/all";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Shield, AlertTriangle, CheckCircle } from "lucide-react";

import SafetyPanel from "../components/safety/SafetyPanel";
import SecurityOverview from "../components/security/SecurityOverview";
import AddSafetySystemModal from "../components/safety/AddSafetySystemModal";
import SafetySystemSettingsModal from "../components/safety/SafetySystemSettingsModal";

export default function Safety() {
  const [safetySystems, setSafetySystems] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedSystem, setSelectedSystem] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await User.me();
      const [systemsData, roomsData] = await Promise.all([
        SafetySystem.filter({ created_by: currentUser.email }),
        Room.filter({ created_by: currentUser.email })
      ]);
      setSafetySystems(systemsData);
      setRooms(roomsData);
    } catch (error) {
      console.error("Error loading safety data:", error);
    }
    setIsLoading(false);
  };

  const handleAddSystem = async (systemData) => {
    try {
        const newSystem = await SafetySystem.create(systemData);
        await loadData();
        setShowAddModal(false);
        toast({
          title: "Success",
          description: `Safety system ${systemData.system_id} added successfully`,
        });
        
        // Trigger event for synchronization
        window.dispatchEvent(new CustomEvent('safetyStateChanged', { 
          detail: { safetySystemId: newSystem.id } 
        }));
    } catch(error) {
        console.error("Error adding safety system", error);
        toast({
          title: "Error",
          description: "Failed to add safety system",
          variant: "destructive"
        });
    }
  }

  const handleDeleteSystem = async (systemId) => {
    try {
        await SafetySystem.delete(systemId);
        loadData();
        setShowSettingsModal(false);
        setSelectedSystem(null);
    } catch(error) {
        console.error("Error deleting safety system", error);
    }
  };

  const handleManualOverride = async (systemId, action) => {
    try {
      const system = safetySystems.find(s => s.id === systemId);
      let updates = {};

      switch (action) {
        case "activate_suppression":
          updates = { status: "suppression_active" };
          break;
        case "close_window":
          updates = { 
            sensor_readings: { 
              ...system.sensor_readings, 
              window_status: "closed" 
            }
          };
          break;
        case "open_window":
          updates = { 
            sensor_readings: { 
              ...system.sensor_readings, 
              window_status: "open" 
            }
          };
          break;
      }

      await SafetySystem.update(systemId, updates);
      loadData();
    } catch (error) {
      console.error("Error with manual override:", error);
    }
  };

  const handleSystemSettings = (system) => {
    setSelectedSystem(system);
    setShowSettingsModal(true);
  };
  
  const handleSaveSystemSettings = async (system) => {
      // This function is passed to the settings modal
      // but the actual save logic will be within the modal itself for simplicity
      console.log("Settings saved for:", system);
      loadData();
  }

  const handleSecurityModeToggle = async (enabled) => {
    console.log("Security mode:", enabled ? "ENABLED" : "DISABLED");
    // Here you would typically call an API to toggle all appliances
    // For now, we'll just simulate the action
    await new Promise(resolve => setTimeout(resolve, 2000));
  };

  const handleSecuritySettings = async (settings) => {
    try {
      // Save security settings to user settings
      await UserSettings.upsert({
        security_settings: {
          ...settings,
          door_security_id: settings.door_security_id || '',
          door_security_series: settings.door_security_series || ''
        }
      });
      
      console.log("Security settings saved:", settings);
      
      // Trigger event for synchronization
      window.dispatchEvent(new CustomEvent('securityModeChanged', { 
        detail: { settings } 
      }));
    } catch (error) {
      console.error("Error saving security settings:", error);
    }
  };

  const getOverallStatus = () => {
    if (safetySystems.length === 0) return "unknown";
    
    const hasActive = safetySystems.some(s => s.status === "active" || s.status === "suppression_active");
    const hasAlert = safetySystems.some(s => s.status === "alert");
    
    if (hasActive) return "active";
    if (hasAlert) return "alert";
    return "safe";
  };

  const getStatusStats = () => {
    const safe = safetySystems.filter(s => s.status === "safe").length;
    const alert = safetySystems.filter(s => s.status === "alert").length;
    const active = safetySystems.filter(s => s.status === "active" || s.status === "suppression_active").length;
    
    return { safe, alert, active };
  };

  const overallStatus = getOverallStatus();
  const stats = getStatusStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <div className="w-8 h-8 bg-white rounded-full"></div>
          </div>
          <p className="text-gray-600 font-inter">Loading safety systems...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24">
      <div className="max-w-[1280px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 font-inter">Safety Systems</h1>
              <p className="text-gray-600 font-inter mt-1">
                Monitor and control your home safety
              </p>
            </div>
            <Button onClick={() => setShowAddModal(true)} className="bg-red-600 hover:bg-red-700 font-inter">
              <Plus className="w-4 h-4 mr-2" />
              Add System
            </Button>
          </div>

          {/* Security Overview */}
          <SecurityOverview 
            onSecurityModeToggle={handleSecurityModeToggle}
            onSecuritySettings={handleSecuritySettings}
          />

          {/* Overall Status */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className={`p-4 rounded-xl ${
              overallStatus === "safe" ? 'bg-green-50 border-green-200' :
              overallStatus === "alert" ? 'bg-yellow-50 border-yellow-200' :
              'bg-red-50 border-red-200'
            } border-2`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  overallStatus === "safe" ? 'bg-green-500' :
                  overallStatus === "alert" ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}>
                  {overallStatus === "safe" ? (
                    <CheckCircle className="w-5 h-5 text-white" />
                  ) : overallStatus === "alert" ? (
                    <AlertTriangle className="w-5 h-5 text-white" />
                  ) : (
                    <Shield className="w-5 h-5 text-white" />
                  )}
                </div>
                <div>
                  <div className="font-semibold text-gray-900 font-inter">Overall Status</div>
                  <div className={`text-sm font-medium ${
                    overallStatus === "safe" ? 'text-green-600' :
                    overallStatus === "alert" ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {overallStatus === "safe" ? "All Systems Safe" :
                    overallStatus === "alert" ? "Alert Active" :
                    "Emergency Active"}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white rounded-xl border-2 border-gray-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 font-inter">{stats.safe}</div>
                <div className="text-sm text-gray-500 font-inter">Safe</div>
              </div>
            </div>

            <div className="p-4 bg-white rounded-xl border-2 border-gray-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600 font-inter">{stats.alert}</div>
                <div className="text-sm text-gray-500 font-inter">Alert</div>
              </div>
            </div>

            <div className="p-4 bg-white rounded-xl border-2 border-gray-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600 font-inter">{stats.active}</div>
                <div className="text-sm text-gray-500 font-inter">Active</div>
              </div>
            </div>
          </div>
        </div>

        {/* Safety Systems */}
        {safetySystems.length > 0 ? (
          <div className="space-y-4">
            {safetySystems.map((system) => (
              <SafetyPanel
                key={system.id}
                system={system}
                onManualOverride={handleManualOverride}
                onSystemSettings={() => handleSystemSettings(system)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 font-inter mb-2">No safety systems configured</h3>
            <p className="text-gray-600 font-inter mb-4">
              Add fire detection and rain sensors to monitor your home
            </p>
            <Button onClick={() => setShowAddModal(true)} className="bg-red-600 hover:bg-red-700 font-inter">
              <Plus className="w-4 h-4 mr-2" />
              Add Safety System
            </Button>
          </div>
        )}

        <AddSafetySystemModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={handleAddSystem}
          rooms={rooms}
        />
        {selectedSystem && (
          <SafetySystemSettingsModal
              isOpen={showSettingsModal}
              onClose={() => {
                  setShowSettingsModal(false);
                  setSelectedSystem(null);
              }}
              system={selectedSystem}
              onSave={handleSaveSystemSettings}
              onDelete={handleDeleteSystem}
          />
        )}
      </div>
    </div>
  );
}