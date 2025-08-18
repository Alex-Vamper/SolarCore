
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Mic, Volume2, MessageSquare, Power } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { User, UserSettings, VoiceCommand } from "@/entities/all";

const AILogoSVG = () => (
  <svg width="24" height="24" viewBox="0 0 100 100" className="w-6 h-6">
    <defs>
      <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FCD34D" />
        <stop offset="50%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#D97706" />
      </radialGradient>
      <linearGradient id="bladeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3B82F6" />
        <stop offset="50%" stopColor="#1E40AF" />
        <stop offset="100%" stopColor="#1E3A8A" />
      </linearGradient>
    </defs>
    
    <g transform="translate(50, 50)">
      <path d="M 0,-35 Q -15,-20 -35,-15 Q -20,-5 0,0 Q 5,-20 0,-35" 
            fill="url(#bladeGradient)" 
            opacity="0.8"/>
      
      <g transform="rotate(120)">
        <path d="M 0,-35 Q -15,-20 -35,-15 Q -20,-5 0,0 Q 5,-20 0,-35" 
              fill="url(#bladeGradient)" 
              opacity="0.8"/>
      </g>
      
      <g transform="rotate(240)">
        <path d="M 0,-35 Q -15,-20 -35,-15 Q -20,-5 0,0 Q 5,-20 0,-35" 
              fill="url(#bladeGradient)" 
              opacity="0.8"/>
      </g>
      
      <circle cx="0" cy="0" r="12" fill="url(#centerGlow)" />
      <circle cx="0" cy="0" r="6" fill="#FFFFFF" opacity="0.9" />
    </g>
  </svg>
);

