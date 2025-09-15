import { User, SafetySystem, SecuritySystem, UserSettings } from "@/entities/all";
import { ChildDeviceService } from "@/entities/ChildDevice";

interface SystemStatus {
  id: string;
  name: string;
  type: string;
  status: 'optimal' | 'warning' | 'error';
  details: string;
  room?: string;
}

export class SystemsCheckService {
  static async checkAllSystems(): Promise<SystemStatus[]> {
    try {
      const currentUser = await User.me();
      const [safetySystems, securitySystems, userSettings] = await Promise.all([
        SafetySystem.filter({ user_id: currentUser.id }),
        SecuritySystem.list(),
        UserSettings.list()
      ]);

      const systemStatuses: SystemStatus[] = [];

      // Check safety systems from child devices
      const safetyDevices = await ChildDeviceService.getSafetyDevices();
      
      for (const device of safetyDevices) {
        const status = this.evaluateSafetySystemStatus(device);
        systemStatuses.push({
          id: device.id!,
          name: device.device_name || 'Safety System',
          type: device.device_type?.device_series || 'safety',
          status: status.status,
          details: status.details,
          room: device.state?.room_name as string
        });
      }

      // Check security systems
      for (const securitySystem of securitySystems) {
        const status = this.evaluateSecuritySystemStatus(securitySystem);
        systemStatuses.push({
          id: securitySystem.id!,
          name: `Security System ${securitySystem.system_id}`,
          type: 'security',
          status: status.status,
          details: status.details
        });
      }

      // Check legacy safety systems (fallback)
      for (const safetySystem of safetySystems) {
        const status = this.evaluateLegacySafetySystemStatus(safetySystem);
        systemStatuses.push({
          id: safetySystem.id!,
          name: `${safetySystem.room_name} Safety`,
          type: safetySystem.system_type || 'safety',
          status: status.status,
          details: status.details,
          room: safetySystem.room_name
        });
      }

      return systemStatuses;
    } catch (error) {
      console.error('Error checking systems:', error);
      return [];
    }
  }

  private static evaluateSafetySystemStatus(device: any): { status: 'optimal' | 'warning' | 'error'; details: string } {
    const state = device.state || {};
    
    // Check for critical conditions
    if (state.flame_status === 'detected' || state.status === 'triggered') {
      return {
        status: 'error',
        details: 'Fire or emergency detected! Immediate attention required.'
      };
    }

    if (state.smoke_percentage && state.smoke_percentage > 50) {
      return {
        status: 'warning',
        details: `High smoke level detected: ${state.smoke_percentage}%`
      };
    }

    if (state.temperature && (state.temperature > 40 || state.temperature < 0)) {
      return {
        status: 'warning',
        details: `Temperature out of normal range: ${state.temperature}°C`
      };
    }

    if (state.status === 'safe' || state.flame_status === 'clear') {
      return {
        status: 'optimal',
        details: 'All sensors reading normal levels. System operational.'
      };
    }

    return {
      status: 'optimal',
      details: 'System status normal. All parameters within safe ranges.'
    };
  }

  private static evaluateSecuritySystemStatus(securitySystem: any): { status: 'optimal' | 'warning' | 'error'; details: string } {
    const lockStatus = securitySystem.lock_status || 'unlocked';
    const securityMode = securitySystem.security_mode || 'home';

    if (securityMode === 'away' && lockStatus === 'locked') {
      return {
        status: 'optimal',
        details: 'Security system armed. Door locked and monitoring active.'
      };
    }

    if (securityMode === 'home' && lockStatus === 'unlocked') {
      return {
        status: 'optimal',
        details: 'Home mode active. Security monitoring normal.'
      };
    }

    return {
      status: 'warning',
      details: `Security mode: ${securityMode}, Lock status: ${lockStatus}`
    };
  }

  private static evaluateLegacySafetySystemStatus(safetySystem: any): { status: 'optimal' | 'warning' | 'error'; details: string } {
    if (safetySystem.status === 'triggered' || safetySystem.flame_status === 'detected') {
      return {
        status: 'error',
        details: 'Emergency condition detected! Please check immediately.'
      };
    }

    if (safetySystem.smoke_percentage && safetySystem.smoke_percentage > 50) {
      return {
        status: 'warning',
        details: `Elevated smoke levels: ${safetySystem.smoke_percentage}%`
      };
    }

    return {
      status: 'optimal',
      details: 'All safety parameters normal. System monitoring active.'
    };
  }

  static async playSystemsCheckAudio(): Promise<void> {
    try {
      const userSettings = await UserSettings.list();
      if (userSettings.length === 0 || !userSettings[0].ander_enabled || !userSettings[0].voice_response_enabled) {
        return;
      }

      // Dispatch event for Ander AI to play systems check audio
      window.dispatchEvent(new CustomEvent('playSystemsCheckAudio'));
    } catch (error) {
      console.error('Error playing systems check audio:', error);
    }
  }
}