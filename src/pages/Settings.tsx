import React, { useState, useEffect } from "react";
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
      sessionStorage.removeItem('landingPageSeen');
      await User.logout();
      window.location.href = createPageUrl('Dashboard'); // Changed from LandingPage to Dashboard
    } catch (error) {
      console.error("Error logging out:", error);
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
    <div className="p-4 space-y-6 pb-24">
      {/* Header */}
      <div className="text-center py-6">
        <h1 className="text-2xl font-bold text-gray-900 font-inter">Settings</h1>
        <p className="text-gray-600 font-inter mt-1">
          Manage your account and preferences
        </p>
      </div>

      {/* Account Information */}
      <Card className="glass-card border-0 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-inter">
            <UserIcon className="w-5 h-5 text-blue-600" />
            Account Information
          </CardTitle>
           <Button variant="ghost" size="icon" onClick={() => setShowEditModal(true)}>
                <Pencil className="w-4 h-4 text-gray-500" />
            </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <span className="text-white font-bold text-xl font-inter">
                {user?.full_name?.charAt(0) || 'U'}
              </span>
            </div>
            <div>
              <div className="font-semibold text-gray-900 font-inter">{user?.full_name}</div>
              <div className="text-sm text-gray-500 font-inter">{user?.email}</div>
              <div className="text-xs text-gray-400 font-inter">
                Role: {user?.role || 'user'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Configuration */}
      <Card className="glass-card border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-inter">
            <Home className="w-5 h-5 text-green-600" />
            System Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700 font-inter">Total Rooms</Label>
              <div className="text-2xl font-bold text-gray-900 font-inter">
                {userSettings?.total_rooms || 0}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 font-inter">Solar Domes</Label>
              <div className="text-2xl font-bold text-gray-900 font-inter">
                {userSettings?.total_domes || 0}
              </div>
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700 font-inter">Energy Mode</Label>
            <select
              value={userSettings?.energy_mode || "auto_switch"}
              onChange={(e) => handleSaveSettings({ energy_mode: e.target.value })}
              className="w-full mt-1 p-2 border border-gray-300 rounded-lg bg-white font-inter"
            >
              <option value="solar_only">Solar Only</option>
              <option value="grid_only">Grid Only</option>
              <option value="auto_switch">Auto Switch</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card className="glass-card border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-inter">
            <Bell className="w-5 h-5 text-yellow-600" />
            Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
           <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium text-gray-700 font-inter">
                Push Notifications
              </Label>
              <p className="text-sm text-gray-500 font-inter">
                Receive alerts about system status
              </p>
            </div>
            <Switch
              checked={userSettings?.notifications_enabled ?? true}
              onCheckedChange={(checked) => handleSaveSettings({ notifications_enabled: checked })}
            />
          </div>

          <div className="space-y-2">
             <Label className="text-sm font-medium text-gray-700 font-inter">Preferred Email</Label>
             <div className="flex items-center gap-2">
                <Input
                    type="email"
                    placeholder="your.email@example.com"
                    value={userSettings?.preferred_email || user?.email || ""}
                    onChange={(e) => handleSaveSettings({ preferred_email: e.target.value })}
                />
                <Switch
                    checked={userSettings?.preferred_email_enabled ?? true}
                    onCheckedChange={(checked) => handleSaveSettings({ preferred_email_enabled: checked })}
                />
             </div>
          </div>

          <div className="space-y-2">
             <Label className="text-sm font-medium text-gray-700 font-inter">Preferred WhatsApp</Label>
             <div className="flex items-center gap-2">
                <Input
                    type="tel"
                    placeholder="+234..."
                    value={userSettings?.preferred_whatsapp || ""}
                    onChange={(e) => handleSaveSettings({ preferred_whatsapp: e.target.value })}
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
          <CardTitle className="flex items-center gap-2 text-lg font-inter">
            <HelpCircle className="w-5 h-5 text-purple-600" />
            Support
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Link to={createPageUrl("FAQ")}>
            <Button variant="outline" className="w-full justify-start font-inter">
                <HelpCircle className="w-4 h-4 mr-2" />
                FAQ & Troubleshooting
            </Button>
          </Link>
          <Link to={createPageUrl("ContactSupport")}>
            <Button variant="outline" className="w-full justify-start font-inter">
              <MessageSquare className="w-4 h-4 mr-2" />
              Contact Support
            </Button>
          </Link>
           <Link to={createPageUrl("Feedback")}>
            <Button variant="outline" className="w-full justify-start font-inter">
              <Star className="w-4 h-4 mr-2" />
              Submit Feedback
            </Button>
          </Link>
          <Button variant="outline" className="w-full justify-start font-inter" onClick={() => navigate(createPageUrl("Ander"))}>
            <div className="w-4 h-4 mr-2">
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
            className="w-full font-inter"
          >
            <LogOut className="w-4 h-4 mr-2" />
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
  );
}