-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_settings table
CREATE TABLE public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  setup_completed BOOLEAN DEFAULT false,
  building_type TEXT DEFAULT 'home' CHECK (building_type IN ('home', 'school', 'office', 'hospital', 'other')),
  building_name TEXT,
  total_rooms INTEGER DEFAULT 0,
  total_domes INTEGER DEFAULT 0,
  energy_mode TEXT DEFAULT 'auto_switch' CHECK (energy_mode IN ('solar_only', 'grid_only', 'auto_switch')),
  notifications_enabled BOOLEAN DEFAULT true,
  voice_response_enabled BOOLEAN DEFAULT true,
  ander_enabled BOOLEAN DEFAULT true,
  preferred_email TEXT,
  preferred_email_enabled BOOLEAN DEFAULT true,
  preferred_whatsapp TEXT,
  preferred_whatsapp_enabled BOOLEAN DEFAULT true,
  emergency_contacts JSONB DEFAULT '[]',
  contact_phone TEXT,
  address TEXT,
  security_settings JSONB DEFAULT '{"auto_shutdown_enabled": false, "shutdown_exceptions": []}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create rooms table
CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  appliances JSONB DEFAULT '[]',
  dome_count INTEGER DEFAULT 0,
  occupancy_status BOOLEAN DEFAULT false,
  pir_sensor_id TEXT,
  automation_settings JSONB DEFAULT '{"auto_mode": false, "temperature_threshold_high": 28, "temperature_threshold_low": 20, "schedule": {}}',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create energy_systems table
CREATE TABLE public.energy_systems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  energy_source TEXT DEFAULT 'mixed' CHECK (energy_source IN ('solar', 'grid', 'mixed')),
  solar_percentage NUMERIC(5,2) DEFAULT 0 CHECK (solar_percentage >= 0 AND solar_percentage <= 100),
  grid_percentage NUMERIC(5,2) DEFAULT 100 CHECK (grid_percentage >= 0 AND grid_percentage <= 100),
  battery_level NUMERIC(5,2) DEFAULT 50 CHECK (battery_level >= 0 AND battery_level <= 100),
  current_usage NUMERIC(10,3) DEFAULT 0,
  daily_usage NUMERIC(10,3) DEFAULT 0,
  cost_savings NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create safety_systems table
CREATE TABLE public.safety_systems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  system_id TEXT NOT NULL,
  system_type TEXT NOT NULL CHECK (system_type IN ('fire_detection', 'window_rain', 'gas_leak', 'water_overflow')),
  room_name TEXT NOT NULL,
  status TEXT DEFAULT 'safe' CHECK (status IN ('safe', 'alert', 'active', 'suppression_active')),
  sensor_readings JSONB DEFAULT '{"flame_detected": false, "smoke_level": 0, "temperature": 25, "rain_detected": false, "window_status": "closed", "gas_level": 0, "water_level": 0}',
  last_triggered TIMESTAMP WITH TIME ZONE,
  automation_settings JSONB DEFAULT '{"auto_response_enabled": true, "notification_level": "all", "trigger_threshold": 75}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.energy_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_systems ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for user_settings
CREATE POLICY "Users can view own settings" ON public.user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON public.user_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON public.user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for rooms
CREATE POLICY "Users can view own rooms" ON public.rooms FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own rooms" ON public.rooms FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own rooms" ON public.rooms FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own rooms" ON public.rooms FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for energy_systems
CREATE POLICY "Users can view own energy systems" ON public.energy_systems FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own energy systems" ON public.energy_systems FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own energy systems" ON public.energy_systems FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own energy systems" ON public.energy_systems FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for safety_systems
CREATE POLICY "Users can view own safety systems" ON public.safety_systems FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own safety systems" ON public.safety_systems FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own safety systems" ON public.safety_systems FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own safety systems" ON public.safety_systems FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON public.rooms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_energy_systems_updated_at BEFORE UPDATE ON public.energy_systems FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_safety_systems_updated_at BEFORE UPDATE ON public.safety_systems FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_user_settings_user_id ON public.user_settings(user_id);
CREATE INDEX idx_rooms_user_id ON public.rooms(user_id);
CREATE INDEX idx_energy_systems_user_id ON public.energy_systems(user_id);
CREATE INDEX idx_safety_systems_user_id ON public.safety_systems(user_id);
CREATE INDEX idx_rooms_order ON public.rooms(user_id, order_index);