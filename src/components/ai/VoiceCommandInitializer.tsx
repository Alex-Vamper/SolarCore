import { useEffect } from 'react';
import { VoiceCommand, Room, User } from '@/entities/all';

export const useVoiceCommandInitializer = () => {
  const initializeVoiceCommands = async () => {
    try {
      // Clear existing commands first
      await VoiceCommand.deleteAll();
      
      // Get user's actual rooms for dynamic commands
      const currentUser = await User.me();
      const userRooms = await Room.filter({ created_by: currentUser.email });
      
      const baseCommands = [
        // System Control
        { command_category: "system_control", command_name: "wake_up", keywords: ["hey ander", "hello ander", "wake up"], response: "Hello! I'm here to help with your smart home.", action_type: "wake_up" },
        { command_category: "system_control", command_name: "all_devices_on", keywords: ["turn on everything", "turn on all devices", "power on all"], response: "Turning on all devices.", action_type: "all_devices_on" },
        { command_category: "system_control", command_name: "all_devices_off", keywords: ["turn off everything", "turn off all devices", "power off all"], response: "Turning off all devices.", action_type: "all_devices_off" },
        
        // Lighting Control
        { command_category: "lighting_control", command_name: "lights_all_on", keywords: ["turn on all lights", "lights on", "all lights on"], response: "Turning on all lights.", action_type: "lights_all_on" },
        { command_category: "lighting_control", command_name: "lights_all_off", keywords: ["turn off all lights", "lights off", "all lights off"], response: "Turning off all lights.", action_type: "lights_all_off" },
        
        // Shading Control
        { command_category: "shading_control", command_name: "windows_all_open", keywords: ["open all windows", "windows open", "open windows"], response: "Opening all windows.", action_type: "windows_all_open" },
        { command_category: "shading_control", command_name: "windows_all_close", keywords: ["close all windows", "windows close", "close windows"], response: "Closing all windows.", action_type: "windows_all_close" },
        { command_category: "shading_control", command_name: "curtains_all_open", keywords: ["open all curtains", "curtains open", "open curtains"], response: "Opening all curtains.", action_type: "curtains_all_open" },
        { command_category: "shading_control", command_name: "curtains_all_close", keywords: ["close all curtains", "curtains close", "close curtains"], response: "Closing all curtains.", action_type: "curtains_all_close" },
        
        // HVAC Control
        { command_category: "hvac_control", command_name: "ac_all_on", keywords: ["turn on all ac", "turn on air conditioning", "ac on"], response: "Turning on all air conditioning units.", action_type: "ac_all_on" },
        { command_category: "hvac_control", command_name: "ac_all_off", keywords: ["turn off all ac", "turn off air conditioning", "ac off"], response: "Turning off all air conditioning units.", action_type: "ac_all_off" },
        
        // Socket Control
        { command_category: "socket_control", command_name: "sockets_all_on", keywords: ["turn on all sockets", "sockets on", "all sockets on"], response: "Turning on all sockets.", action_type: "sockets_all_on" },
        { command_category: "socket_control", command_name: "sockets_all_off", keywords: ["turn off all sockets", "sockets off", "all sockets off"], response: "Turning off all sockets.", action_type: "sockets_all_off" },
        
        // Safety and Security
        { command_category: "safety_and_security", command_name: "away_mode", keywords: ["away mode", "activate away mode", "set away mode"], response: "Activating away mode. Securing the house and turning off non-essential devices.", action_type: "away_mode" },
        { command_category: "safety_and_security", command_name: "home_mode", keywords: ["home mode", "activate home mode", "set home mode"], response: "Activating home mode. Welcome back!", action_type: "home_mode" },
        { command_category: "safety_and_security", command_name: "lock_front_door", keywords: ["lock front door", "lock the door", "secure front door"], response: "Locking the front door and activating security mode.", action_type: "lock_door" },
        { command_category: "safety_and_security", command_name: "unlock_front_door", keywords: ["unlock front door", "unlock the door", "open front door lock"], response: "Unlocking the front door.", action_type: "unlock_door" },
        
        // Information & Interaction
        { command_category: "information_interaction", command_name: "introduction", keywords: ["who are you", "introduce yourself", "what is ander"], response: "I'm Ander, your AI assistant for SolarCore. I help you control your smart home, manage energy, and ensure your safety.", action_type: "introduction" },
        { command_category: "information_interaction", command_name: "help", keywords: ["help", "what can you do", "commands"], response: "I can help you control lights, sockets, curtains, air conditioning, and security systems. Try saying 'turn on all lights' or 'lock front door'.", action_type: "help" }
      ];
      
      // Add room-specific commands for each user room
      const roomCommands = [];
      for (const room of userRooms) {
        const roomName = room.name.toLowerCase();
        
        // Lighting commands for each room
        roomCommands.push(
          { command_category: "lighting_control", command_name: `turn_on_${roomName}_lights`, keywords: [`turn on ${roomName} lights`, `${roomName} lights on`], response: `Turning on ${roomName} lights.`, action_type: "lights_room_on" },
          { command_category: "lighting_control", command_name: `turn_off_${roomName}_lights`, keywords: [`turn off ${roomName} lights`, `${roomName} lights off`], response: `Turning off ${roomName} lights.`, action_type: "lights_room_off" }
        );
        
        // Shading commands for each room
        roomCommands.push(
          { command_category: "shading_control", command_name: `open_${roomName}_windows`, keywords: [`open ${roomName} windows`, `${roomName} windows open`], response: `Opening ${roomName} windows.`, action_type: "windows_room_open" },
          { command_category: "shading_control", command_name: `close_${roomName}_windows`, keywords: [`close ${roomName} windows`, `${roomName} windows close`], response: `Closing ${roomName} windows.`, action_type: "windows_room_close" }
        );
        
        // AC commands for each room
        roomCommands.push(
          { command_category: "hvac_control", command_name: `turn_on_${roomName}_ac`, keywords: [`turn on ${roomName} ac`, `${roomName} ac on`], response: `Turning on ${roomName} air conditioning.`, action_type: "ac_room_on" },
          { command_category: "hvac_control", command_name: `turn_off_${roomName}_ac`, keywords: [`turn off ${roomName} ac`, `${roomName} ac off`], response: `Turning off ${roomName} air conditioning.`, action_type: "ac_room_off" }
        );
        
        // Socket commands for each room
        roomCommands.push(
          { command_category: "socket_control", command_name: `turn_on_${roomName}_sockets`, keywords: [`turn on ${roomName} sockets`, `${roomName} sockets on`], response: `Turning on ${roomName} sockets.`, action_type: "sockets_room_on" },
          { command_category: "socket_control", command_name: `turn_off_${roomName}_sockets`, keywords: [`turn off ${roomName} sockets`, `${roomName} sockets off`], response: `Turning off ${roomName} sockets.`, action_type: "sockets_room_off" }
        );
        
        // Add specific socket commands based on room appliances
        const smartSockets = room.appliances.filter(app => app.type === 'smart_socket');
        for (const socket of smartSockets) {
          const socketName = socket.name.toLowerCase();
          roomCommands.push(
            { command_category: "socket_control", command_name: `turn_on_${roomName}_${socketName}`, keywords: [`turn on ${roomName} ${socketName}`, `${roomName} ${socketName} on`], response: `Turning on ${roomName} ${socketName}.`, action_type: "socket_specific_on" },
            { command_category: "socket_control", command_name: `turn_off_${roomName}_${socketName}`, keywords: [`turn off ${roomName} ${socketName}`, `${roomName} ${socketName} off`], response: `Turning off ${roomName} ${socketName}.`, action_type: "socket_specific_off" }
          );
        }
      }
      
      // Combine all commands and create them
      const allCommands = [...baseCommands, ...roomCommands];
      await VoiceCommand.bulkCreate(allCommands);
      
      console.log(`Initialized ${allCommands.length} voice commands for ${userRooms.length} rooms`);
      
    } catch (error) {
      console.error('Error initializing voice commands:', error);
    }
  };
  
  return { initializeVoiceCommands };
};