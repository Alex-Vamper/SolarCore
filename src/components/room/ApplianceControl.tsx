import { useState } from "react";
import { deviceStateService } from "@/lib/deviceStateService";
import { deviceStateLogger } from "@/lib/deviceStateLogger";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
  Lightbulb,
  Fan,
  Zap,
  Snowflake,
  Sun,
  Moon,
  Trash2,
  Settings,
  Camera,
  Wind,
  Layers,
  Move,
  GripVertical,
  Power,
  Lock,
  Eye
} from "lucide-react";
import CameraViewModal from "./CameraViewModal";
import { useCameraSync } from "@/hooks/useCameraSync";

const getApplianceIcon = (type, name = '') => {
  // Check by type first - exact match to device catalog types
  switch (type) {
    case 'smart_lighting': return Lightbulb;
    case 'smart_hvac': return Snowflake;
    case 'smart_shading': return Layers;
    case 'smart_socket': return Zap;
    case 'smart_camera': return Camera;
    case 'motion_sensor': return Move;
    case 'air_quality': return Wind;
    case 'security': return Lock;
    case 'smart_fan': return Fan;
  }
  
  // Check by name patterns as fallback
  const nameLower = name.toLowerCase();
  if (nameLower.includes('light') || nameLower.includes('lamp')) return Lightbulb;
  if (nameLower.includes('fan')) return Fan;
  if (nameLower.includes('ac') || nameLower.includes('air') || nameLower.includes('hvac')) return Snowflake;
  if (nameLower.includes('shade') || nameLower.includes('blind') || nameLower.includes('curtain')) return Layers;
  if (nameLower.includes('socket') || nameLower.includes('plug')) return Zap;
  if (nameLower.includes('camera')) return Camera;
  if (nameLower.includes('motion') || nameLower.includes('sensor')) return Move;
  if (nameLower.includes('lock') || nameLower.includes('door')) return Lock;
  
  return Lightbulb; // Default
};

const SIMPLIFIED_LIGHT_SERIES = [
  'LumaCore Pulse', 'SolarDome One', 'SolarDome Neo', 
  'OptiCore Glow', 'OptiCore Edge', 'OptiCore Aura'
];

const DIM_ONLY_LIGHT_SERIES = ['SolarDome One', 'OptiCore Glow', 'OptiCore Edge'];

const getMoodsForSeries = (series) => {
  if (DIM_ONLY_LIGHT_SERIES.includes(series)) {
    return [
      { id: "on", name: "On", updates: { status: true, intensity: 100, color_tint: 'white' } },
      { id: "off", name: "Off", updates: { status: false } },
      { id: "dim", name: "Dim", updates: { status: true, intensity: 20, color_tint: 'white' } }
    ];
  }
  return [
    { id: "on", name: "On", updates: { status: true, intensity: 100, color_tint: 'white' } },
    { id: "off", name: "Off", updates: { status: false } },
    { id: "dim", name: "Dim", updates: { status: true, intensity: 20, color_tint: 'white' } },
    { id: "cool", name: "Cool", updates: { status: true, intensity: 100, color_tint: 'cool' } },
    { id: "warm", name: "Warm", updates: { status: true, intensity: 100, color_tint: 'warm' } }
  ];
};

