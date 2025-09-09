-- Update the safety_systems table to support more complex state data
ALTER TABLE public.safety_systems
ADD COLUMN IF NOT EXISTS flame_status text DEFAULT 'clear',
ADD COLUMN IF NOT EXISTS temperature_value numeric DEFAULT 25,
ADD COLUMN IF NOT EXISTS smoke_percentage numeric DEFAULT 0;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_safety_systems_flame_status ON public.safety_systems(flame_status);
CREATE INDEX IF NOT EXISTS idx_safety_systems_user_id ON public.safety_systems(user_id);