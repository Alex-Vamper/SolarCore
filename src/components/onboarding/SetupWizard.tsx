import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Plus, X, Home, Building, Factory } from "lucide-react";

interface SetupWizardProps {
  onComplete: (data: any) => void;
}

export default function SetupWizard({ onComplete }: SetupWizardProps) {
  const [step, setStep] = useState(1);
  const [setupData, setSetupData] = useState({
    buildingType: "",
    buildingName: "",
    energySource: "",
    rooms: []
  });

  const [newRoomName, setNewRoomName] = useState("");

  const buildingTypes = [
    { id: "house", label: "House", icon: Home },
    { id: "apartment", label: "Apartment", icon: Building },
    { id: "office", label: "Office", icon: Factory }
  ];

  const energyOptions = [
    { id: "solar", label: "Solar Only", description: "100% renewable energy" },
    { id: "grid", label: "Grid Only", description: "Traditional power grid" },
    { id: "mixed", label: "Solar + Grid", description: "Hybrid energy system" }
  ];

  const addRoom = () => {
    if (newRoomName.trim()) {
      setSetupData(prev => ({
        ...prev,
        rooms: [...prev.rooms, { name: newRoomName.trim() }]
      }));
      setNewRoomName("");
    }
  };

  const removeRoom = (index: number) => {
    setSetupData(prev => ({
      ...prev,
      rooms: prev.rooms.filter((_, i) => i !== index)
    }));
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      onComplete(setupData);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1: return setupData.buildingType;
      case 2: return setupData.buildingName.trim();
      case 3: return setupData.energySource;
      case 4: return setupData.rooms.length > 0;
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-solarcore-gray flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 gradient-solarcore rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Home className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 font-inter">Setup Your Home</h2>
          <p className="text-gray-600 font-inter">Step {step} of 4</p>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 font-inter">What type of building is this?</h3>
            <div className="space-y-2">
              {buildingTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSetupData(prev => ({ ...prev, buildingType: type.id }))}
                  className={`w-full p-4 rounded-lg border-2 transition-all duration-200 flex items-center gap-3 ${
                    setupData.buildingType === type.id
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <type.icon className="w-5 h-5 text-gray-600" />
                  <span className="font-inter font-medium">{type.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 font-inter">What should we call your {setupData.buildingType}?</h3>
            <Input
              placeholder="e.g., My Home, Office Building, etc."
              value={setupData.buildingName}
              onChange={(e) => setSetupData(prev => ({ ...prev, buildingName: e.target.value }))}
              className="font-inter"
            />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 font-inter">Choose your energy source</h3>
            <div className="space-y-2">
              {energyOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setSetupData(prev => ({ ...prev, energySource: option.id }))}
                  className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                    setupData.energySource === option.id
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium font-inter">{option.label}</div>
                  <div className="text-sm text-gray-600 font-inter">{option.description}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 font-inter">Add your rooms</h3>
            <div className="flex gap-2">
              <Input
                placeholder="Room name"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addRoom()}
                className="font-inter"
              />
              <Button onClick={addRoom} size="icon">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {setupData.rooms.map((room, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="font-inter">{room.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRoom(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-6">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
              Back
            </Button>
          )}
          <Button 
            onClick={handleNext} 
            disabled={!canProceed()}
            className="flex-1"
          >
            {step === 4 ? 'Complete Setup' : 'Next'}
          </Button>
        </div>
      </Card>
    </div>
  );
}