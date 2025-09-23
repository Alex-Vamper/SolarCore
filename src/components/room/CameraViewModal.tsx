import { useState } from "react";
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

interface CameraViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  cameraName: string;
  savedIp?: string;
  onIpSave: (ip: string) => void;
}

export default function CameraViewModal({ 
  isOpen, 
  onClose, 
  cameraName, 
  savedIp = '',
  onIpSave 
}: CameraViewModalProps) {
  const [ipAddress, setIpAddress] = useState(savedIp);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [streamUrl, setStreamUrl] = useState('');
  const [useIframe, setUseIframe] = useState(false);

  const validateIpFormat = (input: string) => {
    // Remove port if present for IP validation
    const ipOnly = input.includes(':') ? input.split(':')[0] : input;
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    return ipRegex.test(ipOnly) && ipOnly.split('.').every(octet => parseInt(octet) <= 255);
  };

  const handleConnect = async () => {
    if (!ipAddress.trim()) {
      setConnectionError('Please enter an IP address');
      return;
    }

    if (!validateIpFormat(ipAddress)) {
      setConnectionError('Please enter a valid IP address (e.g., 192.168.1.100 or 192.168.1.100:8080)');
      return;
    }

    setIsConnecting(true);
    setConnectionError('');
    
    // Handle IP with or without port
    const hasPort = ipAddress.includes(':');
    const baseUrl = hasPort ? `http://${ipAddress}` : `http://${ipAddress}:8080`;
    
    // Try multiple endpoints in order of preference
    const endpoints = ['/video', '/videofeed', '/video?submenu=mjpg'];
    
    let connected = false;
    for (const endpoint of endpoints) {
      const url = baseUrl + endpoint;
      try {
        // Try direct access first
        setStreamUrl(url);
        setUseIframe(false);
        connected = true;
        break;
      } catch (error) {
        console.log(`Failed to connect to ${url}:`, error);
      }
    }
    
    if (connected) {
      setIsStreamActive(true);
      onIpSave(ipAddress);
      setConnectionError('');
    } else {
      // Fallback to iframe method
      setStreamUrl(baseUrl + '/video');
      setUseIframe(true);
      setIsStreamActive(true);
      onIpSave(ipAddress);
      setConnectionError('Stream loaded via iframe. If no video appears, ensure IP Webcam is running and accessible.');
    }
    
    setIsConnecting(false);
  };

  const handleImageError = () => {
    setConnectionError('Stream failed to load. Check camera connection.');
    setIsStreamActive(false);
  };

  const handleClose = () => {
    setIsStreamActive(false);
    setStreamUrl('');
    setConnectionError('');
    onClose();
  };

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
                <div className="space-y-2">
                  <Label htmlFor="ip-address">Camera IP Address</Label>
                  <div className="flex gap-2">
                    <Input
                      id="ip-address"
                      placeholder="192.168.1.100 or 192.168.1.100:8080"
                      value={ipAddress}
                      onChange={(e) => setIpAddress(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                    />
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
                </div>

                {connectionError && (
                  <Alert className="border-destructive">
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription>{connectionError}</AlertDescription>
                  </Alert>
                )}

                <div className="text-sm text-muted-foreground space-y-2">
                  <p><strong>Setup Instructions:</strong></p>
                  <ol className="list-decimal list-inside space-y-1 pl-4">
                    <li>Install "IP Webcam" app on your phone</li>
                    <li>Open the app and tap "Start server"</li>
                    <li>Note the IP address shown (e.g., 192.168.1.100:8080)</li>
                    <li>Ensure your phone and computer are on the same Wi-Fi network</li>
                    <li>Enter that IP address above and click Connect</li>
                  </ol>
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
                    <p className="text-amber-800 text-xs">
                      <strong>Note:</strong> Due to browser security, the stream may load in a frame. 
                      If you see a black screen, try accessing the IP directly in a new browser tab first.
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
                    Connected to: {ipAddress}{!ipAddress.includes(':') ? ':8080' : ''}
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsStreamActive(false);
                      setStreamUrl('');
                    }}
                  >
                    Change IP
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}