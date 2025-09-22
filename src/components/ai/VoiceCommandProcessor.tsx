import { GlobalVoiceCommand } from "@/entities/GlobalVoiceCommand";

export default class VoiceCommandProcessor {
  private recognition: any;
  private isListening: boolean;
  private currentAudio: HTMLAudioElement | null;
  private commands: any[];
  private userSettings: any | null;

  constructor(commands: any[] = [], userSettings: any = null) {
    this.recognition = null;
    this.isListening = false;
    this.currentAudio = null;
    this.commands = commands;
    this.userSettings = userSettings;
  }

  setCommands(commands: any[]) {
    this.commands = commands;
  }

  setUserSettings(userSettings: any) {
    this.userSettings = userSettings;
    console.log('Voice processor updated with user settings:', {
      subscription_plan: userSettings?.subscription_plan,
      voice_response_enabled: userSettings?.voice_response_enabled
    });
  }

  private determineResponseType(audioUrl?: string): 'tts-only' | 'audio-preferred' {
    const subscriptionPlan = this.userSettings?.subscription_plan || 'free';
    
    console.log('Determining response type:', {
      subscription_plan: subscriptionPlan,
      has_audio_url: !!audioUrl,
      user_settings: this.userSettings ? 'loaded' : 'not_loaded'
    });
    
    // Free plan users get TTS only, regardless of audio availability
    if (subscriptionPlan === 'free') {
      console.log('Using TTS-only for free plan user');
      return 'tts-only';
    }
    
    // Premium/Enterprise users get audio preferred with TTS fallback
    console.log('Using audio-preferred for premium user');
    return 'audio-preferred';
  }

  startListening(timeoutMs = 8000) {
    return new Promise((resolve, reject) => {
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        reject(new Error('Speech recognition not supported'));
        return;
      }

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';

      let timeout = setTimeout(() => {
        if (this.recognition) {
          this.recognition.stop();
        }
        resolve({ transcript: null });
      }, timeoutMs);

      this.recognition.onresult = (event) => {
        clearTimeout(timeout);
        const transcript = event.results[0][0].transcript;
        resolve({ transcript });
      };

      this.recognition.onerror = (event) => {
        clearTimeout(timeout);
        reject(new Error(`Speech recognition error: ${event.error}`));
      };

      this.recognition.onend = () => {
        clearTimeout(timeout);
        this.isListening = false;
      };

      this.isListening = true;
      this.recognition.start();
    });
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
    
    // Stop any currently playing audio
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
  }

  async processCommand(transcript) {
    try {
      // Use commands from constructor or fetch global commands if not provided
      const commands = this.commands.length > 0 ? this.commands : await GlobalVoiceCommand.list(this.userSettings);
      const matchedCommand = this.findBestMatch(transcript.toLowerCase(), commands);
      
      if (matchedCommand) {
        // Check if command is restricted for free users
        if (GlobalVoiceCommand.isCommandRestricted(matchedCommand, this.userSettings)) {
          // Find the subscription required command
          const subscriptionRequiredCommand = commands.find(cmd => 
            cmd.command_name === '_admin_subscription_required_'
          );
          
          if (subscriptionRequiredCommand) {
            const preferredLanguage = this.userSettings?.preferred_language || 'english';
            const audioUrl = this.getAudioUrlForLanguage(subscriptionRequiredCommand, preferredLanguage);
            
            return {
              command: subscriptionRequiredCommand,
              response: subscriptionRequiredCommand.response_text,
              audioUrl: audioUrl,
              matched: true,
              restricted: true
            };
          } else {
            return {
              command: matchedCommand,
              response: "This command requires a premium subscription. Please upgrade your plan to use this feature.",
              matched: true,
              restricted: true
            };
          }
        }
        
        // Get language-specific audio URL for allowed commands
        const preferredLanguage = this.userSettings?.preferred_language || 'english';
        const audioUrl = this.getAudioUrlForLanguage(matchedCommand, preferredLanguage);
        
        return {
          command: matchedCommand,
          response: matchedCommand.response_text || matchedCommand.response,
          audioUrl: audioUrl,
          matched: true
        };
      } else {
        return {
          command: null,
          response: "I didn't understand that command. Please try again.",
          matched: false
        };
      }
    } catch (error) {
      console.error("Error processing command:", error);
      return {
        command: null,
        response: "There was an error processing your command.",
        matched: false
      };
    }
  }

  getAudioUrlForLanguage(command, language = 'english') {
    const languageMap = {
      'english': command.audio_url_english || command.audio_url,
      'hausa': command.audio_url_hausa || command.audio_url_english || command.audio_url,
      'yoruba': command.audio_url_yoruba || command.audio_url_english || command.audio_url,
      'igbo': command.audio_url_igbo || command.audio_url_english || command.audio_url,
      'pidgin': command.audio_url_pidgin || command.audio_url_english || command.audio_url
    };
    
    return languageMap[language] || command.audio_url_english || command.audio_url;
  }

  findBestMatch(transcript, commands) {
    let bestMatch = null;
    let highestScore = 0;

    for (const command of commands) {
      for (const keyword of command.keywords) {
        const score = this.calculateSimilarity(transcript, keyword.toLowerCase());
        if (score > highestScore && score > 0.7) {
          highestScore = score;
          bestMatch = command;
        }
      }
    }

    return bestMatch;
  }

  calculateSimilarity(str1, str2) {
    // Simple similarity calculation - checks if key phrases match
    const words1 = str1.split(' ');
    const words2 = str2.replace(/[{}]/g, '').split(' ');
    
    let matches = 0;
    for (const word1 of words1) {
      for (const word2 of words2) {
        if (word1.includes(word2) || word2.includes(word1)) {
          matches++;
          break;
        }
      }
    }
    
    return matches / Math.max(words1.length, words2.length);
  }

  async speakResponse(response, audioUrl = null) {
    try {
      // Stop any currently playing audio
      if (this.currentAudio) {
        this.currentAudio.pause();
        this.currentAudio = null;
      }

      // Determine response type based on subscription plan
      const responseType = this.determineResponseType(audioUrl);
      
      // Force TTS for free plan users
      if (responseType === 'tts-only') {
        return this.speakWithTTS(response);
      }

      // Premium/Enterprise: If audio URL is provided, play pre-recorded audio
      if (audioUrl) {
        return new Promise((resolve, reject) => {
          this.currentAudio = new Audio(audioUrl);
          
          this.currentAudio.onended = () => {
            this.currentAudio = null;
            resolve(void 0);
          };
          
          this.currentAudio.onerror = (error) => {
            console.warn("Error playing audio, falling back to text-to-speech:", error);
            this.currentAudio = null;
            // Fallback to text-to-speech
            this.speakWithTTS(response).then(resolve).catch(reject);
          };
          
          this.currentAudio.play().catch((error) => {
            console.warn("Error playing audio, falling back to text-to-speech:", error);
            this.currentAudio = null;
            // Fallback to text-to-speech
            this.speakWithTTS(response).then(resolve).catch(reject);
          });
        });
      } else {
        // Use text-to-speech as fallback
        return this.speakWithTTS(response);
      }
    } catch (error) {
      console.error("Error in speakResponse:", error);
      // Final fallback to text-to-speech
      return this.speakWithTTS(response);
    }
  }

  speakWithTTS(text) {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Text-to-speech not supported'));
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;

      utterance.onend = () => resolve(void 0);
      utterance.onerror = (event) => reject(new Error(`Text-to-speech error: ${event.error}`));

      window.speechSynthesis.speak(utterance);
    });
  }

  cleanup() {
    this.stopListening();
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
  }
}