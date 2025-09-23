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
    
    console.log('Attempting to connect to camera:', baseUrl);
    
    // Set up the stream URL and save IP
    setStreamUrl(baseUrl + '/video');
    setUseIframe(false);
    setIsStreamActive(true);
    onIpSave(ipAddress);
    setIsConnecting(false);
    
    // Show initial connection message
    setConnectionError('Loading stream... If nothing appears, browser security may be blocking HTTP content. Try opening the IP in a new tab first.');
  };

  const handleImageError = (error: any) => {
    console.error('Camera stream failed to load:', error);
    setConnectionError(`Stream failed to load. This is likely due to browser security blocking HTTP content on HTTPS sites. Try opening http://${ipAddress}${!ipAddress.includes(':') ? ':8080' : ''}/video in a new browser tab first.`);
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
                    Stream URL: {ipAddress}{!ipAddress.includes(':') ? ':8080' : ''}/video
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(`http://${ipAddress}${!ipAddress.includes(':') ? ':8080' : ''}/video`, '_blank')}
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
                      Change IP
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