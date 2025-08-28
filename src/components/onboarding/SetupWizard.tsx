
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Home, 
  Sun, 
  Zap, 
  Battery, 
  CheckCircle, 
  ArrowRight,
  ArrowLeft,
  Plus,
  X,
  Building,
  School,
  Briefcase,
  HeartPulse,
  Hotel 
} from "lucide-react";
import solarcore from '../../assets/SolarCore-1.svg';

const BUILDING_TYPES = [
    { id: "home", name: "Home", icon: Home },
    { id: "office", name: "Office", icon: Briefcase },
    { id: "hospital", name: "Hospital", icon: HeartPulse },
    { id: "hotel", name: "Hotel", icon: Hotel },
    { id: "school", name: "School", icon: School },
    { id: "other", name: "Other", icon: Building }
];

const ENERGY_SOURCES = [
  { id: "solar", name: "Solar Only", icon: Sun, color: "bg-yellow-500" },
  { id: "grid", name: "National Grid", icon: Zap, color: "bg-blue-500" },
  { id: "mixed", name: "Solar + Grid", icon: Battery, color: "bg-green-500" }
];

export default function SetupWizard({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [setupData, setSetupData] = useState({
    buildingType: "home",
    buildingName: "",
    rooms: [],
    energySource: "mixed",
  });

  const [newRoom, setNewRoom] = useState("");

  const steps = [
    { title: "Building Type", icon: Building },
    { title: "Room Setup", icon: Home },
    { title: "Energy Source", icon: Battery }
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;
  const StepIcon = steps[currentStep].icon;

  const addRoom = () => {
    if (newRoom.trim()) {
      setSetupData(prev => ({
        ...prev,
        rooms: [...prev.rooms, { name: newRoom.trim(), id: Date.now() }]
      }));
      setNewRoom("");
    }
  };

  const removeRoom = (roomId) => {
    setSetupData(prev => ({
      ...prev,
      rooms: prev.rooms.filter(room => room.id !== roomId)
    }));
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(setupData);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return setupData.buildingType && (setupData.buildingType !== 'other' || setupData.buildingName);
      case 1: return setupData.rooms.length > 0;
      case 2: return setupData.energySource;
      default: return true;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-auto mx-auto mb-4">
            <img src={solarcore} alt="SolarCore Logo" className="w-full h-auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 font-inter">Welcome to SolarCore</h1>
          <p className="text-gray-600 font-inter mt-2">Let's set up your smart home system</p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium text-gray-600 font-inter">
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="text-sm font-medium text-gray-600 font-inter">
              {Math.round(progress)}%
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <Card className="glass-card shadow-xl border-0 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-lg font-inter">
              <StepIcon className="w-6 h-6 text-yellow-600" />
              {steps[currentStep].title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentStep === 0 && (
                <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                        {BUILDING_TYPES.map((type) => (
                        <button
                            key={type.id}
                            onClick={() => setSetupData(prev => ({ ...prev, buildingType: type.id, buildingName: type.id !== 'other' ? type.name : '' }))}
                            className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                            setupData.buildingType === type.id
                                ? 'border-yellow-500 bg-yellow-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            <type.icon className="w-6 h-6 text-gray-600" />
                            <span className="font-medium text-sm font-inter text-center">{type.name}</span>
                        </button>
                        ))}
                    </div>
                    {setupData.buildingType === "other" && (
                        <div>
                            <Label htmlFor="buildingName" className="text-sm font-medium text-gray-700 font-inter">
                                Building Name
                            </Label>
                            <Input
                                id="buildingName"
                                placeholder="e.g., My Apartment Complex"
                                value={setupData.buildingName}
                                onChange={(e) => setSetupData(prev => ({...prev, buildingName: e.target.value}))}
                                className="mt-2 font-inter"
                            />
                        </div>
                    )}
                </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter room name (e.g., Living Room)"
                    value={newRoom}
                    onChange={(e) => setNewRoom(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addRoom()}
                    className="font-inter"
                  />
                  <Button onClick={addRoom} size="icon" className="bg-yellow-500 hover:bg-yellow-600">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800 font-inter">
                    💡 You can add, edit, or delete rooms anytime from the Automation tab.
                  </p>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {setupData.rooms.map((room) => (
                    <div key={room.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Home className="w-4 h-4 text-gray-500" />
                        <span className="font-medium font-inter">{room.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRoom(room.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="grid gap-3">
                  {ENERGY_SOURCES.map((source) => (
                    <button
                      key={source.id}
                      onClick={() => setSetupData(prev => ({ ...prev, energySource: source.id }))}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        setupData.energySource === source.id
                          ? 'border-yellow-500 bg-yellow-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${source.color} rounded-lg flex items-center justify-center`}>
                          <source.icon className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-medium font-inter">{source.name}</span>
                        {setupData.energySource === source.id && (
                          <CheckCircle className="w-5 h-5 text-yellow-600 ml-auto" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between gap-4">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center gap-2 font-inter"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <Button
            onClick={nextStep}
            disabled={!canProceed()}
            className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 font-inter"
          >
            {currentStep === steps.length - 1 ? 'Complete Setup' : 'Next'}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
