// Device State Logging Service for debugging synchronization issues
class DeviceStateLogger {
  private enabled = true; // Set to false to disable logging in production

  log(context: string, message: string, data?: any) {
    if (!this.enabled) return;
    
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${context}] ${message}`;
    
    if (data) {
      console.log(logMessage, data);
    } else {
      console.log(logMessage);
    }
  }

  logStateChange(context: string, action: string, deviceId: string, oldState: any, newState: any) {
    if (!this.enabled) return;
    
    this.log(context, `State Change - ${action}`, {
      deviceId,
      oldState,
      newState,
      timestamp: Date.now()
    });
  }

  logError(context: string, message: string, error?: any) {
    if (!this.enabled) return;
    
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [${context}] ERROR: ${message}`, error);
  }

  logSync(context: string, roomId: string, applianceCount: number, childDeviceCount: number) {
    if (!this.enabled) return;
    
    this.log(context, `Sync Status`, {
      roomId,
      applianceCount,
      childDeviceCount,
      inSync: applianceCount === childDeviceCount
    });
  }

  logVoiceCommand(actionType: string, transcript: string, result: any) {
    if (!this.enabled) return;
    
    this.log('VOICE_COMMAND', `Action: ${actionType}`, {
      transcript,
      result,
      timestamp: Date.now()
    });
  }

  logDeviceUpdate(context: string, deviceId: string, updates: any, backend: boolean = false) {
    if (!this.enabled) return;
    
    this.log(context, `Device Update ${backend ? '(Backend)' : '(Frontend)'}`, {
      deviceId,
      updates,
      backend,
      timestamp: Date.now()
    });
  }
}

export const deviceStateLogger = new DeviceStateLogger();