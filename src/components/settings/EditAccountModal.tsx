import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { User, Building } from "lucide-react";

export default function EditAccountModal({ isOpen, onClose, user, userSettings, onSave }) {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [buildingName, setBuildingName] = useState("");
    const [buildingType, setBuildingType] = useState("home");
    const [energyMode, setEnergyMode] = useState("auto_switch");

    useEffect(() => {
        if(user) {
            setFullName(user.full_name || "");
            setEmail(user.email || "");
        }
        if(userSettings) {
            setBuildingName(userSettings.building_name || "");
            setBuildingType(userSettings.building_type || "home");
            setEnergyMode(userSettings.energy_mode || "auto_switch");
        }
    }, [user, userSettings, isOpen]);

    const handleSave = () => {
        onSave({
            fullName,
            settings: {
                building_name: buildingName,
                building_type: buildingType,
                energy_mode: energyMode
            }
        });
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <User className="w-5 h-5 text-blue-600" />
                        Edit Account Information
                    </DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div>
                        <Label>Full Name</Label>
                        <Input value={fullName} onChange={e => setFullName(e.target.value)} />
                    </div>
                     <div>
                        <Label>Email</Label>
                        <Input value={email} disabled />
                    </div>
                     <div>
                        <Label>Building Name</Label>
                        <Input value={buildingName} onChange={e => setBuildingName(e.target.value)} />
                    </div>
                    <div>
                        <Label>Building Type</Label>
                        <select value={buildingType} onChange={e => setBuildingType(e.target.value)} className="w-full mt-1 p-2 border rounded-lg">
                            <option value="home">Home</option>
                            <option value="school">School</option>
                            <option value="office">Office</option>
                            <option value="hospital">Hospital</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                     <div>
                        <Label>Energy Setup</Label>
                        <select value={energyMode} onChange={e => setEnergyMode(e.target.value)} className="w-full mt-1 p-2 border rounded-lg">
                            <option value="auto_switch">Hybrid (Auto Switch)</option>
                            <option value="solar_only">Solar Only</option>
                            <option value="grid_only">Grid Only</option>
                        </select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}