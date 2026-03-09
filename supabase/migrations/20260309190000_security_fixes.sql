-- Create extensions schema if it doesn't already exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move pgcrypto to the dedicated extensions schema
-- pgcrypto is safe to move and satisfies the "Extension in Public" warning.
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto') THEN
    ALTER EXTENSION pgcrypto SET SCHEMA extensions;
  END IF;
END $$;

-- Note: postgis extension often does not support SET SCHEMA.
-- We will leave it in its current schema to avoid errors, 
-- but we will still harden the tables it creates.

-- Secure functions by setting search_path to empty string
-- This prevents search path hijacking vulnerabilities.
ALTER FUNCTION public.set_updated_at() SET search_path = '';
ALTER FUNCTION public.current_wallet_address() SET search_path = '';

-- Update the leaderboard view to be SECURITY INVOKER
-- This ensures Row Level Security (RLS) is enforced for users querying the view.
-- Note: VIEW options require Postgres 15+ (which Supabase uses)
ALTER VIEW public.leaderboard SET (security_invoker = on);

-- Note: Enable Row Level Security on spatial_ref_sys is restricted by Supabase permissions.
-- We skip this to allow the other critical security fixes to pass.
