import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Lightbulb, 
  Snowflake,
  Zap,
  Camera,
  Wind,
  Layers,
  Move,
  ArrowLeft,
  Lock,
  Fan,
  Thermometer,
  Mic,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const DEVICE_CATALOG = [
  { id: 'lighting', name: 'Smart Lighting', icon: Lightbulb },
  { id: 'socket', name: 'Smart Socket', icon: Zap },
  { id: 'security', name: 'Smart Lock', icon: Lock },
  { id: 'climate', name: 'Smart HVAC', icon: Snowflake },
  { id: 'fan', name: 'Smart Fan', icon: Fan },
  { id: 'curtain', name: 'Smart Shading', icon: Layers },
  { id: 'sensor', name: 'Sensors', icon: Thermometer },
  { id: 'ai', name: 'AI Assistant', icon: Mic },
];

export default function AddDeviceModal({ isOpen, onClose, onSave, roomName, roomId }) {
  const [selectedType, setSelectedType] = useState(null);
  const [deviceTypes, setDeviceTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deviceData, setDeviceData] = useState({
    esp_id: "",
    name: "",
    series: "",
    device_type_id: "",
  });
  const { toast } = useToast();

  // Load device types from database
  useEffect(() => {
    const loadDeviceTypes = async () => {
      // Direct query to admin.device_types table
      const { data, error } = await supabase.rpc('get_device_types') as any;

      if (error) {
        console.error('Error loading device types:', error);
        // Fallback to hardcoded types if RPC fails
        setDeviceTypes([]);
      } else {
        setDeviceTypes(Array.isArray(data) ? data : []);
      }
    };

    if (isOpen) {
      loadDeviceTypes();
    }
  }, [isOpen]);

  const filteredDeviceTypes = useMemo(() => {
    if (!selectedType) return [];
    return deviceTypes.filter(dt => dt.device_class === selectedType);
  }, [selectedType, deviceTypes]);

  const handleSave = async () => {
    if (!deviceData.esp_id.trim() || !deviceData.name.trim() || !deviceData.device_type_id) {
      return;
    }
    
    setIsLoading(true);
    try {
      // Step 1: Claim the parent device (or get existing)
      const { data: claimResult } = await supabase.rpc('claim_parent_device', {
        p_esp_id: deviceData.esp_id.trim()
      }) as any;

      if (!claimResult?.success) {
        if (claimResult?.code === 'UNREGISTERED_DEVICE') {
          toast({
            title: "Unregistered Device",
            description: "This device ID is not registered. Please contact support.",
            variant: "destructive",
          });
        } else if (claimResult?.code === 'ALREADY_CLAIMED') {
          toast({
            title: "Device Already Claimed",
            description: "This device is already claimed by another account.",
            variant: "destructive",
          });
        }
        setIsLoading(false);
        return;
      }

      // Step 2: Create the child device
      const { data: childResult } = await supabase.rpc('create_child_device', {
        p_parent_id: claimResult.parent_id,
        p_device_type_id: deviceData.device_type_id,
        p_device_name: deviceData.name.trim(),
        p_initial_state: { power: 'off' }
      }) as any;

      if (!childResult?.success) {
        toast({
          title: "Error Creating Device",
          description: childResult?.message || "Failed to create device",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Get the device type for the new device
      const deviceType = deviceTypes.find(dt => dt.id === deviceData.device_type_id);

      // Success - call the onSave callback with the new device info
      onSave({
        id: childResult.child_id,
        parent_id: claimResult.parent_id,
        esp_id: deviceData.esp_id,
        name: deviceData.name,
        device_class: deviceType?.device_class,
        device_series: deviceType?.device_series,
        state: { power: 'off' },
        actions: deviceType?.actions
      });

      toast({
        title: "Device Added",
        description: `${deviceData.name} has been added successfully.`,
      });

      handleClose();
    } catch (error) {
      console.error('Error adding device:', error);
      toast({
        title: "Error",
        description: "Failed to add device. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedType(null);
    setDeviceData({ esp_id: "", name: "", series: "", device_type_id: "" });
    onClose();
  };
  
  const handleTypeSelect = (typeId) => {
    setSelectedType(typeId);
    const availableTypes = deviceTypes.filter(dt => dt.device_class === typeId);
    if (availableTypes.length === 1) {
      setDeviceData(prev => ({ 
        ...prev, 
        device_type_id: availableTypes[0].id,
        series: availableTypes[0].device_series 
      }));
    }
  };

  const activeCatalogEntry = useMemo(() => {
    return DEVICE_CATALOG.find(d => d.id === selectedType);
  }, [selectedType]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {selectedType && (
              <Button variant="ghost" size="icon" className="mr-2" onClick={() => setSelectedType(null)}>
                <ArrowLeft className="app-icon" />
              </Button>
            )}
            <DialogTitle className="app-heading">Add New Device to {roomName}</DialogTitle>
          </div>
          {selectedType && (
            <DialogDescription className="app-text">
              Configuring a new {activeCatalogEntry?.name}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="py-4">
          {!selectedType ? (
            <div className="grid grid-cols-2 gap-3">
              {DEVICE_CATALOG.map((device) => (
                <button
                  key={device.id}
                  onClick={() => handleTypeSelect(device.id)}
                  className="p-4 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all flex flex-col items-center justify-center gap-2 text-center"
                >
                  <device.icon className="app-icon text-gray-600" />
                  <span className="app-text font-medium">{device.name}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="app-text text-blue-800 flex items-center gap-2">
                  <AlertCircle className="app-icon" />
                  Enter the ESP ID (e.g., SC-GID-0001) to claim your device
                </p>
              </div>

              <div>
                <Label htmlFor="esp-id" className="app-text font-medium text-gray-700">ESP Device ID</Label>
                <Input
                  id="esp-id"
                  placeholder="e.g., SC-GID-0001"
                  value={deviceData.esp_id}
                  onChange={(e) => setDeviceData(prev => ({ ...prev, esp_id: e.target.value.toUpperCase() }))}
                  className="app-text mt-1"
                />
              </div>

              <div>
                <Label htmlFor="device-name" className="app-text font-medium text-gray-700">Device Name</Label>
                <Input
                  id="device-name"
                  placeholder="e.g., Main Ceiling Light"
                  value={deviceData.name}
                  onChange={(e) => setDeviceData(prev => ({ ...prev, name: e.target.value }))}
                  className="app-text mt-1"
                />
              </div>

              {filteredDeviceTypes.length > 0 && (
                <div>
                  <Label htmlFor="device-series" className="app-text font-medium text-gray-700">Device Model</Label>
                  <Select
                    value={deviceData.device_type_id}
                    onValueChange={(value) => {
                      const deviceType = deviceTypes.find(dt => dt.id === value);
                      setDeviceData(prev => ({ 
                        ...prev, 
                        device_type_id: value,
                        series: deviceType?.device_series || ""
                      }));
                    }}
                  >
                    <SelectTrigger id="device-series" className="app-text w-full mt-1">
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredDeviceTypes.map(dt => (
                        <SelectItem key={dt.id} value={dt.id}>
                          {dt.device_series}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
        </div>

        {selectedType && (
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={handleClose} className="app-text" disabled={isLoading}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!deviceData.esp_id || !deviceData.name || !deviceData.device_type_id || isLoading}
              className="app-text bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? "Adding..." : "Add Device"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}