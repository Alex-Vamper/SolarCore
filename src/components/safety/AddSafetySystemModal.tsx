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
      const { data: claimResult } = await supabase.rpc('claim_parent_device', {
        p_esp_id: systemData.system_id.trim()
      }) as any;

      if (!claimResult?.success) {
        if (claimResult?.code === 'UNREGISTERED_DEVICE') {
          toast({
            title: "Invalid Device ID",
            description: "This device ID is not registered. Please check the ID and try again.",
            variant: "destructive",
          });
        } else if (claimResult?.code === 'ALREADY_CLAIMED') {
          // Already claimed by this user is OK
          if (claimResult?.message !== 'Device already claimed by you') {
            toast({
              title: "Device Already Claimed",
              description: "This device is already claimed by another account.",
              variant: "destructive",
            });
            setIsLoading(false);
            return;
          }
        }
        
        // If unregistered, stop here
        if (claimResult?.code === 'UNREGISTERED_DEVICE') {
          setIsLoading(false);
          return;
        }
      }

      // If valid, proceed with saving
      await onSave(systemData);
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
      console.error("Error validating device:", error);
      toast({
        title: "Error",
        description: "Failed to validate device. Please try again.",
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

        <div className="space-y-6 py-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="app-text text-blue-800 flex items-center gap-2">
              <AlertCircle className="app-icon" />
              Enter the ESP ID (e.g., SC-GID-0001) to claim your safety device
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
              <option value="fire_detection">Fire Detection</option>
              <option value="window_rain">Rain Detection</option>
              <option value="gas_leak">Gas Leakage</option>
              <option value="water_overflow">Water Level</option>
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