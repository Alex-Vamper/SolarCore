import { VoiceCommand, User, Room } from "@/entities/all";
import { supabase } from "@/integrations/supabase/client";

// Add TypeScript declarations for Speech APIs
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: (event: any) => void;
  onerror: (event: any) => void;
  onend: () => void;
}

export default class VoiceCommandProcessor {
  private recognition: SpeechRecognition | null;
  private synthesis: SpeechSynthesis;
  private isListening: boolean;
  private isAwaitingSecurityResponse: boolean;
  private rooms: any[];
  private roomNames: string[];
  private allSocketNames: string[];

  constructor() {
    this.recognition = null;
    this.synthesis = window.speechSynthesis;
    this.isListening = false;
    this.isAwaitingSecurityResponse = false;
    this.rooms = [];
    this.roomNames = [];
    this.allSocketNames = [];
  }

  async initialize() {
    try {
      const currentUser = await User.me();
      this.rooms = await Room.filter({ created_by: currentUser.email });
      this.roomNames = this.rooms.map(r => r.name.toLowerCase());
      
      const specificSocketNames = [
          "tv socket", "dispenser socket", "free socket", 
          "refrigerator socket", "freezer socket", "fridge socket",
          "microwave socket", "washing machine socket"
      ];
      
      this.allSocketNames = this.rooms.flatMap(r => 
        r.appliances?.filter(a => a.type === 'smart_socket').map(s => s.name.toLowerCase()) || []
      ).concat(specificSocketNames);

    } catch (e) {
      console.error("Could not initialize voice processor with user data", e);
      this.rooms = [];
      this.roomNames = [];
      this.allSocketNames = [];
    }
  }

