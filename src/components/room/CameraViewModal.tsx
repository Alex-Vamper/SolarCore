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
  Loader2
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

  const validateIpFormat = (ip: string) => {
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    return ipRegex.test(ip) && ip.split('.').every(octet => parseInt(octet) <= 255);
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

    setIsConnecting(true);
    setConnectionError('');
    
    const url = `http://${ipAddress}:8080/video`;
    
    try {
      // Test if the stream is reachable
      const response = await fetch(url, { 
        method: 'HEAD',
        mode: 'no-cors' // Handle CORS for initial check
      });
      
      setStreamUrl(url);
      setIsStreamActive(true);
      onIpSave(ipAddress);
      setConnectionError('');
    } catch (error) {
      setConnectionError('Unable to connect to camera. Check IP address and ensure IP Webcam is running.');
      setIsStreamActive(false);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleVideoError = () => {
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
                      placeholder="192.168.1.100"
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
                    <li>Note the IP address shown (e.g., 192.168.1.100)</li>
                    <li>Enter that IP address above and click Connect</li>
                  </ol>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative bg-black rounded-lg overflow-hidden" 
                     style={{ aspectRatio: '16/9' }}>
                  <video
                    src={streamUrl}
                    autoPlay
                    controls
                    className="w-full h-full object-contain"
                    onError={handleVideoError}
                    onLoadStart={() => setConnectionError('')}
                  >
                    Your browser does not support the video element.
                  </video>
                  
                  <div className="absolute top-4 right-4">
                    <div className="flex items-center gap-2 bg-green-500 text-white px-3 py-1 rounded-full text-sm">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      LIVE
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Connected to: {ipAddress}:8080
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