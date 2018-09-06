-- this is only a partial down migration. full downward migration of the vendor data is not supported.

CREATE TABLE vendors (
	"id" SERIAL NOT NULL,
    "vendor_name" TEXT NOT NULL,
    "vendor_email" TEXT NOT NULL,
    PRIMARY KEY (id)
)
WITH ( OIDS = FALSE );

ALTER TABLE public.app_info
DROP COLUMN IF EXISTS vendor_name,
DROP COLUMN IF EXISTS vendor_email,
ADD COLUMN IF NOT EXISTS vendor_id INTEGER;