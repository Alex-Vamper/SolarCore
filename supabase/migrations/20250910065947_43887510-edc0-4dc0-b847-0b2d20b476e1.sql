-- Create wifi_networks table
CREATE TABLE public.wifi_networks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ssid TEXT NOT NULL,
  password TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.wifi_networks ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own WiFi networks" 
ON public.wifi_networks 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own WiFi networks" 
ON public.wifi_networks 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own WiFi networks" 
ON public.wifi_networks 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own WiFi networks" 
ON public.wifi_networks 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_wifi_networks_updated_at
BEFORE UPDATE ON public.wifi_networks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();