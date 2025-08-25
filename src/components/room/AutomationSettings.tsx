import { useState, } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Home,
  Clock,
  Thermometer,
  Trash2,
  Settings
} from "lucide-react";

export default function RoomSettingsTab({ room, onRoomUpdate, onDeleteRoom }) {
  const [generalSettings, setGeneralSettings] = useState({
    name: room.name || "",
    occupancy_detection: room.automation_settings?.auto_mode || false,
    pir_sensor_id: room.pir_sensor_id || "",
  });

  const [automationSettings, setAutomationSettings] = useState({
    auto_schedule: !!room.automation_settings?.schedule?.morning_on,
    morning_on: room.automation_settings?.schedule?.morning_on || "07:00",
    evening_off: room.automation_settings?.schedule?.evening_off || "22:00",
    temperature_sensor_id: room.automation_settings?.temperature_sensor_id || "",
    temp_high: room.automation_settings?.temperature_threshold_high || 28,
    temp_low: room.automation_settings?.temperature_threshold_low || 20,
  });

  const handleSaveGeneral = async () => {
    const updates = {
      name: generalSettings.name,
      pir_sensor_id: generalSettings.pir_sensor_id,
      automation_settings: {
        ...room.automation_settings,
        auto_mode: generalSettings.occupancy_detection,
      }
    };
    
    await onRoomUpdate(updates);
  };

  const handleSaveAutomation = async () => {
    const updates = {
      automation_settings: {
        ...room.automation_settings,
        schedule: automationSettings.auto_schedule ? {
          morning_on: automationSettings.morning_on,
          evening_off: automationSettings.evening_off,
        } : null,
        temperature_sensor_id: automationSettings.temperature_sensor_id,
        temperature_threshold_high: automationSettings.temp_high,
        temperature_threshold_low: automationSettings.temp_low,
      }
    };
    
    await onRoomUpdate(updates);
  };

  return (
    <div className="space-y-6">
      {/* General Settings */}
      <Card className="glass-card border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-inter">
            <Home className="w-5 h-5 text-blue-600" />
            General
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700 font-inter">Room Name</Label>
              <Input
                value={generalSettings.name}
                onChange={(e) => setGeneralSettings(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1 font-inter"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium text-gray-700 font-inter">Occupancy Detection</Label>
                <p className="text-sm text-gray-500 font-inter">Enable PIR sensor for occupancy detection</p>
              </div>
              <Switch
                checked={generalSettings.occupancy_detection}
                onCheckedChange={(checked) => setGeneralSettings(prev => ({ ...prev, occupancy_detection: checked }))}
              />
            </div>

            {generalSettings.occupancy_detection && (
              <div>
                <Label className="text-sm font-medium text-gray-700 font-inter">PIR Sensor ID</Label>
                <Input
                  placeholder="Enter hardware ID of the sensor"
                  value={generalSettings.pir_sensor_id}
                  onChange={(e) => setGeneralSettings(prev => ({ ...prev, pir_sensor_id: e.target.value }))}
                  className="mt-1 font-inter"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" className="font-inter">Cancel</Button>
            <Button onClick={handleSaveGeneral} className="bg-blue-600 hover:bg-blue-700 font-inter">
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Automation Settings */}
      <Card className="glass-card border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-inter">
            <Settings className="w-5 h-5 text-purple-600" />
            Automation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Schedule Automation */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium text-gray-700 font-inter">Schedule Automation</Label>
                <p className="text-sm text-gray-500 font-inter">Automatically turn devices on/off based on schedule</p>
              </div>
              <Switch
                checked={automationSettings.auto_schedule}
                onCheckedChange={(checked) => setAutomationSettings(prev => ({ ...prev, auto_schedule: checked }))}
              />
            </div>

            {automationSettings.auto_schedule && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 font-inter">Morning On</Label>
                  <Input
                    type="time"
                    value={automationSettings.morning_on}
                    onChange={(e) => setAutomationSettings(prev => ({ ...prev, morning_on: e.target.value }))}
                    className="mt-1 font-inter"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 font-inter">Evening Off</Label>
                  <Input
                    type="time"
                    value={automationSettings.evening_off}
                    onChange={(e) => setAutomationSettings(prev => ({ ...prev, evening_off: e.target.value }))}
                    className="mt-1 font-inter"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Temperature Control */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-orange-500" />
              <Label className="text-sm font-medium text-gray-700 font-inter">Temperature Control</Label>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700 font-inter">Temperature Sensor ID</Label>
              <Input
                placeholder="Hardware ID of temperature sensor"
                value={automationSettings.temperature_sensor_id}
                onChange={(e) => setAutomationSettings(prev => ({ ...prev, temperature_sensor_id: e.target.value }))}
                className="mt-1 font-inter"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 font-inter">Turn ON AC above (°C)</Label>
                <Input
                  type="number"
                  value={automationSettings.temp_high}
                  onChange={(e) => setAutomationSettings(prev => ({ ...prev, temp_high: parseInt(e.target.value) || 28 }))}
                  className="mt-1 font-inter"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 font-inter">Turn OFF AC below (°C)</Label>
                <Input
                  type="number"
                  value={automationSettings.temp_low}
                  onChange={(e) => setAutomationSettings(prev => ({ ...prev, temp_low: parseInt(e.target.value) || 20 }))}
                  className="mt-1 font-inter"
                />
              </div>
            </div>
            
            <p className="text-xs text-gray-500 font-inter">
              AC will be managed automatically based on these temperature thresholds.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" className="font-inter">Cancel</Button>
            <Button onClick={handleSaveAutomation} className="bg-purple-600 hover:bg-purple-700 font-inter">
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Room */}
      <Card className="glass-card border-0 shadow-lg border-red-200 bg-red-50/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 font-inter">Delete Room</h3>
              <p className="text-sm text-gray-600 font-inter">
                Permanently remove this room and all its devices
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="font-inter">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Room
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete {room.name}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the room
                    and all associated devices and settings.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={onDeleteRoom}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete Room
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}