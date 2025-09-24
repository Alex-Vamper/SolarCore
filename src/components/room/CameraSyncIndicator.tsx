import { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Camera, Loader2 } from 'lucide-react';
import { useCameraSync } from '@/hooks/useCameraSync';
import { deviceStateLogger } from '@/lib/deviceStateLogger';
import { cameraSyncManager } from '@/lib/cameraSyncManager';

interface CameraSyncIndicatorProps {
  roomId: string;
  className?: string;
}

export default function CameraSyncIndicator({ roomId, className = '' }: CameraSyncIndicatorProps) {
  const [syncStatus, setSyncStatus] = useState<'connected' | 'disconnected' | 'syncing'>('disconnected');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const { issyncing } = useCameraSync(roomId);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    // Listen for camera IP updates (simplified, non-triggering events)
    const handleCameraIpUpdate = (event: CustomEvent) => {
      if (!mountedRef.current || event.detail.roomId !== roomId) return;
      
      const { cameraIp, source } = event.detail;
      
      if (cameraIp) {
        setSyncStatus('connected');
        setLastSyncTime(new Date());
        
        deviceStateLogger.log('CAMERA_SYNC_INDICATOR', 'Camera IP updated', {
          source,
          cameraIp,
          timestamp: new Date().toISOString()
        });
      }
    };

    window.addEventListener('cameraIpUpdated', handleCameraIpUpdate as EventListener);

    return () => {
      mountedRef.current = false;
      window.removeEventListener('cameraIpUpdated', handleCameraIpUpdate as EventListener);
    };
  }, [roomId]);

  useEffect(() => {
    if (!mountedRef.current) return;

    if (issyncing) {
      setSyncStatus('syncing');
    } else if (cameraSyncManager.isActive(roomId)) {
      setSyncStatus('syncing');
    }
  }, [issyncing, roomId]);

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