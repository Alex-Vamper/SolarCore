import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { User, Room, SafetySystem } from "@/entities/all";
import {
  Shield,
  Settings,
  Power,
  Clock,
  Trash2
} from "lucide-react";

export default function SecuritySettingsModal({ isOpen, onClose, onSave }) {
  const [securitySettings, setSecuritySettings] = useState({
    door_security_id: "",
    auto_shutdown_enabled: false,
    shutdown_exceptions: [],
    schedule_enabled: false,
    auto_lock_time: "22:00"
  });
  
  const [userDevices, setUserDevices] = useState([]);
  const [userSafetySystems, setUserSafetySystems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadUserData();
    }
  }, [isOpen]);

  const loadUserData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await User.me();
      const [rooms, safetySystems] = await Promise.all([
        Room.filter({ created_by: currentUser.email }),
        SafetySystem.filter({ created_by: currentUser.email })
      ]);

      // Extract all devices from all rooms
      const allDevices = [];
      rooms.forEach(room => {
        if (room.appliances) {
          room.appliances.forEach(device => {
            allDevices.push({
              ...device,
              room_name: room.name,
              room_id: room.id
            });
          });
        }
      });

      setUserDevices(allDevices);
      setUserSafetySystems(safetySystems);
    } catch (error) {
      console.error("Error loading user data:", error);
    }
    setIsLoading(false);
  };

  const handleSave = () => {
    onSave(securitySettings);
    onClose();
  };

  const toggleDeviceException = (deviceId) => {
    setSecuritySettings(prev => ({
      ...prev,
      shutdown_exceptions: prev.shutdown_exceptions.includes(deviceId)
        ? prev.shutdown_exceptions.filter(id => id !== deviceId)
        : [...prev.shutdown_exceptions, deviceId]
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="app-heading flex items-center gap-2 text-xl">
            <Shield className="app-icon text-blue-600" />
            Security System Settings
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger value="general" className="app-text whitespace-normal py-2">General</TabsTrigger>
            <TabsTrigger value="devices" className="app-text whitespace-normal py-2">Devices</TabsTrigger>
            <TabsTrigger value="safety" className="app-text whitespace-normal py-2">Safety Systems</TabsTrigger>
            <TabsTrigger value="triggers" className="app-text whitespace-normal py-2">Exit Triggers</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card className="glass-card border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="app-text flex items-center gap-2 text-lg">
                  <Settings className="app-icon text-blue-600" />
                  Home Security System
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="app-text text-sm font-medium text-gray-700">Door Security ID</Label>
                  <Input
                    placeholder="Enter hardware ID for door lock system"
                    value={securitySettings.door_security_id}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, door_security_id: e.target.value }))}
                    className="app-text mt-1"
                  />
                  <p className="app-text text-xs text-gray-500 mt-1">Hardware identifier for the main door security system</p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="app-text text-sm font-medium text-gray-700">Auto Power Shutdown</Label>
                    <p className="app-text text-sm text-gray-500">Automatically turn off devices when security mode is activated</p>
                  </div>
                  <Switch
                    checked={securitySettings.auto_shutdown_enabled}
                    onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, auto_shutdown_enabled: checked }))}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="devices" className="space-y-4">
            <Card className="glass-card border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="app-text flex items-center gap-2 text-lg">
                  <Power className="app-icon text-green-600" />
                  Device Exceptions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="app-text text-gray-500">Loading your devices...</p>
                  </div>
                ) : userDevices.length > 0 ? (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {userDevices.map((device) => (
                      <div key={`${device.room_id}-${device.id}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="app-text font-medium">{device.name}</div>
                          <div className="app-text text-sm text-gray-500">
                            {device.room_name} • {device.series}
                          </div>
                        </div>
                        <Switch
                          checked={securitySettings.shutdown_exceptions.includes(device.id)}
                          onCheckedChange={() => toggleDeviceException(device.id)}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Power className="app-icon w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="app-text text-gray-500">No devices found. Add devices to your rooms first.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="safety" className="space-y-4">
            <Card className="glass-card border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="app-text flex items-center gap-2 text-lg">
                  <Shield className="app-icon w-5 h-5 text-red-600" />
                  Safety Systems
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="app-text text-gray-500">Loading safety systems...</p>
                  </div>
                ) : userSafetySystems.length > 0 ? (
                  <div className="space-y-3">
                    {userSafetySystems.map((system) => (
                      <div key={system.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="app-text font-medium">{system.room_name}</div>
                        <div className="app-text text-sm text-gray-500">
                          {system.system_type.replace('_', ' ')} • ID: {system.system_id}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Shield className="app-icon w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="app-text text-gray-500">No safety systems configured yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="triggers" className="space-y-4">
            <Card className="glass-card border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="app-text flex items-center gap-2 text-lg">
                  <Clock className="app-icon w-5 h-5 text-purple-600" />
                  Exit Triggers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="app-text text-sm font-medium text-gray-700">Time-Based Schedule Toggle</Label>
                    <p className="app-text text-sm text-gray-500">Automatically lock door at scheduled time</p>
                  </div>
                  <Switch
                    checked={securitySettings.schedule_enabled}
                    onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, schedule_enabled: checked }))}
                  />
                </div>

                {securitySettings.schedule_enabled && (
                  <Card className="bg-purple-50 border-purple-200">
                    <CardContent className="p-4">
                      <div>
                        <Label className="app-text text-sm font-medium text-gray-700">Auto Lock Time</Label>
                        <Input
                          type="time"
                          value={securitySettings.auto_lock_time}
                          onChange={(e) => setSecuritySettings(prev => ({ ...prev, auto_lock_time: e.target.value }))}
                          className="app-text mt-1"
                        />
                        <p className="app-text text-xs text-gray-500 mt-1">Door will automatically lock at this time daily</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} className="app-text">
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 app-text">
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}