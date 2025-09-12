-- Create user_notification_reads table to track which notifications each user has read
CREATE TABLE public.user_notification_reads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  notification_id uuid NOT NULL,
  read_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, notification_id)
);

-- Enable RLS
ALTER TABLE public.user_notification_reads ENABLE ROW LEVEL SECURITY;

-- Create policies for user_notification_reads
CREATE POLICY "Users can view their own notification reads" 
ON public.user_notification_reads 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notification reads" 
ON public.user_notification_reads 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification reads" 
ON public.user_notification_reads 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_user_notification_reads_updated_at
  BEFORE UPDATE ON public.user_notification_reads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();