export default function ApplianceControl({ appliance, onUpdate, onDelete, dragHandleProps, roomId }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [optimisticState, setOptimisticState] = useState(appliance);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  
  const { syncCameraStateToBackend } = useCameraSync(roomId);

  const handleUpdate = async (updates) => {
    if (isUpdating) {
      deviceStateLogger.log('APPLIANCE_CONTROL', 'Update already in progress, ignoring click', { applianceId: appliance.id });
      return;
    }

    setIsUpdating(true);
    
    // Optimistic update for immediate UI feedback
    const newState = { ...appliance, ...updates };
    setOptimisticState(newState);
    
    deviceStateLogger.logDeviceUpdate('APPLIANCE_CONTROL', appliance.id, updates, false);

    try {
      // Use the provided onUpdate callback or fallback to direct service call
      if (onUpdate) {
        await onUpdate(appliance.id, updates);
      } else if (roomId) {
        // Fallback to direct service call if roomId is provided
        const result = await deviceStateService.updateDeviceState(roomId, appliance.id, updates);
        if (!result.success) {
          throw new Error(result.error || 'Update failed');
        }
      }
      
      deviceStateLogger.log('APPLIANCE_CONTROL', 'Device update successful', { applianceId: appliance.id });
    } catch (error) {
      deviceStateLogger.logError('APPLIANCE_CONTROL', 'Device update failed', error);
      // Rollback optimistic update on error
      setOptimisticState(appliance);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  // Use optimistic state for immediate UI updates, fall back to appliance prop
  const displayState = isUpdating ? optimisticState : appliance;

  const handleCameraIpSave = async (ip: string, port?: number) => {
    try {
      deviceStateLogger.log('APPLIANCE_CONTROL', 'Saving camera settings', { applianceId: appliance.id, ip, port });
      
      // Use the camera sync service for backend synchronization
      const result = await syncCameraStateToBackend(roomId, appliance.id, { 
        camera_ip: ip, 
        camera_port: port || 8080 
      });
      
      if (result.success) {
        // Update optimistic state immediately
        setOptimisticState(prev => ({ 
          ...prev, 
          camera_ip: ip, 
          camera_port: port || 8080 
        }));
        deviceStateLogger.log('APPLIANCE_CONTROL', 'Camera settings saved successfully', { applianceId: appliance.id, ip, port });
      } else {
        throw new Error(result.error || 'Failed to save camera settings');
      }
    } catch (error) {
      deviceStateLogger.logError('APPLIANCE_CONTROL', 'Failed to save camera settings', error);
      throw error; // Re-throw so CameraViewModal can handle the error
    }
  };

  const renderSmartCamera = () => {
    const ApplianceIcon = getApplianceIcon(displayState.type, displayState.name);
    return (
      <>
        <Card className="glass-card border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing">
                  <GripVertical className="w-5 h-5 text-gray-400" />
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  displayState.status ? 'bg-blue-100' : 'bg-gray-200'
                }`}>
                  <ApplianceIcon className={`w-5 h-5 ${displayState.status ? 'text-blue-600' : 'text-gray-500'}`} />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 font-inter">{displayState.name}</div>
                  {displayState.series && (
                    <div className="text-xs text-gray-500 font-inter">
                      {displayState.series}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-500 hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Camera</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{displayState.name}"? This action cannot be undone.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDelete(displayState.id)} className="bg-red-600 hover:bg-red-700">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Button
                  size="icon"
                  onClick={() => setIsCameraModalOpen(true)}
                  className="bg-green-600 hover:bg-green-700 text-white transition-all duration-300 rounded-full w-10 h-10"
                >
                  <Eye className="w-5 h-5" />
                </Button>
                <Button
                  size="icon"
                  onClick={() => handleUpdate({ status: !displayState.status })}
                  className={`transition-all duration-300 rounded-full w-10 h-10 ${
                    displayState.status
                      ? 'bg-yellow-400 text-white shadow-lg shadow-yellow-400/50'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={isUpdating}
                >
                  <Power className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <CameraViewModal
          isOpen={isCameraModalOpen}
          onClose={() => setIsCameraModalOpen(false)}
          cameraName={displayState.name}
          applianceId={appliance.id}
          roomId={roomId}
          savedIp={displayState.camera_ip || ''}
          savedPort={displayState.camera_port || 8080}
          onIpSave={handleCameraIpSave}
        />
      </>
    );
  };

  const renderStandardDevice = () => {
    const ApplianceIcon = getApplianceIcon(displayState.type, displayState.name);
    return (
      <Card className="glass-card border-0 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing">
                <GripVertical className="w-5 h-5 text-gray-400" />
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                displayState.status ? 'bg-blue-100' : 'bg-gray-200'
              }`}>
                <ApplianceIcon className={`w-5 h-5 ${displayState.status ? 'text-blue-600' : 'text-gray-500'}`} />
              </div>
              <div>
                <div className="font-semibold text-gray-900 font-inter">{displayState.name}</div>
                {displayState.series && (
                  <div className="text-xs text-gray-500 font-inter">
                    {displayState.series}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-500 hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Appliance</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{displayState.name}"? This action cannot be undone.
                  </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(displayState.id)} className="bg-red-600 hover:bg-red-700">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button
                size="icon"
                onClick={() => handleUpdate({ status: !displayState.status })}
                className={`transition-all duration-300 rounded-full w-10 h-10 ${
                  displayState.status
                    ? 'bg-yellow-400 text-white shadow-lg shadow-yellow-400/50'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={isUpdating}
              >
                <Power className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderSimplifiedLight = () => {
    const moods = getMoodsForSeries(displayState.series);
    const ApplianceIcon = getApplianceIcon(displayState.type);
    
    const getCurrentMoodId = () => {
      if (!displayState.status) return "off";
      if (displayState.intensity <= 25) return "dim";
      if (displayState.color_tint === 'cool') return "cool";
      if (displayState.color_tint === 'warm') return "warm";
      return "on"; // Default to 'on' if it's on with normal intensity and white tint
    };

    const activeMoodId = getCurrentMoodId();

    return (
      <Card className="glass-card border-0 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing">
                    <GripVertical className="w-5 h-5 text-gray-400" />
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  displayState.status ? 'bg-blue-100' : 'bg-gray-200'
                }`}>
                  <ApplianceIcon className={`w-5 h-5 ${displayState.status ? 'text-blue-600' : 'text-gray-500'}`} />
                </div>
                <div>
                  <CardTitle className="text-lg font-inter">
                    <div className="font-semibold">{displayState.name}</div>
                  </CardTitle>
                  {displayState.series && (
                    <p className="text-xs text-gray-500 font-inter">{displayState.series}</p>
                  )}
                </div>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-500 hover:bg-red-50">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Light</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{displayState.name}"? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(displayState.id)} className="bg-red-600 hover:bg-red-700">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700 font-inter">Auto Mode</span>
            </div>
            <Switch
              checked={displayState.auto_mode}
              onCheckedChange={(checked) => handleUpdate({ auto_mode: checked })}
              disabled={isUpdating}
            />
          </div>

          <div className="grid grid-cols-5 gap-2">
            {moods.map((mood) => {
              const isActive = activeMoodId === mood.id;
              return (
                <Button
                  key={mood.id}
                  onClick={() => handleUpdate(mood.updates)}
                  disabled={isUpdating}
                  variant={isActive ? 'default' : 'outline'}
                  className={`h-auto p-2 flex-1 transition-all text-xs font-semibold ${
                    isActive ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-700 bg-white'
                  }`}
                >
                  {mood.name}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Check if it's a smart camera first
  if (displayState.type === 'smart_camera') {
    return renderSmartCamera();
  }
  
  return SIMPLIFIED_LIGHT_SERIES.includes(displayState.series)
    ? renderSimplifiedLight()
    : renderStandardDevice();
}