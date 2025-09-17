import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Zap, Grid3x3, CheckCircle, Sun, Battery, WifiOff, ArrowLeft, Save, Wifi, Plus } from "lucide-react";
import { PowerSystem } from "@/entities/PowerSystem";
import { UserSettingsService } from "@/entities/UserSettings";
import { WiFiNetwork } from "@/entities/WiFiNetwork";
import WiFiNetworkForm from "@/components/settings/WiFiNetworkForm";
import WiFiNetworkList from "@/components/settings/WiFiNetworkList";
import { toast } from "sonner";

const ENERGY_SOURCES = [
  { id: "solar_only", name: "Solar Only", icon: Sun, color: "bg-yellow-500" },
  { id: "grid_only", name: "Grid Only", icon: Grid3x3, color: "bg-blue-500" },
  { id: "solar_grid", name: "Solar + Grid", icon: Battery, color: "bg-green-500" },
  { id: "no_digital", name: "No Digital Connection", icon: WifiOff, color: "bg-gray-500" }
];

const SOLAR_PROVIDERS = [
  { value: "SolarCore", label: "SolarCore" },
  { value: "Huawei", label: "Huawei" },
  { value: "Schneider", label: "Schneider" },
  { value: "Victron", label: "Victron" },
];

export default function AdvancedSystemSettings() {
  const navigate = useNavigate();
  const [userSettings, setUserSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [energySource, setEnergySource] = useState("");
  const [solarProvider, setSolarProvider] = useState("SolarCore");
  const [solarSystemId, setSolarSystemId] = useState("");
  const [gridMeterId, setGridMeterId] = useState("");
  const [skipSolar, setSkipSolar] = useState(false);
  const [skipGrid, setSkipGrid] = useState(false);
  const [solarValidated, setSolarValidated] = useState(false);
  const [gridValidated, setGridValidated] = useState(false);
  const [validating, setValidating] = useState(false);
  
  // WiFi networks state
  const [wifiNetworks, setWifiNetworks] = useState<WiFiNetwork[]>([]);
  const [wifiFormOpen, setWifiFormOpen] = useState(false);
  const [editingNetwork, setEditingNetwork] = useState<WiFiNetwork | null>(null);
  const [loadingWifi, setLoadingWifi] = useState(false);

  useEffect(() => {
    loadSettings();
    loadWifiNetworks();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const settings = await UserSettingsService.list();
      if (settings && settings.length > 0) {
        const userSetting = settings[0];
        setUserSettings(userSetting);
        
        // Initialize form with existing values
        setEnergySource(userSetting.power_source || "grid_only");
        setSolarSystemId(userSetting.solar_system_id || "");
        setGridMeterId(userSetting.grid_meter_id || "");
        
        // If IDs exist, mark them as validated
        if (userSetting.solar_system_id) {
          setSolarValidated(true);
        }
        if (userSetting.grid_meter_id) {
          setGridValidated(true);
        }
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      toast.error("Failed to load system settings");
    }
    setIsLoading(false);
  };

  const loadWifiNetworks = async () => {
    setLoadingWifi(true);
    try {
      const networks = await WiFiNetwork.list();
      setWifiNetworks(networks);
    } catch (error) {
      console.error("Error loading WiFi networks:", error);
      toast.error("Failed to load WiFi networks");
    }
    setLoadingWifi(false);
  };

  const handleEditWifiNetwork = (network: WiFiNetwork) => {
    setEditingNetwork(network);
    setWifiFormOpen(true);
  };

  const handleAddWifiNetwork = () => {
    setEditingNetwork(null);
    setWifiFormOpen(true);
  };

  const handleWifiFormSuccess = () => {
    loadWifiNetworks();
  };

  const handleSendToDevices = async () => {
    try {
      // This would send WiFi credentials to connected devices
      // For now, just show success message
      toast.success("WiFi credentials sent to connected devices!", {
        description: "Your Ander devices can now connect to the internet and use AI features."
      });
    } catch (error) {
      console.error("Error sending WiFi to devices:", error);
      toast.error("Failed to send WiFi credentials to devices");
    }
  };

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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedSettings = {
        ...userSettings,
        power_source: energySource,
        solar_system_id: skipSolar ? null : solarSystemId,
        grid_meter_id: skipGrid ? null : gridMeterId,
      };

      await UserSettingsService.update(userSettings.id, updatedSettings);
      
      // Show appropriate warnings
      if (skipSolar && (energySource === 'solar_only' || energySource === 'solar_grid')) {
        toast.warning("Solar monitoring and energy optimization services will be unavailable", {
          duration: 5000,
        });
      }
      if (skipGrid && (energySource === 'grid_only' || energySource === 'solar_grid')) {
        toast.warning("Energy monitoring, billing & recharge tracking services will be unavailable", {
          duration: 5000,
        });
      }
      if (energySource === 'no_digital') {
        toast.warning("Some features will not be available without digital connection", {
          duration: 5000,
        });
      }
      
      toast.success("System settings updated successfully!");
      navigate("/app/settings");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save system settings");
    }
    setIsSaving(false);
  };

  const canSave = () => {
    if (energySource === 'no_digital') return true;
    
    if (energySource === 'solar_only') {
      return skipSolar || (solarSystemId && solarValidated);
    }
    
    if (energySource === 'grid_only') {
      return skipGrid || (gridMeterId && gridValidated);
    }
    
    if (energySource === 'solar_grid') {
      const solarOk = skipSolar || (solarSystemId && solarValidated);
      const gridOk = skipGrid || (gridMeterId && gridValidated);
      return solarOk && gridOk;
    }
    
    return false;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <div className="w-8 h-8 bg-white rounded-full"></div>
          </div>
          <p className="app-text text-gray-600">Loading system settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 pb-24">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/app/settings")}
            className="rounded-full"
          >
            <ArrowLeft className="app-icon" />
          </Button>
          <div>
            <h1 className="app-heading text-2xl font-bold">Advanced System Settings</h1>
            <p className="app-text text-muted-foreground">Configure your power source and connectivity settings</p>
          </div>
        </div>

        {/* Tabbed Interface */}
        <Tabs defaultValue="energy" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="energy" className="gap-2">
              <Battery className="app-icon" />
              Energy Sources
            </TabsTrigger>
            <TabsTrigger value="wifi" className="gap-2">
              <Wifi className="app-icon" />
              Connectivity
            </TabsTrigger>
          </TabsList>

          {/* Energy Sources Tab */}
          <TabsContent value="energy" className="space-y-6">

        {/* Energy Source Selection */}
        <Card className="glass-card border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="app-text flex items-center gap-2">
              <Battery className="app-icon text-primary" />
              Power Source Type
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {ENERGY_SOURCES.map((source) => (
                <button
                  key={source.id}
                  onClick={() => setEnergySource(source.id)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    energySource === source.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-muted-foreground'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className={`w-10 h-10 ${source.color} rounded-lg flex items-center justify-center`}>
                      <source.icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="app-text font-medium">{source.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* No Digital Connection Notice */}
        {energySource === 'no_digital' && (
          <Card className="glass-card border-0 shadow-lg border-warning/50">
            <CardHeader>
              <CardTitle className="app-text flex items-center gap-2">
                <AlertCircle className="app-icon text-warning" />
                No Digital Connection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="app-text text-muted-foreground">
                You've chosen to proceed without digital connection. Some features will be unavailable, 
                but you can still use manual controls and basic features.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Solar System Configuration */}
        {(energySource === 'solar_only' || energySource === 'solar_grid') && (
          <Card className="glass-card border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="app-text flex items-center gap-2">
                <Sun className="app-icon text-yellow-500" />
                Solar System Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="solar-provider" className="app-text">Solar Provider</Label>
                <Select value={solarProvider} onValueChange={setSolarProvider}>
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
                <Label htmlFor="solar-id" className="app-text">Solar System ID</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="solar-id"
                    placeholder="e.g., SC-SS-0001"
                    value={solarSystemId}
                    onChange={(e) => setSolarSystemId(e.target.value)}
                    disabled={skipSolar || !solarProvider}
                    className="app-text"
                  />
                  {solarSystemId && !skipSolar && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={validateSolarId}
                      disabled={validating || solarValidated}
                    >
                      {solarValidated ? <CheckCircle className="app-icon text-green-500" /> : "Validate"}
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
                      setSolarSystemId("");
                      setSolarValidated(false);
                    }
                  }}
                  className="rounded border-muted-foreground"
                />
                <Label htmlFor="skip-solar" className="app-text text-muted-foreground cursor-pointer">
                  I don't have/know my Solar System ID
                </Label>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Grid System Configuration */}
        {(energySource === 'grid_only' || energySource === 'solar_grid') && (
          <Card className="glass-card border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="app-text flex items-center gap-2">
                <Grid3x3 className="app-icon text-blue-500" />
                Grid Meter Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="grid-id" className="app-text">Grid Meter ID</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="grid-id"
                    placeholder="e.g., NG-PM-0001"
                    value={gridMeterId}
                    onChange={(e) => setGridMeterId(e.target.value)}
                    disabled={skipGrid}
                    className="app-text"
                  />
                  {gridMeterId && !skipGrid && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={validateGridId}
                      disabled={validating || gridValidated}
                    >
                      {gridValidated ? <CheckCircle className="app-icon text-green-500" /> : "Validate"}
                    </Button>
                  )}
                </div>
                <p className="app-text text-muted-foreground mt-1">
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
                      setGridMeterId("");
                      setGridValidated(false);
                    }
                  }}
                  className="rounded border-muted-foreground"
                />
                <Label htmlFor="skip-grid" className="app-text text-muted-foreground cursor-pointer">
                  I don't have/know my Grid Meter ID
                </Label>
              </div>
            </CardContent>
          </Card>
        )}

            {/* Save Button */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => navigate("/app/settings")}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!canSave() || isSaving}
                className="flex-1 gap-2"
              >
                <Save className="app-icon" />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </TabsContent>

          {/* WiFi Connectivity Tab */}
          <TabsContent value="wifi" className="space-y-6">
            <Card className="glass-card border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="app-text flex items-center gap-2">
                    <Wifi className="app-icon text-primary" />
                    WiFi Networks
                  </CardTitle>
                  <Button onClick={handleAddWifiNetwork} className="gap-2">
                    <Plus className="app-icon" />
                    Add Network
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="app-text text-muted-foreground">
                    Configure WiFi networks for your connected devices. Devices will automatically 
                    connect to available networks based on priority order.
                  </p>
                  
                   {loadingWifi ? (
                     <div className="text-center py-8">
                       <div className="w-8 h-8 bg-primary/20 rounded-full mx-auto mb-4 animate-pulse"></div>
                       <p className="app-text text-muted-foreground">Loading WiFi networks...</p>
                     </div>
                   ) : (
                     <WiFiNetworkList
                       networks={wifiNetworks}
                       onEdit={handleEditWifiNetwork}
                       onRefresh={loadWifiNetworks}
                     />
                   )}
                 </div>
               </CardContent>
             </Card>
           </TabsContent>
         </Tabs>

         {/* WiFi Network Form Modal */}
         <WiFiNetworkForm
           isOpen={wifiFormOpen}
           onClose={() => setWifiFormOpen(false)}
           network={editingNetwork}
           onSuccess={handleWifiFormSuccess}
         />
      </div>
    </div>
  );
}