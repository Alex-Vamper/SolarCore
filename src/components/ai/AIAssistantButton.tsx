
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { User, UserSettings } from "@/entities/all";
import { Mic, MicOff } from "lucide-react";
import VoiceCommandProcessor from "./VoiceCommandProcessor";

const AILogoSVG = () => (
  <svg width="40" height="40" viewBox="0 0 100 100" className="w-10 h-10">
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
    
    <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(59, 130, 246, 0.2)" strokeWidth="2"/>
    
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

export default function AIAssistantButton() {
  const [isEnabled, setIsEnabled] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [position, setPosition] = useState({ x: 20, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [user, setUser] = useState(null);
  const [voiceResponseEnabled, setVoiceResponseEnabled] = useState(true);
  
  const dragStartPos = useRef({ x: 0, y: 0 });
  const clickStartPos = useRef({ x: 0, y: 0 });
  const voiceProcessor = useRef(null);
  const buttonRef = useRef(null);
  const dragThreshold = 5; // pixels

  useEffect(() => {
    loadUserData();
    loadPosition();
    
    voiceProcessor.current = new VoiceCommandProcessor();
    
    const button = buttonRef.current;
    if (button) {
        button.addEventListener('mousedown', handleMouseDown);
        // Use passive: false for touch events if preventing default behavior inside the handler
        button.addEventListener('touchstart', handleTouchStart, { passive: false });
    }
    
    window.addEventListener('anderSettingsChanged', loadUserData);
    
    return () => {
      if (voiceProcessor.current) {
        voiceProcessor.current.cleanup();
      }
      if (button) {
        button.removeEventListener('mousedown', handleMouseDown);
        button.removeEventListener('touchstart', handleTouchStart);
      }
      window.removeEventListener('anderSettingsChanged', loadUserData);
    };
  }, []);

  const loadUserData = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      
      const settingsResult = await UserSettings.filter({ created_by: currentUser.email });
      if (settingsResult.length > 0) {
        const settings = settingsResult[0];
        setVoiceResponseEnabled(settings.voice_response_enabled ?? true);
        setIsEnabled(settings.ander_enabled ?? true);
      } else {
        // Default to enabled if no settings exist
        setVoiceResponseEnabled(true);
        setIsEnabled(true);
      }
    } catch (error) {
      console.error("Error loading user:", error);
      setIsEnabled(false); // Disable if user can't be loaded
    }
  };

  const loadPosition = () => {
    // Use a global key that persists across logout/login
    const savedPosition = localStorage.getItem('aiAssistantPosition');
    if (savedPosition) {
      try {
        const parsedPosition = JSON.parse(savedPosition);
        // Validate position is within screen bounds
        if (parsedPosition.x >= 0 && parsedPosition.y >= 0 && 
            parsedPosition.x <= window.innerWidth - 80 && 
            parsedPosition.y <= window.innerHeight - 80) {
          setPosition(parsedPosition);
        }
      } catch (error) {
        console.error("Error parsing saved position:", error);
      }
    }
  };

  const savePosition = (newPosition) => {
    // Use a global key that persists across logout/login
    localStorage.setItem('aiAssistantPosition', JSON.stringify(newPosition));
  };

  const handleDragStart = (clientX, clientY) => {
    dragStartPos.current = {
      x: clientX - position.x,
      y: clientY - position.y
    };
    clickStartPos.current = { x: clientX, y: clientY };
    setIsDragging(false);
  };

  const handleDragMove = (clientX, clientY) => {
    const deltaX = Math.abs(clientX - clickStartPos.current.x);
    const deltaY = Math.abs(clientY - clickStartPos.current.y);
    
    if (deltaX > dragThreshold || deltaY > dragThreshold) {
        setIsDragging(true);
    }
    
    const newX = Math.max(20, Math.min(window.innerWidth - 80, clientX - dragStartPos.current.x));
    const newY = Math.max(20, Math.min(window.innerHeight - 80, clientY - dragStartPos.current.y));
    setPosition({ x: newX, y: newY });
  };
  
  const handleDragEnd = () => {
    if (isDragging) {
        savePosition(position);
    } else {
        // Only activate if we weren't dragging
        handleActivate();
    }
    // Reset dragging state after a brief delay to prevent accidental activation
    setTimeout(() => setIsDragging(false), 100);
  };
  
  const handleMouseDown = (e) => {
    e.preventDefault(); // Prevent text selection during drag
    handleDragStart(e.clientX, e.clientY);
    
    const onMouseMove = (e) => {
      // e.preventDefault(); // Not typically needed for mousemove on document if dragStart prevents default
      handleDragMove(e.clientX, e.clientY);
    };
    
    const onMouseUp = () => {
        // e.preventDefault(); // Not typically needed
        handleDragEnd();
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handleTouchStart = (e) => {
    if(e.cancelable) e.preventDefault(); // Prevent default touch behavior (like scrolling) if allowed
    const touch = e.touches[0];
    handleDragStart(touch.clientX, touch.clientY);

    const onTouchMove = (e) => {
        if(e.cancelable) e.preventDefault(); // Prevent default touchmove behavior (like scrolling)
        const touch = e.touches[0];
        handleDragMove(touch.clientX, touch.clientY);
    };
    
    const onTouchEnd = () => {
        handleDragEnd();
        document.removeEventListener('touchmove', onTouchMove);
        document.removeEventListener('touchend', onTouchEnd);
    };

    document.addEventListener('touchmove', onTouchMove, { passive: false }); // Needs passive: false to allow preventDefault
    document.addEventListener('touchend', onTouchEnd);
  };

  const handleActivate = async () => {
    // Don't activate if we're in the middle of dragging or already listening
    if (isDragging || isListening) {
      if (voiceProcessor.current && isListening) voiceProcessor.current.stopListening();
      return;
    }

    setIsActive(true);
    setIsListening(true);
    setTranscript("Listening...");
    setResponse("");

    try {
      const result = await voiceProcessor.current.startListening(8000);
      
      if (result.transcript) {
        setTranscript(`You said: "${result.transcript}"`);
        const commandResponse = await voiceProcessor.current.processCommand(result.transcript);
        setResponse(commandResponse.response);
        
        if (voiceResponseEnabled && commandResponse.response) {
          await voiceProcessor.current.speakResponse(commandResponse.response);
        }
      } else {
        setTranscript("No speech detected");
        setResponse("Please try speaking more clearly");
      }
    } catch (error) {
      console.error("Voice processing error:", error);
      setTranscript("Voice recognition failed");
      setResponse("Please check your microphone and try again");
    } finally {
      setIsListening(false);
      setTimeout(() => {
        setIsActive(false);
        setTranscript("");
        setResponse("");
      }, 4000);
    }
  };

  const firstName = user?.full_name?.split(' ')[0] || 'User';
  
  const isOnLeftHalf = position.x < window.innerWidth / 2;
  const bubbleLeft = isOnLeftHalf ? position.x + 80 : position.x - 320;

  if (!isEnabled) {
    return null;
  }

  return (
    <>
      <div
        ref={buttonRef}
        style={{
          position: 'fixed',
          left: position.x,
          top: position.y,
          zIndex: 1000,
          cursor: isDragging ? 'grabbing' : 'grab',
          touchAction: 'none', // Prevents browser gestures like pull-to-refresh
          userSelect: 'none' // Prevents text selection on drag
        }}
        className="select-none"
        // onMouseDown={handleMouseDown} // Event listeners moved to useEffect
        // onTouchStart={handleTouchStart} // Event listeners moved to useEffect
      >
        <div className="relative">
          <Button
            size="icon"
            className={`w-16 h-16 rounded-full shadow-2xl transition-all duration-300 border-0 ${
              isListening 
                ? 'animate-pulse bg-red-500 hover:bg-red-600 shadow-red-400/50' 
                : isActive 
                ? 'animate-pulse shadow-yellow-400/50' 
                : 'hover:scale-110 shadow-blue-600/30'
            }`}
            style={{
              background: isListening 
                ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)'
                : 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #60a5fa 100%)',
              boxShadow: isActive 
                ? '0 0 30px rgba(251, 191, 36, 0.6), 0 0 60px rgba(251, 191, 36, 0.4)' 
                : '0 10px 25px rgba(59, 130, 246, 0.3)'
            }}
          >
            {isListening ? <MicOff className="w-6 h-6" /> : <AILogoSVG />}
          </Button>
          
          {(isActive || isListening) && (
            <div className={`absolute inset-0 rounded-full border-4 animate-ping opacity-75 ${
              isListening ? 'border-red-400' : 'border-yellow-400'
            }`}></div>
          )}
        </div>
      </div>

      {(isActive || transcript || response) && (
        <div
          style={{
            position: 'fixed',
            left: bubbleLeft,
            top: position.y + 10,
            zIndex: 1001
          }}
          className="bg-white rounded-xl shadow-xl border border-gray-200 p-3 max-w-xs animate-in slide-in-from-left-2 duration-300"
        >
          <div className="relative">
            <div 
              className={`absolute top-4 w-0 h-0 border-t-4 border-b-4 border-transparent ${
                isOnLeftHalf 
                  ? '-left-2 border-r-8 border-r-white' 
                  : '-right-2 border-l-8 border-l-white'
              }`}
            ></div>
            
            {isListening && (
              <div className="flex items-center gap-2 mb-2">
                <Mic className="w-4 h-4 text-red-500 animate-pulse" />
                <span className="text-sm text-gray-600 font-inter">Listening...</span>
              </div>
            )}
            
            {transcript && !response && (
              <p className="text-sm text-gray-800 font-inter mb-2">{transcript}</p>
            )}
            
            {response ? (
              <div>
                <p className="text-sm font-semibold text-blue-600 font-inter mb-1">Ander:</p>
                <p className="text-sm text-gray-800 font-inter">{response}</p>
              </div>
            ) : !transcript && !isListening && (
              <p className="text-sm text-gray-800 font-inter">
                Hi <span className="font-semibold text-blue-600">{firstName}</span>, tap and speak your command!
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
