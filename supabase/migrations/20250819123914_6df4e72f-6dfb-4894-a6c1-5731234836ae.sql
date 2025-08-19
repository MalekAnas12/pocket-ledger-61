-- Fix function search_path security issues
ALTER FUNCTION public.update_updated_at_column() SET search_path = '';

ALTER FUNCTION public.create_user_defaults() SET search_path = '';