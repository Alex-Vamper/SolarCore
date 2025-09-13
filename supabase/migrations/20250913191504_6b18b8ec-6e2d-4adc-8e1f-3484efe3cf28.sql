-- Enable real-time updates for admin_launch_control table
ALTER TABLE admin_launch_control REPLICA IDENTITY FULL;

-- Add table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE admin_launch_control;