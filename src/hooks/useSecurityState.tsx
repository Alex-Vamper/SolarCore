import { useState, useEffect } from 'react';

interface SecurityState {
  isDoorLocked: boolean;
  isSecurityMode: boolean;
}

export const useSecurityState = () => {
  const [securityState, setSecurityState] = useState<SecurityState>({
    isDoorLocked: false,
    isSecurityMode: false
  });

  // Initialize from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('securityState');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setSecurityState(parsed);
      } catch (error) {
        console.error('Error parsing security state:', error);
      }
    }
  }, []);

  // Listen for global security events from voice commands
  useEffect(() => {
    const handleDoorLocked = (event: CustomEvent) => {
      const locked = event.detail.locked;
      const newState = {
        isDoorLocked: locked,
        isSecurityMode: locked ? true : securityState.isSecurityMode
      };
      setSecurityState(newState);
      localStorage.setItem('securityState', JSON.stringify(newState));
    };

    const handleDoorUnlocked = (event: CustomEvent) => {
      const newState = {
        isDoorLocked: false,
        isSecurityMode: false
      };
      setSecurityState(newState);
      localStorage.setItem('securityState', JSON.stringify(newState));
    };

    const handleSecurityModeChanged = (event: CustomEvent) => {
      const mode = event.detail.mode;
      const newState = {
        isDoorLocked: mode === 'away' ? true : securityState.isDoorLocked,
        isSecurityMode: mode === 'away'
      };
      setSecurityState(newState);
      localStorage.setItem('securityState', JSON.stringify(newState));
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