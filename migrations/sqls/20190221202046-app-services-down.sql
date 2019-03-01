-- APP SERVICES DOWN MIGRATION --
ALTER TABLE public.permissions
DROP COLUMN IF EXISTS function_id,
DROP COLUMN IF EXISTS display_name;

DROP TABLE IF EXISTS public.app_service_type_permissions;
DROP TABLE IF EXISTS public.app_service_type_names;
DROP TABLE IF EXISTS public.app_service_types;
DROP TABLE IF EXISTS public.service_type_permissions;
DROP TABLE IF EXISTS public.service_types;