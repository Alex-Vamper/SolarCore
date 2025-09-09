-- Create RPC to get device types (accessible to authenticated users)
CREATE OR REPLACE FUNCTION public.get_device_types()
RETURNS SETOF admin.device_types
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT * FROM admin.device_types
  ORDER BY device_class, device_series;
$$;