
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Shield, 
  Home, 
  Lock, 
  Power,
  Settings,
  Clock,
  Unlock
} from "lucide-react";
import { UserSettings } from "@/entities/all";
import { toast } from "sonner";
import SecuritySettingsModal from "./SecuritySettingsModal";

export default function SecurityOverview({ onSecurityModeToggle, onSecuritySettings }) {
  const [isDoorLocked, setIsDoorLocked] = useState(false);
  const [isSecurityMode, setIsSecurityMode] = useState(false);
  const [isArming, setIsArming] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [securitySettings, setSecuritySettings] = useState(null);

  const speak = (text, repeat = 1) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;
    
    let repeatCount = 0;
    
    const doSpeak = () => {
      if (repeatCount < repeat) {
        repeatCount++;
        utterance.onend = () => {
          if (repeatCount < repeat) {
            setTimeout(() => doSpeak(), 500);
          }
        };
        window.speechSynthesis.speak(utterance);
      }
    };
    doSpeak();
  };

  // Load security state and settings from localStorage and database
  const loadSecurityData = async () => {
    try {
      // Load user settings for security configuration
      const settings = await UserSettings.list();
      if (settings.length > 0) {
        setSecuritySettings(settings[0].security_settings);
      }
    } catch (error) {
      console.error("Error loading security settings:", error);
    }
    
    // Load local state
    const savedSecurityState = localStorage.getItem('securityState');
    if (savedSecurityState) {
      const state = JSON.parse(savedSecurityState);
      setIsDoorLocked(state.isDoorLocked || false);
      setIsSecurityMode(state.isSecurityMode || false);
    }
  };

  useEffect(() => {
    loadSecurityData();
  }, []);

  // Listen for settings changes
  useEffect(() => {
    const handleSecuritySettingsChanged = () => {
      loadSecurityData();
    };

    window.addEventListener('securitySettingsChanged', handleSecuritySettingsChanged);
    return () => {
      window.removeEventListener('securitySettingsChanged', handleSecuritySettingsChanged);
    };
  }, []);

  // Save security state to localStorage whenever it changes
  useEffect(() => {
    const securityState = {
      isDoorLocked,
      isSecurityMode
    };
    localStorage.setItem('securityState', JSON.stringify(securityState));
  }, [isDoorLocked, isSecurityMode]);

  // Listen for global state changes from voice commands
  useEffect(() => {
    const handleDoorLocked = (event) => {
      const locked = event.detail.locked;
      setIsDoorLocked(locked);
      if (locked) {
          setIsSecurityMode(true);
          onSecurityModeToggle(true);
      }
    };

    const handleDoorUnlocked = (event) => {
      setIsDoorLocked(false);
      setIsSecurityMode(false);
      onSecurityModeToggle(false);
    }

    const handleSecurityModeChanged = (event) => {
      const mode = event.detail.mode;
      setIsSecurityMode(mode === 'away');
      onSecurityModeToggle(mode === 'away');
      if (mode === 'away') {
          setIsDoorLocked(true); // Locking the door is part of away mode
      }
    };

    window.addEventListener('doorLocked', handleDoorLocked);
    window.addEventListener('doorUnlocked', handleDoorUnlocked);
    window.addEventListener('securityModeChanged', handleSecurityModeChanged);

    return () => {
      window.removeEventListener('doorLocked', handleDoorLocked);
      window.removeEventListener('doorUnlocked', handleDoorUnlocked);
      window.removeEventListener('securityModeChanged', handleSecurityModeChanged);
    };
  }, [onSecurityModeToggle]);

  const handleDoorToggle = async () => {
    // Check if security device is configured
    if (!securitySettings?.door_security_id) {
      toast.error('Please configure a security device in settings first');
      return;
    }
    
    setIsArming(true);
    const newLockState = !isDoorLocked;
    
    try {
      // Update backend state via SecuritySystemService
      const { SecuritySystemService } = await import('@/entities/SecuritySystem');
      const securitySystems = await SecuritySystemService.list();
      let securitySystem = securitySystems.find(s => s.system_id === securitySettings.door_security_id);
      
      // If no security system found, create one
      if (!securitySystem) {
        console.log('Creating new security system with ID:', securitySettings.door_security_id);
        securitySystem = await SecuritySystemService.create({
          system_id: securitySettings.door_security_id,
          system_type: 'door_control',
          lock_status: 'unlocked',
          security_mode: 'home'
        });
        toast.success('Security system created and linked');
      }
      
      if (securitySystem?.id) {
        await SecuritySystemService.update(securitySystem.id, {
          lock_status: newLockState ? 'locked' : 'unlocked',
          security_mode: newLockState ? 'away' : 'home',
          last_action: new Date().toISOString()
        });
        console.log('Security system updated:', securitySystem.id, {
          lock_status: newLockState ? 'locked' : 'unlocked',
          security_mode: newLockState ? 'away' : 'home'
        });
      }
      
      // Update local state
      if (newLockState) {
        setIsDoorLocked(true);
        setIsSecurityMode(true);
        await onSecurityModeToggle(true);
      } else {
        setIsDoorLocked(false);
        setIsSecurityMode(false);
        await onSecurityModeToggle(false);
      }
    } catch (error) {
      console.error('Error updating security state:', error);
      toast.error('Failed to update security state');
    } finally {
      setIsArming(false);
    }
  };

  const handleSecurityToggle = async () => {
    // Check if security device is configured
    if (!securitySettings?.door_security_id) {
      toast.error('Please configure a security device in settings first');
      return;
    }
    
    setIsArming(true);
    const newSecurityMode = !isSecurityMode;

    try {
      // Update backend state via SecuritySystemService
      const { SecuritySystemService } = await import('@/entities/SecuritySystem');
      const securitySystems = await SecuritySystemService.list();
      let securitySystem = securitySystems.find(s => s.system_id === securitySettings.door_security_id);
      
      // If no security system found, create one
      if (!securitySystem) {
        console.log('Creating new security system with ID:', securitySettings.door_security_id);
        securitySystem = await SecuritySystemService.create({
          system_id: securitySettings.door_security_id,
          system_type: 'door_control',
          lock_status: 'unlocked',
          security_mode: 'home'
        });
        toast.success('Security system created and linked');
      }
      
      if (securitySystem?.id) {
        await SecuritySystemService.update(securitySystem.id, {
          security_mode: newSecurityMode ? 'away' : 'home',
          lock_status: newSecurityMode ? 'locked' : (isDoorLocked ? 'locked' : 'unlocked'),
          last_action: new Date().toISOString()
        });
        console.log('Security system updated:', securitySystem.id, {
          security_mode: newSecurityMode ? 'away' : 'home',
          lock_status: newSecurityMode ? 'locked' : (isDoorLocked ? 'locked' : 'unlocked')
        });
      }
      
      // Update local state
      if (newSecurityMode) {
        if (!isDoorLocked) {
          setIsDoorLocked(true);
        }
        setIsSecurityMode(true);
        await onSecurityModeToggle(true);
      } else {
        setIsSecurityMode(false);
        await onSecurityModeToggle(false);
      }
    } catch (error) {
      console.error('Error updating security mode:', error);
      toast.error('Failed to update security mode');
    } finally {
      setIsArming(false);
    }
  };

  return (
    <>
      <Card className="glass-card border-0 shadow-lg mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-inter">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isDoorLocked ? 'bg-red-500' : 'bg-green-500'
            }`}>
              {isDoorLocked ? (
                <Lock className="w-5 h-5 text-white" />
              ) : (
                <Unlock className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
            <div className="font-semibold">Home Security System</div>
              <div className="text-sm text-gray-500 font-normal">
                {!securitySettings?.door_security_id ? "Device not configured" :
                 isDoorLocked ? "House is secured" : "Normal operation"}
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Door Lock Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-gray-500" />
              <div>
                <span className="font-medium font-inter">Lock Door</span>
                <p className="text-sm text-gray-500 font-inter">
                  {isDoorLocked 
                    ? "Main entrance is locked"
                    : "Main entrance is unlocked"
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={isDoorLocked 
                ? "bg-red-100 text-red-800 border-red-200" 
                : "bg-green-100 text-green-800 border-green-200"
              }>
                {isDoorLocked ? "LOCKED" : "UNLOCKED"}
              </Badge>
              <Switch
                checked={isDoorLocked}
                onCheckedChange={handleDoorToggle}
                disabled={isArming || !securitySettings?.door_security_id}
              />
            </div>
          </div>

          {/* Security Mode Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-gray-500" />
              <div>
                <span className="font-medium font-inter">Security Mode</span>
                <p className="text-sm text-gray-500 font-inter">
                  {isSecurityMode 
                    ? "Away mode - All systems powered down"
                    : "Home mode - Normal operation"
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={isSecurityMode 
                ? "bg-red-100 text-red-800 border-red-200" 
                : "bg-green-100 text-green-800 border-green-200"
              }>
                {isSecurityMode ? "AWAY" : "HOME"}
              </Badge>
              <Switch
                checked={isSecurityMode}
                onCheckedChange={handleSecurityToggle}
                disabled={isArming || !securitySettings?.door_security_id}
              />
            </div>
          </div>

          {/* Security Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <Power className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <div className="text-sm font-medium text-gray-900 font-inter">Auto Power Off</div>
              <div className="text-xs text-gray-500 font-inter">
                {isSecurityMode ? "Active" : "Inactive"}
              </div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <Shield className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <div className="text-sm font-medium text-gray-900 font-inter">Safety Systems</div>
              <div className="text-xs text-gray-500 font-inter">Always Active</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600 mx-auto mb-2" />
              <div className="text-sm font-medium text-gray-900 font-inter">Auto Schedule</div>
              <div className="text-xs text-gray-500 font-inter">
                {isSecurityMode ? "Paused" : "Running"}
              </div>
            </div>
          </div>

          {/* Security Settings Button */}
          <div className="pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => setShowSettings(true)}
              className="w-full flex items-center gap-2 font-inter"
            >
              <Settings className="w-4 h-4" />
              Security Settings
            </Button>
          </div>

          {isSecurityMode && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 font-inter">
                <strong>Away Mode Active:</strong> Main door is locked and security system is engaged. All non-essential appliances are powered off automatically. Safety systems remain active.
              </p>
            </div>
          )}

          {isDoorLocked && !isSecurityMode && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 font-inter">
                <strong>Home Mode:</strong> Door is locked but you're still home. Toggle to Away mode when leaving to power down all systems.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      <SecuritySettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSave={onSecuritySettings}
       />
    </>
  );
}
