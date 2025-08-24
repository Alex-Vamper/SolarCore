import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Flame, Droplets, Wind, Waves, Trash2 } from "lucide-react";

// Individual Settings Components
const FireDetectionSettings = ({ settings, setSettings }) => {
    return (
        <div className="space-y-4">
            <div>
                <Label>Smoke Threshold (%)</Label>
                <Slider defaultValue={[75]} max={100} step={1} />
            </div>
            <div>
                <Label>Heat Threshold (°C)</Label>
                <Input type="number" defaultValue={60} />
            </div>
            <div className="flex items-center justify-between">
                <Label>Buzzer Alert</Label>
                <Switch defaultChecked />
            </div>
        </div>
    );
};

const RainDetectionSettings = ({ settings, setSettings }) => {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Label>Auto-close Window</Label>
                <Switch defaultChecked />
            </div>
            <div>
                <Label>Override Timer (minutes)</Label>
                <Input type="number" defaultValue={30} />
            </div>
        </div>
    );
};

const GasLeakageSettings = ({ settings, setSettings }) => {
    return (
         <div className="space-y-4">
            <div>
                <Label>Sensor Sensitivity</Label>
                <select className="w-full mt-1 p-2 border border-gray-300 rounded-lg font-inter">
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                </select>
            </div>
            <div className="flex items-center justify-between">
                <Label>Auto-open Windows</Label>
                <Switch />
            </div>
        </div>
    );
};

const WaterLevelSettings = ({ settings, setSettings }) => {
    // Initialize local states from settings or provide default values
    const [min, setMin] = useState(settings?.min_water_level ?? 20);
    const [max, setMax] = useState(settings?.max_water_level ?? 90);
    const [autoPump, setAutoPump] = useState(settings?.auto_pump_toggle ?? false);

    // Handlers to update local state and the parent 'settings' state
    const handleMinChange = (value) => {
        const val = Array.isArray(value) ? value[0] : Number(value);
        setMin(val);
        setSettings(prev => ({ ...prev, min_water_level: val }));
    };

    const handleMaxChange = (value) => {
        const val = Array.isArray(value) ? value[0] : Number(value);
        setMax(val);
        setSettings(prev => ({ ...prev, max_water_level: val }));
    };

    const handleAutoPumpChange = (checked) => {
        setAutoPump(checked);
        setSettings(prev => ({ ...prev, auto_pump_toggle: checked }));
    };

    return (
        <div className="space-y-6">
            <div>
                <Label>Min Water Level (%)</Label>
                 <div className="flex items-center gap-4">
                    <Slider value={[min]} onValueChange={handleMinChange} max={100} step={1} className="w-full"/>
                    <Input type="number" value={min} onChange={(e) => handleMinChange(e.target.value)} className="w-20" />
                </div>
            </div>
            <div>
                <Label>Max Water Level (%)</Label>
                 <div className="flex items-center gap-4">
                    <Slider value={[max]} onValueChange={handleMaxChange} max={100} step={1} className="w-full"/>
                    <Input type="number" value={max} onChange={(e) => handleMaxChange(e.target.value)} className="w-20" />
                </div>
            </div>
            <div className="flex items-center justify-between">
                <Label>Auto-pump Toggle</Label>
                <Switch checked={autoPump} onCheckedChange={handleAutoPumpChange}/>
            </div>
        </div>
    );
};


const SYSTEM_SETTINGS_MAP = {
    fire_detection: {
        title: "Fire Detection Settings",
        icon: Flame,
        component: FireDetectionSettings
    },
    window_rain: {
        title: "Rain Detection Settings",
        icon: Droplets,
        component: RainDetectionSettings
    },
    gas_leak: {
        title: "Gas Leakage Settings",
        icon: Wind,
        component: GasLeakageSettings
    },
    water_overflow: {
        title: "Water Level Settings",
        icon: Waves,
        component: WaterLevelSettings
    }
}

export default function SafetySystemSettingsModal({ isOpen, onClose, system, onSave, onDelete }) {
    const [settings, setSettings] = useState(system.automation_settings || {});

    if (!isOpen || !system) return null;

    const config = SYSTEM_SETTINGS_MAP[system.system_type];
    if (!config) return null;

    const SpecificSettings = config.component;
    const Icon = config.icon;

    const handleSave = () => {
        onSave({ id: system.id, ...settings });
        onClose();
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Icon className="w-5 h-5 text-red-600"/>
                        {config.title} for {system.room_name}
                    </DialogTitle>
                </DialogHeader>
                <div className="py-4">
                   <SpecificSettings settings={settings} setSettings={setSettings} />
                </div>
                <DialogFooter className="flex justify-between w-full">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" className="flex items-center gap-2">
                                <Trash2 className="w-4 h-4"/>
                                Delete System
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this safety system.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDelete(system.id)} className="bg-red-600 hover:bg-red-700">Continue</AlertDialogAction>
                        </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose}>Cancel</Button>
                        <Button onClick={handleSave} className="bg-red-600 hover:bg-red-700">Save</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}