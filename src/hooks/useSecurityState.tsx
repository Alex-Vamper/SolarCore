import { useState, useEffect } from 'react';
import { UserSettings } from '@/entities/all';
import { SecurityAutoLockService } from '@/lib/securityAutoLockService';

interface SecurityState {
  isDoorLocked: boolean;
  isSecurityMode: boolean;
}

export const useSecurityState = () => {
  const [securityState, setSecurityState] = useState<SecurityState>({
    isDoorLocked: false,
    isSecurityMode: false
  });
  const [securitySettings, setSecuritySettings] = useState<any>(null);
  const [autoLockSessionId, setAutoLockSessionId] = useState<string | null>(null);

  // Load security settings and initialize state
  useEffect(() => {
    const loadSecurityData = async () => {
      try {
        // Load user settings for security configuration
        const settings = await UserSettings.list();
        if (settings.length > 0) {
          setSecuritySettings(settings[0].security_settings || {});
        }

        // Initialize from localStorage
        const savedState = localStorage.getItem('securityState');
        if (savedState) {
          try {
            const parsed = JSON.parse(savedState);
            setSecurityState({
              isDoorLocked: !!parsed.isDoorLocked,
              isSecurityMode: !!parsed.isSecurityMode
            });
            setAutoLockSessionId(parsed.sessionId || null);
          } catch (error) {
            console.error('Error parsing security state:', error);
          }
        }
      } catch (error) {
        console.error('Error loading security settings:', error);
      }
    };

    loadSecurityData();
  }, []);

  // Listen for settings changes
  useEffect(() => {
    const handleSecuritySettingsChanged = async () => {
      try {
        const settings = await UserSettings.list();
        if (settings.length > 0) {
          setSecuritySettings(settings[0].security_settings || {});
        }
      } catch (error) {
        console.error('Error reloading security settings:', error);
      }
    };

    window.addEventListener('securitySettingsChanged', handleSecuritySettingsChanged);
    return () => {
      window.removeEventListener('securitySettingsChanged', handleSecuritySettingsChanged);
    };
  }, []);

  // Listen for global security events from voice commands
  useEffect(() => {
    const handleDoorLocked = (event: CustomEvent) => {
      const locked = event.detail.locked;
      const sessionId = `${locked}_${locked ? true : securityState.isSecurityMode}_${Date.now()}`;
      const newState = {
        isDoorLocked: locked,
        isSecurityMode: locked ? true : securityState.isSecurityMode
      };
      setSecurityState(newState);
      setAutoLockSessionId(sessionId);
      localStorage.setItem('securityState', JSON.stringify({ ...newState, sessionId }));
    };

    const handleDoorUnlocked = (event: CustomEvent) => {
      const sessionId = `false_false_${Date.now()}`;
      const newState = {
        isDoorLocked: false,
        isSecurityMode: false
      };
      setSecurityState(newState);
      setAutoLockSessionId(sessionId);
      localStorage.setItem('securityState', JSON.stringify({ ...newState, sessionId }));
      
      // Clear completed sessions when unlocking (new security cycle)
      localStorage.removeItem('autoLockCompletedSessions');
      localStorage.removeItem('autoLockStartedSessions');
    };

    const handleSecurityModeChanged = (event: CustomEvent) => {
      const mode = event.detail.mode;
      const sessionId = `${mode === 'away' ? true : securityState.isDoorLocked}_${mode === 'away'}_${Date.now()}`;
      const newState = {
        isDoorLocked: mode === 'away' ? true : securityState.isDoorLocked,
        isSecurityMode: mode === 'away'
      };
      setSecurityState(newState);
      setAutoLockSessionId(sessionId);
      localStorage.setItem('securityState', JSON.stringify({ ...newState, sessionId }));
      
      if (mode !== 'away') {
        // Clear completed sessions when switching to home mode (new security cycle)
        localStorage.removeItem('autoLockCompletedSessions');
        localStorage.removeItem('autoLockStartedSessions');
      }
    };

    window.addEventListener('doorLocked', handleDoorLocked as EventListener);
    window.addEventListener('doorUnlocked', handleDoorUnlocked as EventListener);
    window.addEventListener('securityModeChanged', handleSecurityModeChanged as EventListener);

    return () => {
      window.removeEventListener('doorLocked', handleDoorLocked as EventListener);
      window.removeEventListener('doorUnlocked', handleDoorUnlocked as EventListener);
      window.removeEventListener('securityModeChanged', handleSecurityModeChanged as EventListener);
    };
  }, [securityState]);

  // Global auto-lock monitoring - this runs regardless of which page is active
  useEffect(() => {
    const isLockedAndAway = securityState.isDoorLocked && securityState.isSecurityMode;
    const autoShutdownEnabled = securitySettings?.auto_shutdown_enabled;
    
    // Check if auto-lock has already run for this session
    const completedSessionsJson = localStorage.getItem('autoLockCompletedSessions');
    const completedSessions = completedSessionsJson ? JSON.parse(completedSessionsJson) : [];
    const hasAlreadyCompletedAutoLock = autoLockSessionId && completedSessions.includes(autoLockSessionId);
    
    if (isLockedAndAway && autoShutdownEnabled && !SecurityAutoLockService.isCountdownRunning() && !hasAlreadyCompletedAutoLock) {
      // Start auto-lock countdown only when both conditions are met and hasn't run for this session
      SecurityAutoLockService.startAutoLockCountdown();
      
      // Mark this session as having auto-lock started
      if (autoLockSessionId) {
        const startedSessionsJson = localStorage.getItem('autoLockStartedSessions');
        const startedSessions = startedSessionsJson ? JSON.parse(startedSessionsJson) : [];
        if (!startedSessions.includes(autoLockSessionId)) {
          startedSessions.push(autoLockSessionId);
          localStorage.setItem('autoLockStartedSessions', JSON.stringify(startedSessions));
        }
      }
      
      console.log('Auto-lock countdown started globally for session:', autoLockSessionId);
    } else if ((!isLockedAndAway || !autoShutdownEnabled) && SecurityAutoLockService.isCountdownRunning()) {
      // Cancel auto-lock countdown when conditions are no longer met
      SecurityAutoLockService.cancelAutoLockCountdown();
      console.log('Auto-lock countdown cancelled globally');
    }
  }, [securityState.isDoorLocked, securityState.isSecurityMode, securitySettings?.auto_shutdown_enabled, autoLockSessionId]);

  // Cleanup on unmount - but preserve auto-lock countdown
  useEffect(() => {
    return () => {
      // Don't cleanup auto-lock service on hook unmount
      // The auto-lock should persist across page navigation
      // SecurityAutoLockService.cleanup();
    };
  }, []);

  const updateSecurityState = (newState: Partial<SecurityState>) => {
    const updated = { ...securityState, ...newState };
    setSecurityState(updated);
    localStorage.setItem('securityState', JSON.stringify(updated));
  };

  return {
    ...securityState,
    updateSecurityState
  };
};