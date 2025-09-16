import { useState, useEffect } from "react";
import { UserSettings } from "@/entities/all";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { User, Room, SafetySystem } from "@/entities/all";
import {
  Shield,
  Settings,
  Power,
  Clock,
  Trash2,
  AlertCircle
} from "lucide-react";
import { SecuritySystemService } from "@/entities/SecuritySystem";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function SecuritySettingsModal({ isOpen, onClose, onSave }) {
  const [securitySettings, setSecuritySettings] = useState({
    door_security_id: "",
    door_security_series: "",
    auto_shutdown_enabled: false,
    shutdown_exceptions: [],
    schedule_enabled: false,
    auto_lock_time: "22:00"
  });
  
  const [userDevices, setUserDevices] = useState([]);
  const [userSafetySystems, setUserSafetySystems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadUserData();
    }
  }, [isOpen]);

  const loadUserData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await User.me();
      const [rooms, safetySystems, userSettings] = await Promise.all([
        Room.filter({ created_by: currentUser.email }),
        SafetySystem.filter({ created_by: currentUser.email }),
        UserSettings.list()
      ]);

      // Load existing security settings
      if (userSettings.length > 0 && userSettings[0].security_settings) {
        setSecuritySettings({
          door_security_id: userSettings[0].security_settings.door_security_id || "",
          door_security_series: userSettings[0].security_settings.door_security_series || "",
          auto_shutdown_enabled: userSettings[0].security_settings.auto_shutdown_enabled || false,
          shutdown_exceptions: userSettings[0].security_settings.shutdown_exceptions || [],
          schedule_enabled: userSettings[0].security_settings.schedule_enabled || false,
          auto_lock_time: userSettings[0].security_settings.auto_lock_time || "22:00"
        });
      }

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

  const handleSave = async () => {
    try {
      // Validate ESP ID and create child device if provided
      if (securitySettings.door_security_id) {
        const { data: claimResult, error: claimError } = await supabase.rpc('claim_parent_device', {
          p_esp_id: securitySettings.door_security_id.trim()
        });

        console.log('Claim result:', claimResult, 'Error:', claimError);

        if (claimError) {
          console.error('RPC error:', claimError);
          toast({
            title: "Error",
            description: "Failed to validate device. Please try again.",
            variant: "destructive",
          });
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
            return;
          } else if (result?.code === 'ALREADY_CLAIMED') {
            // Check if it's claimed by current user
            if (result?.message !== 'Device already claimed by you') {
              toast({
                title: "Device Already Claimed",
                description: "This device is already claimed by another account.",
                variant: "destructive",
              });
              return;
            }
          } else {
            toast({
              title: "Error",
              description: result?.message || "Failed to claim device.",
              variant: "destructive",
            });
            return;
          }
        }

        // Create security device in child_devices table if it doesn't exist
        try {
          // Check if child device already exists for this parent
          const { data: existingDevices } = await supabase
            .from('child_devices')
            .select('*')
            .eq('parent_id', result?.parent_id)
            .eq('device_name', securitySettings.door_security_id);

          if (!existingDevices || existingDevices.length === 0) {
            // Get security device type
            const { data: deviceTypes } = await supabase.rpc('get_device_types');
            const securityDeviceType = (deviceTypes as any[])?.find(dt => 
              dt.device_class === 'security' && dt.device_series === 'door_control'
            );
            
            if (securityDeviceType && result?.parent_id) {
              // Create child device for security system
              const { data: createResult, error: createError } = await supabase.rpc('create_child_device', {
                p_parent_id: result.parent_id,
                p_device_type_id: securityDeviceType.id,
                p_device_name: securitySettings.door_security_id,
                p_initial_state: {
                  system_type: 'door_control',
                  room_name: 'Front Door',
                  lock_status: 'unlocked',
                  security_mode: 'home'
                }
              });

              if (createError || !(createResult as any)?.success) {
                console.error('Create security device error:', createError, createResult);
                const errorMessage = (createResult as any)?.message || createError?.message || 'Failed to create security device';
                
                // Only show error if it's not about already existing device
                if (!errorMessage.includes('already has a child device') && !errorMessage.includes('already exists')) {
                  toast({
                    title: "Error",
                    description: errorMessage,
                    variant: "destructive",
                  });
                  return;
                }
              } else {
                console.log('Security child device created successfully:', createResult);
                
                // Ensure user_settings security_settings is updated with the device info
                try {
                  const userSettings = await UserSettings.list();
                  if (userSettings.length > 0) {
                    const updatedSecuritySettings = {
                      ...userSettings[0].security_settings,
                      door_security_id: securitySettings.door_security_id,
                      door_security_series: securitySettings.door_security_series,
                      auto_shutdown_enabled: securitySettings.auto_shutdown_enabled,
                      shutdown_exceptions: securitySettings.shutdown_exceptions
                    };
                    
                    await UserSettings.update(userSettings[0].id!, {
                      security_settings: updatedSecuritySettings
                    });
                    
                    console.log('User settings updated with security device info');
                  }
                } catch (settingsError) {
                  console.error('Error updating user settings:', settingsError);
                }
              }
            }
          } else {
            console.log('Security child device already exists, ensuring settings sync');
            
            // Device exists, ensure user_settings is synced
            try {
              const userSettings = await UserSettings.list();
              if (userSettings.length > 0) {
                const updatedSecuritySettings = {
                  ...userSettings[0].security_settings,
                  door_security_id: securitySettings.door_security_id,
                  door_security_series: securitySettings.door_security_series,
                  auto_shutdown_enabled: securitySettings.auto_shutdown_enabled,
                  shutdown_exceptions: securitySettings.shutdown_exceptions
                };
                
                await UserSettings.update(userSettings[0].id!, {
                  security_settings: updatedSecuritySettings
                });
                
                console.log('User settings synchronized with existing security device');
              }
            } catch (settingsError) {
              console.error('Error synchronizing user settings:', settingsError);
            }
          }
        } catch (deviceError) {
          console.error('Error creating security device:', deviceError);
          // Don't fail the main save operation
        }
      }
      
      await onSave(securitySettings);
      toast({
        title: "Success",
        description: "Security settings saved successfully",
      });
      
      // Trigger event for SecurityOverview to reload settings
      window.dispatchEvent(new CustomEvent('securitySettingsChanged'));
      
      onClose();
    } catch (error) {
      console.error("Error saving security settings:", error);
      toast({
        title: "Error",
        description: "Failed to save security settings",
        variant: "destructive",
      });
    }
  };

  const toggleDeviceException = (deviceId) => {
    if (!deviceId) return;
    
    setSecuritySettings(prev => ({
      ...prev,
      shutdown_exceptions: prev.shutdown_exceptions.includes(deviceId)
        ? prev.shutdown_exceptions.filter(id => id !== deviceId)
        : [...prev.shutdown_exceptions, deviceId]
    }));
  };

  const handleRemoveDevice = async () => {
    if (!securitySettings.door_security_id) return;

    setIsRemoving(true);
    try {
      // Find and delete the security device
      const securitySystems = await SecuritySystemService.list();
      const securitySystem = securitySystems.find(s => s.system_id === securitySettings.door_security_id);
      
      if (securitySystem?.id) {
        await SecuritySystemService.delete(securitySystem.id);
      }

      // Clear security settings
      const clearedSettings = {
        ...securitySettings,
        door_security_id: "",
        door_security_series: ""
      };
      
      await onSave(clearedSettings);
      setSecuritySettings(clearedSettings);
      
      toast({
        title: "Success",
        description: "Security device removed successfully",
      });
      
      // Trigger event for SecurityOverview to reload settings
      window.dispatchEvent(new CustomEvent('securitySettingsChanged'));
      
    } catch (error) {
      console.error("Error removing security device:", error);
      toast({
        title: "Error",
        description: "Failed to remove security device",
        variant: "destructive",
      });
    } finally {
      setIsRemoving(false);
    }
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
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="app-text text-blue-800 flex items-center gap-2">
                    <AlertCircle className="app-icon" />
                    Enter the ESP ID (e.g., SC-GID-0001) to claim your security device
                  </p>
                </div>

                <div>
                  <Label className="app-text text-sm font-medium text-gray-700">ESP Device ID</Label>
                  <Input
                    placeholder="e.g., SC-GID-0001"
                    value={securitySettings.door_security_id}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, door_security_id: e.target.value.toUpperCase() }))}
                    className="app-text mt-1"
                  />
                </div>

                <div>
                  <Label className="app-text text-sm font-medium text-gray-700">Security Model</Label>
                  <Select
                    value={securitySettings.door_security_series}
                    onValueChange={(value) => setSecuritySettings(prev => ({ ...prev, door_security_series: value }))}
                  >
                    <SelectTrigger className="app-text w-full mt-1">
                      <SelectValue placeholder="Select security model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="S-Core Lite">S-Core Lite</SelectItem>
                      <SelectItem value="S-Core Bio">S-Core Bio (Fingerprint)</SelectItem>
                      <SelectItem value="S-Core Ultra">S-Core Ultra (Face Recognition)</SelectItem>
                    </SelectContent>
                  </Select>
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

                {securitySettings.door_security_id && (
                  <div className="pt-4 border-t">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          disabled={isRemoving}
                          className="flex items-center gap-2"
                        >
                          <Trash2 className="app-icon w-4 h-4" />
                          {isRemoving ? "Removing..." : "Remove Device"}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove Security Device</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove this security device? This will delete the device from your account and clear all security settings.
                            <br /><br />
                            <strong>Device ID:</strong> {securitySettings.door_security_id}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleRemoveDevice} className="bg-red-600 hover:bg-red-700">
                            Remove Device
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
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
                          checked={securitySettings.shutdown_exceptions.includes(device.child_device_id || device.id)}
                          onCheckedChange={() => toggleDeviceException(device.child_device_id || device.id)}
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