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
import { SecurityAutoLockService } from "@/lib/securityAutoLockService";
import { useSecurityStateCentralized } from "@/hooks/useSecurityStateCentralized";

export default function SecurityOverview({ onSecurityModeToggle, onSecuritySettings }) {
  const { isDoorLocked, isSecurityMode, updateSecurityState } = useSecurityStateCentralized();
  const [isArming, setIsArming] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [securitySettings, setSecuritySettings] = useState(null);
  const [remainingTime, setRemainingTime] = useState(0);

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

  // Load security settings
  const loadSecuritySettings = async () => {
    try {
      const settings = await UserSettings.list();
      if (settings.length > 0) {
        setSecuritySettings(settings[0].security_settings);
      }
    } catch (error) {
      console.error('Error loading security settings:', error);
    }
  };

  useEffect(() => {
    loadSecuritySettings();
  }, []);

  // Listen for settings changes
  useEffect(() => {
    const handleSecuritySettingsChanged = () => {
      loadSecuritySettings();
    };

    window.addEventListener('securitySettingsChanged', handleSecuritySettingsChanged);
    return () => {
      window.removeEventListener('securitySettingsChanged', handleSecuritySettingsChanged);
    };
  }, []);

  // Update countdown timer display for UI
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    const updateDisplay = () => {
      const isActive = SecurityAutoLockService.isCountdownRunning();
      const time = SecurityAutoLockService.getRemainingTime();
      setRemainingTime(time);
      
      // Continue updating if countdown is active
      if (isActive && time > 0) {
        interval = setTimeout(updateDisplay, 1000);
      }
    };

    // Initial update and start interval
    updateDisplay();

    return () => {
      if (interval) {
        clearTimeout(interval);
      }
    };
  }, []);

  const handleDoorToggle = async () => {
    // Check if security device is configured
    if (!securitySettings?.door_security_id) {
      toast.error('Please configure a security device in settings first');
      return;
    }
    
    setIsArming(true);
    const newLockState = !isDoorLocked;
    
    try {
      // Update through centralized state manager
      updateSecurityState({
        isDoorLocked: newLockState,
        isSecurityMode: newLockState ? true : isSecurityMode
      });

      if (newLockState) {
        await onSecurityModeToggle(true);
      } else {
        await onSecurityModeToggle(false);
        
        // Clear completed sessions when unlocking (new security cycle)
        localStorage.removeItem('autoLockCompletedSessions');
        localStorage.removeItem('autoLockStartedSessions');
      }
    } catch (error) {
      console.error('Error updating security state:', error);
      const errorMessage = error.message || 'Unknown error occurred';
      toast.error(`Failed to update security state: ${errorMessage}`);
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
      // Update through centralized state manager
      updateSecurityState({
        isDoorLocked: newSecurityMode ? true : isDoorLocked,
        isSecurityMode: newSecurityMode
      });
      
      if (newSecurityMode) {
        await onSecurityModeToggle(true);
      } else {
        await onSecurityModeToggle(false);
        
        // Clear completed sessions when switching to home mode (new security cycle)
        localStorage.removeItem('autoLockCompletedSessions');
        localStorage.removeItem('autoLockStartedSessions');
      }
    } catch (error) {
      console.error('Error updating security mode:', error);
      const errorMessage = error.message || 'Unknown error occurred';
      toast.error(`Failed to update security mode: ${errorMessage}`);
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
            <div className={`text-center p-3 rounded-lg ${
              SecurityAutoLockService.isCountdownRunning() ? "bg-orange-50 border border-orange-200" : "bg-blue-50"
            }`}>
              <Power className={`w-6 h-6 mx-auto mb-2 ${
                SecurityAutoLockService.isCountdownRunning() ? "text-orange-600" : "text-blue-600"
              }`} />
              <div className="text-sm font-medium text-gray-900 font-inter">Auto Power Off</div>
              <div className="text-xs text-gray-500 font-inter">
                {SecurityAutoLockService.isCountdownRunning() ? "Countdown Active" : isSecurityMode ? "Armed" : "Inactive"}
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

          {/* Countdown Display */}
          {SecurityAutoLockService.isCountdownRunning() && remainingTime > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Power className="w-5 h-5 text-orange-600" />
                  <span className="font-medium text-orange-800 font-inter">Auto Power Off</span>
                </div>
                <div className="text-orange-800 font-mono">
                  {Math.floor(remainingTime / 60).toString().padStart(2, '0')}:
                  {(remainingTime % 60).toString().padStart(2, '0')}
                </div>
              </div>
              <p className="text-sm text-orange-700 mt-2 font-inter">
                All devices will automatically turn off when the timer reaches zero.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  SecurityAutoLockService.cancelAutoLockCountdown();
                  toast.success('Auto power off cancelled');
                }}
                className="mt-3 border-orange-300 text-orange-700 hover:bg-orange-100 font-inter"
              >
                Cancel Auto Power Off
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {showSettings && (
        <SecuritySettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          onSave={(settings) => {
            setSecuritySettings(settings);
            onSecuritySettings?.(settings);
            setShowSettings(false);
          }}
        />
      )}
    </>
  );
}