  startListening(timeout = 8000) {
    return new Promise((resolve, reject) => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        return reject(new Error("Speech recognition not supported"));
      }

      if (this.isListening) {
        this.recognition.stop();
      }

      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';

      let timeoutHandle = setTimeout(() => {
        if(this.recognition) this.recognition.stop();
        resolve({ transcript: "" });
      }, timeout);

      this.recognition.onresult = (event) => {
        clearTimeout(timeoutHandle);
        const finalTranscript = event.results[0][0].transcript.trim();
        resolve({ transcript: finalTranscript });
      };

      this.recognition.onerror = (event) => {
        clearTimeout(timeoutHandle);
        reject(new Error(`Speech recognition error: ${event.error}`));
      };
      
      this.recognition.onend = () => {
          clearTimeout(timeoutHandle);
          this.isListening = false;
      }

      this.isListening = true;
      this.recognition.start();
    });
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  async processCommand(transcript) {
    if (!transcript) return { command: null, response: "I didn't hear anything. Please try again." };
    
    await this.initialize();
    
    try {
      const allCommands = await VoiceCommand.list();
      if (!allCommands.length) return { command: null, response: "I'm still learning." };

      const { bestMatch, extractedRoomName, extractedSocketName } = this.fuzzySearch(transcript, allCommands);

      if (bestMatch && bestMatch.score > 0.4) {
        const responseText = await this.executeAction(bestMatch.command, extractedRoomName, extractedSocketName);
        return { command: bestMatch.command, response: responseText };
      } else {
        return { command: null, response: "I didn't understand that. For a list of commands, check the Ander page in your settings." };
      }
    } catch (error) {
      console.error("Error processing command:", error);
      return { command: null, response: "Sorry, I had trouble with that command." };
    }
  }
  
  async executeAction(command, roomName, socketName) {
    const action = command.action_type;
    
    const positiveActions = ['_on', '_open'];
    const status = positiveActions.some(suffix => action.endsWith(suffix));

    let responseText = command.response;
    let roomsToUpdate = [];
    
    if (action.includes('_all_')) {
        roomsToUpdate = this.rooms;
        responseText = responseText.replace('{RoomName}', 'all rooms');
    } else if (roomName) {
        const targetRoom = this.rooms.find(r => r.name.toLowerCase() === roomName.toLowerCase());
        if (targetRoom) roomsToUpdate.push(targetRoom);
    }
    
    if (action === 'system_all_on' || action === 'system_all_off') {
        roomsToUpdate = this.rooms;
    }
    
    if (action === "lock_door") {
        this.isAwaitingSecurityResponse = true;
        window.dispatchEvent(new CustomEvent('doorLocked', { detail: { locked: true } }));
        return responseText;
    }
    if (action === "unlock_door") {
        window.dispatchEvent(new CustomEvent('doorUnlocked'));
        return responseText;
    }
    if (action === "home_mode" || action === "away_mode") {
        if (this.isAwaitingSecurityResponse || document.querySelector('[data-security-state="locked"]')) {
             window.dispatchEvent(new CustomEvent('securityModeChanged', { detail: { mode: action.split('_')[0] } }));
             this.isAwaitingSecurityResponse = false;
             return responseText;
        } else {
            return "The door must be locked first to select a security mode.";
        }
    }

    if (roomsToUpdate.length === 0 && !socketName) {
        if(command.command_category === "information_interaction" || command.command_category === "energy_management") {
            return responseText;
        }
        return "I couldn't figure out which room or device you meant.";
    }

    const updatePromises = roomsToUpdate.map(room => {
        const updatedAppliances = room.appliances.map(app => {
            let shouldUpdate = false;
            
            if (action.startsWith('lights_') && app.type === 'smart_lighting') shouldUpdate = true;
            if (action.startsWith('window_') && app.series === 'D-W Sense') shouldUpdate = true;
            if (action.startsWith('curtain_') && app.series?.includes('ShadeCore')) shouldUpdate = true;
            if (action.startsWith('ac_') && app.type === 'smart_hvac') shouldUpdate = true;
            if (action.startsWith('system_all_')) shouldUpdate = true;
            
            return shouldUpdate ? { ...app, status } : app;
        });
        return Room.update(room.id, { appliances: updatedAppliances });
    });

    if (socketName) {
        for (const room of this.rooms) {
            let foundSocket = false;
            const updatedAppliances = room.appliances.map(app => {
                if (app.type === 'smart_socket' && app.name.toLowerCase().includes(socketName)) {
                    foundSocket = true;
                    return { ...app, status };
                }
                return app;
            });
            if (foundSocket) {
                updatePromises.push(Room.update(room.id, { appliances: updatedAppliances }));
                responseText = responseText.replace('{SocketName}', socketName);
            }
        }
    }
    
    await Promise.all(updatePromises);
    
    const roomsAffected = roomsToUpdate.length > 0 ? roomsToUpdate : this.rooms;
    roomsAffected.forEach(room => {
        window.dispatchEvent(new CustomEvent('roomApplianceUpdated', { detail: { roomId: room.id } }));
    });

    return responseText.replace('{RoomName}', roomName || 'all rooms');
  }
  
  fuzzySearch(transcript, allCommands) {
    const input = transcript.toLowerCase().trim();
    let bestMatch = { command: null, score: 0 };
    let extractedRoomName = null;
    let extractedSocketName = null;
  
    // Prioritize socket name extraction
    for (const name of this.allSocketNames) {
      if (input.includes(name)) {
        extractedSocketName = name;
        break;
      }
    }
    
    // Then check for room name
    if (!extractedSocketName) {
        for (const name of this.roomNames) {
          if (input.includes(name)) {
            extractedRoomName = name;
            break;
          }
        }
    }
  
    for (const command of allCommands) {
      for (const keyword of command.keywords) {
        let score = 0;
        let currentKeyword = keyword.toLowerCase();
        
        let placeholderFreeKeyword = currentKeyword.replace(/\{(roomname|socketname)\}/g, '').trim();
        let placeholderFreeInput = input;
        
        if (extractedSocketName) {
            placeholderFreeInput = input.replace(extractedSocketName, '').trim();
        } else if(extractedRoomName) {
            placeholderFreeInput = input.replace(extractedRoomName, '').trim();
        }

        if(placeholderFreeInput.includes(placeholderFreeKeyword)) {
            score = 0.5; // Base score for keyword match
            if (extractedRoomName && currentKeyword.includes('{roomname}')) score += 0.3;
            if (extractedSocketName && currentKeyword.includes('{socketname}')) score += 0.4;
            if (input === currentKeyword.replace('{roomname}', extractedRoomName || "").replace('{socketname}', extractedSocketName || "").trim()) {
                score = 1; // Perfect match
            }
        }

        if (score > bestMatch.score) {
          bestMatch = { command, score };
        }
      }
    }
    return { bestMatch, extractedRoomName, extractedSocketName };
  }

  async speakResponse(text: string): Promise<void> {
    try {
      // Use our TTS edge function for better quality speech
      const { data, error } = await supabase.functions.invoke('generate-tts', {
        body: { text, voiceId: "9BWtsMINqrJLrRacOk9x" }
      });

      if (error) throw error;

      if (data?.audioContent) {
        // Convert base64 to blob and play
        const audioBytes = atob(data.audioContent);
        const byteNumbers = new Array(audioBytes.length);
        for (let i = 0; i < audioBytes.length; i++) {
          byteNumbers[i] = audioBytes.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const audioBlob = new Blob([byteArray], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        const audio = new Audio(audioUrl);
        audio.volume = 0.7;
        
        return new Promise((resolve) => {
          audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            resolve();
          };
          audio.onerror = () => {
            URL.revokeObjectURL(audioUrl);
            this.fallbackToWebSpeech(text);
            resolve();
          };
          audio.play().catch(() => {
            URL.revokeObjectURL(audioUrl);
            this.fallbackToWebSpeech(text);
            resolve();
          });
        });
      } else {
        this.fallbackToWebSpeech(text);
      }
    } catch (error) {
      console.error('TTS error:', error);
      this.fallbackToWebSpeech(text);
    }
  }

  private fallbackToWebSpeech(text: string): void {
    if (!this.synthesis) return;
    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;
    
    let repeatCount = 0;
    const speak = () => {
      if (repeatCount < 2) {
        repeatCount++;
        utterance.onend = () => {
            if(repeatCount < 2) setTimeout(speak, 500);
        };
        utterance.onerror = () => {};
        this.synthesis.speak(utterance);
      }
    };
    speak();
  }

  cleanup() {
    if (this.recognition) this.recognition.abort();
    if (this.synthesis) this.synthesis.cancel();
  }
}