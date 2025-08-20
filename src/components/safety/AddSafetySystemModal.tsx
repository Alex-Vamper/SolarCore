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
import { Shield, Key } from "lucide-react";

export default function AddSafetySystemModal({ isOpen, onClose, onSave, rooms = [] }) {
  const [systemData, setSystemData] = useState({
    system_id: "",
    room_name: "",
    system_type: "fire_detection",
  });

  const handleSave = () => {
    if (systemData.room_name && systemData.system_id) {
      onSave(systemData);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-inter">
            <Shield className="w-6 h-6 text-red-600" />
            Add Safety System
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div>
            <Label className="text-sm font-medium text-gray-700 font-inter flex items-center gap-1">
              <Key className="w-3 h-3" /> System ID
            </Label>
            <Input
              placeholder="Enter unique hardware ID"
              value={systemData.system_id}
              onChange={(e) => setSystemData(prev => ({ ...prev, system_id: e.target.value }))}
              className="mt-1 font-inter"
            />
             <p className="text-xs text-gray-500 mt-1">This ID links the physical device to your account.</p>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700 font-inter">System Type</Label>
            <select
              value={systemData.system_type}
              onChange={(e) => setSystemData(prev => ({ ...prev, system_type: e.target.value }))}
              className="w-full mt-1 p-2 border border-gray-300 rounded-lg font-inter"
            >
              <option value="fire_detection">Fire Detection</option>
              <option value="window_rain">Rain Detection</option>
              <option value="gas_leak">Gas Leakage</option>
              <option value="water_overflow">Water Level</option>
            </select>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700 font-inter">Assign to Room</Label>
            <select
              value={systemData.room_name}
              onChange={(e) => setSystemData(prev => ({ ...prev, room_name: e.target.value }))}
              className="w-full mt-1 p-2 border border-gray-300 rounded-lg font-inter"
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
          <Button variant="outline" onClick={onClose} className="font-inter">
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!systemData.room_name || !systemData.system_id}
            className="bg-red-600 hover:bg-red-700 font-inter"
          >
            Add System
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}