-- Enable realtime for user_tracker_settings table
ALTER TABLE public.user_tracker_settings REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_tracker_settings;