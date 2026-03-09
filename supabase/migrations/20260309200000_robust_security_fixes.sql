-- Robust Migration: Move PostGIS to extensions schema and harden security

-- 0. Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- 1. Backup location data from public.submissions
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS location_temp text;
UPDATE public.submissions SET location_temp = public.ST_AsText(location);

-- 2. Drop the location column and any depending indexes
DROP INDEX IF EXISTS public.submissions_location_gix;
ALTER TABLE public.submissions DROP COLUMN IF EXISTS location;

-- 3. Drop PostGIS extension
-- This will also drop spatial_ref_sys and other postgis internal objects
DROP EXTENSION IF EXISTS postgis CASCADE;

-- 4. Re-create PostGIS in the extensions schema
CREATE EXTENSION postgis SCHEMA extensions;

-- 5. Restore the location column using the new schema path
ALTER TABLE public.submissions ADD COLUMN location extensions.geography(point, 4326);

-- 6. Re-create the spatial index
CREATE INDEX submissions_location_gix ON public.submissions USING gist(location);

-- 7. Restore the data
UPDATE public.submissions SET location = extensions.ST_GeogFromText(location_temp);

-- 8. Finalize the schema
ALTER TABLE public.submissions ALTER COLUMN location SET NOT NULL;
ALTER TABLE public.submissions DROP COLUMN location_temp;

-- 9. Enable RLS on spatial_ref_sys (Note: Restricted by Supabase permissions)
-- We skip this to allow the other security fixes (like moving the extension) to pass.
-- ALTER TABLE extensions.spatial_ref_sys ENABLE ROW LEVEL SECURITY;

-- 10. Re-verify function search paths and view security
ALTER FUNCTION public.set_updated_at() SET search_path = '';
ALTER FUNCTION public.current_wallet_address() SET search_path = '';
ALTER VIEW public.leaderboard SET (security_invoker = on);
