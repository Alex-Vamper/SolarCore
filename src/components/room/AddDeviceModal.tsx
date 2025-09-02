
import { useState, useMemo } from "react";
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
  Layers, // For shading
  Move, // For motion sensor
  ArrowLeft
} from "lucide-react";

const DEVICE_CATALOG = [
  {
    id: 'smart_lighting', name: 'Smart Lighting', icon: Lightbulb,
    series: [
      'LumaCore Halo', 'LumaCore Pulse', 'LumaCore Lux',
      'SolarDome One', 'SolarDome Neo',
      'OptiCore Glow', 'OptiCore Edge', 'OptiCore Aura'
    ]
  },
  { id: 'smart_hvac', name: 'Smart HVAC', icon: Snowflake, series: ['ClimaCore Basic', 'ClimaCore Pro'] },
  { id: 'smart_shading', name: 'Smart Shading', icon: Layers, series: ['ShadeCore Glide', 'ShadeCore Lux', 'ShadeCore Touch', 'D-W Sense'] },
  { id: 'smart_socket', name: 'Smart Socket', icon: Zap, series: ['S-Plug', 'S-Plug Duo'] },
  { id: 'smart_camera', name: 'Smart Camera', icon: Camera, series: ['Cam Mini', 'Cam 360', 'Cam Door'] },
  { id: 'motion_sensor', name: 'Motion Sensor', icon: Move, series: ['MotionSense'] },
  { id: 'air_quality', name: 'Air Quality', icon: Wind, series: ['SenseSmoke', 'SenseGas'] }
];

export default function AddDeviceModal({ isOpen, onClose, onSave, roomName }) {
  const [selectedType, setSelectedType] = useState(null);
  const [deviceData, setDeviceData] = useState({
    name: "",
    series: "",
    device_id: "",
  });

  const activeCatalogEntry = useMemo(() => {
    return DEVICE_CATALOG.find(d => d.id === selectedType);
  }, [selectedType]);

  const handleSave = () => {
    if (!deviceData.name.trim() || !deviceData.device_id.trim() || (activeCatalogEntry.series.length > 0 && !deviceData.series)) {
        return;
    }
    
    const newDevice = {
      type: selectedType,
      name: deviceData.name.trim(),
      series: deviceData.series,
      device_id: deviceData.device_id.trim(),
      status: false,
      // Default values for lighting devices if applicable
      ...(selectedType === 'smart_lighting' && {
        intensity: 50,
        color_tint: "white",
        auto_mode: true,
        ldr_status: "bright",
      }),
    };

    onSave(newDevice);
    handleClose();
  };

  const handleClose = () => {
    setSelectedType(null);
    setDeviceData({ name: "", series: "", device_id: "" });
    onClose();
  };
  
  const handleTypeSelect = (typeId) => {
    setSelectedType(typeId);
    const catalog = DEVICE_CATALOG.find(d => d.id === typeId);
    // If there's only one series, pre-select it.
    if(catalog?.series.length === 1) {
        setDeviceData(prev => ({ ...prev, series: catalog.series[0] }));
    }
  }

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

              {activeCatalogEntry?.series.length > 0 && (
                  <div>
                      <Label htmlFor="device-series" className="app-text font-medium text-gray-700">Series</Label>
                      <Select
                          value={deviceData.series}
                          onValueChange={(value) => setDeviceData(prev => ({ ...prev, series: value }))}
                      >
                          <SelectTrigger id="device-series" className="app-text w-full mt-1">
                              <SelectValue placeholder="Select a series" />
                          </SelectTrigger>
                          <SelectContent>
                              {activeCatalogEntry.series.map(s => (
                                  <SelectItem key={s} value={s}>{s}</SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                  </div>
                )}
                
              <div>
                <Label htmlFor="device-id" className="app-text font-medium text-gray-700">Device ID</Label>
                <Input
                  id="device-id"
                  placeholder="Enter hardware device ID"
                  value={deviceData.device_id}
                  onChange={(e) => setDeviceData(prev => ({ ...prev, device_id: e.target.value }))}
                  className="app-text mt-1"
                />
              </div>
            </div>
          )}
        </div>

        {selectedType && (
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={handleClose} className="app-text">
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!deviceData.name || !deviceData.device_id || (activeCatalogEntry?.series.length > 0 && !deviceData.series)}
              className="app-text bg-blue-600 hover:bg-blue-700"
            >
              Add Device
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
