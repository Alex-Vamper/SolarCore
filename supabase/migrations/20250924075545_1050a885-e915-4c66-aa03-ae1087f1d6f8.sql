-- Create dedicated table for camera configurations
CREATE TABLE public.camera_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  room_id UUID NOT NULL,
  appliance_id UUID NOT NULL,
  camera_name TEXT NOT NULL,
  camera_ip TEXT NOT NULL,
  camera_port INTEGER DEFAULT 8080,
  camera_path TEXT DEFAULT '/video',
  status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error', 'discovering')),
  last_connected_at TIMESTAMP WITH TIME ZONE,
  last_error TEXT,
  retry_count INTEGER DEFAULT 0,
  connection_quality TEXT DEFAULT 'unknown' CHECK (connection_quality IN ('excellent', 'good', 'poor', 'unknown')),
  camera_capabilities JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, room_id, appliance_id)
);

-- Enable RLS
ALTER TABLE public.camera_configurations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own camera configurations" 
ON public.camera_configurations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own camera configurations" 
ON public.camera_configurations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own camera configurations" 
ON public.camera_configurations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own camera configurations" 
ON public.camera_configurations 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_camera_configurations_user_id ON public.camera_configurations(user_id);
CREATE INDEX idx_camera_configurations_room_id ON public.camera_configurations(room_id);
CREATE INDEX idx_camera_configurations_status ON public.camera_configurations(status);

-- Create function to update timestamps
CREATE TRIGGER update_camera_configurations_updated_at
BEFORE UPDATE ON public.camera_configurations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create device state management table
CREATE TABLE public.device_state_sync (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  device_type TEXT NOT NULL,
  device_id TEXT NOT NULL,
  last_sync_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  sync_status TEXT NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'success', 'error')),
  error_count INTEGER DEFAULT 0,
  last_error TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, device_type, device_id)
);

-- Enable RLS for device state sync
ALTER TABLE public.device_state_sync ENABLE ROW LEVEL SECURITY;

-- Create policies for device state sync
CREATE POLICY "Users can manage their own device sync states" 
ON public.device_state_sync 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_device_state_sync_user_id ON public.device_state_sync(user_id);
CREATE INDEX idx_device_state_sync_device_type ON public.device_state_sync(device_type);
CREATE INDEX idx_device_state_sync_status ON public.device_state_sync(sync_status);

-- Add trigger
CREATE TRIGGER update_device_state_sync_updated_at
BEFORE UPDATE ON public.device_state_sync
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();