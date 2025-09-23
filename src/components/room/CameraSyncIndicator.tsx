import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Camera, Loader2 } from 'lucide-react';
import { useCameraSync } from '@/hooks/useCameraSync';
import { deviceStateLogger } from '@/lib/deviceStateLogger';

interface CameraSyncIndicatorProps {
  roomId: string;
  className?: string;
}

export default function CameraSyncIndicator({ roomId, className = '' }: CameraSyncIndicatorProps) {
  const [syncStatus, setSyncStatus] = useState<'connected' | 'disconnected' | 'syncing'>('disconnected');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const { issyncing } = useCameraSync(roomId);

  useEffect(() => {
    // Listen for camera state change events
    const handleCameraStateChange = (event: CustomEvent) => {
      const { success, source } = event.detail;
      
      if (success) {
        setSyncStatus('connected');
        setLastSyncTime(new Date());
        
        deviceStateLogger.log('CAMERA_SYNC_INDICATOR', 'Camera state synced', {
          source,
          timestamp: new Date().toISOString()
        });
      } else {
        setSyncStatus('disconnected');
      }
    };

    // Listen for room updates
    const handleRoomUpdate = (event: CustomEvent) => {
      if (event.detail.source === 'camera_sync') {
        setSyncStatus('connected');
        setLastSyncTime(new Date());
      }
    };

    window.addEventListener('cameraStateChanged', handleCameraStateChange as EventListener);
    window.addEventListener('roomUpdated', handleRoomUpdate as EventListener);

    return () => {
      window.removeEventListener('cameraStateChanged', handleCameraStateChange as EventListener);
      window.removeEventListener('roomUpdated', handleRoomUpdate as EventListener);
    };
  }, []);

  useEffect(() => {
    if (issyncing) {
      setSyncStatus('syncing');
      
      // Timeout to prevent stuck syncing state
      const timeout = setTimeout(() => {
        if (issyncing) {
          deviceStateLogger.log('CAMERA_SYNC_INDICATOR', 'Sync timeout - resetting status');
          setSyncStatus('disconnected');
        }
      }, 10000); // 10 second timeout

      return () => clearTimeout(timeout);
    }
  }, [issyncing]);

  const getSyncStatusBadge = () => {
    switch (syncStatus) {
      case 'connected':
        return (
          <Badge variant="secondary" className={`bg-green-100 text-green-700 hover:bg-green-200 ${className}`}>
            <Wifi className="w-3 h-3 mr-1" />
            Camera Sync: Connected
          </Badge>
        );
      case 'syncing':
        return (
          <Badge variant="secondary" className={`bg-blue-100 text-blue-700 hover:bg-blue-200 ${className}`}>
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Camera Sync: Syncing...
          </Badge>
        );
      case 'disconnected':
      default:
        return (
          <Badge variant="outline" className={`border-gray-300 text-gray-600 hover:bg-gray-50 ${className}`}>
            <WifiOff className="w-3 h-3 mr-1" />
            Camera Sync: Offline
          </Badge>
        );
    }
  };

  const getLastSyncText = () => {
    if (!lastSyncTime) return null;
    
    const timeDiff = Date.now() - lastSyncTime.getTime();
    const seconds = Math.floor(timeDiff / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (seconds < 60) {
      return `Last sync: ${seconds}s ago`;
    } else if (minutes < 60) {
      return `Last sync: ${minutes}m ago`;
    } else {
      return `Last sync: ${lastSyncTime.toLocaleTimeString()}`;
    }
  };

  return (
    <div className="flex flex-col gap-1">
      {getSyncStatusBadge()}
      {lastSyncTime && (
        <div className="text-xs text-muted-foreground pl-1">
          {getLastSyncText()}
        </div>
      )}
    </div>
  );
}