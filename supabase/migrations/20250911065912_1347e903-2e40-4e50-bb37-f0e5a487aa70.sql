-- Enable RLS on the admin.device_types table
ALTER TABLE admin.device_types ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for device_types (read-only for authenticated users)
CREATE POLICY "Anyone can read device types" 
ON admin.device_types 
FOR SELECT 
USING (true);