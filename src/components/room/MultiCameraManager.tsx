import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Video, 
  Plus, 
  Eye, 
  Settings, 
  Wifi, 
  WifiOff,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { UnifiedDeviceStateService } from "@/services/UnifiedDeviceStateService";
import CameraViewModal from "./CameraViewModal";
import CameraSetupGuide from "./CameraSetupGuide";
import { CameraConfiguration } from "@/entities/CameraConfiguration";

interface MultiCameraManagerProps {
  roomId: string;
  roomName: string;
  applianceId: string;
}

export default function MultiCameraManager({ 
  roomId, 
  roomName, 
  applianceId 
}: MultiCameraManagerProps) {
  const [cameras, setCameras] = useState<CameraConfiguration[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<CameraConfiguration | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load camera configurations
  useEffect(() => {
    loadCameras();
  }, [applianceId]);

  const loadCameras = async () => {
    try {
      setIsLoading(true);
      // For this demo, we'll simulate multiple camera configs
      // In a real implementation, this would fetch all camera configs for the appliance
      const config = await UnifiedDeviceStateService.getCameraConfiguration(applianceId);
      
      if (config) {
        // Create simulated multi-camera setup based on the main configuration
        const baseCameras: CameraConfiguration[] = [
          {
            ...config,
            id: `${config.id}-1`,
            camera_name: `${roomName} - Camera 1`,
            camera_port: config.camera_port || 8080
          },
          {
            ...config,
            id: `${config.id}-2`,
            camera_name: `${roomName} - Camera 2`,
            camera_port: 8081,
            status: 'disconnected' as const
          },
          {
            ...config,
            id: `${config.id}-3`,
            camera_name: `${roomName} - Camera 3`,
            camera_port: 8082,
            status: 'disconnected' as const
          }
        ];
        setCameras(baseCameras);
      } else {
        // Create default camera configs for demo
        const defaultCameras: CameraConfiguration[] = [
          {
            id: `${applianceId}-1`,
            user_id: '',
            room_id: roomId,
            appliance_id: applianceId,
            camera_name: `${roomName} - Camera 1`,
            camera_ip: '',
            camera_port: 8080,
            camera_path: '/video',
            status: 'disconnected',
            retry_count: 0,
            connection_quality: 'unknown',
            camera_capabilities: {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: `${applianceId}-2`,
            user_id: '',
            room_id: roomId,
            appliance_id: applianceId,
            camera_name: `${roomName} - Camera 2`,
            camera_ip: '',
            camera_port: 8081,
            camera_path: '/video',
            status: 'disconnected',
            retry_count: 0,
            connection_quality: 'unknown',
            camera_capabilities: {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: `${applianceId}-3`,
            user_id: '',
            room_id: roomId,
            appliance_id: applianceId,
            camera_name: `${roomName} - Camera 3`,
            camera_ip: '',
            camera_port: 8082,
            camera_path: '/video',
            status: 'disconnected',
            retry_count: 0,
            connection_quality: 'unknown',
            camera_capabilities: {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
        setCameras(defaultCameras);
      }
    } catch (error) {
      console.error('Failed to load camera configurations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCameraConnect = (camera: CameraConfiguration) => {
    setSelectedCamera(camera);
    setIsViewModalOpen(true);
  };

  const handleCameraUpdate = async (ip: string, port?: number) => {
    if (!selectedCamera) return;

    try {
      // Update the camera configuration
      await UnifiedDeviceStateService.updateDeviceState({
        deviceType: 'camera',
        deviceId: selectedCamera.appliance_id,
        state: {
          camera_ip: ip,
          camera_port: port || selectedCamera.camera_port
        },
        metadata: { roomId }
      });

      // Update local state
      setCameras(prev => 
        prev.map(cam => 
          cam.id === selectedCamera.id 
            ? { ...cam, camera_ip: ip, camera_port: port || cam.camera_port, status: 'connected' as const }
            : cam
        )
      );
    } catch (error) {
      console.error('Failed to update camera:', error);
      throw error;
    }
  };

  const getStatusIcon = (status: CameraConfiguration['status']) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'discovering':
        return <Wifi className="w-4 h-4 text-blue-600 animate-pulse" />;
      default:
        return <WifiOff className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: CameraConfiguration['status']) => {
    const variants = {
      connected: 'bg-green-100 text-green-800',
      error: 'bg-red-100 text-red-800',
      discovering: 'bg-blue-100 text-blue-800',
      disconnected: 'bg-gray-100 text-gray-600'
    };

    return (
      <Badge className={variants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Video className="w-5 h-5" />
            Camera System - {roomName}
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage multiple camera views with port-based configuration
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => setIsGuideOpen(true)}
          className="flex items-center gap-2"
        >
          <Settings className="w-4 h-4" />
          Setup Guide
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cameras.map((camera) => (
            <Card key={camera.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{camera.camera_name}</CardTitle>
                  {getStatusIcon(camera.status)}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Port {camera.camera_port}</Badge>
                  {getStatusBadge(camera.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {camera.camera_ip ? (
                    <div className="text-sm text-muted-foreground">
                      <p>IP: {camera.camera_ip}:{camera.camera_port}</p>
                      <p>Quality: {camera.connection_quality}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Not configured
                    </p>
                  )}
                  
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleCameraConnect(camera)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      {camera.status === 'connected' ? 'View' : 'Connect'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Camera View Modal */}
      {selectedCamera && (
        <CameraViewModal
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false);
            setSelectedCamera(null);
          }}
          cameraName={selectedCamera.camera_name}
          applianceId={selectedCamera.appliance_id}
          roomId={roomId}
          savedIp={selectedCamera.camera_ip}
          savedPort={selectedCamera.camera_port}
          onIpSave={handleCameraUpdate}
        />
      )}

      {/* Setup Guide Modal */}
      {isGuideOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="bg-white rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">3-Camera Setup Guide</h3>
                <Button variant="ghost" onClick={() => setIsGuideOpen(false)}>
                  ×
                </Button>
              </div>
              <CameraSetupGuide totalCameras={3} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}