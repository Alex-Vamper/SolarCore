import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Home, 
  Sun
} from "lucide-react";

export default function AddRoomModal({ isOpen, onClose, onSave }) {
  const [roomData, setRoomData] = useState({
    name: "",
    appliances: [],
    dome_count: 0,
    occupancy_status: false
  });

  const handleSave = () => {
    if (roomData.name.trim()) {
      onSave(roomData);
      setRoomData({
        name: "",
        appliances: [],
        dome_count: 0,
        occupancy_status: false
      });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-inter">
            <Home className="w-6 h-6 text-blue-600" />
            Add New Room
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Room Name */}
          <div>
            <Label className="text-sm font-medium text-gray-700 font-inter">Room Name</Label>
            <Input
              placeholder="e.g., Living Room, Kitchen"
              value={roomData.name}
              onChange={(e) => setRoomData(prev => ({ ...prev, name: e.target.value }))}
              className="mt-1 font-inter"
            />
          </div>

          {/* Dome Count */}
          <div>
            <Label className="text-sm font-medium text-gray-700 font-inter flex items-center gap-1">
                <Sun className="w-4 h-4" /> Solar Domes
            </Label>
            <Input
              type="number"
              min="0"
              placeholder="Number of solar domes in this room"
              value={roomData.dome_count}
              onChange={(e) => setRoomData(prev => ({ ...prev, dome_count: parseInt(e.target.value) || 0 }))}
              className="mt-1 font-inter"
            />
          </div>
          
          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="font-inter">
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!roomData.name.trim()}
              className="bg-blue-600 hover:bg-blue-700 font-inter"
            >
              Create Room
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}