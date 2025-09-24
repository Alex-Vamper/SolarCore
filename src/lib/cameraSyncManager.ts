// Global Camera Sync Manager - Prevents infinite loops and manages camera state
import { deviceStateLogger } from './deviceStateLogger';

interface SyncState {
  isActive: boolean;
  lastSync: number;
  syncCount: number;
  roomId: string;
}

class CameraSyncManager {
  private syncStates = new Map<string, SyncState>();
  private readonly SYNC_COOLDOWN = 5000; // 5 seconds between syncs
  private readonly MAX_SYNC_COUNT = 3; // Max 3 syncs per minute
  private readonly RESET_INTERVAL = 60000; // Reset count every minute

  constructor() {
    // Reset sync counts periodically
    setInterval(() => {
      this.syncStates.forEach((state, roomId) => {
        state.syncCount = 0;
      });
    }, this.RESET_INTERVAL);
  }

  canSync(roomId: string): boolean {
    const now = Date.now();
    const state = this.syncStates.get(roomId);

    if (!state) {
      this.syncStates.set(roomId, {
        isActive: false,
        lastSync: 0,
        syncCount: 0,
        roomId
      });
      return true;
    }

    // Check if sync is already active
    if (state.isActive) {
      deviceStateLogger.log('CAMERA_SYNC_MANAGER', 'Sync already active for room', { roomId });
      return false;
    }

    // Check cooldown period
    if (now - state.lastSync < this.SYNC_COOLDOWN) {
      deviceStateLogger.log('CAMERA_SYNC_MANAGER', 'Sync in cooldown period', { 
        roomId, 
        remainingMs: this.SYNC_COOLDOWN - (now - state.lastSync) 
      });
      return false;
    }

    // Check max sync count
    if (state.syncCount >= this.MAX_SYNC_COUNT) {
      deviceStateLogger.log('CAMERA_SYNC_MANAGER', 'Max sync count reached', { roomId, count: state.syncCount });
      return false;
    }

    return true;
  }

  startSync(roomId: string): boolean {
    if (!this.canSync(roomId)) {
      return false;
    }

    const state = this.syncStates.get(roomId)!;
    state.isActive = true;
    state.lastSync = Date.now();
    state.syncCount++;

    deviceStateLogger.log('CAMERA_SYNC_MANAGER', 'Sync started', { roomId, count: state.syncCount });
    return true;
  }

  endSync(roomId: string): void {
    const state = this.syncStates.get(roomId);
    if (state) {
      state.isActive = false;
      deviceStateLogger.log('CAMERA_SYNC_MANAGER', 'Sync ended', { roomId });
    }
  }

  isActive(roomId: string): boolean {
    const state = this.syncStates.get(roomId);
    return state?.isActive || false;
  }

  reset(roomId: string): void {
    this.syncStates.delete(roomId);
    deviceStateLogger.log('CAMERA_SYNC_MANAGER', 'Sync state reset', { roomId });
  }

  resetAll(): void {
    this.syncStates.clear();
    deviceStateLogger.log('CAMERA_SYNC_MANAGER', 'All sync states reset');
  }
}

export const cameraSyncManager = new CameraSyncManager();