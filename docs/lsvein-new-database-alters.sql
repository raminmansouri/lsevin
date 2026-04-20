

-- 2) Staff gallery
CREATE TABLE IF NOT EXISTS category.staff_gallery_items (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title_translations jsonb NOT NULL DEFAULT '{}'::jsonb,
    description_translations jsonb NOT NULL DEFAULT '{}'::jsonb,
    url character varying(250) NOT NULL,
    media_type character varying(50) NOT NULL DEFAULT 'image',
    display_order integer NOT NULL DEFAULT 0,
    is_primary boolean NOT NULL DEFAULT false,
    staff_id uuid NOT NULL,
    create_date timestamp with time zone NOT NULL DEFAULT now(),
    last_modified_date timestamp with time zone,
    CONSTRAINT pk_staff_gallery_items PRIMARY KEY (id),
    CONSTRAINT fk_staff_gallery_items_staff
        FOREIGN KEY (staff_id)
        REFERENCES category.staff(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_staff_gallery_items_staff_id
ON category.staff_gallery_items (staff_id);

CREATE INDEX IF NOT EXISTS ix_staff_gallery_items_display_order
ON category.staff_gallery_items (staff_id, display_order);

CREATE UNIQUE INDEX IF NOT EXISTS ux_staff_gallery_items_one_primary
ON category.staff_gallery_items (staff_id)
WHERE is_primary = true;


-- 3) Service gallery
CREATE TABLE IF NOT EXISTS category.provider_service_gallery_items (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title_translations jsonb NOT NULL DEFAULT '{}'::jsonb,
    description_translations jsonb NOT NULL DEFAULT '{}'::jsonb,
    url character varying(250) NOT NULL,
    media_type character varying(50) NOT NULL DEFAULT 'image',
    display_order integer NOT NULL DEFAULT 0,
    is_primary boolean NOT NULL DEFAULT false,
    provider_service_id uuid NOT NULL,
    create_date timestamp with time zone NOT NULL DEFAULT now(),
    last_modified_date timestamp with time zone,
    CONSTRAINT pk_provider_service_gallery_items PRIMARY KEY (id),
    CONSTRAINT fk_provider_service_gallery_items_provider_service
        FOREIGN KEY (provider_service_id)
        REFERENCES category.provider_services(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_provider_service_gallery_items_service_id
ON category.provider_service_gallery_items (provider_service_id);

CREATE INDEX IF NOT EXISTS ix_provider_service_gallery_items_display_order
ON category.provider_service_gallery_items (provider_service_id, display_order);

CREATE UNIQUE INDEX IF NOT EXISTS ux_provider_service_gallery_items_one_primary
ON category.provider_service_gallery_items (provider_service_id)
WHERE is_primary = true;




------------------------------------------------------
BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================
-- 1) Missing columns on category.staff
-- =========================================================
ALTER TABLE category.staff
    ADD COLUMN IF NOT EXISTS specialty_translations jsonb,
    ADD COLUMN IF NOT EXISTS experience_years integer,
    ADD COLUMN IF NOT EXISTS success_rate character varying(50);

-- =========================================================
-- 2) Missing tables expected by the original query
-- =========================================================

-- LANGUAGES
CREATE TABLE IF NOT EXISTS category.staff_languages (
    staff_id uuid NOT NULL,
    language text NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT pk_staff_languages PRIMARY KEY (staff_id, language),
    CONSTRAINT fk_staff_languages_staff
        FOREIGN KEY (staff_id)
        REFERENCES category.staff(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_staff_languages_staff_id
    ON category.staff_languages(staff_id);

-- SPECIALIZATIONS
CREATE TABLE IF NOT EXISTS category.staff_specializations (
    staff_id uuid NOT NULL,
    specialty text NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT pk_staff_specializations PRIMARY KEY (staff_id, specialty),
    CONSTRAINT fk_staff_specializations_staff
        FOREIGN KEY (staff_id)
        REFERENCES category.staff(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_staff_specializations_staff_id
    ON category.staff_specializations(staff_id);

-- EDUCATION
CREATE TABLE IF NOT EXISTS category.staff_education (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    staff_id uuid NOT NULL,
    degree character varying(200) NOT NULL,
    institution character varying(250) NOT NULL,
    year integer,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now(),
    CONSTRAINT pk_staff_education PRIMARY KEY (id),
    CONSTRAINT fk_staff_education_staff
        FOREIGN KEY (staff_id)
        REFERENCES category.staff(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_staff_education_staff_id
    ON category.staff_education(staff_id);

CREATE INDEX IF NOT EXISTS ix_staff_education_staff_id_year
    ON category.staff_education(staff_id, year DESC);

-- CERTIFICATIONS
CREATE TABLE IF NOT EXISTS category.staff_certifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    staff_id uuid NOT NULL,
    name character varying(200) NOT NULL,
    issuer character varying(200),
    is_verified boolean DEFAULT false NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now(),
    CONSTRAINT pk_staff_certifications PRIMARY KEY (id),
    CONSTRAINT fk_staff_certifications_staff
        FOREIGN KEY (staff_id)
        REFERENCES category.staff(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_staff_certifications_staff_id
    ON category.staff_certifications(staff_id);

-- ACHIEVEMENTS
CREATE TABLE IF NOT EXISTS category.staff_achievements (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    staff_id uuid NOT NULL,
    icon character varying(100),
    title character varying(200) NOT NULL,
    organization character varying(200),
    display_order integer DEFAULT 0 NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now(),
    CONSTRAINT pk_staff_achievements PRIMARY KEY (id),
    CONSTRAINT fk_staff_achievements_staff
        FOREIGN KEY (staff_id)
        REFERENCES category.staff(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_staff_achievements_staff_id
    ON category.staff_achievements(staff_id);

CREATE INDEX IF NOT EXISTS ix_staff_achievements_staff_id_display_order
    ON category.staff_achievements(staff_id, display_order);

-- BEFORE / AFTER
CREATE TABLE IF NOT EXISTS category.staff_before_after (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    staff_id uuid NOT NULL,
    before_image character varying(250) NOT NULL,
    after_image character varying(250) NOT NULL,
    procedure character varying(200),
    months integer,
    display_order integer DEFAULT 0 NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now(),
    CONSTRAINT pk_staff_before_after PRIMARY KEY (id),
    CONSTRAINT fk_staff_before_after_staff
        FOREIGN KEY (staff_id)
        REFERENCES category.staff(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_staff_before_after_staff_id
    ON category.staff_before_after(staff_id);

CREATE INDEX IF NOT EXISTS ix_staff_before_after_staff_id_display_order
    ON category.staff_before_after(staff_id, display_order);

-- =========================================================
-- 3) Missing relationship: review_images -> service_provider_comments
-- =========================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_review_images_service_provider_comments_review_id'
    ) THEN
        ALTER TABLE category.review_images
        ADD CONSTRAINT fk_review_images_service_provider_comments_review_id
        FOREIGN KEY (review_id)
        REFERENCES category.service_provider_comments(id)
        ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS ix_review_images_review_id
    ON category.review_images(review_id);

COMMIT;
-------------------------------------------------------------------------------------
ALTER TABLE booking.bookings
    ADD COLUMN IF NOT EXISTS user_id uuid;

CREATE UNIQUE INDEX IF NOT EXISTS ux_bookings_one_pending_checkout_per_user
    ON booking.bookings (user_id)
    WHERE booking_status = 'Pending';
	
	CREATE TABLE category.service_upload_file_requirements
(
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    service_definition_id uuid NOT NULL,
    title_translations jsonb NOT NULL,
    description_translations jsonb NOT NULL,
    is_required boolean DEFAULT false NOT NULL,
    max_file_size_bytes bigint DEFAULT 0 NOT NULL,
    allowed_extensions text[] DEFAULT ARRAY[]::text[] NOT NULL,
    allowed_mime_types text[] DEFAULT ARRAY[]::text[] NOT NULL,
    max_files integer DEFAULT 1 NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    example_file_url text,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now(),

    CONSTRAINT pk_service_upload_file_requirements PRIMARY KEY (id),
    CONSTRAINT fk_service_upload_file_requirements_service_definition
        FOREIGN KEY (service_definition_id)
        REFERENCES category.service_definitions(id)
        ON DELETE CASCADE,
    CONSTRAINT ck_sufr_max_file_size_bytes_nonnegative
        CHECK (max_file_size_bytes >= 0),
    CONSTRAINT ck_sufr_max_files_positive
        CHECK (max_files > 0)
);

CREATE INDEX ix_sufr_service_definition_id
    ON category.service_upload_file_requirements(service_definition_id);

CREATE INDEX ix_sufr_service_definition_id_display_order
    ON category.service_upload_file_requirements(service_definition_id, display_order);



-------------------------------------------------------------------
-- =========================
-- Missing schema for favorites
-- =========================

CREATE OR REPLACE FUNCTION common.get_translation(
    translations jsonb,
    preferred_language text,
    fallback_language text DEFAULT 'en'
)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT COALESCE(
        NULLIF(BTRIM(translations ->> preferred_language), ''),
        NULLIF(BTRIM(translations ->> fallback_language), ''),
        (
            SELECT NULLIF(BTRIM(e.value), '')
            FROM jsonb_each_text(translations) AS e
            ORDER BY e.key
            LIMIT 1
        ),
        ''
    );
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        INNER JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'customer'
          AND t.typname = 'favorite_type'
    ) THEN
        CREATE TYPE customer.favorite_type AS ENUM ('provider', 'service', 'specialist');
    END IF;
END
$$;

CREATE TABLE IF NOT EXISTS customer.favorites
(
    id          bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    customer_id uuid NOT NULL,
    favorite_type customer.favorite_type NOT NULL,
    entity_id   uuid NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT fk_favorites_customer
        FOREIGN KEY (customer_id)
        REFERENCES customer.customers(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_favorites_customer_type_entity
        UNIQUE (customer_id, favorite_type, entity_id)
);

CREATE INDEX IF NOT EXISTS ix_favorites_customer_id
    ON customer.favorites(customer_id);

CREATE INDEX IF NOT EXISTS ix_favorites_customer_type
    ON customer.favorites(customer_id, favorite_type);

CREATE INDEX IF NOT EXISTS ix_favorites_entity
    ON customer.favorites(entity_id);
---------------------------------------------------------------------------------------------------------
-- ============================================================
-- MIGRATION: Add missing columns / tables to support
--   GetBookingServiceSelectionDataProvider
--   GetBookingGetServicesByProviderAndSpecialistService
--   GetBookingServiceSelectionDataSpecialist
-- Run ONCE against your PostgreSQL database.
-- ============================================================

-- ── category.service_providers ───────────────────────────────
-- image_url is missing from the existing schema
ALTER TABLE category.service_providers
    ADD COLUMN IF NOT EXISTS image_url text;

-- Note: existing columns that map to the DTO:
--   rating        → Provider.Rating
--   accredited    → Provider.Verified
--   is_sponsored  → Provider.Popular   (re-used intent)
--   name_translations (jsonb) → Provider.Name  (resolve per locale app-side)
--   description_translations  → Provider.Description

-- ── category.staff ───────────────────────────────────────────
-- Several fields required by GetBookingServiceSelectionDataSpecialist
-- are missing from the existing staff table.

ALTER TABLE category.staff
    ADD COLUMN IF NOT EXISTS specialty           text;               -- Specialist.Specialty

ALTER TABLE category.staff
    ADD COLUMN IF NOT EXISTS consultation_fee    numeric(18,2)
                                                 DEFAULT 0;          -- Specialist.Consultation (price)

ALTER TABLE category.staff
    ADD COLUMN IF NOT EXISTS next_available_label text;              -- Specialist.NextAvailable
                                                                     -- (cached human-readable label;
                                                                     --  live slot logic done app-side
                                                                     --  via staff_availabilities)

ALTER TABLE category.staff
    ADD COLUMN IF NOT EXISTS review_count        integer DEFAULT 0;  -- Specialist.Reviews

-- Note: existing columns that map to the DTO:
--   experience          → Specialist.Experience
--   patients            → Specialist.Patients
--   rating              → Specialist.Rating
--   profile_image_url   → Specialist.Image
--   is_active           → filter guard

-- ── category.staff_credentials (new) ─────────────────────────
-- Captures free-text credential / qualification strings per staff member.
-- Maps to GetBookingServiceSelectionDataSpecialist.Credentials[].
-- (provider_certifications already exists but is scoped to service_providers,
--  not to individual staff members.)

CREATE TABLE IF NOT EXISTS category.staff_credentials (
    id          uuid    NOT NULL DEFAULT public.uuid_generate_v4(),
    staff_id    uuid    NOT NULL,
    credential  text    NOT NULL,
    is_verified boolean NOT NULL DEFAULT false,

    CONSTRAINT pk_staff_credentials PRIMARY KEY (id),
    CONSTRAINT fk_staff_credentials_staff
        FOREIGN KEY (staff_id) REFERENCES category.staff (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_staff_credentials_staff_id
    ON category.staff_credentials (staff_id);
----------------------------------------------------------------------------------------------------
-- ============================================================
-- MIGRATION: Add addon tables to the category schema
-- These tables are missing from the existing schema and are
-- required to support the Addon / AddonListResponse model.
-- ============================================================

-- ① Core addons table (one row per add-on)
CREATE TABLE category.addons (
    id          text        NOT NULL,                        -- natural / slug key shown to UI
    name        text        NOT NULL,
    description text        NOT NULL DEFAULT '',
    price       numeric(18, 2) NOT NULL DEFAULT 0,
    icon        text        NOT NULL DEFAULT '',             -- CSS class, file path, or enum string
    popular     boolean,                                     -- nullable – tri-state in UI
    create_date timestamp with time zone NOT NULL DEFAULT now(),
    last_modified_date timestamp with time zone DEFAULT now(),

    CONSTRAINT pk_addons PRIMARY KEY (id)
);

-- ② Detail bullet-points  (one row per bullet, ordered)
CREATE TABLE category.addon_details (
    id          uuid        NOT NULL DEFAULT public.uuid_generate_v4(),
    addon_id    text        NOT NULL,
    detail      text        NOT NULL,
    display_order integer   NOT NULL DEFAULT 0,

    CONSTRAINT pk_addon_details PRIMARY KEY (id),
    CONSTRAINT fk_addon_details_addons
        FOREIGN KEY (addon_id) REFERENCES category.addons (id) ON DELETE CASCADE
);

-- ③ Link table – which add-ons are available for a provider service
CREATE TABLE category.provider_service_addons (
    provider_service_id uuid NOT NULL,
    addon_id            text NOT NULL,

    CONSTRAINT pk_provider_service_addons
        PRIMARY KEY (provider_service_id, addon_id),
    CONSTRAINT fk_psa_provider_services
        FOREIGN KEY (provider_service_id) REFERENCES category.provider_services (id) ON DELETE CASCADE,
    CONSTRAINT fk_psa_addons
        FOREIGN KEY (addon_id) REFERENCES category.addons (id) ON DELETE CASCADE
);

-- Helpful indexes
CREATE INDEX ix_addon_details_addon_id  ON category.addon_details (addon_id);
CREATE INDEX ix_psa_addon_id            ON category.provider_service_addons (addon_id);













--------------------------------------------
ALTER TABLE category.addons ADD COLUMN details jsonb;


CREATE TABLE booking.bookings (
    provider_id TEXT NOT NULL,
    service_id TEXT NOT NULL,
    specialist_id TEXT NOT NULL,
    selected_date DATE NOT NULL,
    selected_date_from TIME NOT NULL,
    selected_date_to TIME NOT NULL,
    selected_time TIME NOT NULL,
    selected_time_from TIME NOT NULL,
    selected_time_to TIME NOT NULL,
    payment_method TEXT NOT NULL,
    
    -- Add-ons
    add_ons JSONB NOT NULL,  -- Store as JSONB for flexibility

    -- Uploaded Files (you might want to store file metadata, not the actual file)
    upload_files JSONB NOT NULL,  -- Store file metadata as JSONB

    -- Additional Services (optional)
    additional_services JSONB,  -- Optional, stored as JSONB

    CONSTRAINT pk_booking PRIMARY KEY (provider_id, service_id, specialist_id, selected_date, selected_time)
);

ALTER TABLE category.service_providers
ADD COLUMN is_sponsored BOOLEAN DEFAULT FALSE;

ALTER TABLE category.service_providers
ADD COLUMN sponsored_tag VARCHAR(50);

ALTER TABLE category.service_providers
ADD COLUMN specialties TEXT[];

ALTER TABLE category.provider_services
ADD COLUMN trending_score NUMERIC DEFAULT 0;

ALTER TABLE category.service_providers
ADD COLUMN featured_score NUMERIC DEFAULT 0;

ALTER TABLE category.provider_services
ADD COLUMN growth VARCHAR(50);


CREATE TABLE category.category_groups (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL
);
ALTER TABLE category.categories
ADD COLUMN group_id INT REFERENCES category.category_groups(id);

ALTER TABLE category.categories
ADD COLUMN image_url TEXT,
ADD COLUMN gradient VARCHAR(100);

ALTER TABLE booking.bookings
ADD COLUMN payment_status VARCHAR(50);

ALTER TABLE booking.booking_services
ADD COLUMN duration VARCHAR(50);

ALTER TABLE booking.bookings
ADD COLUMN confirmation_code VARCHAR(100);



ALTER TABLE category.provider_services
ADD COLUMN search_vector tsvector;

UPDATE category.provider_services
SET search_vector =
    to_tsvector('english',
        coalesce(display_name_translations->>'en','') || ' ' ||
        coalesce(description_translations->>'en','')
    );

CREATE INDEX idx_provider_services_search 
ON category.provider_services USING GIN(search_vector);

ALTER TABLE category.service_providers
ADD COLUMN search_vector tsvector;

UPDATE category.service_providers
SET search_vector =
    to_tsvector('english',
        coalesce(name_translations->>'en','') || ' ' ||
        coalesce(description_translations->>'en','')
    );

CREATE INDEX idx_providers_search 
ON category.service_providers USING GIN(search_vector);

ALTER TABLE category.service_providers
ADD COLUMN specialties TEXT[];


ALTER TABLE category.provider_services
ADD COLUMN tags TEXT[];

CREATE TABLE search.user_search_history (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    term TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT now()
);

CREATE EXTENSION pg_trgm;


CREATE TABLE marketing.offers (
    id SERIAL PRIMARY KEY,

    provider_service_id INT NOT NULL 
        REFERENCES category.provider_services(id),

    title TEXT NOT NULL,
    subtitle TEXT,

    discount_percent NUMERIC(5,2) NOT NULL,

    valid_until TIMESTAMP NOT NULL,
    code VARCHAR(50),

    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_offers_active 
ON marketing.offers(is_active, valid_until);

ALTER TABLE marketing.offers
ADD CONSTRAINT valid_until_check 
CHECK (valid_until > created_at);

ALTER TABLE marketing.offers
ADD COLUMN is_featured BOOLEAN DEFAULT FALSE;

ALTER TABLE marketing.offers
ADD COLUMN usage_limit INT,
ADD COLUMN used_count INT DEFAULT 0;

CREATE INDEX idx_offers_provider_service 
ON marketing.offers(provider_service_id);

ALTER TABLE search.user_search_history
ADD COLUMN category_id INT,
ADD COLUMN normalized_term TEXT;


UPDATE search.user_search_history
SET normalized_term = LOWER(term);

CREATE INDEX idx_search_history_user 
ON search.user_search_history(user_id, created_at DESC);

CREATE INDEX idx_search_history_term 
ON search.user_search_history(normalized_term);

CREATE INDEX idx_search_history_category 
ON search.user_search_history(category_id);

ALTER TABLE category.categories
ADD COLUMN icon TEXT;

CREATE TABLE search.trending_searches (
    term TEXT,
    trend TEXT,
    calculated_at TIMESTAMP
);
-------------------------------------------------------------------------------------------------
ALTER TABLE category.service_providers
ADD COLUMN rating numeric(3,2) DEFAULT 0,
ADD COLUMN review_count integer DEFAULT 0,
ADD COLUMN accredited boolean DEFAULT false,
ADD COLUMN response_time varchar(50),
ADD COLUMN established_year int,
ADD COLUMN total_patients varchar(50),
ADD COLUMN success_rate varchar(50);

ALTER TABLE category.service_providers
ADD COLUMN languages text[];


CREATE TABLE category.provider_certifications (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_provider_id uuid NOT NULL,
    name varchar(200) NOT NULL,
    is_verified boolean DEFAULT false
);

ALTER TABLE category.provider_services
ADD COLUMN rating numeric(3,2) DEFAULT 0,
ADD COLUMN review_count integer DEFAULT 0,
ADD COLUMN recovery varchar(100),
ADD COLUMN image_url varchar(250),
ADD COLUMN is_popular boolean DEFAULT false;


ALTER TABLE category.staff
ADD COLUMN experience varchar(50),
ADD COLUMN patients varchar(50),
ADD COLUMN rating numeric(3,2) DEFAULT 0;


ALTER TABLE category.service_provider_comments
ADD COLUMN country varchar(50),
ADD COLUMN treatment varchar(100),
ADD COLUMN is_verified boolean DEFAULT false,
ADD COLUMN helpful_count integer DEFAULT 0;


CREATE TABLE category.review_images (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id uuid NOT NULL,
    image_url varchar(250)
);


CREATE TABLE category.provider_recommendations (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_provider_id uuid NOT NULL,
    target_provider_id uuid NOT NULL,
    type varchar(20) NOT NULL, -- 'local' or 'international'
    create_date timestamp with time zone DEFAULT now()
);

CREATE TABLE category.service_included (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id uuid NOT NULL,
    item varchar(200) NOT NULL
);
CREATE TABLE category.service_process (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id uuid NOT NULL,
    step int NOT NULL,
    title varchar(200),
    description text,
    duration varchar(50)
);

CREATE TABLE category.service_faqs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id uuid NOT NULL,
    question text,
    answer text
);

ALTER TABLE category.provider_services
ADD COLUMN anesthesia varchar(100),
ADD COLUMN stay_required varchar(100),
ADD COLUMN success_rate varchar(50),
ADD COLUMN satisfaction varchar(50);