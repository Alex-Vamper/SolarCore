import { useState, useEffect } from "react";
import { User, UserSettings } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  User as UserIcon,
  Home,
  Zap,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  FileText,
  Pencil,
  MessageSquare,
  Star
} from "lucide-react";
import EditAccountModal from "../components/settings/EditAccountModal";
import { supabase } from '@/integrations/supabase/client';

export default function Settings() {
  const [user, setUser] = useState(null);
  const [userSettings, setUserSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      const settingsResult = await UserSettings.filter({ created_by: currentUser.email });
      const userSetting = settingsResult.length > 0 ? settingsResult[0] : null;
      setUserSettings(userSetting);
    } catch (error) {
      console.error("Error loading settings:", error);
    }
    setIsLoading(false);
  };

  const handleSaveSettings = async (newSettings) => {
    setIsSaving(true);
    try {
      if (userSettings) {
        const updatedSettings = { ...userSettings, ...newSettings };
        await UserSettings.update(userSettings.id, updatedSettings);
        setUserSettings(updatedSettings);
      } else {
        // If settings don't exist, create new ones based on current user's email
        await UserSettings.create({ ...newSettings, created_by: user?.email });
        loadData(); // Reload to get the newly created settings object with an ID
      }
    } catch (error) {
      console.error("Error saving settings:", error);
    }
    setIsSaving(false);
  };

  const handleSaveAccountInfo = async (info) => {
    setIsSaving(true);
    try {
        await User.updateMyUserData({ full_name: info.fullName });

        if (userSettings) {
            const updatedSettings = { ...userSettings, ...info.settings };
            await UserSettings.update(userSettings.id, updatedSettings);
        } else {
             await UserSettings.create({ ...info.settings, created_by: user?.email });
        }
        await loadData(); // Reload all data to ensure consistency after updates
        setShowEditModal(false); // Close the modal on successful save
    } catch(error) {
        console.error("Error saving account info:", error);
    }
    setIsSaving(false);
  };

  const handleLogout = async () => {
    try {
      // Clear Supabase session + tokens
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Optional: clear extra app state
      //localStorage.clear();
      sessionStorage.clear();

      // Redirect user to the auth or landing page
      window.location.href = "/auth"; 
    } catch (err: any) {
      console.error("Logout failed:", err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <div className="w-8 h-8 bg-white rounded-full"></div>
          </div>
          <p className="text-gray-600 font-inter">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24">
      <div className="max-w-[1280px] mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-6">
          <h1 className="app-heading text-2xl font-bold text-gray-900">Settings</h1>
          <p className="app-text text-gray-600 mt-1">
            Manage your account and preferences
          </p>
        </div>

        {/* Account Information */}
        <Card className="glass-card border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="app-text flex items-center gap-2 text-lg">
              <UserIcon className="app-icon text-blue-600" />
              Account Information
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setShowEditModal(true)}>
              <Pencil className="app-icon text-gray-500" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <span className="app-text text-white font-bold text-xl">
                  {user?.full_name?.charAt(0) || 'U'}
                </span>
              </div>
              <div>
                <div className="app-text font-semibold text-gray-900">{user?.full_name}</div>
                <div className="app-text text-sm text-gray-500">{user?.email}</div>
                <div className="app-text text-xs text-gray-400">
                  Role: {user?.role || 'user'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Configuration */}
        <Card className="glass-card border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="app-text flex items-center gap-2 text-lg">
              <Home className="app-icon text-green-600" />
              System Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => navigate("/app/advanced-system-settings")}
              className="w-full app-text"
            >
              Advanced System Settings
            </Button>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="app-text text-blue-800">
                Configure your power source type, system IDs, and energy settings.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card className="glass-card border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="app-text flex items-center gap-2 text-lg">
              <Bell className="app-icon text-yellow-600" />
              Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="app-text font-medium text-gray-700">
                  Push Notifications
                </Label>
                <p className="app-text text-sm text-gray-500">
                  Receive alerts about system status
                </p>
              </div>
              <Switch
                checked={userSettings?.notifications_enabled ?? true}
                onCheckedChange={(checked) => handleSaveSettings({ notifications_enabled: checked })}
              />
            </div>

            <div className="space-y-2">
              <Label className="app-text font-medium text-gray-700">Preferred Email</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="email"
                  placeholder="your.email@example.com"
                  value={userSettings?.preferred_email || user?.email || ""}
                  onChange={(e) => handleSaveSettings({ preferred_email: e.target.value })}
                  className="app-text"
                />
                <Switch
                  checked={userSettings?.preferred_email_enabled ?? true}
                  onCheckedChange={(checked) => handleSaveSettings({ preferred_email_enabled: checked })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="app-text font-medium text-gray-700">Preferred WhatsApp</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="tel"
                  placeholder="+234..."
                  value={userSettings?.preferred_whatsapp || ""}
                  onChange={(e) => handleSaveSettings({ preferred_whatsapp: e.target.value })}
                  className="app-text"
                />
                <Switch
                  checked={userSettings?.preferred_whatsapp_enabled ?? true}
                  onCheckedChange={(checked) => handleSaveSettings({ preferred_whatsapp_enabled: checked })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Support */}
        <Card className="glass-card border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="app-text flex items-center gap-2 text-lg">
              <HelpCircle className="app-icon text-purple-600" />
              Support
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/app/faq">
              <Button variant="outline" className="w-full justify-start app-text">
                <HelpCircle className="app-icon mr-2" />
                FAQ & Troubleshooting
              </Button>
            </Link>
            <Link to="/app/contact">
              <Button variant="outline" className="w-full justify-start app-text">
                <MessageSquare className="app-icon mr-2" />
                Contact Support
              </Button>
            </Link>
            <Link to="/app/feedback">
              <Button variant="outline" className="w-full justify-start app-text">
                <Star className="app-icon mr-2" />
                Submit Feedback
              </Button>
            </Link>
            <Button variant="outline" className="w-full justify-start app-text" onClick={() => navigate("/app/ander")}>
              <div className="app-icon mr-2">
                <svg width="16" height="16" viewBox="0 0 100 100" className="w-4 h-4">
                  <defs>
                    <radialGradient id="centerGlowSmall" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#FCD34D" />
                      <stop offset="50%" stopColor="#F59E0B" />
                      <stop offset="100%" stopColor="#D97706" />
                    </radialGradient>
                    <linearGradient id="bladeGradientSmall" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3B82F6" />
                      <stop offset="50%" stopColor="#1E40AF" />
                      <stop offset="100%" stopColor="#1E3A8A" />
                    </linearGradient>
                  </defs>
                  
                  <g transform="translate(50, 50)">
                    <path d="M 0,-35 Q -15,-20 -35,-15 Q -20,-5 0,0 Q 5,-20 0,-35" 
                          fill="url(#bladeGradientSmall)" 
                          opacity="0.8"/>
                    
                    <g transform="rotate(120)">
                      <path d="M 0,-35 Q -15,-20 -35,-15 Q -20,-5 0,0 Q 5,-20 0,-35" 
                            fill="url(#bladeGradientSmall)" 
                            opacity="0.8"/>
                    </g>
                    
                    <g transform="rotate(240)">
                      <path d="M 0,-35 Q -15,-20 -35,-15 Q -20,-5 0,0 Q 5,-20 0,-35" 
                            fill="url(#bladeGradientSmall)" 
                            opacity="0.8"/>
                    </g>
                    
                    <circle cx="0" cy="0" r="12" fill="url(#centerGlowSmall)" />
                    <circle cx="0" cy="0" r="6" fill="#FFFFFF" opacity="0.9" />
                  </g>
                </svg>
              </div>
              Ander - Voice Commands
            </Button>
          </CardContent>
        </Card>

        {/* Logout */}
        <Card className="glass-card border-0 shadow-lg">
          <CardContent className="pt-6">
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="w-full app-text"
            >
              <LogOut className="app-icon mr-2" />
              Logout
            </Button>
          </CardContent>
        </Card>

        <EditAccountModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          user={user}
          userSettings={userSettings}
          onSave={handleSaveAccountInfo}
        />
      </div>
    </div>
  );
}