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
import { Home } from "lucide-react";

export default function AddRoomModal({ isOpen, onClose, onSave }) {
  const [roomData, setRoomData] = useState({
    name: "",
    appliances: [],
    occupancy_status: false
  });

  const handleSave = () => {
    if (roomData.name.trim()) {
      onSave(roomData);
      setRoomData({
        name: "",
        appliances: [],
        occupancy_status: false
      });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="app-heading flex items-center gap-2">
            <Home className="w-6 h-6 text-blue-600 app-icon" />
            Add New Room
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Room Name */}
          <div>
            <Label className="app-text font-medium text-gray-700">
              Room Name
            </Label>
            <Input
              placeholder="e.g., Living Room, Kitchen"
              value={roomData.name}
              onChange={(e) =>
                setRoomData((prev) => ({ ...prev, name: e.target.value }))
              }
              className="app-text mt-1"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="app-text">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!roomData.name.trim()}
              className="app-text bg-blue-600 hover:bg-blue-700"
            >
              Create Room
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
