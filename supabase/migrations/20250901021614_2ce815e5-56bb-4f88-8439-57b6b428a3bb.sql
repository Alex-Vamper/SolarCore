-- Add solar_system_id and grid_meter_id to user_settings table
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS solar_system_id TEXT,
ADD COLUMN IF NOT EXISTS grid_meter_id TEXT,
ADD COLUMN IF NOT EXISTS power_source TEXT DEFAULT 'grid_only';

-- Create power_systems table for validating system IDs
CREATE TABLE IF NOT EXISTS public.power_systems (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  system_id TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL,
  system_type TEXT NOT NULL, -- 'solar' or 'grid'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on power_systems
ALTER TABLE public.power_systems ENABLE ROW LEVEL SECURITY;

-- Create policy for power_systems (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view power systems" 
ON public.power_systems 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Insert placeholder system IDs for testing
-- SolarCore IDs (SC-SS-xxxx)
INSERT INTO public.power_systems (system_id, provider, system_type) 
SELECT 
  'SC-SS-' || LPAD(generate_series::text, 4, '0'),
  'SolarCore',
  'solar'
FROM generate_series(1, 100);

-- Huawei IDs (HW-SS-xxxx)
INSERT INTO public.power_systems (system_id, provider, system_type) 
SELECT 
  'HW-SS-' || LPAD(generate_series::text, 4, '0'),
  'Huawei',
  'solar'
FROM generate_series(1, 100);

-- Schneider IDs (SD-SS-xxxx)
INSERT INTO public.power_systems (system_id, provider, system_type) 
SELECT 
  'SD-SS-' || LPAD(generate_series::text, 4, '0'),
  'Schneider',
  'solar'
FROM generate_series(1, 100);

-- Victron IDs (VT-SS-xxxx)
INSERT INTO public.power_systems (system_id, provider, system_type) 
SELECT 
  'VT-SS-' || LPAD(generate_series::text, 4, '0'),
  'Victron',
  'solar'
FROM generate_series(1, 100);

-- National Grid IDs (NG-PM-xxxx)
INSERT INTO public.power_systems (system_id, provider, system_type) 
SELECT 
  'NG-PM-' || LPAD(generate_series::text, 4, '0'),
  'National Grid',
  'grid'
FROM generate_series(1, 100);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_power_systems_system_id ON public.power_systems(system_id);

-- Add trigger to update updated_at
CREATE TRIGGER update_power_systems_updated_at
BEFORE UPDATE ON public.power_systems
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();