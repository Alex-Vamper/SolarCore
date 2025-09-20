import { useState, useEffect } from 'react';
import { UserSettings, SecuritySystem } from '@/entities/all';
import { SecurityAutoLockService } from '@/lib/securityAutoLockService';

interface SecurityState {
  isDoorLocked: boolean;
  isSecurityMode: boolean;
}

interface SecuritySystemData {
  id?: string;
  system_id?: string;
  lock_status?: string;
  security_mode?: string;
}

// Centralized security state management
class SecurityStateManager {
  private static instance: SecurityStateManager;
  private state: SecurityState = { isDoorLocked: false, isSecurityMode: false };
  private listeners: ((state: SecurityState) => void)[] = [];
  private securitySystem: SecuritySystemData | null = null;

  static getInstance(): SecurityStateManager {
    if (!SecurityStateManager.instance) {
      SecurityStateManager.instance = new SecurityStateManager();
    }
    return SecurityStateManager.instance;
  }

  initialize() {
    this.loadFromLocalStorage();
    this.setupEventListeners();
  }

  private loadFromLocalStorage() {
    try {
      const saved = localStorage.getItem('securityState');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.state = {
          isDoorLocked: !!parsed.isDoorLocked,
          isSecurityMode: !!parsed.isSecurityMode
        };
      }
    } catch (error) {
      console.error('Error loading security state from localStorage:', error);
    }
  }

  private saveToLocalStorage() {
    localStorage.setItem('securityState', JSON.stringify(this.state));
  }

  private async saveToBackend() {
    try {
      console.log('Saving security state to backend:', this.state);
      
      const mode = this.state.isSecurityMode ? 'away' : 'home';
      const lockStatus = this.state.isDoorLocked ? 'locked' : 'unlocked';
      
      if (this.securitySystem?.id) {
        await SecuritySystem.update(this.securitySystem.id, {
          lock_status: lockStatus,
          security_mode: mode
        });
        console.log('Updated existing security system:', this.securitySystem.id);
      } else {
        // Check if we have a security system
        const systems = await SecuritySystem.list();
        if (systems.length > 0) {
          this.securitySystem = systems[0];
          await SecuritySystem.update(systems[0].id, {
            lock_status: lockStatus,
            security_mode: mode
          });
          console.log('Updated found security system:', systems[0].id);
        } else {
          // Create a new security system
          const newSystem = await SecuritySystem.create({
            system_id: 'default_security',
            system_type: 'door_control',
            lock_status: lockStatus,
            security_mode: mode
          });
          this.securitySystem = newSystem;
          console.log('Created new security system:', newSystem.id);
        }
      }
    } catch (error) {
      console.error('Error saving security state to backend:', error);
    }
  }

  private setupEventListeners() {
    const handleDoorLocked = (event: CustomEvent) => {
      console.log('Door locked event received:', event.detail);
      this.updateState({
        isDoorLocked: event.detail.locked,
        isSecurityMode: event.detail.locked ? true : this.state.isSecurityMode
      });
    };

    const handleDoorUnlocked = () => {
      console.log('Door unlocked event received');
      this.updateState({
        isDoorLocked: false,
        isSecurityMode: false
      });
      // Clear auto-lock sessions
      localStorage.removeItem('autoLockCompletedSessions');
      localStorage.removeItem('autoLockStartedSessions');
    };

    const handleSecurityModeChanged = (event: CustomEvent) => {
      console.log('Security mode changed event received:', event.detail);
      const mode = event.detail.mode;
      this.updateState({
        isDoorLocked: mode === 'away' ? true : this.state.isDoorLocked,
        isSecurityMode: mode === 'away'
      });
      
      if (mode !== 'away') {
        localStorage.removeItem('autoLockCompletedSessions');
        localStorage.removeItem('autoLockStartedSessions');
      }
    };

    window.addEventListener('doorLocked', handleDoorLocked as EventListener);
    window.addEventListener('doorUnlocked', handleDoorUnlocked as EventListener);
    window.addEventListener('securityModeChanged', handleSecurityModeChanged as EventListener);
  }

  private updateState(newState: Partial<SecurityState>) {
    this.state = { ...this.state, ...newState };
    this.saveToLocalStorage();
    this.saveToBackend(); // Save to backend immediately
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.state));
  }

  getState(): SecurityState {
    return { ...this.state };
  }

  subscribe(listener: (state: SecurityState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  updateSecurityState(newState: Partial<SecurityState>) {
    this.updateState(newState);
  }

  // Method to trigger events from voice commands
  triggerSecurityModeChange(mode: 'home' | 'away') {
    console.log('Triggering security mode change via manager:', mode);
    this.updateState({
      isDoorLocked: mode === 'away' ? true : this.state.isDoorLocked,
      isSecurityMode: mode === 'away'
    });
  }

  triggerDoorLock(locked: boolean) {
    console.log('Triggering door lock via manager:', locked);
    this.updateState({
      isDoorLocked: locked,
      isSecurityMode: locked ? true : this.state.isSecurityMode
    });
  }
}

// Hook to use the centralized security state
export const useSecurityStateCentralized = () => {
  const [securityState, setSecurityState] = useState<SecurityState>({ isDoorLocked: false, isSecurityMode: false });
  const [securitySettings, setSecuritySettings] = useState<any>(null);

  useEffect(() => {
    const manager = SecurityStateManager.getInstance();
    manager.initialize();
    
    // Set initial state
    setSecurityState(manager.getState());
    
    // Subscribe to changes
    const unsubscribe = manager.subscribe(setSecurityState);
    
    return unsubscribe;
  }, []);

  // Load security settings
  useEffect(() => {
    const loadSecuritySettings = async () => {
      try {
        const settings = await UserSettings.list();
        if (settings.length > 0) {
          setSecuritySettings(settings[0].security_settings || {});
        }
      } catch (error) {
        console.error('Error loading security settings:', error);
      }
    };

    loadSecuritySettings();

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

  // Auto-lock monitoring
  useEffect(() => {
    const isLockedAndAway = securityState.isDoorLocked && securityState.isSecurityMode;
    const autoShutdownEnabled = securitySettings?.auto_shutdown_enabled;
    
    if (isLockedAndAway && autoShutdownEnabled && !SecurityAutoLockService.isCountdownRunning()) {
      SecurityAutoLockService.startAutoLockCountdown();
      console.log('Auto-lock countdown started');
    } else if ((!isLockedAndAway || !autoShutdownEnabled) && SecurityAutoLockService.isCountdownRunning()) {
      SecurityAutoLockService.cancelAutoLockCountdown();
      console.log('Auto-lock countdown cancelled');
    }
  }, [securityState.isDoorLocked, securityState.isSecurityMode, securitySettings?.auto_shutdown_enabled]);

  const updateSecurityState = (newState: Partial<SecurityState>) => {
    const manager = SecurityStateManager.getInstance();
    manager.updateSecurityState(newState);
  };

  return {
    ...securityState,
    updateSecurityState
  };
};

// Export the manager for direct access from ActionExecutor
export { SecurityStateManager };