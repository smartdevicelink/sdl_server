CREATE TYPE transport_type as enum ('webengine', 'websocket');

ALTER TABLE app_info
    ADD COLUMN IF NOT EXISTS min_rpc_version TEXT,
    ADD COLUMN IF NOT EXISTS min_protocol_version TEXT,
    ADD COLUMN IF NOT EXISTS developer_version TEXT,
    ADD COLUMN IF NOT EXISTS package_url TEXT,
    ADD COLUMN IF NOT EXISTS entrypoint_path TEXT,
    ADD COLUMN IF NOT EXISTS icon_path TEXT,
    ADD COLUMN IF NOT EXISTS transport_type transport_type,
    ADD COLUMN IF NOT EXISTS size_compressed_bytes INT,
    ADD COLUMN IF NOT EXISTS size_decompressed_bytes INT,
    ADD COLUMN IF NOT EXISTS description VARCHAR(1000);
;

CREATE TABLE app_categories (
    "app_id" INT NOT NULL,
    "category_id" INT NOT NULL,
    CONSTRAINT app_categories_pk PRIMARY KEY (app_id, category_id),
    CONSTRAINT app_id FOREIGN KEY (app_id) REFERENCES app_info (id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT category_id FOREIGN KEY (category_id) REFERENCES categories (id) ON UPDATE CASCADE ON DELETE CASCADE
)
WITH (
    OIDS = FALSE
);

-- Add existing categories from all current versions of applications to this table
INSERT INTO app_categories (app_id, category_id)
SELECT
    id AS app_id,
    category_id AS category_id
FROM app_info;

CREATE TABLE locale_lkp (
    "code" TEXT NOT NULL,
    CONSTRAINT locale_lkp_pk PRIMARY KEY ("code")
)
WITH (
    OIDS = FALSE
);

INSERT INTO locale_lkp (code) VALUES
    ('en-us'),
    ('es-mx'),
    ('fr-ca'),
    ('de-de'),
    ('es-es'),
    ('en-gb'),
    ('ru-ru'),
    ('tr-tr'),
    ('pl-pl'),
    ('fr-fr'),
    ('it-it'),
    ('sv-se'),
    ('pt-pt'),
    ('nl-nl'),
    ('en-au'),
    ('zh-cn'),
    ('zh-tw'),
    ('ja-jp'),
    ('ar-sa'),
    ('ko-kr'),
    ('pt-br'),
    ('cs-cz'),
    ('da-dk'),
    ('no-no'),
    ('nl-be'),
    ('el-gr'),
    ('hu-hu'),
    ('fi-fi'),
    ('sk-sk'),
    ('en-in'),
    ('th-th'),
    ('en-sa'),
    ('he-il'),
    ('ro-ro'),
    ('uk-ua'),
    ('id-id'),
    ('vi-vn'),
    ('ms-my'),
    ('hi-in');

CREATE TABLE app_locale (
    "id" SERIAL NOT NULL,
    "app_id" INT NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "vr_names" VARCHAR(100)[] NOT NULL,
    CONSTRAINT app_locale_pk PRIMARY KEY (id),
    CONSTRAINT app_locale_unique UNIQUE (app_id, locale),
    CONSTRAINT app_id FOREIGN KEY (app_id) REFERENCES app_info (id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT locale FOREIGN KEY (locale) REFERENCES locale_lkp (code) ON UPDATE CASCADE ON DELETE CASCADE
)
WITH (
    OIDS = FALSE
);

CREATE TABLE app_locale_ttsname (
    "app_locale_id" INT NOT NULL,
    "chunk_type" TEXT NOT NULL,
    "chunk_text" TEXT NOT NULL,
    CONSTRAINT app_locale_ttsname_pk PRIMARY KEY (app_locale_id, chunk_type, chunk_text),
    CONSTRAINT app_locale_id FOREIGN KEY (app_locale_id) REFERENCES app_locale (id) ON UPDATE CASCADE ON DELETE CASCADE
)
WITH (
    OIDS = FALSE
);

