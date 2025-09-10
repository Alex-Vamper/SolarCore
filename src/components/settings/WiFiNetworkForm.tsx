import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, EyeOff, Wifi } from "lucide-react";
import { WiFiNetwork } from "@/entities/WiFiNetwork";
import { toast } from "sonner";

interface WiFiNetworkFormProps {
  isOpen: boolean;
  onClose: () => void;
  network?: WiFiNetwork | null;
  onSuccess: () => void;
}

export default function WiFiNetworkForm({ isOpen, onClose, network, onSuccess }: WiFiNetworkFormProps) {
  const [ssid, setSsid] = useState(network?.ssid || "");
  const [password, setPassword] = useState(network?.password || "");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ssid.trim()) {
      toast.error("WiFi network name (SSID) is required");
      return;
    }

    if (!password.trim()) {
      toast.error("WiFi password is required");
      return;
    }

    setIsSubmitting(true);
    try {
      if (network) {
        // Update existing network
        await WiFiNetwork.update(network.id, {
          ssid: ssid.trim(),
          password: password.trim()
        });
        toast.success("WiFi network updated successfully");
      } else {
        // Create new network
        await WiFiNetwork.create({
          ssid: ssid.trim(),
          password: password.trim(),
          priority: 0,
          is_active: true
        });
        toast.success("WiFi network added successfully");
      }
      
      onSuccess();
      onClose();
      
      // Reset form
      setSsid("");
      setPassword("");
      setShowPassword(false);
    } catch (error) {
      console.error("Error saving WiFi network:", error);
      toast.error("Failed to save WiFi network");
    }
    setIsSubmitting(false);
  };

  const handleClose = () => {
    onClose();
    // Reset form
    setSsid(network?.ssid || "");
    setPassword(network?.password || "");
    setShowPassword(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="app-text flex items-center gap-2">
            <Wifi className="app-icon text-primary" />
            {network ? "Edit WiFi Network" : "Add WiFi Network"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="ssid" className="app-text">Network Name (SSID)</Label>
            <Input
              id="ssid"
              value={ssid}
              onChange={(e) => setSsid(e.target.value)}
              placeholder="Enter WiFi network name"
              className="app-text mt-1"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="password" className="app-text">Password</Label>
            <div className="relative mt-1">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter WiFi password"
                className="app-text pr-10"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : network ? "Update" : "Add Network"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}