import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Wifi, Video, Settings } from "lucide-react";

interface CameraSetupGuideProps {
  totalCameras?: number;
}

export default function CameraSetupGuide({ totalCameras = 3 }: CameraSetupGuideProps) {
  const cameraConfigs = Array.from({ length: totalCameras }, (_, i) => ({
    id: i + 1,
    port: 8080 + i,
    room: `Camera ${i + 1}`,
    color: i === 0 ? 'bg-blue-100 text-blue-800' : i === 1 ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
  }));

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Video className="w-5 h-5" />
          Multi-Camera Setup Guide
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure {totalCameras} cameras using different ports on the same network
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Step 1: App Installation */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center font-bold">1</div>
            <h3 className="font-semibold">Install IP Webcam App</h3>
          </div>
          <div className="pl-8 space-y-2">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-gray-500" />
              <span className="text-sm">Install "IP Webcam" app on each phone/device</span>
            </div>
          </div>
        </div>

        {/* Step 2: Port Configuration */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center font-bold">2</div>
            <h3 className="font-semibold">Configure Different Ports</h3>
          </div>
          <div className="pl-8 space-y-3">
            <p className="text-sm text-gray-600">
              Set each camera to use a unique port to avoid conflicts:
            </p>
            <div className="grid gap-2">
              {cameraConfigs.map((camera) => (
                <div key={camera.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">{camera.room}</span>
                  <Badge className={camera.color}>
                    Port {camera.port}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Step 3: Network Setup */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center font-bold">3</div>
            <h3 className="font-semibold">Network Configuration</h3>
          </div>
          <div className="pl-8 space-y-2">
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4 text-gray-500" />
              <span className="text-sm">Ensure all devices are on the same Wi-Fi network</span>
            </div>
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-gray-500" />
              <span className="text-sm">Start the server on each device</span>
            </div>
          </div>
        </div>

        {/* Example Configuration */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">Example Configuration</h4>
          <div className="space-y-1 text-sm">
            <p><strong>IP Address:</strong> 192.168.1.100 (same for all cameras)</p>
            <p><strong>Camera 1:</strong> Port 8080</p>
            <p><strong>Camera 2:</strong> Port 8081</p>
            <p><strong>Camera 3:</strong> Port 8082</p>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-800 mb-2">💡 Pro Tips</h4>
          <ul className="space-y-1 text-sm text-yellow-700">
            <li>• Keep devices plugged in to maintain stable connections</li>
            <li>• Use phone stands or mounts for better camera positioning</li>
            <li>• Test each camera individually before setting up all three</li>
            <li>• Ensure good Wi-Fi signal strength in all camera locations</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}