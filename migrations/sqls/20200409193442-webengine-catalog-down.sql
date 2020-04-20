DROP TABLE IF EXISTS public.app_locale_ttsname;
DROP TABLE IF EXISTS public.app_locale;
DROP TABLE IF EXISTS public.locale_lkp;
DROP TABLE IF EXISTS public.app_additional_category;

ALTER TABLE app_info
    DROP COLUMN IF EXISTS is_in_catalog,
    DROP COLUMN IF EXISTS is_homepage_app,
    DROP COLUMN IF EXISTS catalog_name,
    DROP COLUMN IF EXISTS is_oem_specific,
    DROP COLUMN IF EXISTS download_urls,
    DROP COLUMN IF EXISTS min_rpc_version,
    DROP COLUMN IF EXISTS min_protocol_version,
    DROP COLUMN IF EXISTS developer_version,
    DROP COLUMN IF EXISTS package_url,
    DROP COLUMN IF EXISTS entrypoint_path,
    DROP COLUMN IF EXISTS transport_type,
    DROP COLUMN IF EXISTS size_compressed_bytes,
    DROP COLUMN IF EXISTS size_decompressed_bytes,
    DROP COLUMN IF EXISTS description;

DROP TYPE IF EXISTS transport_type;