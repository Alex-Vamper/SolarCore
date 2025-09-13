import { useState, useEffect } from "react";
import { User, ChildDevice, Room, UserSettings, SafetySystem } from "@/entities/all";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Shield, AlertTriangle, CheckCircle } from "lucide-react";
import { useSafetySystemsRealtime } from "@/hooks/useSafetySystemsRealtime";

import SafetyPanel from "../components/safety/SafetyPanel";
import SecurityOverview from "../components/security/SecurityOverview";
import AddSafetySystemModal from "../components/safety/AddSafetySystemModal";
import SafetySystemSettingsModal from "../components/safety/SafetySystemSettingsModal";

export default function Safety() {
  const { safetySystems, isLoading, refresh } = useSafetySystemsRealtime();
  const [rooms, setRooms] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedSystem, setSelectedSystem] = useState(null);

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      const roomsData = await Room.list();
      setRooms(roomsData);
    } catch (error) {
      console.error("Error loading rooms:", error);
    }
  };

  const handleAddSystem = async (systemData) => {
    try {
      // The AddSafetySystemModal already creates the device
      // Just refresh data and show success
      await refresh();
      setShowAddModal(false);
      
      // Trigger event for synchronization
      window.dispatchEvent(new CustomEvent('safetyStateChanged', { 
        detail: { safetySystemId: systemData.system_id } 
      }));
    } catch(error) {
      console.error("Error adding safety system", error);
      toast.error("Error", {
        description: "Failed to add safety system"
      });
    }
  }

  const handleDeleteSystem = async (systemId) => {
    try {
        await ChildDevice.delete(systemId);
        await refresh();
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
          updates = { 
            status: "suppression_active" 
          };
          break;
        case "deactivate_suppression":
          updates = { 
            status: "safe" 
          };
          break;
        case "reset_system":
          updates = { 
            status: "safe",
            flame_status: "clear",
            temperature_value: 25,
            smoke_percentage: 0
          };
          break;
        case "silence_alarm":
          updates = { 
            automation_settings: {
              ...system.automation_settings,
              alarm_silenced: true 
            }
          };
          break;
      }

      await SafetySystem.update(systemId, updates);
      await refresh();
      
      toast.success(`Manual override applied: ${action}`, {
        description: `System ${system.system_id || systemId} has been updated.`,
      });
    } catch (error) {
      console.error(`Error applying manual override:`, error);
      toast.error("Manual override failed", {
        description: "Please try again or contact support if the issue persists.",
      });
    }
  };

  const handleScheduleCheck = async (systemId, schedule) => {
    try {
      const system = safetySystems.find(s => s.id === systemId);
      const updates = { 
        automation_settings: {
          ...system.automation_settings,
          maintenance_schedule: schedule
        }
      };

      await SafetySystem.update(systemId, updates);
      await refresh();
      
      toast.success("Maintenance scheduled", {
        description: `Next check scheduled for ${schedule.next_check}`,
      });
    } catch (error) {
      console.error("Error scheduling check:", error);
      toast.error("Failed to schedule maintenance check");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading safety systems...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-red-600" />
          <div>
            <h1 className="text-3xl font-bold">Safety & Security</h1>
            <p className="text-muted-foreground">Monitor and manage your safety systems</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge 
            variant={safetySystems.some(s => s.status === 'danger') ? 'destructive' : 'default'}
            className="px-4 py-2"
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            {safetySystems.every(s => s.status === 'safe') ? 'All Safe' : 'Alert Active'}
          </Badge>
          
          <Button onClick={() => setShowAddModal(true)} className="bg-red-600 hover:bg-red-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Safety System
          </Button>
        </div>
      </div>

      {/* Safety Systems Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {safetySystems.map((system) => (
          <SafetyPanel
            key={system.id}
            system={system}
            onManualOverride={handleManualOverride}
            onSystemSettings={() => {
              setSelectedSystem(system);
              setShowSettingsModal(true);
            }}
          />
        ))}
      </div>

      {/* Empty State */}
      {safetySystems.length === 0 && (
        <div className="text-center py-12">
          <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Safety Systems</h3>
          <p className="text-muted-foreground mb-4">
            Add your first safety system to start monitoring your property.
          </p>
          <Button onClick={() => setShowAddModal(true)} className="bg-red-600 hover:bg-red-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Safety System
          </Button>
        </div>
      )}

      {/* Security Overview */}
      <div className="border-t pt-6">
        <SecurityOverview 
          onSecurityModeToggle={() => {
            toast.info("Security mode toggle not implemented yet");
          }}
          onSecuritySettings={() => {
            toast.info("Security settings not implemented yet");
          }}
        />
      </div>

      {/* Modals */}
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
          onDelete={() => handleDeleteSystem(selectedSystem.id)}
          onSave={async (updates) => {
            try {
              await SafetySystem.update(selectedSystem.id, updates);
              await refresh();
              setShowSettingsModal(false);
              setSelectedSystem(null);
              toast.success("Settings updated successfully");
            } catch (error) {
              console.error("Error updating system:", error);
              toast.error("Failed to update settings");
            }
          }}
        />
      )}
    </div>
  );
}