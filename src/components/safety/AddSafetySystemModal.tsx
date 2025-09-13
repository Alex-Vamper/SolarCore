import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Shield, Key, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SafetySystemService } from "@/entities/SafetySystem";

export default function AddSafetySystemModal({ isOpen, onClose, onSave, rooms = [] }) {
  const [systemData, setSystemData] = useState({
    system_id: "",
    room_name: "",
    system_type: "fire_detection",
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!systemData.room_name || !systemData.system_id) {
      return;
    }

    setIsLoading(true);
    try {
      // Call the RPC to validate ESP ID
      const { data: claimResult, error: claimError } = await supabase.rpc('claim_parent_device', {
        p_esp_id: systemData.system_id.trim()
      });

      console.log('Claim result:', claimResult, 'Error:', claimError);

      if (claimError) {
        console.error('RPC error:', claimError);
        toast({
          title: "Error",
          description: "Failed to validate device. Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const result = claimResult as any;
      if (!result?.success) {
        if (result?.code === 'UNREGISTERED_DEVICE') {
          toast({
            title: "Invalid Device ID",
            description: "This device ID is not registered. Please check the ID and try again.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        } else if (result?.code === 'ALREADY_CLAIMED') {
          // Already claimed by this user is OK
          if (result?.message !== 'Device already claimed by you') {
            toast({
              title: "Device Already Claimed",
              description: "This device is already claimed by another account.",
              variant: "destructive",
            });
            setIsLoading(false);
            return;
          }
        } else {
          // Other error
          toast({
            title: "Error",
            description: result?.message || "Failed to claim device.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
      }

      // If valid, proceed with creating the child device
      console.log('Creating safety system with data:', systemData);
      
      const safetySystemData = {
        system_id: systemData.system_id,
        system_type: systemData.system_type as 'fire_detection' | 'rain_detection' | 'gas_leak' | 'water_overflow',
        room_name: systemData.room_name,
        status: 'safe' as const,
        flame_status: 'clear' as const,
        temperature_value: 25,
        smoke_percentage: 0,
        sensor_readings: {
          gas_level: 0,
          smoke_level: 0,
          temperature: 25,
          water_level: 0,
          rain_detected: false,
          window_status: "closed",
          flame_detected: false
        },
        automation_settings: {
          trigger_threshold: 75,
          notification_level: "all",
          auto_response_enabled: true
        }
      };
      
      console.log('Calling SafetySystemService.create with:', safetySystemData);
      const createdSystem = await SafetySystemService.create(safetySystemData);
      console.log('Safety system created:', createdSystem);
      
      // Call parent component's onSave
      if (onSave) {
        await onSave(systemData);
      }
      
      toast({
        title: "Success",
        description: "Safety system added successfully",
      });
      
      // Reset form
      setSystemData({
        system_id: "",
        room_name: "",
        system_type: "fire_detection",
      });
      
      onClose();
    } catch (error) {
      console.error("Error creating safety system:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create safety system. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="app-heading flex items-center gap-2">
            <Shield className="app-icon text-red-600" />
            Add Safety System
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
            <p className="text-sm text-foreground/80">
              Enter your ESP device ID to claim and configure your safety system. 
              The device must be registered in our system.
            </p>
          </div>

          <div>
            <Label className="app-text font-medium text-gray-700 flex items-center gap-1">
              <Key className="app-icon" /> ESP Device ID
            </Label>
            <Input
              placeholder="e.g., SC-GID-0001"
              value={systemData.system_id}
              onChange={(e) => setSystemData(prev => ({ ...prev, system_id: e.target.value.toUpperCase() }))}
              className="app-text mt-1"
            />
          </div>

          <div>
            <Label className="app-text font-medium text-gray-700">System Type</Label>
            <select
              value={systemData.system_type}
              onChange={(e) => setSystemData(prev => ({ ...prev, system_type: e.target.value }))}
              className="app-text w-full mt-1 p-2 border border-gray-300 rounded-lg"
            >
              <option value="fire_detection">🔥 Fire Detection System</option>
              <option value="rain_detection">🌧️ Rain Detection System</option>
              <option value="gas_leak">⚠️ Gas Leak Detection</option>
              <option value="water_overflow">💧 Water Overflow Detection</option>
            </select>
          </div>

          <div>
            <Label className="app-text font-medium text-gray-700">Assign to Room</Label>
            <select
              value={systemData.room_name}
              onChange={(e) => setSystemData(prev => ({ ...prev, room_name: e.target.value }))}
              className="app-text w-full mt-1 p-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select a room</option>
              {rooms.map(room => (
                <option key={room.id} value={room.name}>{room.name}</option>
              ))}
              <option value="External System">External System</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} className="app-text">
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!systemData.room_name || !systemData.system_id || isLoading}
            className="app-text bg-red-600 hover:bg-red-700"
          >
            {isLoading ? "Adding..." : "Add System"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}