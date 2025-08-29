
import React, { useState, useEffect, useRef } from 'react';
import { User, UserSettings, VoiceCommand } from "@/entities/all";
import VoiceCommandProcessor from './VoiceCommandProcessor';
import ActionExecutor from './ActionExecutor'; // Import the new executor
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';

const AILogoSVG = () => (
    <svg width="24" height="24" viewBox="0 0 100 100" className="w-8 h-8">
      <defs>
        <radialGradient id="centerGlowBtn" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </radialGradient>
        <linearGradient id="bladeGradientBtn" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="50%" stopColor="#1E40AF" />
          <stop offset="100%" stopColor="#1E3A8A" />
        </linearGradient>
      </defs>
      <g transform="translate(50, 50)">
        <path d="M 0,-35 Q -15,-20 -35,-15 Q -20,-5 0,0 Q 5,-20 0,-35" fill="url(#bladeGradientBtn)" opacity="0.8"/>
        <g transform="rotate(120)"><path d="M 0,-35 Q -15,-20 -35,-15 Q -20,-5 0,0 Q 5,-20 0,-35" fill="url(#bladeGradientBtn)" opacity="0.8"/></g>
        <g transform="rotate(240)"><path d="M 0,-35 Q -15,-20 -35,-15 Q -20,-5 0,0 Q 5,-20 0,-35" fill="url(#bladeGradientBtn)" opacity="0.8"/></g>
        <circle cx="0" cy="0" r="12" fill="url(#centerGlowBtn)" />
        <circle cx="0" cy="0" r="6" fill="#FFFFFF" opacity="0.9" />
      </g>
    </svg>
);

