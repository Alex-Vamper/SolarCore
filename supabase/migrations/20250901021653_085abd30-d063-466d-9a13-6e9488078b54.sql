-- Enable RLS on launch_splash_seen table
ALTER TABLE public.launch_splash_seen ENABLE ROW LEVEL SECURITY;

-- Create policies for launch_splash_seen
CREATE POLICY "Users can view own splash records" 
ON public.launch_splash_seen 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own splash records" 
ON public.launch_splash_seen 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own splash records" 
ON public.launch_splash_seen 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own splash records" 
ON public.launch_splash_seen 
FOR DELETE 
USING (auth.uid() = user_id);