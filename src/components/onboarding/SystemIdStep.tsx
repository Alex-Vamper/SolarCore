import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Zap, Grid3x3, CheckCircle } from "lucide-react";
import { PowerSystem } from "@/entities/PowerSystem";
import { toast } from "sonner";

interface SystemIdStepProps {
  powerSource: string;
  solarSystemId: string;
  gridMeterId: string;
  solarProvider: string;
  onSolarSystemIdChange: (value: string) => void;
  onGridMeterIdChange: (value: string) => void;
  onSolarProviderChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const SOLAR_PROVIDERS = [
  { value: "SolarCore", label: "SolarCore" },
  { value: "Huawei", label: "Huawei" },
  { value: "Schneider", label: "Schneider" },
  { value: "Victron", label: "Victron" },
];

export default function SystemIdStep({
  powerSource,
  solarSystemId,
  gridMeterId,
  solarProvider,
  onSolarSystemIdChange,
  onGridMeterIdChange,
  onSolarProviderChange,
  onNext,
  onBack,
}: SystemIdStepProps) {
  const [skipSolar, setSkipSolar] = useState(false);
  const [skipGrid, setSkipGrid] = useState(false);
  const [solarValidated, setSolarValidated] = useState(false);
  const [gridValidated, setGridValidated] = useState(false);
  const [validating, setValidating] = useState(false);

  // Reset validation states when IDs change
  useEffect(() => {
    setSolarValidated(false);
  }, [solarSystemId]);

  useEffect(() => {
    setGridValidated(false);
  }, [gridMeterId]);

  const validateSolarId = async () => {
    if (!solarSystemId || skipSolar) return;
    
    setValidating(true);
    const system = await PowerSystem.validateSystemId(solarSystemId);
    setValidating(false);
    
    if (system && system.system_type === 'solar') {
      setSolarValidated(true);
      toast.success("Solar system ID validated successfully!");
    } else {
      toast.error("Invalid solar system ID. Please check and try again.");
    }
  };

  const validateGridId = async () => {
    if (!gridMeterId || skipGrid) return;
    
    setValidating(true);
    const system = await PowerSystem.validateSystemId(gridMeterId);
    setValidating(false);
    
    if (system && system.system_type === 'grid') {
      setGridValidated(true);
      toast.success("Grid meter ID validated successfully!");
    } else {
      toast.error("Invalid grid meter ID. Please check and try again.");
    }
  };

  const handleNext = () => {
    // Show warning for skipped IDs
    if (skipSolar && (powerSource === 'solar_only' || powerSource === 'solar_grid')) {
      toast.warning("Solar monitoring and energy optimization services will be unavailable", {
        duration: 20000,
      });
    }
    if (skipGrid && (powerSource === 'grid_only' || powerSource === 'solar_grid')) {
      toast.warning("Energy monitoring, billing & recharge tracking services will be unavailable", {
        duration: 20000,
      });
    }
    
    // If no digital connection, show warning
    if (powerSource === 'no_digital') {
      toast.warning("Some features will not be available without digital connection", {
        duration: 20000,
      });
    }
    
    onNext();
  };

  const canProceed = () => {
    if (powerSource === 'no_digital') return true;
    
    if (powerSource === 'solar_only') {
      return skipSolar || (solarSystemId && solarValidated);
    }
    
    if (powerSource === 'grid_only') {
      return skipGrid || (gridMeterId && gridValidated);
    }
    
    if (powerSource === 'solar_grid') {
      const solarOk = skipSolar || (solarSystemId && solarValidated);
      const gridOk = skipGrid || (gridMeterId && gridValidated);
      return solarOk && gridOk;
    }
    
    return false;
  };

  // No digital connection - skip this step entirely
  if (powerSource === 'no_digital') {
    return (
      <Card className="bg-card/50 backdrop-blur border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-warning" />
            No Digital Connection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            You've chosen to proceed without digital connection. Some features will be unavailable, but you can still use manual controls and basic features.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onBack}>
              Back
            </Button>
            <Button onClick={handleNext} className="flex-1">
              Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur border-primary/20">
      <CardHeader>
        <CardTitle>System Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Solar System Configuration */}
        {(powerSource === 'solar_only' || powerSource === 'solar_grid') && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-yellow-500" />
              <h3 className="font-semibold">Solar System Details</h3>
            </div>
            
            <div>
              <Label htmlFor="solar-provider">Solar Provider</Label>
              <Select value={solarProvider} onValueChange={onSolarProviderChange}>
                <SelectTrigger id="solar-provider" className="mt-1">
                  <SelectValue placeholder="Select your solar provider" />
                </SelectTrigger>
                <SelectContent>
                  {SOLAR_PROVIDERS.map((provider) => (
                    <SelectItem key={provider.value} value={provider.value}>
                      {provider.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="solar-id">Solar System ID</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="solar-id"
                  placeholder="e.g., SC-SS-0001"
                  value={solarSystemId}
                  onChange={(e) => onSolarSystemIdChange(e.target.value)}
                  disabled={skipSolar || !solarProvider}
                />
                {solarSystemId && !skipSolar && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={validateSolarId}
                    disabled={validating || solarValidated}
                  >
                    {solarValidated ? <CheckCircle className="w-4 h-4 text-green-500" /> : "Validate"}
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="skip-solar"
                checked={skipSolar}
                onChange={(e) => {
                  setSkipSolar(e.target.checked);
                  if (e.target.checked) {
                    onSolarSystemIdChange("");
                    setSolarValidated(false);
                  }
                }}
                className="rounded border-muted-foreground"
              />
              <Label htmlFor="skip-solar" className="text-sm text-muted-foreground cursor-pointer">
                I don't have/know my Solar System ID
              </Label>
            </div>
          </div>
        )}

        {/* Grid System Configuration */}
        {(powerSource === 'grid_only' || powerSource === 'solar_grid') && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Grid3x3 className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold">Grid Meter Details</h3>
            </div>
            
            <div>
              <Label htmlFor="grid-id">Grid Meter ID</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="grid-id"
                  placeholder="e.g., NG-PM-0001"
                  value={gridMeterId}
                  onChange={(e) => onGridMeterIdChange(e.target.value)}
                  disabled={skipGrid}
                />
                {gridMeterId && !skipGrid && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={validateGridId}
                    disabled={validating || gridValidated}
                  >
                    {gridValidated ? <CheckCircle className="w-4 h-4 text-green-500" /> : "Validate"}
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Format: NG-PM-XXXX (National Grid - Prepaid Meter - ID)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="skip-grid"
                checked={skipGrid}
                onChange={(e) => {
                  setSkipGrid(e.target.checked);
                  if (e.target.checked) {
                    onGridMeterIdChange("");
                    setGridValidated(false);
                  }
                }}
                className="rounded border-muted-foreground"
              />
              <Label htmlFor="skip-grid" className="text-sm text-muted-foreground cursor-pointer">
                I don't have/know my Grid Meter ID
              </Label>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button 
            onClick={handleNext} 
            className="flex-1"
            disabled={!canProceed()}
          >
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}