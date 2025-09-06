import { useState } from "react";
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
  Lock
} from "lucide-react";

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

export default function ApplianceControl({ appliance, onUpdate, onDelete, dragHandleProps }) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async (updates) => {
    setIsUpdating(true);
    try {
      await onUpdate(appliance.id, updates);
    } finally {
      setIsUpdating(false);
    }
  };

  const renderStandardDevice = () => {
    const ApplianceIcon = getApplianceIcon(appliance.type, appliance.name);
    return (
      <Card className="glass-card border-0 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing">
                <GripVertical className="w-5 h-5 text-gray-400" />
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                appliance.status ? 'bg-blue-100' : 'bg-gray-200'
              }`}>
                <ApplianceIcon className={`w-5 h-5 ${appliance.status ? 'text-blue-600' : 'text-gray-500'}`} />
              </div>
              <div>
                <div className="font-semibold text-gray-900 font-inter">{appliance.name}</div>
                {appliance.series && (
                  <div className="text-xs text-gray-500 font-inter">
                    {appliance.series}
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
                      Are you sure you want to delete "{appliance.name}"? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(appliance.id)} className="bg-red-600 hover:bg-red-700">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button
                size="icon"
                onClick={() => handleUpdate({ status: !appliance.status })}
                className={`transition-all duration-300 rounded-full w-10 h-10 ${
                  appliance.status
                    ? 'bg-yellow-400 text-white shadow-lg shadow-yellow-400/50'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
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
    const moods = getMoodsForSeries(appliance.series);
    const ApplianceIcon = getApplianceIcon(appliance.type);
    
    const getCurrentMoodId = () => {
      if (!appliance.status) return "off";
      if (appliance.intensity <= 25) return "dim";
      if (appliance.color_tint === 'cool') return "cool";
      if (appliance.color_tint === 'warm') return "warm";
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
                  appliance.status ? 'bg-blue-100' : 'bg-gray-200'
                }`}>
                  <ApplianceIcon className={`w-5 h-5 ${appliance.status ? 'text-blue-600' : 'text-gray-500'}`} />
                </div>
                <div>
                  <CardTitle className="text-lg font-inter">
                    <div className="font-semibold">{appliance.name}</div>
                  </CardTitle>
                  {appliance.series && (
                    <p className="text-xs text-gray-500 font-inter">{appliance.series}</p>
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
                    Are you sure you want to delete "{appliance.name}"? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(appliance.id)} className="bg-red-600 hover:bg-red-700">
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
              checked={appliance.auto_mode}
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

  return SIMPLIFIED_LIGHT_SERIES.includes(appliance.series)
    ? renderSimplifiedLight()
    : renderStandardDevice();
}