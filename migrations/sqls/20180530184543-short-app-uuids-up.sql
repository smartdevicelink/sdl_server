-- add a short_uuid column to applications
ALTER TABLE public.app_info
ADD COLUMN IF NOT EXISTS app_short_uuid VARCHAR(10);

-- populate the new short_uuid column for existing applications
UPDATE public.app_info
SET app_short_uuid = substring(regexp_replace(app_uuid, '(-|_)', '') from 1 for 10);

-- make sure the new short_uuid column is never NULL
ALTER TABLE public.app_info
ALTER COLUMN app_short_uuid SET NOT NULL;