export default function AIAssistantButton() {
    const [anderEnabled, setAnderEnabled] = useState(false);
    const [voiceResponseEnabled, setVoiceResponseEnabled] = useState(true);
    const [isListening, setIsListening] = useState(false);
    const [responseMessage, setResponseMessage] = useState('');
    
    // State for drag-and-drop and position persistence
    const [position, setPosition] = useState({ x: window.innerWidth - 80, y: window.innerHeight - 80 });
    const [isDragging, setIsDragging] = useState(false);
    const [hasMoved, setHasMoved] = useState(false); // To distinguish click from drag
    const buttonRef = useRef(null);
    const dragStartPoint = useRef({ x: 0, y: 0 });
    const userSettingsRef = useRef(null); // To store user settings object
    const systemFallbacksRef = useRef<{ unrecognized?: any; device_not_found?: any }>({});
    
    const isMobile = useIsMobile();

    const voiceProcessor = useRef(new VoiceCommandProcessor());

    const loadSettings = async () => {
        try {
            const currentUser = await User.me();
            // Fetch settings using the corrected list method
            const settingsResult = await UserSettings.list();

            if (settingsResult.length > 0) {
                const settings = settingsResult[0];
                userSettingsRef.current = settings;
                setAnderEnabled(settings.ander_enabled ?? false);
                setVoiceResponseEnabled(settings.voice_response_enabled ?? true);
                // Use ander_button_position from settings or default
                const buttonPos = settings.ander_button_position || { x: 20, y: 20 };
                setPosition(buttonPos);
            } else {
                setAnderEnabled(false); // No settings, so no button
            }
            
            // Fetch system fallbacks
            const allCommands = await VoiceCommand.list();
            systemFallbacksRef.current = {
                unrecognized: allCommands.find(c => c.command_name === '_admin_didnt_understand_') || null,
                device_not_found: allCommands.find(c => c.command_name === '_admin_device_not_found_') || null
            };

        } catch (error) {
            // Not logged in or other error, disable button
            setAnderEnabled(false); 
        }
    };

    useEffect(() => {
        loadSettings();
        window.addEventListener('anderSettingsChanged', loadSettings);
        return () => window.removeEventListener('anderSettingsChanged', loadSettings);
    }, []);

    const handlePointerDown = (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        setIsDragging(true);
        setHasMoved(false);
        dragStartPoint.current = {
            x: e.clientX || e.touches?.[0]?.clientX || 0,
            y: e.clientY || e.touches?.[0]?.clientY || 0
        };
        e.preventDefault();
    };

    const handlePointerMove = (e) => {
        if (!isDragging) return;
        setHasMoved(true);

        const clientX = e.clientX || e.touches?.[0]?.clientX || 0;
        const clientY = e.clientY || e.touches?.[0]?.clientY || 0;

        const newX = position.x + clientX - dragStartPoint.current.x;
        const newY = position.y + clientY - dragStartPoint.current.y;
        
        dragStartPoint.current = { x: clientX, y: clientY };

        const buttonWidth = buttonRef.current?.offsetWidth || 64;
        const buttonHeight = buttonRef.current?.offsetHeight || 64;
        
        const clampedX = Math.max(10, Math.min(newX, window.innerWidth - buttonWidth - 10));
        const clampedY = Math.max(10, Math.min(newY, window.innerHeight - buttonHeight - 10));

        setPosition({ x: clampedX, y: clampedY });
    };

    const savePosition = async (newPos) => {
        try {
            // Use upsert to save the button position
            await UserSettings.upsert({ ander_button_position: newPos });
            console.log('Button position saved:', newPos);
        } catch (error) {
            console.error("Failed to save button position:", error);
        }
    };

    const handlePointerUp = () => {
        setIsDragging(false);
        if (hasMoved) {
            savePosition(position);
        }
    };

    useEffect(() => {
        if (isDragging) {
            if (isMobile) {
                document.addEventListener('touchmove', handlePointerMove as any, { passive: false });
                document.addEventListener('touchend', handlePointerUp as any);
            } else {
                document.addEventListener('mousemove', handlePointerMove as any);
                document.addEventListener('mouseup', handlePointerUp as any);
            }
            document.body.style.userSelect = 'none';
            document.body.style.touchAction = 'none';
        }
        return () => {
            if (isMobile) {
                document.removeEventListener('touchmove', handlePointerMove as any);
                document.removeEventListener('touchend', handlePointerUp as any);
            } else {
                document.removeEventListener('mousemove', handlePointerMove as any);
                document.removeEventListener('mouseup', handlePointerUp as any);
            }
            document.body.style.userSelect = 'auto';
            document.body.style.touchAction = 'auto';
        };
    }, [isDragging, position, isMobile]);

    const handleClick = async () => {
        if (hasMoved || isListening) return;

        setIsListening(true);
        setResponseMessage('');
        
        try {
            const result = await voiceProcessor.current.startListening() as { transcript: string | null };
            setIsListening(false); // Set to false right after listening finishes
            
            if (result?.transcript) {
                const commandResult = await voiceProcessor.current.processCommand(result.transcript);
                
                if (commandResult.matched) {
                    // Execute the action
                    const actionResult = await ActionExecutor.execute(commandResult.command, result.transcript);

                    let finalResponseCommand = commandResult.command; // Use 'command' as the source for response and audio
                    // If action failed because device not found, use device_not_found fallback
                    if (!actionResult.success && actionResult.reason === 'device_not_found' && systemFallbacksRef.current?.device_not_found) {
                        finalResponseCommand = systemFallbacksRef.current.device_not_found;
                    }

                    setResponseMessage(finalResponseCommand.response);
                    if (voiceResponseEnabled) {
                        await voiceProcessor.current.speakResponse(finalResponseCommand.response, finalResponseCommand.audio_url);
                    }
                } else {
                    // Use unrecognized fallback
                    const fallback = systemFallbacksRef.current?.unrecognized;
                    if (fallback) {
                        setResponseMessage(fallback.response);
                        if (voiceResponseEnabled) {
                           await voiceProcessor.current.speakResponse(fallback.response, fallback.audio_url);
                        }
                    } else {
                        // Fallback to default message from VoiceCommandProcessor if no DB fallback exists
                        setResponseMessage(commandResult.response); 
                    }
                }
            } else {
                setResponseMessage("No command heard.");
            }
        } catch (error) {
            console.error("Voice command failed:", error);
            setIsListening(false); // Ensure listening state is reset on error
            const fallback = systemFallbacksRef.current?.unrecognized;
            // Use the fallback response or a generic error message
            setResponseMessage(fallback?.response || "An error occurred.");
        }
    };

    // Calculate text box position based on button position
    const getTextBoxPosition = () => {
        const isOnLeftHalf = position.x < window.innerWidth / 2;
        if (isOnLeftHalf) {
            // Button on left, text box on right
            return {
                left: position.x + 80,
                top: position.y,
                transform: 'translateY(-50%)'
            };
        } else {
            // Button on right, text box on left
            return {
                right: window.innerWidth - position.x + 16,
                top: position.y,
                transform: 'translateY(-50%)'
            };
        }
    };

    if (!anderEnabled) {
        return null;
    }

    return (
        <>
            {/* Listening pulse effect */}
            {isListening && (
                <div
                    className="fixed z-40 pointer-events-none"
                    style={{
                        left: position.x - 16,
                        top: position.y - 16,
                        width: '96px',
                        height: '96px'
                    }}
                >
                    <div className="absolute inset-0 rounded-full bg-yellow-400 opacity-30 animate-ping"></div>
                    <div className="absolute inset-2 rounded-full bg-yellow-300 opacity-40 animate-ping animation-delay-75"></div>
                    <div className="absolute inset-4 rounded-full bg-yellow-200 opacity-50 animate-ping animation-delay-150"></div>
                </div>
            )}

            {/* Response text box */}
            <AnimatePresence>
                {responseMessage && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="fixed z-50 bg-white text-black p-3 rounded-lg shadow-xl text-sm max-w-xs font-inter border border-gray-200"
                        style={getTextBoxPosition()}
                    >
                        {responseMessage}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* AI Assistant Button */}
            <motion.button
                ref={buttonRef}
                className="fixed z-50 w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg cursor-grab active:cursor-grabbing focus:outline-none"
                style={{
                    left: position.x,
                    top: position.y,
                }}
                onMouseDown={!isMobile ? handlePointerDown : undefined}
                onTouchStart={isMobile ? handlePointerDown : undefined}
                onClick={handleClick}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
            >
                <AILogoSVG />
            </motion.button>

            <style>
                {`
                .animation-delay-75 {
                    animation-delay: 75ms;
                }
                .animation-delay-150 {
                    animation-delay: 150ms;
                }
                `}
            </style>
        </>
    );
}
