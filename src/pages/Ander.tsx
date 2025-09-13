import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Mic, Volume2, Power, HardDrive, Lock, AlertTriangle, Check, X, Plus, Pencil, ShieldCheck } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { User, UserSettings } from "@/entities/all";
import { supabase } from '@/integrations/supabase/client';
import SubscriptionModal from '../components/subscriptions/SubscriptionModal';
import AdminPasswordModal from '../components/voice/AdminPasswordModal';
import AudioUploadModal from '../components/voice/AudioUploadModal';
import CommandEditorModal from '../components/voice/CommandEditorModal';
import { useVoiceCommandInitializer } from "@/components/ai/VoiceCommandInitializer";
import { useCrossSystemSync } from "@/hooks/useCrossSystemSync";
import { GlobalVoiceCommand } from "@/entities/GlobalVoiceCommand";

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
  const [anderEnabled, setAnderEnabled] = useState(false);
  const [subscriptionPlan, setSubscriptionPlan] = useState('none');
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userCommands, setUserCommands] = useState([]); // User-facing commands
  const [adminCommands, setAdminCommands] = useState([]); // Admin-only commands (fallbacks)
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [anderDeviceId, setAnderDeviceId] = useState('');
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [selectedCommand, setSelectedCommand] = useState(null);
  const [showAudioModal, setShowAudioModal] = useState(false);
  const [showCommandEditor, setShowCommandEditor] = useState(false);
  const [logoClickCount, setLogoClickCount] = useState(0);
  const logoClickTimer = useRef(null);
  const [isValidatingDeviceId, setIsValidatingDeviceId] = useState(false);
  const [deviceIdError, setDeviceIdError] = useState('');

  const loadAllCommands = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch global commands from admin_ander_commands
      const { data: allCommands, error } = await supabase
        .from('admin_ander_commands')
        .select('*')
        .eq('is_active', true)
        .order('command_category', { ascending: true })
        .order('command_name', { ascending: true });

      if (error) {
        console.error('Error loading commands:', error);
        return;
      }

      // Separate admin and user commands
      const adminCmds = allCommands.filter(cmd => 
        cmd.command_category === 'Admin' || 
        cmd.command_category === 'Advanced'
      );
      const userCmds = allCommands.filter(cmd => 
        cmd.command_category !== 'Admin' && 
        cmd.command_category !== 'Advanced'
      );

      setAdminCommands(adminCmds);
      setUserCommands(userCmds);
    } catch (error) {
      console.error("Error loading all commands:", error);
    }
  };

  // This effect will run when the component mounts.
  useEffect(() => {
    loadUserSettings();
    initializeDefaultCommands(); // This will call loadAllCommands internally
    
    // Listen for settings changes from other components
    const handleSettingsChange = () => {
      loadUserSettings();
    };
    
    window.addEventListener('anderSettingsChanged', handleSettingsChange);
    
    return () => {
      if (logoClickTimer.current) clearTimeout(logoClickTimer.current);
      window.removeEventListener('anderSettingsChanged', handleSettingsChange);
    };
  }, []);

  const loadUserSettings = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      const settingsResult = await UserSettings.list();
      if (settingsResult.length > 0) {
        const settings = settingsResult[0];
        setVoiceResponseEnabled(settings.voice_response_enabled ?? true);
        setAnderEnabled(settings.ander_enabled ?? false);
        setSubscriptionPlan(settings.subscription_plan ?? 'free');
        setAnderDeviceId(settings.ander_device_id ?? '');
      }
    } catch (error) {
      console.error("Error loading user settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeDefaultCommands = async () => {
    try {
      await loadAllCommands();
    } catch (error) {
      console.error("Error initializing voice commands:", error);
    }
  };
  const createInitialCommands = async () => {
    const initialCommands = [
        // Admin Commands (System Fallbacks) - Only visible in admin mode
        { command_category: "admin_commands", command_name: "_admin_didnt_understand_", keywords: [], response: "I'm sorry, I didn't understand that command. Please try again.", action_type: "fallback" },
        { command_category: "admin_commands", command_name: "_admin_device_not_found_", keywords: [], response: "I couldn't find that specific device in your configuration.", action_type: "fallback" },
        { command_category: "admin_commands", command_name: "_admin_subscription_required_", keywords: [], response: "This command requires a premium subscription. Please upgrade your plan to use this feature.", action_type: "fallback" },
        
        // System Control - User-visible commands
        { command_category: "system_control", command_name: "all_devices_on", keywords: ["turn on all devices", "turn on all systems", "activate all devices"], response: "Activating all systems.", action_type: "all_devices_on" },
        { command_category: "system_control", command_name: "all_devices_off", keywords: ["turn off all devices", "turn off all systems", "shutdown all devices"], response: "Shutting down all non-essential devices.", action_type: "all_devices_off" },
        { command_category: "system_control", command_name: "wake_up", keywords: ["ander", "hey ander", "hello ander", "wake up"], response: "Hello. Ander here. How can I help?", action_type: "wake_up" },
        { command_category: "system_control", command_name: "all_systems_check", keywords: ["run a system check", "check all systems", "system status"], response: "Running system diagnostics. All systems are currently online and functioning normally.", action_type: "system_check" },
        
        // Lighting Control
        { command_category: "lighting_control", command_name: "turn_on_all_lights", keywords: ["turn on all lights", "lights on everywhere", "all lights on"], response: "Turning on all lights.", action_type: "lights_all_on" },
        { command_category: "lighting_control", command_name: "turn_off_all_lights", keywords: ["turn off all lights", "lights off everywhere", "all lights off"], response: "Turning off all lights.", action_type: "lights_all_off" },
        { command_category: "lighting_control", command_name: "turn_on_living_room_lights", keywords: ["turn on all living room lights", "turn on living room lights", "living room lights on"], response: "Turning on living room lights.", action_type: "lights_room_on" },
        { command_category: "lighting_control", command_name: "turn_off_living_room_lights", keywords: ["turn off all living room lights", "turn off living room lights", "living room lights off"], response: "Turning off living room lights.", action_type: "lights_room_off" },
        { command_category: "lighting_control", command_name: "turn_on_dining_room_lights", keywords: ["turn on all dining room lights", "turn on dining room lights", "dining room lights on"], response: "Turning on dining room lights.", action_type: "lights_room_on" },
        { command_category: "lighting_control", command_name: "turn_off_dining_room_lights", keywords: ["turn off all dining room lights", "turn off dining room lights", "dining room lights off"], response: "Turning off dining room lights.", action_type: "lights_room_off" },
        { command_category: "lighting_control", command_name: "turn_on_kitchen_lights", keywords: ["turn on all kitchen lights", "turn on kitchen lights", "kitchen lights on"], response: "Turning on kitchen lights.", action_type: "lights_room_on" },
        { command_category: "lighting_control", command_name: "turn_off_kitchen_lights", keywords: ["turn off all kitchen lights", "turn off kitchen lights", "kitchen lights off"], response: "Turning off kitchen lights.", action_type: "lights_room_off" },
        { command_category: "lighting_control", command_name: "turn_on_bedroom_lights", keywords: ["turn on all bedroom lights", "turn on bedroom lights", "bedroom lights on"], response: "Turning on bedroom lights.", action_type: "lights_room_on" },
        { command_category: "lighting_control", command_name: "turn_off_bedroom_lights", keywords: ["turn off all bedroom lights", "turn off bedroom lights", "bedroom lights off"], response: "Turning off bedroom lights.", action_type: "lights_room_off" },
        
        // Shading Control
        { command_category: "shading_control", command_name: "open_all_windows", keywords: ["open all windows", "open windows everywhere"], response: "Opening all windows.", action_type: "windows_all_open" },
        { command_category: "shading_control", command_name: "close_all_windows", keywords: ["close all windows", "close windows everywhere"], response: "Closing all windows.", action_type: "windows_all_close" },
        { command_category: "shading_control", command_name: "open_living_room_windows", keywords: ["open living room windows"], response: "Opening living room windows.", action_type: "windows_room_open" },
        { command_category: "shading_control", command_name: "close_living_room_windows", keywords: ["close living room windows"], response: "Closing living room windows.", action_type: "windows_room_close" },
        { command_category: "shading_control", command_name: "open_dining_room_windows", keywords: ["open dining room windows"], response: "Opening dining room windows.", action_type: "windows_room_open" },
        { command_category: "shading_control", command_name: "close_dining_room_windows", keywords: ["close dining room windows"], response: "Closing dining room windows.", action_type: "windows_room_close" },
        { command_category: "shading_control", command_name: "open_kitchen_windows", keywords: ["open kitchen windows"], response: "Opening kitchen windows.", action_type: "windows_room_open" },
        { command_category: "shading_control", command_name: "close_kitchen_windows", keywords: ["close kitchen windows"], response: "Closing kitchen lights.", action_type: "windows_room_close" },
        { command_category: "shading_control", command_name: "open_bedroom_windows", keywords: ["open bedroom windows"], response: "Opening bedroom windows.", action_type: "windows_room_open" },
        { command_category: "shading_control", command_name: "close_bedroom_windows", keywords: ["close bedroom windows"], response: "Closing bedroom windows.", action_type: "windows_room_close" },
        
        { command_category: "shading_control", command_name: "open_all_curtains", keywords: ["open all curtains", "open curtains everywhere"], response: "Opening all curtains.", action_type: "curtains_all_open" },
        { command_category: "shading_control", command_name: "close_all_curtains", keywords: ["close all curtains", "close curtains everywhere"], response: "Closing all curtains.", action_type: "curtains_all_close" },
        { command_category: "shading_control", command_name: "open_living_room_curtains", keywords: ["open living room curtains"], response: "Opening living room curtains.", action_type: "curtains_room_open" },
        { command_category: "shading_control", command_name: "close_living_room_curtains", keywords: ["close living room curtains"], response: "Closing living room curtains.", action_type: "curtains_room_close" },
        { command_category: "shading_control", command_name: "open_dining_room_curtains", keywords: ["open dining room curtains"], response: "Opening dining room curtains.", action_type: "curtains_room_open" },
        { command_category: "shading_control", command_name: "close_dining_room_curtains", keywords: ["close dining room curtains"], response: "Closing dining room curtains.", action_type: "curtains_room_close" },
        { command_category: "shading_control", command_name: "open_bedroom_curtains", keywords: ["open bedroom curtains"], response: "Opening bedroom curtains.", action_type: "curtains_room_open" },
        { command_category: "shading_control", command_name: "close_bedroom_curtains", keywords: ["close bedroom curtains"], response: "Closing bedroom curtains.", action_type: "curtains_room_close" },
        
        // HVAC Control
        { command_category: "hvac_control", command_name: "turn_on_all_acs", keywords: ["turn on all acs", "turn on all air conditioners", "all acs on"], response: "Turning on all air conditioning systems.", action_type: "ac_all_on" },
        { command_category: "hvac_control", command_name: "turn_off_all_acs", keywords: ["turn off all acs", "turn off all air conditioners", "all acs off"], response: "Turning off all air conditioning systems.", action_type: "ac_all_off" },
        { command_category: "hvac_control", command_name: "turn_on_living_room_acs", keywords: ["turn on living room ac", "turn on living room air conditioner", "living room ac on"], response: "Turning on living room air conditioning.", action_type: "ac_room_on" },
        { command_category: "hvac_control", command_name: "turn_off_living_room_acs", keywords: ["turn off living room ac", "turn off living room air conditioner", "living room ac off"], response: "Turning off living room air conditioning.", action_type: "ac_room_off" },
        { command_category: "hvac_control", command_name: "turn_on_bedroom_acs", keywords: ["turn on bedroom ac", "turn on bedroom air conditioner", "bedroom ac on"], response: "Turning on bedroom air conditioning.", action_type: "ac_room_on" },
        { command_category: "hvac_control", command_name: "turn_off_bedroom_acs", keywords: ["turn off bedroom ac", "turn off bedroom air conditioner", "bedroom ac off"], response: "Turning off bedroom air conditioning.", action_type: "ac_room_off" },
        
        // Socket Control
        { command_category: "socket_control", command_name: "turn_on_all_sockets", keywords: ["turn on all sockets", "all sockets on", "turn on all outlets"], response: "Turning on all sockets.", action_type: "sockets_all_on" },
        { command_category: "socket_control", command_name: "turn_off_all_sockets", keywords: ["turn off all sockets", "all sockets off", "turn off all outlets"], response: "Turning off all sockets.", action_type: "sockets_all_off" },
        { command_category: "socket_control", command_name: "turn_on_living_room_sockets", keywords: ["turn on all living room sockets", "turn on living room sockets", "living room sockets on"], response: "Turning on living room sockets.", action_type: "sockets_room_on" },
        { command_category: "socket_control", command_name: "turn_off_living_room_sockets", keywords: ["turn off all living room sockets", "turn off living room sockets", "living room sockets off"], response: "Turning off living room sockets.", action_type: "sockets_room_off" },
        { command_category: "socket_control", command_name: "turn_on_dining_room_sockets", keywords: ["turn on all dining room sockets", "turn on dining room sockets", "dining room sockets on"], response: "Turning on dining room sockets.", action_type: "sockets_room_on" },
        { command_category: "socket_control", command_name: "turn_off_dining_room_sockets", keywords: ["turn off all dining room sockets", "turn off dining room sockets", "dining room sockets off"], response: "Turning off dining room sockets.", action_type: "sockets_room_off" },
        { command_category: "socket_control", command_name: "turn_on_kitchen_sockets", keywords: ["turn on all kitchen sockets", "turn on kitchen sockets", "kitchen sockets on"], response: "Turning on kitchen sockets.", action_type: "sockets_room_on" },
        { command_category: "socket_control", command_name: "turn_off_kitchen_sockets", keywords: ["turn off all kitchen sockets", "turn off kitchen sockets", "kitchen sockets off"], response: "Turning off kitchen sockets.", action_type: "sockets_room_off" },
        { command_category: "socket_control", command_name: "turn_on_bedroom_sockets", keywords: ["turn on all bedroom sockets", "turn on bedroom sockets", "bedroom sockets on"], response: "Turning on bedroom sockets.", action_type: "sockets_room_on" },
        { command_category: "socket_control", command_name: "turn_off_bedroom_sockets", keywords: ["turn off all bedroom sockets", "turn off bedroom sockets", "bedroom sockets off"], response: "Turning off bedroom sockets.", action_type: "sockets_room_off" },
        
        // Living Room Specific Sockets
        { command_category: "socket_control", command_name: "turn_on_living_room_tv_socket", keywords: ["turn on living room tv socket", "living room tv socket on"], response: "Turning on living room TV socket.", action_type: "socket_specific_on" },
        { command_category: "socket_control", command_name: "turn_off_living_room_tv_socket", keywords: ["turn off living room tv socket", "living room tv socket off"], response: "Turning off living room TV socket.", action_type: "socket_specific_off" },
        { command_category: "socket_control", command_name: "turn_on_living_room_dispenser_socket", keywords: ["turn on living room dispenser socket", "living room dispenser socket on"], response: "Turning on living room dispenser socket.", action_type: "socket_specific_on" },
        { command_category: "socket_control", command_name: "turn_off_living_room_dispenser_socket", keywords: ["turn off living room dispenser socket", "living room dispenser socket off"], response: "Turning off living room dispenser socket.", action_type: "socket_specific_off" },
        { command_category: "socket_control", command_name: "turn_on_living_room_free_socket", keywords: ["turn on living room free socket", "living room free socket on"], response: "Turning on living room free socket.", action_type: "socket_specific_on" },
        { command_category: "socket_control", command_name: "turn_off_living_room_free_socket", keywords: ["turn off living room free socket", "living room free socket off"], response: "Turning off living room free socket.", action_type: "socket_specific_off" },
        
        // Safety and Security
        { command_category: "safety_and_security", command_name: "away_mode", keywords: ["away mode", "activate away mode", "set away mode"], response: "Activating away mode. Securing the house and turning off non-essential devices.", action_type: "away_mode" },
        { command_category: "safety_and_security", command_name: "home_mode", keywords: ["home mode", "activate home mode", "set home mode"], response: "Activating home mode. Welcome back!", action_type: "home_mode" },
        { command_category: "safety_and_security", command_name: "lock_front_door", keywords: ["lock front door", "lock the door", "secure front door"], response: "Locking the front door.", action_type: "lock_door" },
        { command_category: "safety_and_security", command_name: "unlock_front_door", keywords: ["unlock front door", "unlock the door", "open front door lock"], response: "Unlocking the front door.", action_type: "unlock_door" },
        
        // Energy Management
        { command_category: "energy_management", command_name: "energy_report", keywords: ["energy report", "show energy usage", "energy status"], response: "Your current energy consumption is optimized. Solar panels are generating efficiently and battery levels are stable.", action_type: "energy_report" },
        { command_category: "energy_management", command_name: "solar_status", keywords: ["solar status", "solar power", "how much solar"], response: "Solar panels are currently generating power efficiently. Battery storage is at optimal levels.", action_type: "energy_report" },
        
        // Information & Interaction
        { command_category: "information_interaction", command_name: "introduction", keywords: ["who are you", "introduce yourself", "what is ander"], response: "I'm Ander, your AI assistant for SolarCore. I help you control your smart home, manage energy, and ensure your safety.", action_type: "introduction" },
        { command_category: "information_interaction", command_name: "help", keywords: ["help", "what can you do", "commands"], response: "I can help you control lights, sockets, curtains, air conditioning, and security systems. Try saying 'turn on all lights' or 'lock front door'.", action_type: "help" }
    ];
    
// Seeding per-user commands deprecated; using global commands table
    return;
  };

  const handleLogoClick = () => {
    if (logoClickTimer.current) clearTimeout(logoClickTimer.current);
    const newClickCount = logoClickCount + 1;
    setLogoClickCount(newClickCount);
    if (newClickCount === 3) {
      setShowAdminModal(true);
      setLogoClickCount(0);
      if (logoClickTimer.current) {
        clearTimeout(logoClickTimer.current);
        logoClickTimer.current = null;
      }
    } else {
      logoClickTimer.current = setTimeout(() => {
        setLogoClickCount(0);
        logoClickTimer.current = null;
      }, 2000);
    }
  };

  const handleAdminAuthenticated = () => {
    setShowAdminModal(false);
    setIsAdminMode(true);
  };

  const handleAudioUpload = (command) => {
    setSelectedCommand(command);
    setShowAudioModal(true);
  };
  
  const handleEditCommand = (command) => {
    setSelectedCommand(command);
    setShowCommandEditor(true);
  };
  
  const handleAddNewCommand = () => {
      setSelectedCommand(null); // Ensure we're creating a new one
      setShowCommandEditor(true);
  };

  const handleAudioModalClose = () => {
    setShowAudioModal(false);
    setSelectedCommand(null);
    // Don't reload commands - just close modal
  };

  const handleCommandEditorClose = () => {
    setShowCommandEditor(false);
    setSelectedCommand(null);
  };
  
  const handleCommandSave = () => {
      loadAllCommands(); // Reload all commands after saving
  };

  const handleAcceptChanges = () => {
    setIsAdminMode(false);
  };

  const handleCancelChanges = () => {
    setIsAdminMode(false);
  };

  const handleSettingUpdate = async (setting) => {
    setIsLoading(true);
    try {
        if (!user) {
          console.warn("User not loaded, cannot update settings.");
          return;
        }
        
        // Use upsert to create or update settings
        await UserSettings.upsert(setting);

        // Notify other components of the change
        window.dispatchEvent(new CustomEvent('anderSettingsChanged'));

    } catch(error) {
        console.error("Error updating setting:", error);
    } finally {
        setIsLoading(false);
    }
  };

  const validateAndClaimDevice = async (deviceId) => {
    try {
      const { data, error } = await supabase.rpc('claim_parent_device', {
        p_esp_id: deviceId
      });
      
      if (error) throw error;
      
      if (!(data as any)?.success) {
        throw new Error((data as any)?.message || 'Device validation failed');
      }
      
      return true;
    } catch (error) {
      console.error('Error validating device:', error);
      throw error;
    }
  };

  const validateAndUpdateDeviceId = async (deviceId: string) => {
    const upperDeviceId = deviceId.toUpperCase();
    setAnderDeviceId(upperDeviceId);
    
    if (!upperDeviceId) {
      setDeviceIdError('');
      await handleSettingUpdate({ ander_device_id: '' });
      return;
    }

    // Simple validation for Ander IA device format
    if (!upperDeviceId.startsWith('SC-GID-')) {
      setDeviceIdError('Invalid format. Ander IA device IDs start with SC-GID-');
      return;
    }

    // Extract the number part and validate it's in range
    const numberPart = upperDeviceId.replace('SC-GID-', '');
    const deviceNumber = parseInt(numberPart, 10);
    
    if (isNaN(deviceNumber) || deviceNumber < 1 || deviceNumber > 100 || numberPart.length !== 4) {
      setDeviceIdError('Invalid device ID. Use format SC-GID-0001 to SC-GID-0100');
      return;
    }

    setDeviceIdError('');
    await handleSettingUpdate({ ander_device_id: upperDeviceId });
    toast.success('Device ID validated successfully');
  };

  const handleVoiceResponseToggle = async (enabled) => {
    setVoiceResponseEnabled(enabled);
    await handleSettingUpdate({ voice_response_enabled: enabled });
  };

  const handleAnderToggle = async (enabled) => {
    // If enabling Ander, validate device ID first
    if (enabled && !anderDeviceId) {
      toast.error("Please configure your Ander device ID first");
      return;
    }
    
    if (enabled && anderDeviceId) {
      try {
        await validateAndClaimDevice(anderDeviceId);
      } catch (error) {
        toast.error(error.message || "Device validation failed");
        return;
      }
    }
    
    // If user is trying to enable Ander for the first time, check subscription plan
    if (enabled && (subscriptionPlan === 'none' || subscriptionPlan === null)) {
      setShowSubscriptionModal(true);
      return;
    }
    
    // Otherwise, just toggle the state
    setAnderEnabled(enabled);
    await handleSettingUpdate({ ander_enabled: enabled });
  };

  const handleSelectPlan = async (plan) => {
    setShowSubscriptionModal(false);
    
    // Set the chosen plan and enable Ander
    await handleSettingUpdate({ subscription_plan: plan, ander_enabled: true });

    // Update local state immediately for instant UI feedback
    setSubscriptionPlan(plan);
    setAnderEnabled(true);
  };

  const handleChangePlan = () => {
    setShowSubscriptionModal(true);
  };

  const getPlanDisplayInfo = () => {
    switch (subscriptionPlan) {
      case 'free':
        return { label: 'Free', color: 'bg-gray-100 text-gray-800 border-gray-300' };
      case 'premium':
        return { label: 'Premium', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' };
      case 'enterprise':
        return { label: 'Enterprise', color: 'bg-purple-100 text-purple-800 border-purple-300' };
      default:
        return { label: 'None', color: 'bg-gray-100 text-gray-800 border-gray-300' };
    }
  };

  const groupedUserCommands = userCommands.reduce((acc, command) => {
    const categoryKey = command.command_category.replace(/_/g, ' ');
    if (!acc[categoryKey]) acc[categoryKey] = [];
    acc[categoryKey].push(command);
    return acc;
  }, {});
  
  const sortedUserCategories = Object.keys(groupedUserCommands).sort();

  if (isLoading && userCommands.length === 0 && adminCommands.length === 0) {
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

  const planInfo = getPlanDisplayInfo();

  return (
    <div className="p-4 pb-24">
      <div className="max-w-[1280px] mx-auto space-y-6">
        <Link to={createPageUrl('Settings')}>
          <Button variant="outline" className="font-inter">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Settings
          </Button>
        </Link>
        
        <div className="text-center py-6">
          <button
            onClick={handleLogoClick}
            className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg hover:scale-105 transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <AILogoSVG />
          </button>
          {isAdminMode && (
            <div className="mb-2">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                <Lock className="w-3 h-3" />
                Admin Mode Active
              </span>
            </div>
          )}
          <h1 className="text-2xl font-bold text-gray-900 font-inter">
            Ander Voice Commands
          </h1>
          <p className="text-gray-600 font-inter mt-2">
            Control your smart home with natural voice commands
          </p>
          {isAdminMode && (
            <div className="mt-4 flex justify-center gap-2">
              <Button onClick={handleCancelChanges} variant="outline" className="font-inter">
                <X className="w-4 h-4 mr-2"/>
                Cancel
              </Button>
              <Button onClick={handleAcceptChanges} className="bg-green-600 hover:bg-green-700 font-inter">
                <Check className="w-4 h-4 mr-2"/>
                Accept Changes
              </Button>
              <Button onClick={handleAddNewCommand} className="font-inter">
                <Plus className="w-4 h-4 mr-2"/>
                New Command
              </Button>
              <Button onClick={async () => {
                await GlobalVoiceCommand.clearCache();
                await initializeDefaultCommands();
                toast.success("Global voice commands refreshed!");
              }} variant="outline" className="font-inter">
                <AlertTriangle className="w-4 h-4 mr-2"/>
                Refresh Commands
              </Button>
            </div>
          )}
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
              <div className="flex-1">
                <span className="font-medium font-inter">Enable Ander Assistant</span>
                <p className="text-sm text-gray-500 font-inter">
                  Show or hide the floating AI assistant button
                </p>
              </div>
              <div className="flex items-center gap-3">
                {subscriptionPlan !== 'none' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleChangePlan}
                    className={`${planInfo.color} border font-inter`}
                  >
                    {planInfo.label}
                  </Button>
                )}
                <Switch
                  checked={anderEnabled}
                  onCheckedChange={handleAnderToggle}
                  disabled={isLoading || !anderDeviceId}
                />
              </div>
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
                disabled={isLoading || !anderEnabled}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-inter">
              <HardDrive className="w-5 h-5 text-purple-600" />
              Device Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
              <div>
                <Label htmlFor="anderDeviceId" className="font-inter">Ander ESP ID (e.g., SC-GID-0001)</Label>
                <Input
                  id="anderDeviceId"
                  placeholder="Enter your Ander IA device ID"
                  value={anderDeviceId}
                  onChange={(e) => validateAndUpdateDeviceId(e.target.value)}
                  className="mt-1 font-inter uppercase"
                  disabled={isValidatingDeviceId}
                />
                {deviceIdError && (
                  <p className="text-xs text-red-600 mt-1 font-inter flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {deviceIdError}
                  </p>
                )}
                {isValidatingDeviceId && (
                  <p className="text-xs text-blue-600 mt-1 font-inter">Validating ESP ID...</p>
                )}
                <p className="text-xs text-gray-500 mt-2 font-inter">This ESP ID connects the app to your Ander IA hardware device.</p>
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

        {/* COMMANDS SECTION */}
        <div className="space-y-4">
          {/* User-Facing Commands */}
          {sortedUserCategories.map((categoryKey) => {
            const commandsInCategory = groupedUserCommands[categoryKey] || [];
            if (commandsInCategory.length === 0) return null; // Should not happen if category exists in map

            return (
              <Card key={categoryKey} className="glass-card border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg font-inter capitalize text-gray-900">
                    {categoryKey}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {commandsInCategory.map((command) => (
                    <div key={command.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-blue-100 text-blue-800 border-blue-300 font-inter whitespace-normal text-left">
                            {command.command_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Badge>
                          {command.audio_url && <Badge className="bg-green-100 text-green-800 border-green-200 font-inter">Audio Set</Badge>}
                        </div>
                        {isAdminMode && (
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleAudioUpload(command)} title="Upload audio" className="text-green-600 hover:text-green-700"><Volume2 className="w-4 h-4" /></button>
                            <button onClick={() => handleEditCommand(command)} title="Edit command" className="text-blue-600 hover:text-blue-700"><Pencil className="w-4 h-4" /></button>
                          </div>
                        )}
                      </div>
                      <p className="text-sm font-inter mb-1 italic text-gray-700">"{command.response_text || command.response}"</p>
                      {command.keywords && command.keywords.length > 0 && (
                        <p className="text-xs text-gray-500 font-inter">Try saying: "{command.keywords[0]}"</p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}

          {/* Admin-Only Fallback Commands */}
          {isAdminMode && adminCommands.length > 0 && (
            <Card className="glass-card border-2 border-orange-300 bg-orange-50/30 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-inter text-orange-800 capitalize">
                  <ShieldCheck className="w-5 h-5"/>
                  Admin Commands
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {adminCommands.map((command) => (
                  <div key={command.id} className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-orange-100 text-orange-800 border-orange-300 font-inter whitespace-normal text-left">
                          {command.command_name === '_admin_didnt_understand_' && "Didn't Understand Command"}
                          {command.command_name === '_admin_device_not_found_' && "User does not have the device"}
                          {command.command_name === '_admin_subscription_required_' && "User's subscription plan does not support command"}
                        </Badge>
                        {command.audio_url && <Badge className="bg-green-100 text-green-800 border-green-200 font-inter">Audio Set</Badge>}
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleAudioUpload(command)} title="Upload audio" className="text-green-600 hover:text-green-700"><Volume2 className="w-4 h-4" /></button>
                        <button onClick={() => handleEditCommand(command)} title="Edit command" className="text-blue-600 hover:text-blue-700"><Pencil className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <p className="text-sm font-inter mb-1 italic text-orange-700">"{command.response_text || command.response}"</p>
                    <p className="text-xs text-orange-600 font-inter">System response for when this situation occurs</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <SubscriptionModal
          isOpen={showSubscriptionModal}
          onClose={() => setShowSubscriptionModal(false)}
          onSelectPlan={handleSelectPlan}
        />

        <AdminPasswordModal
          isOpen={showAdminModal}
          onClose={() => setShowAdminModal(false)}
          onAuthenticated={handleAdminAuthenticated}
        />

        <AudioUploadModal
          isOpen={showAudioModal}
          onClose={handleAudioModalClose}
          command={selectedCommand}
        />
        
        <CommandEditorModal
          isOpen={showCommandEditor}
          onClose={handleCommandEditorClose}
          command={selectedCommand}
          onSave={handleCommandSave}
        />
      </div>
    </div>
  );
}