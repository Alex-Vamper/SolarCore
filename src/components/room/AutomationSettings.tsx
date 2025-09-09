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
          <CardTitle className="app-heading flex items-center gap-2">
            <Home className="app-icon text-blue-600" />
            General
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label className="app-text font-medium text-gray-700">Room Name</Label>
              <Input
                value={generalSettings.name}
                onChange={(e) => setGeneralSettings(prev => ({ ...prev, name: e.target.value }))}
                className="app-text mt-1"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label className="app-text font-medium text-gray-700">Occupancy Detection</Label>
                <p className="app-text text-gray-500">Enable PIR sensor for occupancy detection</p>
              </div>
              <Switch
                checked={generalSettings.occupancy_detection}
                onCheckedChange={(checked) => setGeneralSettings(prev => ({ ...prev, occupancy_detection: checked }))}
              />
            </div>

            {generalSettings.occupancy_detection && (
              <div>
                <Label className="app-text font-medium text-gray-700">PIR Sensor ID</Label>
                <Input
                  placeholder="Enter hardware ID of the sensor"
                  value={generalSettings.pir_sensor_id}
                  onChange={(e) => setGeneralSettings(prev => ({ ...prev, pir_sensor_id: e.target.value }))}
                  className="app-text mt-1"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" className="app-text">Cancel</Button>
            <Button onClick={handleSaveGeneral} className="app-text bg-blue-600 hover:bg-blue-700">
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Automation Settings */}
      <Card className="glass-card border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="app-heading flex items-center gap-2">
            <Settings className="app-icon text-purple-600" />
            Automation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Schedule Automation */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="app-text font-medium text-gray-700">Schedule Automation</Label>
                <p className="app-text text-gray-500">Automatically turn devices on/off based on schedule</p>
              </div>
              <Switch
                checked={automationSettings.auto_schedule}
                onCheckedChange={(checked) => setAutomationSettings(prev => ({ ...prev, auto_schedule: checked }))}
              />
            </div>

            {automationSettings.auto_schedule && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="app-text font-medium text-gray-700">Morning On</Label>
                  <Input
                    type="time"
                    value={automationSettings.morning_on}
                    onChange={(e) => setAutomationSettings(prev => ({ ...prev, morning_on: e.target.value }))}
                    className="app-text mt-1"
                  />
                </div>
                <div>
                  <Label className="app-text font-medium text-gray-700">Evening Off</Label>
                  <Input
                    type="time"
                    value={automationSettings.evening_off}
                    onChange={(e) => setAutomationSettings(prev => ({ ...prev, evening_off: e.target.value }))}
                    className="app-text mt-1"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Temperature Control */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Thermometer className="app-icon text-orange-500" />
              <Label className="app-text font-medium text-gray-700">Temperature Control</Label>
            </div>
            
            <div>
              <Label className="app-text font-medium text-gray-700">Temperature Sensor ID</Label>
              <Input
                placeholder="Hardware ID of temperature sensor"
                value={automationSettings.temperature_sensor_id}
                onChange={(e) => setAutomationSettings(prev => ({ ...prev, temperature_sensor_id: e.target.value }))}
                className="app-text mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="app-text font-medium text-gray-700">Turn ON AC above (°C)</Label>
                <Input
                  type="number"
                  value={automationSettings.temp_high}
                  onChange={(e) => setAutomationSettings(prev => ({ ...prev, temp_high: parseInt(e.target.value) || 28 }))}
                  className="app-text mt-1"
                />
              </div>
              <div>
                <Label className="app-text font-medium text-gray-700">Turn OFF AC below (°C)</Label>
                <Input
                  type="number"
                  value={automationSettings.temp_low}
                  onChange={(e) => setAutomationSettings(prev => ({ ...prev, temp_low: parseInt(e.target.value) || 20 }))}
                  className="app-text mt-1"
                />
              </div>
            </div>
            
            <p className="app-text text-gray-500">
              AC will be managed automatically based on these temperature thresholds.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" className="app-text">Cancel</Button>
            <Button onClick={handleSaveAutomation} className="app-text bg-purple-600 hover:bg-purple-700">
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
              <h3 className="app-text font-semibold text-gray-900">Delete Room</h3>
              <p className="app-text text-gray-600">
                Permanently remove this room and all its devices
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="app-text">
                  <Trash2 className="app-icon mr-2" />
                  Delete Room
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="app-heading">Delete {room.name}?</AlertDialogTitle>
                  <AlertDialogDescription className="app-text">
                    This action cannot be undone. This will permanently delete the room
                    and all associated devices and settings.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="app-text">Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={onDeleteRoom}
                    className="app-text bg-red-600 hover:bg-red-700"
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