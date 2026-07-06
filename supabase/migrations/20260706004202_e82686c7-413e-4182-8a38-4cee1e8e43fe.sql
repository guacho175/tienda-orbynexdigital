-- Revoke public/anon/authenticated EXECUTE on the SECURITY DEFINER helper so
-- clients cannot call it through PostgREST. RLS policies keep working because
-- they run under the table owner's rights during policy evaluation.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM authenticated;
-- Keep service_role able to call it for admin/maintenance paths.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;