import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Maximize2, 
  Minimize2, 
  AlertCircle, 
  Play,
  Loader2,
  Wifi,
  WifiOff
} from "lucide-react";
import { UnifiedDeviceStateService } from "@/services/UnifiedDeviceStateService";
import { supabase } from "@/integrations/supabase/client";

interface CameraViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  cameraName: string;
  applianceId: string;
  roomId: string;
  savedIp?: string;
  savedPort?: number;
  onIpSave: (ip: string, port?: number) => void;
}

export default function CameraViewModal({ 
  isOpen, 
  onClose, 
  cameraName, 
  applianceId,
  roomId,
  savedIp = '',
  savedPort = 8080,
  onIpSave 
}: CameraViewModalProps) {
  const [ipAddress, setIpAddress] = useState(savedIp);
  const [port, setPort] = useState(savedPort);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [streamUrl, setStreamUrl] = useState('');
  const [useIframe, setUseIframe] = useState(false);

  const validateIpFormat = (input: string) => {
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    return ipRegex.test(input) && input.split('.').every(octet => parseInt(octet) <= 255);
  };

  const validatePort = (portNum: number) => {
    return portNum >= 1024 && portNum <= 65535;
  };

  const handleConnect = async () => {
    if (!ipAddress.trim()) {
      setConnectionError('Please enter an IP address');
      return;
    }

    if (!validateIpFormat(ipAddress)) {
      setConnectionError('Please enter a valid IP address (e.g., 192.168.1.100)');
      return;
    }

    if (!validatePort(port)) {
      setConnectionError('Please enter a valid port between 1024 and 65535');
      return;
    }

    setIsConnecting(true);
    setConnectionError('');
    
    try {
      // Use the unified device state service for camera connection
      const result = await UnifiedDeviceStateService.updateDeviceState({
        deviceType: 'camera',
        deviceId: applianceId,
        state: {
          camera_ip: ipAddress,
          camera_port: port,
          camera_path: '/video'
        },
        metadata: { roomId }
      });

      if (!result.success) {
        throw new Error(result.error || 'Connection failed');
      }

      // Get the camera proxy URL
      const { data, error } = await supabase.functions.invoke('camera-proxy', {
        body: { cameraIp: ipAddress, port, path: '/video' }
      });

      if (error) {
        throw new Error(error.message);
      }

      // If we get here, the connection is successful
      setStreamUrl(data.proxyUrl);
      setUseIframe(false);
      setIsStreamActive(true);
      onIpSave(ipAddress, port);
      setConnectionError('');
      
    } catch (error) {
      console.error('Error in handleConnect:', error);
      setConnectionError(`Failed to connect: ${error.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleImageError = (error: any) => {
    console.error('Camera stream failed to load:', error);
    try {
      const fullUrl = `http://${ipAddress || 'IP_ADDRESS'}:${port}/video`;
      setConnectionError(`Stream failed to load. This is likely due to browser security blocking HTTP content on HTTPS sites. Try opening ${fullUrl} in a new browser tab first.`);
    } catch (err) {
      console.error('Error in handleImageError:', err);
      setConnectionError('Stream failed to load. Browser security may be blocking HTTP content. Try opening the camera IP in a new browser tab first.');
    }
  };

  const handleClose = () => {
    setIsStreamActive(false);
    setStreamUrl('');
    setConnectionError('');
    onClose();
  };

  // Load camera configuration when modal opens
  useEffect(() => {
    if (isOpen && applianceId) {
      const loadCameraConfig = async () => {
        try {
          const config = await UnifiedDeviceStateService.getCameraConfiguration(applianceId);
          if (config && config.camera_ip) {
            setIpAddress(config.camera_ip);
            setPort(config.camera_port || 8080);
            
            if (config.status === 'connected') {
              // Auto-connect if already configured and connected
              handleConnect();
            }
          } else if (savedIp) {
            setIpAddress(savedIp);
            setPort(savedPort);
          }
        } catch (error) {
          console.error('Failed to load camera configuration:', error);
          if (savedIp) {
            setIpAddress(savedIp);
            setPort(savedPort);
          }
        }
      };
      loadCameraConfig();
    }
  }, [isOpen, applianceId, savedIp, savedPort]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={`${isFullscreen ? 'max-w-none w-screen h-screen' : 'max-w-4xl'} p-0`}>
        <div className="flex flex-col h-full">
          <DialogHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle className="font-inter">
                {cameraName} - Live Stream
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 p-6">
            {!isStreamActive ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ip-address">Camera IP Address</Label>
                    <Input
                      id="ip-address"
                      placeholder="192.168.1.100"
                      value={ipAddress}
                      onChange={(e) => setIpAddress(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="port">Port</Label>
                    <Input
                      id="port"
                      type="number"
                      placeholder="8080"
                      value={port}
                      onChange={(e) => setPort(parseInt(e.target.value) || 8080)}
                      onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                      min="1024"
                      max="65535"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button 
                    onClick={handleConnect}
                    disabled={isConnecting}
                    className="px-6"
                  >
                    {isConnecting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    Connect
                  </Button>
                </div>

                {connectionError && (
                  <Alert className="border-destructive">
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription>{connectionError}</AlertDescription>
                  </Alert>
                )}

                <div className="text-sm text-muted-foreground space-y-2">
                  <p><strong>Setup Instructions for Multiple Cameras:</strong></p>
                  <ol className="list-decimal list-inside space-y-1 pl-4">
                    <li>Install "IP Webcam" app on each phone/camera device</li>
                    <li>Configure each camera with a different port:
                      <ul className="list-disc list-inside ml-4 mt-1 text-xs">
                        <li>Camera 1: Port 8080 (default)</li>
                        <li>Camera 2: Port 8081</li>
                        <li>Camera 3: Port 8082</li>
                      </ul>
                    </li>
                    <li>Start server on each device</li>
                    <li>Note the IP address (same for all devices on same network)</li>
                    <li>Ensure all devices are on the same Wi-Fi network</li>
                    <li>Enter the IP address and unique port for each camera</li>
                  </ol>
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-800 text-xs">
                      <strong>Important:</strong> Browser security blocks HTTP camera streams on HTTPS sites. 
                      If the stream doesn't work, you'll need to open the camera URL in a separate browser tab first to allow it.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative bg-black rounded-lg overflow-hidden" 
                     style={{ aspectRatio: '16/9' }}>
                  {useIframe ? (
                    <iframe
                      src={streamUrl}
                      className="w-full h-full"
                      allow="camera"
                      onLoad={() => setConnectionError('')}
                    />
                  ) : (
                    <img
                      src={streamUrl}
                      alt="Live camera stream"
                      className="w-full h-full object-contain"
                      onError={handleImageError}
                      onLoad={() => setConnectionError('')}
                      crossOrigin="anonymous"
                    />
                  )}
                  
                  <div className="absolute top-4 right-4">
                    <div className="flex items-center gap-2 bg-green-500 text-white px-3 py-1 rounded-full text-sm">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      LIVE
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-green-600" />
                    Camera: {ipAddress}:{port}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(`http://${ipAddress}:${port}/video`, '_blank')}
                    >
                      Open in Tab
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setIsStreamActive(false);
                        setStreamUrl('');
                      }}
                    >
                      Change Settings
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}