export default function Ander() {
  const [voiceResponseEnabled, setVoiceResponseEnabled] = useState(true);
  const [anderEnabled, setAnderEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [voiceCommands, setVoiceCommands] = useState([]);

  useEffect(() => {
    loadUserSettings();
    initializeVoiceCommands();
  }, []);

  const loadUserSettings = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      const settingsResult = await UserSettings.filter({ created_by: currentUser.email });
      if (settingsResult.length > 0) {
        setVoiceResponseEnabled(settingsResult[0].voice_response_enabled ?? true);
        setAnderEnabled(settingsResult[0].ander_enabled ?? true);
      }
    } catch (error) {
      console.error("Error loading user settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeVoiceCommands = async () => {
    try {
      const existingCommands = await VoiceCommand.list();
      // Only seed commands if the database is empty.
      if (existingCommands.length === 0) {
        await createInitialCommands();
      }
      
      const commands = await VoiceCommand.list();
      setVoiceCommands(commands);
    } catch (error) {
      console.error("Error initializing voice commands:", error);
    }
  };

  const createInitialCommands = async () => {
    const initialCommands = [
      // System Control
      {
        command_category: "system_control",
        command_name: "wake_up",
        keywords: ["ander", "hey ander", "hello ander", "wake up", "activate"],
        response: "Hello. Ander online. How can I help you today?",
        action_type: "wake_up"
      },
      {
        command_category: "system_control", 
        command_name: "all_devices_on",
        keywords: ["turn on all devices", "turn on all systems"],
        response: "All systems starting up now.",
        action_type: "system_all_on"
      },
      {
        command_category: "system_control",
        command_name: "all_devices_off", 
        keywords: ["turn off all devices", "turn off all systems", "shutdown all systems"],
        response: "Shutting down all non-essential systems.",
        action_type: "system_all_off"
      },

      // Lighting Control
      {
        command_category: "lighting_control",
        command_name: "all_lights_on",
        keywords: ["turn on all lights", "turn all the lights on"],
        response: "Turning on all lights.",
        action_type: "lights_all_on"
      },
       {
        command_category: "lighting_control",
        command_name: "all_lights_off",
        keywords: ["turn off all lights", "turn all the lights off"],
        response: "Turning off all lights.",
        action_type: "lights_all_off"
      },
      {
        command_category: "lighting_control",
        command_name: "room_lights_on",
        keywords: ["turn on {RoomName} lights", "activate {RoomName} lighting"],
        response: "{RoomName} lights are now on.",
        action_type: "lights_room_on"
      },
      {
        command_category: "lighting_control",
        command_name: "room_lights_off",
        keywords: ["turn off {RoomName} lights", "deactivate {RoomName} lighting"],
        response: "Turning off {RoomName} lights.",
        action_type: "lights_room_off"
      },

      // Shading Control
      {
        command_category: "shading_control",
        command_name: "all_windows_open",
        keywords: ["open all windows"],
        response: "Opening all windows.",
        action_type: "window_all_open"
      },
      {
        command_category: "shading_control",
        command_name: "all_windows_close",
        keywords: ["close all windows"],
        response: "Closing all windows.",
        action_type: "window_all_close"
      },
      {
        command_category: "shading_control",
        command_name: "window_open",
        keywords: ["open {RoomName} window", "open {RoomName} windows"],
        response: "Opening the window in the {RoomName}.",
        action_type: "window_room_open"
      },
      {
        command_category: "shading_control",
        command_name: "window_close",
        keywords: ["close {RoomName} window", "close {RoomName} windows"],
        response: "Closing the window in the {RoomName}.",
        action_type: "window_room_close"
      },
      {
        command_category: "shading_control",
        command_name: "all_curtains_open",
        keywords: ["open all curtains"],
        response: "Opening all curtains.",
        action_type: "curtain_all_open"
      },
      {
        command_category: "shading_control",
        command_name: "all_curtains_close",
        keywords: ["close all curtains"],
        response: "Closing all curtains.",
        action_type: "curtain_all_close"
      },
      {
        command_category: "shading_control",
        command_name: "curtain_open",
        keywords: ["open {RoomName} curtains", "raise {RoomName} curtains"],
        response: "Opening the curtains in the {RoomName}.",
        action_type: "curtain_room_open"
      },
      {
        command_category: "shading_control",
        command_name: "curtain_close",
        keywords: ["close {RoomName} curtains", "lower {RoomName} curtains"],
        response: "Closing the curtains in the {RoomName}.",
        action_type: "curtain_room_close"
      },
      
      // HVAC Control
       {
        command_category: "hvac_control",
        command_name: "all_ac_on",
        keywords: ["turn on all ac", "turn on all air conditioners"],
        response: "Turning on all AC units.",
        action_type: "ac_all_on"
      },
      {
        command_category: "hvac_control",
        command_name: "all_ac_off",
        keywords: ["turn off all ac", "turn off all air conditioners"],
        response: "Turning off all AC units.",
        action_type: "ac_all_off"
      },
      {
        command_category: "hvac_control",
        command_name: "ac_on",
        keywords: ["turn on the ac in {RoomName}", "start the {RoomName} ac"],
        response: "Turning on the A.C. in the {RoomName}.",
        action_type: "ac_room_on"
      },
      {
        command_category: "hvac_control",
        command_name: "ac_off",
        keywords: ["turn off the ac in {RoomName}", "stop the {RoomName} ac"],
        response: "Turning off the A.C. in the {RoomName}.",
        action_type: "ac_room_off"
      },
      
      // Socket Control
      {
        command_category: "socket_control",
        command_name: "socket_on",
        keywords: ["turn on {SocketName} socket", "activate {SocketName}"],
        response: "The {SocketName} socket is now on.",
        action_type: "socket_on"
      },
      {
        command_category: "socket_control",
        command_name: "socket_off",
        keywords: ["turn off {SocketName} socket", "deactivate {SocketName}"],
        response: "The {SocketName} socket has been turned off.",
        action_type: "socket_off"
      },

      // Safety & Security
      {
        command_category: "safety_security",
        command_name: "lock_door",
        keywords: ["lock door", "lock the door", "lock front door", "secure door", "close front door", "close the front door"],
        response: "Front Door Locked. Should I set security to Home Mode or are you away?",
        action_type: "lock_door"
      },
       {
        command_category: "safety_security",
        command_name: "unlock_door",
        keywords: ["unlock the door", "unlock front door", "open the door", "open front door"],
        response: "Door has been Unlocked.",
        action_type: "unlock_door"
      },
      {
        command_category: "safety_security",
        command_name: "home_mode",
        keywords: ["home mode", "i'm home", "set to home", "activate home mode"],
        response: "Home Mode Activated, Systems will remain active",
        action_type: "home_mode"
      },
      {
        command_category: "safety_security",
        command_name: "away_mode", 
        keywords: ["away mode", "i'm leaving", "set to away", "going out"],
        response: "Away mode activated. Turning off all non-essentials in 5 minutes.",
        action_type: "away_mode"
      },
      
      // Information & Interaction (abbreviated for brevity)
      {
        command_category: "information_interaction",
        command_name: "who_are_you",
        keywords: ["who are you"],
        response: "I am Ander, your intelligent home assistant, here to make your living smarter and safer.",
        action_type: "introduction"
      },
      {
        command_category: "information_interaction",
        command_name: "help",
        keywords: ["help", "what can you do"],
        response: "I can help you control lights, security, energy systems, and provide status updates. Try saying 'turn on lights' or 'activate security mode'.",
        action_type: "help"
      }
    ];

    await VoiceCommand.bulkCreate(initialCommands);
  };

  const handleSettingUpdate = async (setting) => {
    setIsLoading(true);
    try {
        if (!user) {
          console.warn("User not loaded, cannot update settings.");
          return;
        }
        const settingsResult = await UserSettings.filter({ created_by: user.email });
        
        let settingsId;
        if (settingsResult.length > 0) {
            settingsId = settingsResult[0].id;
            await UserSettings.update(settingsId, setting);
        } else {
            const newSettings = await UserSettings.create({ ...setting, created_by: user.email });
            settingsId = newSettings.id;
        }

        // Notify other components of the change
        window.dispatchEvent(new CustomEvent('anderSettingsChanged'));

    } catch(error) {
        console.error("Error updating setting:", error);
    } finally {
        setIsLoading(false);
    }
  }

  const handleVoiceResponseToggle = async (enabled) => {
    setVoiceResponseEnabled(enabled);
    await handleSettingUpdate({ voice_response_enabled: enabled });
  };

  const handleAnderToggle = async (enabled) => {
    setAnderEnabled(enabled);
    await handleSettingUpdate({ ander_enabled: enabled });
  }

  const groupedCommands = voiceCommands.reduce((acc, command) => {
    const categoryKey = command.command_category;
    if (!acc[categoryKey]) {
      acc[categoryKey] = [];
    }
    acc[categoryKey].push(command);
    return acc;
  }, {});

  const categoryTitles = {
    system_control: "System Control",
    lighting_control: "Lighting Control",
    shading_control: "Shading Control",
    hvac_control: "HVAC Control",
    socket_control: "Socket Control",
    safety_security: "Safety & Security",
    energy_management: "Energy Management",
    information_interaction: "Information & Interaction"
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <AILogoSVG />
          </div>
          <p className="text-gray-600 font-inter">Loading voice settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 pb-24 md:pb-6">
      <Link to={createPageUrl('Settings')}>
        <Button variant="outline" className="font-inter">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Settings
        </Button>
      </Link>
      
      <div className="text-center py-6">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <AILogoSVG />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 font-inter">
          Ander Voice Commands
        </h1>
        <p className="text-gray-600 font-inter mt-2">
          Control your smart home with natural voice commands
        </p>
      </div>

      <Card className="glass-card border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-inter">
            <Power className="w-5 h-5 text-blue-600" />
            Assistant Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <span className="font-medium font-inter">Enable Ander Assistant</span>
              <p className="text-sm text-gray-500 font-inter">
                Show or hide the floating AI assistant button
              </p>
            </div>
            <Switch
              checked={anderEnabled}
              onCheckedChange={handleAnderToggle}
              disabled={isLoading}
            />
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <span className="font-medium font-inter">Enable Voice Responses</span>
              <p className="text-sm text-gray-500 font-inter">
                When enabled, Ander will speak responses aloud
              </p>
            </div>
            <Switch
              checked={voiceResponseEnabled}
              onCheckedChange={handleVoiceResponseToggle}
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-inter">
            <Mic className="w-5 h-5 text-blue-600" />
            How to Use Voice Commands
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
            <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">1</div>
            <div>
              <p className="font-medium text-blue-900 font-inter">Tap the AI Assistant Button</p>
              <p className="text-sm text-blue-700 font-inter">Look for the floating blue button with the Ander logo</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
            <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm">2</div>
            <div>
              <p className="font-medium text-green-900 font-inter">Speak Your Command</p>
              <p className="text-sm text-green-700 font-inter">You have 8 seconds to give your voice command clearly</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
            <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold text-sm">3</div>
            <div>
              <p className="font-medium text-purple-900 font-inter">Get Response</p>
              <p className="text-sm text-purple-700 font-inter">Ander will show and optionally speak the response</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {Object.entries(categoryTitles).map(([categoryKey, categoryTitle]) => {
          const commandsInCategory = groupedCommands[categoryKey] || [];
          if (commandsInCategory.length === 0) return null;

          return (
            <Card key={categoryKey} className="glass-card border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg font-inter">{categoryTitle}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {commandsInCategory.map((command) => (
                  <div key={command.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200 font-inter whitespace-normal text-left">
                          {command.command_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                      </div>
                      <Volume2 className="w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-700 font-inter mb-1">
                      {command.response.replace('{RoomName}', '[Room]').replace('{SocketName}', '[Socket]')}
                    </p>
                    <p className="text-xs text-gray-500 font-inter italic">
                      Example: "{command.keywords[0].replace('{RoomName}', 'Living Room').replace('{SocketName}', 'TV')}"
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
