import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Eye, EyeOff } from "lucide-react";

interface AdminPasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPasswordVerified: () => void;
}

export default function AdminPasswordModal({ 
  open, 
  onOpenChange, 
  onPasswordVerified 
}: AdminPasswordModalProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Default admin password for demo - in production this would come from backend
  const ADMIN_PASSWORD = "ander2024";

  const handleVerify = async () => {
    if (!password) {
      setError("Please enter the admin password");
      return;
    }

    setIsLoading(true);
    setError("");

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (password === ADMIN_PASSWORD) {
      setPassword("");
      onPasswordVerified();
      onOpenChange(false);
    } else {
      setError("Invalid admin password. Please try again.");
    }

    setIsLoading(false);
  };

  const handleClose = () => {
    setPassword("");
    setError("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-500" />
            Admin Authentication Required
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <Alert>
            <AlertDescription>
              This action requires admin privileges. Please enter the admin password to continue.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="admin-password">Admin Password</Label>
            <div className="relative">
              <Input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="text-xs text-gray-500">
            Demo password: ander2024
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleVerify} 
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? "Verifying..." : "Verify"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}