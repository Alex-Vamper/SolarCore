export interface CameraConfiguration {
  id: string;
  user_id: string;
  room_id: string;
  appliance_id: string;
  camera_name: string;
  camera_ip: string;
  camera_port: number;
  camera_path: string;
  status: 'connected' | 'disconnected' | 'error' | 'discovering';
  last_connected_at?: string;
  last_error?: string;
  retry_count: number;
  connection_quality: 'excellent' | 'good' | 'poor' | 'unknown';
  camera_capabilities: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface DeviceStateSyncEntry {
  id: string;
  user_id: string;
  device_type: string;
  device_id: string;
  last_sync_at: string;
  sync_status: 'pending' | 'syncing' | 'success' | 'error';
  error_count: number;
  last_error?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}