-- add columns to app_info table
ALTER TABLE public.app_info
ADD COLUMN IF NOT EXISTS vendor_name TEXT,
ADD COLUMN IF NOT EXISTS vendor_email TEXT;

-- populate the new columns for existing applications
UPDATE public.app_info
SET vendor_name = (SELECT vendor_name FROM vendors v WHERE v.id = app_info.vendor_id),
    vendor_email = (SELECT vendor_email FROM vendors v WHERE v.id = app_info.vendor_id);

ALTER TABLE public.app_info
ALTER COLUMN vendor_name SET NOT NULL,
ALTER COLUMN vendor_email SET NOT NULL,
DROP CONSTRAINT app_info_vendor_id_fkey;

ALTER TABLE public.app_info
DROP COLUMN IF EXISTS vendor_id;

DROP TABLE IF EXISTS public.vendors;