import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Wifi, Edit2, Trash2, ChevronUp, ChevronDown, Send } from "lucide-react";
import { WiFiNetwork } from "@/entities/WiFiNetwork";
import { toast } from "sonner";

interface WiFiNetworkListProps {
  networks: WiFiNetwork[];
  onEdit: (network: WiFiNetwork) => void;
  onRefresh: () => void;
}

export default function WiFiNetworkList({ networks, onEdit, onRefresh }: WiFiNetworkListProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [sendingToDevices, setSendingToDevices] = useState(false);

  const handleToggleActive = async (network: WiFiNetwork) => {
    setUpdatingId(network.id);
    try {
      await WiFiNetwork.update(network.id, {
        is_active: !network.is_active
      });
      toast.success(`WiFi network ${!network.is_active ? 'enabled' : 'disabled'}`);
      onRefresh();
    } catch (error) {
      console.error("Error updating WiFi network:", error);
      toast.error("Failed to update WiFi network");
    }
    setUpdatingId(null);
  };

  const handleDelete = async (network: WiFiNetwork) => {
    if (!confirm(`Are you sure you want to delete the WiFi network "${network.ssid}"?`)) {
      return;
    }

    try {
      await WiFiNetwork.delete(network.id);
      toast.success("WiFi network deleted successfully");
      onRefresh();
    } catch (error) {
      console.error("Error deleting WiFi network:", error);
      toast.error("Failed to delete WiFi network");
    }
  };

  const handleMovePriority = async (network: WiFiNetwork, direction: 'up' | 'down') => {
    const currentIndex = networks.findIndex(n => n.id === network.id);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (targetIndex < 0 || targetIndex >= networks.length) return;

    const updatedNetworks = [...networks];
    const currentNetwork = updatedNetworks[currentIndex];
    const targetNetwork = updatedNetworks[targetIndex];

    // Swap priorities
    const tempPriority = currentNetwork.priority;
    currentNetwork.priority = targetNetwork.priority;
    targetNetwork.priority = tempPriority;

    try {
      await WiFiNetwork.updatePriorities([
        { id: currentNetwork.id, priority: currentNetwork.priority },
        { id: targetNetwork.id, priority: targetNetwork.priority }
      ]);
      toast.success("Network priority updated");
      onRefresh();
    } catch (error) {
      console.error("Error updating priorities:", error);
      toast.error("Failed to update network priority");
    }
  };

  const handleSendToDevices = async () => {
    setSendingToDevices(true);
    try {
      await WiFiNetwork.sendToDevices();
      toast.success("WiFi networks sent to connected devices");
    } catch (error) {
      console.error("Error sending to devices:", error);
      toast.error("Failed to send WiFi networks to devices");
    }
    setSendingToDevices(false);
  };

  if (networks.length === 0) {
    return (
      <div className="text-center py-8">
        <Wifi className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="app-text text-muted-foreground">No WiFi networks configured</p>
        <p className="app-text text-sm text-muted-foreground mt-1">
          Add a WiFi network to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Send to Devices Button */}
      <Button
        onClick={handleSendToDevices}
        disabled={sendingToDevices || networks.filter(n => n.is_active).length === 0}
        className="w-full gap-2"
        variant="outline"
      >
        <Send className="app-icon" />
        {sendingToDevices ? "Sending..." : "Send to Connected Devices"}
      </Button>

      {/* Networks List */}
      <div className="space-y-3">
        {networks.map((network, index) => (
          <Card key={network.id} className="glass-card border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`p-2 rounded-lg ${network.is_active ? 'bg-primary/20' : 'bg-muted'}`}>
                    <Wifi className={`app-icon ${network.is_active ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="app-text font-medium">{network.ssid}</h3>
                      {index === 0 && (
                        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                          Primary
                        </span>
                      )}
                    </div>
                    <p className="app-text text-sm text-muted-foreground">
                      Priority: {network.priority} • {network.is_active ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Priority Controls */}
                  <div className="flex flex-col">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMovePriority(network, 'up')}
                      disabled={index === 0}
                      className="h-6 w-6 p-0"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMovePriority(network, 'down')}
                      disabled={index === networks.length - 1}
                      className="h-6 w-6 p-0"
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Active Toggle */}
                  <Switch
                    checked={network.is_active}
                    onCheckedChange={() => handleToggleActive(network)}
                    disabled={updatingId === network.id}
                  />

                  {/* Edit Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(network)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>

                  {/* Delete Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(network)}
                    className="h-8 w-8 p-0 hover:bg-destructive/20 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {networks.filter(n => n.is_active).length === 0 && (
        <div className="text-center py-4">
          <p className="app-text text-sm text-muted-foreground">
            No active networks. Enable at least one network to send to devices.
          </p>
        </div>
      )}
    </div>
  );
}