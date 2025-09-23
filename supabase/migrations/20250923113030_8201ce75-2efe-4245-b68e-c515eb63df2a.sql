-- Enable realtime for child_devices table to support camera synchronization
ALTER TABLE public.child_devices REPLICA IDENTITY FULL;

-- Add child_devices to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.child_devices;