--
-- PostgreSQL database dump
--

-- Dumped from database version 16.0
-- Dumped by pg_dump version 17.1

-- Started on 2026-04-18 01:15:43

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 13 (class 2615 OID 17935)
-- Name: booking; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA booking;


ALTER SCHEMA booking OWNER TO postgres;

--
-- TOC entry 9 (class 2615 OID 16398)
-- Name: category; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA category;


ALTER SCHEMA category OWNER TO postgres;

--
-- TOC entry 10 (class 2615 OID 16399)
-- Name: common; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA common;


ALTER SCHEMA common OWNER TO postgres;

--
-- TOC entry 11 (class 2615 OID 16400)
-- Name: customer; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA customer;


ALTER SCHEMA customer OWNER TO postgres;

--
-- TOC entry 12 (class 2615 OID 16401)
-- Name: identity; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA identity;


ALTER SCHEMA identity OWNER TO postgres;

--
-- TOC entry 15 (class 2615 OID 18139)
-- Name: marketing; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA marketing;


ALTER SCHEMA marketing OWNER TO postgres;

--
-- TOC entry 14 (class 2615 OID 18023)
-- Name: search; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA search;


ALTER SCHEMA search OWNER TO postgres;

--
-- TOC entry 4 (class 3079 OID 18596)
-- Name: btree_gist; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public;


--
-- TOC entry 6135 (class 0 OID 0)
-- Dependencies: 4
-- Name: EXTENSION btree_gist; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION btree_gist IS 'support for indexing common datatypes in GiST';


--
-- TOC entry 3 (class 3079 OID 18415)
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- TOC entry 6136 (class 0 OID 0)
-- Dependencies: 3
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- TOC entry 2 (class 3079 OID 16402)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- TOC entry 6137 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- TOC entry 1451 (class 1247 OID 19306)
-- Name: favorite_type; Type: TYPE; Schema: customer; Owner: postgres
--

CREATE TYPE customer.favorite_type AS ENUM (
    'provider',
    'service',
    'specialist'
);


ALTER TYPE customer.favorite_type OWNER TO postgres;

--
-- TOC entry 335 (class 1255 OID 19304)
-- Name: get_translation(jsonb, text, text); Type: FUNCTION; Schema: common; Owner: postgres
--

CREATE FUNCTION common.get_translation(translations jsonb, preferred_language text, fallback_language text DEFAULT 'en'::text) RETURNS text
    LANGUAGE sql IMMUTABLE
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


ALTER FUNCTION common.get_translation(translations jsonb, preferred_language text, fallback_language text) OWNER TO postgres;

--
-- TOC entry 355 (class 1255 OID 19467)
-- Name: get_translation_t(jsonb, text, text); Type: FUNCTION; Schema: common; Owner: postgres
--

CREATE FUNCTION common.get_translation_t(translations jsonb, preferred_language text, fallback_language text DEFAULT 'en'::text) RETURNS text
    LANGUAGE sql IMMUTABLE
    AS $$
WITH p AS (
    SELECT
        NULLIF(BTRIM(preferred_language), '') AS preferred_language,
        NULLIF(BTRIM(fallback_language), '') AS fallback_language,
        LOWER(REPLACE(NULLIF(BTRIM(preferred_language), ''), '_', '-')) AS preferred_norm,
        LOWER(REPLACE(NULLIF(BTRIM(fallback_language), ''), '_', '-')) AS fallback_norm,
        SPLIT_PART(LOWER(REPLACE(NULLIF(BTRIM(preferred_language), ''), '_', '-')), '-', 1) AS preferred_base,
        SPLIT_PART(LOWER(REPLACE(NULLIF(BTRIM(fallback_language), ''), '_', '-')), '-', 1) AS fallback_base
),
candidates AS (
    -- 1) exact preferred key
    SELECT 1 AS ord, NULLIF(BTRIM(translations ->> p.preferred_language), '') AS value
    FROM p

    UNION ALL

    -- 2) normalized exact preferred key (fa-ir vs fa-IR)
    SELECT 2 AS ord, NULLIF(BTRIM(e.value), '') AS value
    FROM p
    CROSS JOIN LATERAL jsonb_each_text(translations) e
    WHERE LOWER(REPLACE(e.key, '_', '-')) = p.preferred_norm

    UNION ALL

    -- 3) preferred base language match (fa -> fa-IR)
    SELECT 3 AS ord, NULLIF(BTRIM(e.value), '') AS value
    FROM p
    CROSS JOIN LATERAL jsonb_each_text(translations) e
    WHERE SPLIT_PART(LOWER(REPLACE(e.key, '_', '-')), '-', 1) = p.preferred_base

    UNION ALL

    -- 4) exact fallback key
    SELECT 4 AS ord, NULLIF(BTRIM(translations ->> p.fallback_language), '') AS value
    FROM p

    UNION ALL

    -- 5) normalized exact fallback key
    SELECT 5 AS ord, NULLIF(BTRIM(e.value), '') AS value
    FROM p
    CROSS JOIN LATERAL jsonb_each_text(translations) e
    WHERE LOWER(REPLACE(e.key, '_', '-')) = p.fallback_norm

    UNION ALL

    -- 6) fallback base language match (en -> en-US)
    SELECT 6 AS ord, NULLIF(BTRIM(e.value), '') AS value
    FROM p
    CROSS JOIN LATERAL jsonb_each_text(translations) e
    WHERE SPLIT_PART(LOWER(REPLACE(e.key, '_', '-')), '-', 1) = p.fallback_base

    UNION ALL

    -- 7) final deterministic fallback: first non-empty translation
    SELECT 7 AS ord, NULLIF(BTRIM(e.value), '') AS value
    FROM jsonb_each_text(translations) e
)
SELECT COALESCE(
    (
        SELECT value
        FROM candidates
        WHERE value IS NOT NULL
        ORDER BY ord
        LIMIT 1
    ),
    ''
);
$$;


ALTER FUNCTION common.get_translation_t(translations jsonb, preferred_language text, fallback_language text) OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 305 (class 1259 OID 18381)
-- Name: bookings; Type: TABLE; Schema: booking; Owner: postgres
--

CREATE TABLE booking.bookings (
    provider_id uuid NOT NULL,
    service_id uuid NOT NULL,
    specialist_id uuid NOT NULL,
    selected_date date NOT NULL,
    selected_date_from time without time zone NOT NULL,
    selected_date_to time without time zone NOT NULL,
    selected_time time without time zone NOT NULL,
    selected_time_from time without time zone NOT NULL,
    selected_time_to time without time zone NOT NULL,
    payment_method text NOT NULL,
    add_ons jsonb NOT NULL,
    upload_files jsonb NOT NULL,
    additional_services jsonb,
    payment_status character varying(50),
    confirmation_code character varying(100),
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    booking_status character varying(30) DEFAULT 'Confirmed'::character varying NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid,
    CONSTRAINT ck_bookings_time_range CHECK ((selected_time_from < selected_time_to))
);


ALTER TABLE booking.bookings OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16413)
-- Name: Currency; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category."Currency" (
    "Id" bigint NOT NULL,
    "Price" money,
    "Symbol" character varying
);


ALTER TABLE category."Currency" OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 16418)
-- Name: Currency_Id_seq; Type: SEQUENCE; Schema: category; Owner: postgres
--

ALTER TABLE category."Currency" ALTER COLUMN "Id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME category."Currency_Id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 227 (class 1259 OID 16419)
-- Name: LocationType; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category."LocationType" (
    id integer NOT NULL,
    name character varying(50) NOT NULL
);


ALTER TABLE category."LocationType" OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 16422)
-- Name: __EFMigrationsHistory; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category."__EFMigrationsHistory" (
    migration_id character varying(150) NOT NULL,
    product_version character varying(32) NOT NULL
);


ALTER TABLE category."__EFMigrationsHistory" OWNER TO postgres;

--
-- TOC entry 314 (class 1259 OID 18542)
-- Name: addon_details; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.addon_details (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    addon_id text NOT NULL,
    detail text NOT NULL,
    display_order integer DEFAULT 0 NOT NULL
);


ALTER TABLE category.addon_details OWNER TO postgres;

--
-- TOC entry 313 (class 1259 OID 18530)
-- Name: addons; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.addons (
    id text NOT NULL,
    name text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    price numeric(18,2) DEFAULT 0 NOT NULL,
    icon text DEFAULT ''::text NOT NULL,
    popular boolean,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now()
);


ALTER TABLE category.addons OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 16425)
-- Name: attribute_types; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.attribute_types (
    id integer NOT NULL,
    name character varying(25) NOT NULL
);


ALTER TABLE category.attribute_types OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 16428)
-- Name: categories; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.categories (
    id uuid NOT NULL,
    name_translations jsonb NOT NULL,
    description_translations jsonb NOT NULL,
    parent_id uuid,
    display_order integer DEFAULT 0 NOT NULL,
    is_active boolean NOT NULL,
    icon_url character varying(250),
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now(),
    group_id integer,
    image_url text,
    gradient character varying(100),
    icon text
);


ALTER TABLE category.categories OWNER TO postgres;

--
-- TOC entry 307 (class 1259 OID 18392)
-- Name: category_groups; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.category_groups (
    id integer NOT NULL,
    title character varying(200) NOT NULL
);


ALTER TABLE category.category_groups OWNER TO postgres;

--
-- TOC entry 306 (class 1259 OID 18391)
-- Name: category_groups_id_seq; Type: SEQUENCE; Schema: category; Owner: postgres
--

CREATE SEQUENCE category.category_groups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE category.category_groups_id_seq OWNER TO postgres;

--
-- TOC entry 6138 (class 0 OID 0)
-- Dependencies: 306
-- Name: category_groups_id_seq; Type: SEQUENCE OWNED BY; Schema: category; Owner: postgres
--

ALTER SEQUENCE category.category_groups_id_seq OWNED BY category.category_groups.id;


--
-- TOC entry 231 (class 1259 OID 16436)
-- Name: currencies; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.currencies (
    symbol text NOT NULL,
    name text DEFAULT ''::text NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now(),
    id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    price numeric DEFAULT 0.0 NOT NULL
);


ALTER TABLE category.currencies OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 16446)
-- Name: inbox_message_consumers; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.inbox_message_consumers (
    message_id uuid NOT NULL,
    name character varying(500) NOT NULL
);


ALTER TABLE category.inbox_message_consumers OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 16451)
-- Name: inbox_messages; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.inbox_messages (
    id uuid NOT NULL,
    type character varying(250) NOT NULL,
    content jsonb NOT NULL,
    occurred_on_utc timestamp with time zone NOT NULL,
    processed_on_utc timestamp with time zone,
    error text
);


ALTER TABLE category.inbox_messages OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 16456)
-- Name: internal_command_message_consumers; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.internal_command_message_consumers (
    message_id uuid NOT NULL,
    name character varying(500) NOT NULL
);


ALTER TABLE category.internal_command_message_consumers OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 16461)
-- Name: internal_command_messages; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.internal_command_messages (
    id uuid NOT NULL,
    type character varying(250) NOT NULL,
    content jsonb NOT NULL,
    occurred_on_utc timestamp with time zone NOT NULL,
    processed_on_utc timestamp with time zone,
    error text
);


ALTER TABLE category.internal_command_messages OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 16466)
-- Name: locations; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.locations (
    id uuid NOT NULL,
    code character varying(10) NOT NULL,
    value_translations jsonb NOT NULL,
    location_type_id integer NOT NULL,
    parent_id uuid,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now(),
    display_order integer
);


ALTER TABLE category.locations OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 16473)
-- Name: outbox_message_consumers; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.outbox_message_consumers (
    message_id uuid NOT NULL,
    name character varying(500) NOT NULL
);


ALTER TABLE category.outbox_message_consumers OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 16478)
-- Name: outbox_messages; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.outbox_messages (
    id uuid NOT NULL,
    type character varying(250) NOT NULL,
    content jsonb NOT NULL,
    occurred_on_utc timestamp with time zone NOT NULL,
    processed_on_utc timestamp with time zone,
    error text
);


ALTER TABLE category.outbox_messages OWNER TO postgres;

--
-- TOC entry 239 (class 1259 OID 16483)
-- Name: provider_attribute_definition_domain_options; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.provider_attribute_definition_domain_options (
    provider_attribute_definition_id uuid NOT NULL,
    id integer NOT NULL,
    display_name_translations jsonb NOT NULL,
    value_translations jsonb NOT NULL
);


ALTER TABLE category.provider_attribute_definition_domain_options OWNER TO postgres;

--
-- TOC entry 240 (class 1259 OID 16488)
-- Name: provider_attribute_definition_domain_options_id_seq; Type: SEQUENCE; Schema: category; Owner: postgres
--

ALTER TABLE category.provider_attribute_definition_domain_options ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME category.provider_attribute_definition_domain_options_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 241 (class 1259 OID 16489)
-- Name: provider_attribute_definitions; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.provider_attribute_definitions (
    id uuid NOT NULL,
    name_translations jsonb NOT NULL,
    description_translations jsonb NOT NULL,
    attribute_type_id integer NOT NULL,
    is_required boolean NOT NULL,
    validation_rules character varying(250) NOT NULL,
    provider_type_id uuid NOT NULL,
    create_date timestamp with time zone NOT NULL,
    last_modified_date timestamp with time zone
);


ALTER TABLE category.provider_attribute_definitions OWNER TO postgres;

--
-- TOC entry 242 (class 1259 OID 16494)
-- Name: provider_attributes; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.provider_attributes (
    id uuid NOT NULL,
    attribute_definition_id uuid NOT NULL,
    value_translations jsonb NOT NULL,
    service_provider_id uuid NOT NULL,
    create_date timestamp with time zone NOT NULL,
    last_modified_date timestamp with time zone
);


ALTER TABLE category.provider_attributes OWNER TO postgres;

--
-- TOC entry 299 (class 1259 OID 17872)
-- Name: provider_certifications; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.provider_certifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    service_provider_id uuid NOT NULL,
    name character varying(200) NOT NULL,
    is_verified boolean DEFAULT false
);


ALTER TABLE category.provider_certifications OWNER TO postgres;

--
-- TOC entry 243 (class 1259 OID 16499)
-- Name: provider_gallery_items; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.provider_gallery_items (
    id uuid NOT NULL,
    title_translations jsonb NOT NULL,
    description_translations jsonb NOT NULL,
    url character varying(250) NOT NULL,
    media_type character varying(50) NOT NULL,
    display_order integer NOT NULL,
    service_provider_id uuid NOT NULL,
    create_date timestamp with time zone NOT NULL,
    last_modified_date timestamp with time zone
);


ALTER TABLE category.provider_gallery_items OWNER TO postgres;

--
-- TOC entry 326 (class 1259 OID 19468)
-- Name: provider_languages; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.provider_languages (
    service_provider_id uuid NOT NULL,
    language text NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE category.provider_languages OWNER TO postgres;

--
-- TOC entry 244 (class 1259 OID 16504)
-- Name: provider_policies; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.provider_policies (
    id uuid NOT NULL,
    type_translations jsonb NOT NULL,
    description_translations jsonb NOT NULL,
    service_provider_id uuid NOT NULL,
    create_date timestamp with time zone NOT NULL,
    last_modified_date timestamp with time zone
);


ALTER TABLE category.provider_policies OWNER TO postgres;

--
-- TOC entry 301 (class 1259 OID 17891)
-- Name: provider_recommendations; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.provider_recommendations (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    source_provider_id uuid NOT NULL,
    target_provider_id uuid NOT NULL,
    type character varying(20) NOT NULL,
    create_date timestamp with time zone DEFAULT now()
);


ALTER TABLE category.provider_recommendations OWNER TO postgres;

--
-- TOC entry 315 (class 1259 OID 18556)
-- Name: provider_service_addons; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.provider_service_addons (
    provider_service_id uuid NOT NULL,
    addon_id text NOT NULL
);


ALTER TABLE category.provider_service_addons OWNER TO postgres;

--
-- TOC entry 328 (class 1259 OID 19506)
-- Name: provider_service_gallery_items; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.provider_service_gallery_items (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title_translations jsonb DEFAULT '{}'::jsonb NOT NULL,
    description_translations jsonb DEFAULT '{}'::jsonb NOT NULL,
    url character varying(250) NOT NULL,
    media_type character varying(50) DEFAULT 'image'::character varying NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    is_primary boolean DEFAULT false NOT NULL,
    provider_service_id uuid NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone
);


ALTER TABLE category.provider_service_gallery_items OWNER TO postgres;

--
-- TOC entry 245 (class 1259 OID 16509)
-- Name: provider_services; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.provider_services (
    id uuid NOT NULL,
    service_definition_id uuid NOT NULL,
    display_name_translations jsonb NOT NULL,
    description_translations jsonb NOT NULL,
    is_active boolean NOT NULL,
    service_provider_id uuid NOT NULL,
    currency character varying(15) NOT NULL,
    value numeric(18,2) NOT NULL,
    create_date timestamp with time zone NOT NULL,
    last_modified_date timestamp with time zone,
    duration_minutes integer DEFAULT 0 NOT NULL,
    rating numeric(3,2) DEFAULT 0,
    review_count integer DEFAULT 0,
    recovery character varying(100),
    image_url character varying(250),
    is_popular boolean DEFAULT false,
    anesthesia character varying(100),
    stay_required character varying(100),
    success_rate character varying(50),
    satisfaction character varying(50),
    trending_score numeric DEFAULT 0,
    growth character varying(50),
    search_vector tsvector,
    tags text[],
    slot_interval_minutes integer DEFAULT 15 NOT NULL,
    CONSTRAINT ck_provider_services_duration_minutes_positive CHECK ((duration_minutes >= 0)),
    CONSTRAINT ck_provider_services_slot_interval_minutes_positive CHECK ((slot_interval_minutes > 0))
);


ALTER TABLE category.provider_services OWNER TO postgres;

--
-- TOC entry 246 (class 1259 OID 16515)
-- Name: provider_staffs; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.provider_staffs (
    id uuid NOT NULL,
    staff_id uuid NOT NULL,
    notes_translations jsonb NOT NULL,
    is_active boolean NOT NULL,
    service_provider_id uuid NOT NULL,
    create_date timestamp with time zone NOT NULL,
    last_modified_date timestamp with time zone
);


ALTER TABLE category.provider_staffs OWNER TO postgres;

--
-- TOC entry 247 (class 1259 OID 16520)
-- Name: provider_types; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.provider_types (
    id uuid NOT NULL,
    name_translations jsonb NOT NULL,
    description_translations jsonb NOT NULL,
    is_active boolean NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now(),
    icon_url character varying(250)
);


ALTER TABLE category.provider_types OWNER TO postgres;

--
-- TOC entry 300 (class 1259 OID 17885)
-- Name: review_images; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.review_images (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    review_id uuid NOT NULL,
    image_url character varying(250)
);


ALTER TABLE category.review_images OWNER TO postgres;

--
-- TOC entry 248 (class 1259 OID 16527)
-- Name: service_attribute_definition_options; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.service_attribute_definition_options (
    service_attribute_definition_id uuid NOT NULL,
    id integer NOT NULL,
    display_name_translations jsonb NOT NULL,
    value_translations jsonb NOT NULL,
    additional_price numeric(18,2)
);


ALTER TABLE category.service_attribute_definition_options OWNER TO postgres;

--
-- TOC entry 249 (class 1259 OID 16532)
-- Name: service_attribute_definition_options_id_seq; Type: SEQUENCE; Schema: category; Owner: postgres
--

ALTER TABLE category.service_attribute_definition_options ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME category.service_attribute_definition_options_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 250 (class 1259 OID 16533)
-- Name: service_attribute_definitions; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.service_attribute_definitions (
    id uuid NOT NULL,
    name_translations jsonb NOT NULL,
    description_translations jsonb NOT NULL,
    attribute_type_id integer NOT NULL,
    is_required boolean NOT NULL,
    affects_pricing boolean NOT NULL,
    display_order integer NOT NULL,
    service_definition_id uuid,
    create_date timestamp with time zone NOT NULL,
    last_modified_date timestamp with time zone
);


ALTER TABLE category.service_attribute_definitions OWNER TO postgres;

--
-- TOC entry 251 (class 1259 OID 16538)
-- Name: service_attribute_values; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.service_attribute_values (
    id uuid NOT NULL,
    attribute_definition_id uuid NOT NULL,
    value_translations jsonb NOT NULL,
    provider_service_id uuid NOT NULL,
    create_date timestamp with time zone NOT NULL,
    last_modified_date timestamp with time zone
);


ALTER TABLE category.service_attribute_values OWNER TO postgres;

--
-- TOC entry 252 (class 1259 OID 16543)
-- Name: service_definition_domain_requirements; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.service_definition_domain_requirements (
    service_definition_id uuid NOT NULL,
    id integer NOT NULL,
    description_translations jsonb NOT NULL,
    is_mandatory boolean NOT NULL
);


ALTER TABLE category.service_definition_domain_requirements OWNER TO postgres;

--
-- TOC entry 253 (class 1259 OID 16548)
-- Name: service_definition_domain_requirements_id_seq; Type: SEQUENCE; Schema: category; Owner: postgres
--

ALTER TABLE category.service_definition_domain_requirements ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME category.service_definition_domain_requirements_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 254 (class 1259 OID 16549)
-- Name: service_definitions; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.service_definitions (
    id uuid NOT NULL,
    name_translations jsonb NOT NULL,
    description_translations jsonb NOT NULL,
    category_id uuid NOT NULL,
    duration_minutes integer NOT NULL,
    pricing_model character varying(100) NOT NULL,
    is_active boolean NOT NULL,
    currency character varying(15) NOT NULL,
    value numeric(18,2) NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now()
);


ALTER TABLE category.service_definitions OWNER TO postgres;

--
-- TOC entry 304 (class 1259 OID 17912)
-- Name: service_faqs; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.service_faqs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    service_id uuid NOT NULL,
    question text,
    answer text
);


ALTER TABLE category.service_faqs OWNER TO postgres;

--
-- TOC entry 302 (class 1259 OID 17898)
-- Name: service_included; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.service_included (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    service_id uuid NOT NULL,
    item character varying(200) NOT NULL
);


ALTER TABLE category.service_included OWNER TO postgres;

--
-- TOC entry 303 (class 1259 OID 17904)
-- Name: service_process; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.service_process (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    service_id uuid NOT NULL,
    step integer NOT NULL,
    title character varying(200),
    description text,
    duration character varying(50)
);


ALTER TABLE category.service_process OWNER TO postgres;

--
-- TOC entry 255 (class 1259 OID 16556)
-- Name: service_provider_comments; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.service_provider_comments (
    id uuid NOT NULL,
    service_provider_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    customer_name character varying(150) NOT NULL,
    comment_text character varying(2000) NOT NULL,
    rating integer,
    is_public boolean DEFAULT true NOT NULL,
    create_date timestamp with time zone NOT NULL,
    last_modified_date timestamp with time zone,
    country character varying(50),
    treatment character varying(100),
    is_verified boolean DEFAULT false,
    helpful_count integer DEFAULT 0
);


ALTER TABLE category.service_provider_comments OWNER TO postgres;

--
-- TOC entry 256 (class 1259 OID 16562)
-- Name: service_provider_grades; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.service_provider_grades (
    id integer NOT NULL,
    name character varying(25) NOT NULL
);


ALTER TABLE category.service_provider_grades OWNER TO postgres;

--
-- TOC entry 257 (class 1259 OID 16565)
-- Name: service_provider_request_statuses; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.service_provider_request_statuses (
    id integer NOT NULL,
    name character varying(25) NOT NULL
);


ALTER TABLE category.service_provider_request_statuses OWNER TO postgres;

--
-- TOC entry 258 (class 1259 OID 16568)
-- Name: service_provider_requests; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.service_provider_requests (
    id uuid NOT NULL,
    service_provider_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    customer_email character varying(256) NOT NULL,
    customer_full_name character varying(256) NOT NULL,
    message character varying(2000) NOT NULL,
    request_status_id integer NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now()
);


ALTER TABLE category.service_provider_requests OWNER TO postgres;

--
-- TOC entry 259 (class 1259 OID 16575)
-- Name: service_providers; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.service_providers (
    id uuid NOT NULL,
    name_translations jsonb NOT NULL,
    description_translations jsonb NOT NULL,
    is_active boolean NOT NULL,
    provider_type_id uuid NOT NULL,
    city character varying(15) NOT NULL,
    country character varying(15) NOT NULL,
    detail_translations jsonb,
    street_translations jsonb,
    zip_code character varying(50),
    email character varying(250) NOT NULL,
    phone_number_country_code character varying(3) NOT NULL,
    phone_number character varying(15) NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now(),
    grade_id integer,
    latitude numeric(10,7),
    longitude numeric(10,7),
    rating numeric(3,2) DEFAULT 0,
    review_count integer DEFAULT 0,
    accredited boolean DEFAULT false,
    response_time character varying(50),
    established_year integer,
    total_patients character varying(50),
    success_rate character varying(50),
    languages text[],
    is_sponsored boolean DEFAULT false,
    sponsored_tag character varying(50),
    specialties text[],
    featured_score numeric DEFAULT 0,
    search_vector tsvector,
    image_url text,
    timezone_id text DEFAULT 'UTC'::text NOT NULL
);


ALTER TABLE category.service_providers OWNER TO postgres;

--
-- TOC entry 319 (class 1259 OID 19338)
-- Name: service_upload_file_requirements; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.service_upload_file_requirements (
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
    CONSTRAINT ck_sufr_max_file_size_bytes_nonnegative CHECK ((max_file_size_bytes >= 0)),
    CONSTRAINT ck_sufr_max_files_positive CHECK ((max_files > 0))
);


ALTER TABLE category.service_upload_file_requirements OWNER TO postgres;

--
-- TOC entry 260 (class 1259 OID 16582)
-- Name: staff; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.staff (
    id uuid NOT NULL,
    name_translations jsonb NOT NULL,
    biography_translations jsonb NOT NULL,
    title_translations jsonb NOT NULL,
    profile_image_url character varying(250),
    is_active boolean NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now(),
    experience character varying(50),
    patients character varying(50),
    rating numeric(3,2) DEFAULT 0,
    specialty text,
    consultation_fee numeric(18,2) DEFAULT 0,
    next_available_label text,
    review_count integer DEFAULT 0,
    specialty_translations jsonb,
    experience_years integer,
    success_rate character varying(50)
);


ALTER TABLE category.staff OWNER TO postgres;

--
-- TOC entry 324 (class 1259 OID 19425)
-- Name: staff_achievements; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.staff_achievements (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    staff_id uuid NOT NULL,
    icon character varying(100),
    title character varying(200) NOT NULL,
    organization character varying(200),
    display_order integer DEFAULT 0 NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now()
);


ALTER TABLE category.staff_achievements OWNER TO postgres;

--
-- TOC entry 261 (class 1259 OID 16589)
-- Name: staff_availabilities; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.staff_availabilities (
    id uuid NOT NULL,
    day_of_week integer NOT NULL,
    is_recurring boolean NOT NULL,
    availability_status_id integer NOT NULL,
    specific_date timestamp with time zone,
    staff_id uuid NOT NULL,
    end_time interval NOT NULL,
    start_time interval NOT NULL,
    create_date timestamp with time zone NOT NULL,
    last_modified_date timestamp with time zone,
    CONSTRAINT ck_staff_availabilities_day_of_week CHECK (((day_of_week >= 1) AND (day_of_week <= 7))),
    CONSTRAINT ck_staff_availabilities_time_range CHECK ((start_time < end_time))
);


ALTER TABLE category.staff_availabilities OWNER TO postgres;

--
-- TOC entry 262 (class 1259 OID 16592)
-- Name: staff_availability_statuses; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.staff_availability_statuses (
    id integer NOT NULL,
    name character varying(25) NOT NULL
);


ALTER TABLE category.staff_availability_statuses OWNER TO postgres;

--
-- TOC entry 325 (class 1259 OID 19443)
-- Name: staff_before_after; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.staff_before_after (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    staff_id uuid NOT NULL,
    before_image character varying(250) NOT NULL,
    after_image character varying(250) NOT NULL,
    procedure character varying(200),
    months integer,
    display_order integer DEFAULT 0 NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now()
);


ALTER TABLE category.staff_before_after OWNER TO postgres;

--
-- TOC entry 323 (class 1259 OID 19410)
-- Name: staff_certifications; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.staff_certifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    staff_id uuid NOT NULL,
    name character varying(200) NOT NULL,
    issuer character varying(200),
    is_verified boolean DEFAULT false NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now()
);


ALTER TABLE category.staff_certifications OWNER TO postgres;

--
-- TOC entry 316 (class 1259 OID 18578)
-- Name: staff_credentials; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.staff_credentials (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    staff_id uuid NOT NULL,
    credential text NOT NULL,
    is_verified boolean DEFAULT false NOT NULL
);


ALTER TABLE category.staff_credentials OWNER TO postgres;

--
-- TOC entry 322 (class 1259 OID 19395)
-- Name: staff_education; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.staff_education (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    staff_id uuid NOT NULL,
    degree character varying(200) NOT NULL,
    institution character varying(250) NOT NULL,
    year integer,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now()
);


ALTER TABLE category.staff_education OWNER TO postgres;

--
-- TOC entry 327 (class 1259 OID 19484)
-- Name: staff_gallery_items; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.staff_gallery_items (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title_translations jsonb DEFAULT '{}'::jsonb NOT NULL,
    description_translations jsonb DEFAULT '{}'::jsonb NOT NULL,
    url character varying(250) NOT NULL,
    media_type character varying(50) DEFAULT 'image'::character varying NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    is_primary boolean DEFAULT false NOT NULL,
    staff_id uuid NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone
);


ALTER TABLE category.staff_gallery_items OWNER TO postgres;

--
-- TOC entry 320 (class 1259 OID 19367)
-- Name: staff_languages; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.staff_languages (
    staff_id uuid NOT NULL,
    language text NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE category.staff_languages OWNER TO postgres;

--
-- TOC entry 263 (class 1259 OID 16595)
-- Name: staff_services; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.staff_services (
    id uuid NOT NULL,
    service_definition_id uuid NOT NULL,
    is_active boolean NOT NULL,
    notes_translations jsonb NOT NULL,
    staff_id uuid NOT NULL,
    create_date timestamp with time zone NOT NULL,
    last_modified_date timestamp with time zone
);


ALTER TABLE category.staff_services OWNER TO postgres;

--
-- TOC entry 321 (class 1259 OID 19381)
-- Name: staff_specializations; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.staff_specializations (
    staff_id uuid NOT NULL,
    specialty text NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE category.staff_specializations OWNER TO postgres;

--
-- TOC entry 264 (class 1259 OID 16600)
-- Name: __EFMigrationsHistory; Type: TABLE; Schema: customer; Owner: postgres
--

CREATE TABLE customer."__EFMigrationsHistory" (
    migration_id character varying(150) NOT NULL,
    product_version character varying(32) NOT NULL
);


ALTER TABLE customer."__EFMigrationsHistory" OWNER TO postgres;

--
-- TOC entry 265 (class 1259 OID 16603)
-- Name: consulting_selected_document_references; Type: TABLE; Schema: customer; Owner: postgres
--

CREATE TABLE customer.consulting_selected_document_references (
    customer_document_id uuid NOT NULL,
    consulting_id uuid NOT NULL
);


ALTER TABLE customer.consulting_selected_document_references OWNER TO postgres;

--
-- TOC entry 266 (class 1259 OID 16606)
-- Name: consultings; Type: TABLE; Schema: customer; Owner: postgres
--

CREATE TABLE customer.consultings (
    id uuid NOT NULL,
    customer_id uuid NOT NULL,
    description character varying(2000) NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now(),
    category_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    category_name character varying(250) DEFAULT ''::character varying NOT NULL
);


ALTER TABLE customer.consultings OWNER TO postgres;

--
-- TOC entry 267 (class 1259 OID 16615)
-- Name: customer_document_types; Type: TABLE; Schema: customer; Owner: postgres
--

CREATE TABLE customer.customer_document_types (
    id integer NOT NULL,
    name character varying(25) NOT NULL
);


ALTER TABLE customer.customer_document_types OWNER TO postgres;

--
-- TOC entry 268 (class 1259 OID 16618)
-- Name: customer_documents; Type: TABLE; Schema: customer; Owner: postgres
--

CREATE TABLE customer.customer_documents (
    id uuid NOT NULL,
    document_type_id integer NOT NULL,
    document_url character varying(250) NOT NULL,
    customer_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL,
    create_date timestamp with time zone NOT NULL,
    last_modified_date timestamp with time zone
);


ALTER TABLE customer.customer_documents OWNER TO postgres;

--
-- TOC entry 269 (class 1259 OID 16622)
-- Name: customers; Type: TABLE; Schema: customer; Owner: postgres
--

CREATE TABLE customer.customers (
    id uuid NOT NULL,
    phone_number character varying(15) NOT NULL,
    phone_number_country_code character varying(3) NOT NULL,
    email character varying(250) NOT NULL,
    birth_date timestamp with time zone,
    street_translations jsonb,
    city character varying(15),
    country character varying(15),
    detail_translations jsonb,
    zip_code character varying(50),
    first_name character varying(100) NOT NULL,
    last_name character varying(50) NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now(),
    gender character varying(25),
    is_active boolean DEFAULT true NOT NULL,
    latitude numeric(10,7),
    longitude numeric(10,7)
);


ALTER TABLE customer.customers OWNER TO postgres;

--
-- TOC entry 318 (class 1259 OID 19314)
-- Name: favorites; Type: TABLE; Schema: customer; Owner: postgres
--

CREATE TABLE customer.favorites (
    id bigint NOT NULL,
    customer_id uuid NOT NULL,
    favorite_type customer.favorite_type NOT NULL,
    entity_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE customer.favorites OWNER TO postgres;

--
-- TOC entry 317 (class 1259 OID 19313)
-- Name: favorites_id_seq; Type: SEQUENCE; Schema: customer; Owner: postgres
--

ALTER TABLE customer.favorites ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME customer.favorites_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 270 (class 1259 OID 16630)
-- Name: inbox_message_consumers; Type: TABLE; Schema: customer; Owner: postgres
--

CREATE TABLE customer.inbox_message_consumers (
    message_id uuid NOT NULL,
    name character varying(500) NOT NULL
);


ALTER TABLE customer.inbox_message_consumers OWNER TO postgres;

--
-- TOC entry 271 (class 1259 OID 16635)
-- Name: inbox_messages; Type: TABLE; Schema: customer; Owner: postgres
--

CREATE TABLE customer.inbox_messages (
    id uuid NOT NULL,
    type character varying(250) NOT NULL,
    content jsonb NOT NULL,
    occurred_on_utc timestamp with time zone NOT NULL,
    processed_on_utc timestamp with time zone,
    error text
);


ALTER TABLE customer.inbox_messages OWNER TO postgres;

--
-- TOC entry 272 (class 1259 OID 16640)
-- Name: internal_command_message_consumers; Type: TABLE; Schema: customer; Owner: postgres
--

CREATE TABLE customer.internal_command_message_consumers (
    message_id uuid NOT NULL,
    name character varying(500) NOT NULL
);


ALTER TABLE customer.internal_command_message_consumers OWNER TO postgres;

--
-- TOC entry 273 (class 1259 OID 16645)
-- Name: internal_command_messages; Type: TABLE; Schema: customer; Owner: postgres
--

CREATE TABLE customer.internal_command_messages (
    id uuid NOT NULL,
    type character varying(250) NOT NULL,
    content jsonb NOT NULL,
    occurred_on_utc timestamp with time zone NOT NULL,
    processed_on_utc timestamp with time zone,
    error text
);


ALTER TABLE customer.internal_command_messages OWNER TO postgres;

--
-- TOC entry 274 (class 1259 OID 16650)
-- Name: outbox_message_consumers; Type: TABLE; Schema: customer; Owner: postgres
--

CREATE TABLE customer.outbox_message_consumers (
    message_id uuid NOT NULL,
    name character varying(500) NOT NULL
);


ALTER TABLE customer.outbox_message_consumers OWNER TO postgres;

--
-- TOC entry 275 (class 1259 OID 16655)
-- Name: outbox_messages; Type: TABLE; Schema: customer; Owner: postgres
--

CREATE TABLE customer.outbox_messages (
    id uuid NOT NULL,
    type character varying(250) NOT NULL,
    content jsonb NOT NULL,
    occurred_on_utc timestamp with time zone NOT NULL,
    processed_on_utc timestamp with time zone,
    error text
);


ALTER TABLE customer.outbox_messages OWNER TO postgres;

--
-- TOC entry 276 (class 1259 OID 16660)
-- Name: __EFMigrationsHistory; Type: TABLE; Schema: identity; Owner: postgres
--

CREATE TABLE identity."__EFMigrationsHistory" (
    migration_id character varying(150) NOT NULL,
    product_version character varying(32) NOT NULL
);


ALTER TABLE identity."__EFMigrationsHistory" OWNER TO postgres;

--
-- TOC entry 277 (class 1259 OID 16663)
-- Name: access_tokens; Type: TABLE; Schema: identity; Owner: postgres
--

CREATE TABLE identity.access_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token character varying(2000) NOT NULL,
    created_at timestamp with time zone NOT NULL,
    expired_at timestamp with time zone NOT NULL,
    created_by_ip character varying(50) NOT NULL
);


ALTER TABLE identity.access_tokens OWNER TO postgres;

--
-- TOC entry 278 (class 1259 OID 16668)
-- Name: asp_net_role_claims; Type: TABLE; Schema: identity; Owner: postgres
--

CREATE TABLE identity.asp_net_role_claims (
    id integer NOT NULL,
    role_id uuid NOT NULL,
    claim_type text,
    claim_value text
);


ALTER TABLE identity.asp_net_role_claims OWNER TO postgres;

--
-- TOC entry 279 (class 1259 OID 16673)
-- Name: asp_net_role_claims_id_seq; Type: SEQUENCE; Schema: identity; Owner: postgres
--

ALTER TABLE identity.asp_net_role_claims ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME identity.asp_net_role_claims_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 280 (class 1259 OID 16674)
-- Name: asp_net_roles; Type: TABLE; Schema: identity; Owner: postgres
--

CREATE TABLE identity.asp_net_roles (
    id uuid NOT NULL,
    name character varying(256),
    normalized_name character varying(256),
    concurrency_stamp text
);


ALTER TABLE identity.asp_net_roles OWNER TO postgres;

--
-- TOC entry 281 (class 1259 OID 16679)
-- Name: asp_net_user_claims; Type: TABLE; Schema: identity; Owner: postgres
--

CREATE TABLE identity.asp_net_user_claims (
    id integer NOT NULL,
    user_id uuid NOT NULL,
    claim_type text,
    claim_value text
);


ALTER TABLE identity.asp_net_user_claims OWNER TO postgres;

--
-- TOC entry 282 (class 1259 OID 16684)
-- Name: asp_net_user_claims_id_seq; Type: SEQUENCE; Schema: identity; Owner: postgres
--

ALTER TABLE identity.asp_net_user_claims ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME identity.asp_net_user_claims_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 283 (class 1259 OID 16685)
-- Name: asp_net_user_logins; Type: TABLE; Schema: identity; Owner: postgres
--

CREATE TABLE identity.asp_net_user_logins (
    login_provider text NOT NULL,
    provider_key text NOT NULL,
    provider_display_name text,
    user_id uuid NOT NULL
);


ALTER TABLE identity.asp_net_user_logins OWNER TO postgres;

--
-- TOC entry 284 (class 1259 OID 16690)
-- Name: asp_net_user_roles; Type: TABLE; Schema: identity; Owner: postgres
--

CREATE TABLE identity.asp_net_user_roles (
    user_id uuid NOT NULL,
    role_id uuid NOT NULL
);


ALTER TABLE identity.asp_net_user_roles OWNER TO postgres;

--
-- TOC entry 285 (class 1259 OID 16693)
-- Name: asp_net_user_tokens; Type: TABLE; Schema: identity; Owner: postgres
--

CREATE TABLE identity.asp_net_user_tokens (
    user_id uuid NOT NULL,
    login_provider text NOT NULL,
    name text NOT NULL,
    value text
);


ALTER TABLE identity.asp_net_user_tokens OWNER TO postgres;

--
-- TOC entry 286 (class 1259 OID 16698)
-- Name: asp_net_users; Type: TABLE; Schema: identity; Owner: postgres
--

CREATE TABLE identity.asp_net_users (
    id uuid NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(50) NOT NULL,
    phone_number_country_code character varying(3) NOT NULL,
    last_logged_in_at timestamp with time zone,
    user_state text DEFAULT 'Active'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_name character varying(50) NOT NULL,
    normalized_user_name character varying(50) NOT NULL,
    email character varying(250) NOT NULL,
    normalized_email character varying(250) NOT NULL,
    email_confirmed boolean NOT NULL,
    password_hash text,
    security_stamp text,
    concurrency_stamp text,
    phone_number character varying(20) NOT NULL,
    phone_number_confirmed boolean NOT NULL,
    two_factor_enabled boolean NOT NULL,
    lockout_end timestamp with time zone,
    lockout_enabled boolean NOT NULL,
    access_failed_count integer NOT NULL
);


ALTER TABLE identity.asp_net_users OWNER TO postgres;

--
-- TOC entry 287 (class 1259 OID 16705)
-- Name: email_verification_codes; Type: TABLE; Schema: identity; Owner: postgres
--

CREATE TABLE identity.email_verification_codes (
    id uuid NOT NULL,
    email character varying(250) NOT NULL,
    code character(6) NOT NULL,
    sent_at timestamp with time zone NOT NULL,
    used_at timestamp with time zone
);


ALTER TABLE identity.email_verification_codes OWNER TO postgres;

--
-- TOC entry 288 (class 1259 OID 16708)
-- Name: inbox_message_consumers; Type: TABLE; Schema: identity; Owner: postgres
--

CREATE TABLE identity.inbox_message_consumers (
    message_id uuid NOT NULL,
    name character varying(500) NOT NULL
);


ALTER TABLE identity.inbox_message_consumers OWNER TO postgres;

--
-- TOC entry 289 (class 1259 OID 16713)
-- Name: inbox_messages; Type: TABLE; Schema: identity; Owner: postgres
--

CREATE TABLE identity.inbox_messages (
    id uuid NOT NULL,
    type character varying(250) NOT NULL,
    content jsonb NOT NULL,
    occurred_on_utc timestamp with time zone NOT NULL,
    processed_on_utc timestamp with time zone,
    error text
);


ALTER TABLE identity.inbox_messages OWNER TO postgres;

--
-- TOC entry 290 (class 1259 OID 16718)
-- Name: internal_command_message_consumers; Type: TABLE; Schema: identity; Owner: postgres
--

CREATE TABLE identity.internal_command_message_consumers (
    message_id uuid NOT NULL,
    name character varying(500) NOT NULL
);


ALTER TABLE identity.internal_command_message_consumers OWNER TO postgres;

--
-- TOC entry 291 (class 1259 OID 16723)
-- Name: internal_command_messages; Type: TABLE; Schema: identity; Owner: postgres
--

CREATE TABLE identity.internal_command_messages (
    id uuid NOT NULL,
    type character varying(250) NOT NULL,
    content jsonb NOT NULL,
    occurred_on_utc timestamp with time zone NOT NULL,
    processed_on_utc timestamp with time zone,
    error text
);


ALTER TABLE identity.internal_command_messages OWNER TO postgres;

--
-- TOC entry 292 (class 1259 OID 16728)
-- Name: outbox_message_consumers; Type: TABLE; Schema: identity; Owner: postgres
--

CREATE TABLE identity.outbox_message_consumers (
    message_id uuid NOT NULL,
    name character varying(500) NOT NULL
);


ALTER TABLE identity.outbox_message_consumers OWNER TO postgres;

--
-- TOC entry 293 (class 1259 OID 16733)
-- Name: outbox_messages; Type: TABLE; Schema: identity; Owner: postgres
--

CREATE TABLE identity.outbox_messages (
    id uuid NOT NULL,
    type character varying(250) NOT NULL,
    content jsonb NOT NULL,
    occurred_on_utc timestamp with time zone NOT NULL,
    processed_on_utc timestamp with time zone,
    error text
);


ALTER TABLE identity.outbox_messages OWNER TO postgres;

--
-- TOC entry 294 (class 1259 OID 16738)
-- Name: password_reset_codes; Type: TABLE; Schema: identity; Owner: postgres
--

CREATE TABLE identity.password_reset_codes (
    id uuid NOT NULL,
    email character varying(250) NOT NULL,
    code character varying(6) NOT NULL,
    sent_at timestamp with time zone NOT NULL,
    used_at timestamp with time zone
);


ALTER TABLE identity.password_reset_codes OWNER TO postgres;

--
-- TOC entry 295 (class 1259 OID 16741)
-- Name: phone_login_codes; Type: TABLE; Schema: identity; Owner: postgres
--

CREATE TABLE identity.phone_login_codes (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    code character(6) NOT NULL,
    sent_at timestamp with time zone NOT NULL,
    used_at timestamp with time zone,
    expires_at timestamp with time zone NOT NULL,
    attempt_count integer DEFAULT 0 NOT NULL,
    is_invalidated boolean DEFAULT false NOT NULL,
    phone_number_country_code character varying(3) NOT NULL,
    phone_number character varying(15) NOT NULL
);


ALTER TABLE identity.phone_login_codes OWNER TO postgres;

--
-- TOC entry 296 (class 1259 OID 16746)
-- Name: refresh_tokens; Type: TABLE; Schema: identity; Owner: postgres
--

CREATE TABLE identity.refresh_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token character varying(100) NOT NULL,
    created_at timestamp with time zone NOT NULL,
    expired_at timestamp with time zone NOT NULL,
    created_by_ip text NOT NULL,
    revoked_at timestamp with time zone
);


ALTER TABLE identity.refresh_tokens OWNER TO postgres;

--
-- TOC entry 311 (class 1259 OID 18497)
-- Name: offers; Type: TABLE; Schema: marketing; Owner: postgres
--

CREATE TABLE marketing.offers (
    id integer NOT NULL,
    provider_service_id uuid NOT NULL,
    title text NOT NULL,
    subtitle text,
    discount_percent numeric(5,2) NOT NULL,
    valid_until timestamp without time zone NOT NULL,
    code character varying(50),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    is_featured boolean DEFAULT false,
    usage_limit integer,
    used_count integer DEFAULT 0,
    CONSTRAINT valid_until_check CHECK ((valid_until > created_at))
);


ALTER TABLE marketing.offers OWNER TO postgres;

--
-- TOC entry 310 (class 1259 OID 18496)
-- Name: offers_id_seq; Type: SEQUENCE; Schema: marketing; Owner: postgres
--

CREATE SEQUENCE marketing.offers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE marketing.offers_id_seq OWNER TO postgres;

--
-- TOC entry 6139 (class 0 OID 0)
-- Dependencies: 310
-- Name: offers_id_seq; Type: SEQUENCE OWNED BY; Schema: marketing; Owner: postgres
--

ALTER SEQUENCE marketing.offers_id_seq OWNED BY marketing.offers.id;


--
-- TOC entry 297 (class 1259 OID 16751)
-- Name: translation_audit; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.translation_audit (
    id bigint NOT NULL,
    table_name text NOT NULL,
    column_name text NOT NULL,
    row_pk text NOT NULL,
    source_locale text NOT NULL,
    target_locale text NOT NULL,
    source_text text NOT NULL,
    translated_text text,
    status text NOT NULL,
    error text,
    model text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.translation_audit OWNER TO postgres;

--
-- TOC entry 298 (class 1259 OID 16757)
-- Name: translation_audit_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.translation_audit_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.translation_audit_id_seq OWNER TO postgres;

--
-- TOC entry 6140 (class 0 OID 0)
-- Dependencies: 298
-- Name: translation_audit_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.translation_audit_id_seq OWNED BY public.translation_audit.id;


--
-- TOC entry 312 (class 1259 OID 18520)
-- Name: trending_searches; Type: TABLE; Schema: search; Owner: postgres
--

CREATE TABLE search.trending_searches (
    term text,
    trend text,
    calculated_at timestamp without time zone
);


ALTER TABLE search.trending_searches OWNER TO postgres;

--
-- TOC entry 309 (class 1259 OID 18406)
-- Name: user_search_history; Type: TABLE; Schema: search; Owner: postgres
--

CREATE TABLE search.user_search_history (
    id integer NOT NULL,
    user_id text NOT NULL,
    term text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    category_id integer,
    normalized_term text
);


ALTER TABLE search.user_search_history OWNER TO postgres;

--
-- TOC entry 308 (class 1259 OID 18405)
-- Name: user_search_history_id_seq; Type: SEQUENCE; Schema: search; Owner: postgres
--

CREATE SEQUENCE search.user_search_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE search.user_search_history_id_seq OWNER TO postgres;

--
-- TOC entry 6141 (class 0 OID 0)
-- Dependencies: 308
-- Name: user_search_history_id_seq; Type: SEQUENCE OWNED BY; Schema: search; Owner: postgres
--

ALTER SEQUENCE search.user_search_history_id_seq OWNED BY search.user_search_history.id;


--
-- TOC entry 5520 (class 2604 OID 18395)
-- Name: category_groups id; Type: DEFAULT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.category_groups ALTER COLUMN id SET DEFAULT nextval('category.category_groups_id_seq'::regclass);


--
-- TOC entry 5523 (class 2604 OID 18500)
-- Name: offers id; Type: DEFAULT; Schema: marketing; Owner: postgres
--

ALTER TABLE ONLY marketing.offers ALTER COLUMN id SET DEFAULT nextval('marketing.offers_id_seq'::regclass);


--
-- TOC entry 5506 (class 2604 OID 16758)
-- Name: translation_audit id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.translation_audit ALTER COLUMN id SET DEFAULT nextval('public.translation_audit_id_seq'::regclass);


--
-- TOC entry 5521 (class 2604 OID 18409)
-- Name: user_search_history id; Type: DEFAULT; Schema: search; Owner: postgres
--

ALTER TABLE ONLY search.user_search_history ALTER COLUMN id SET DEFAULT nextval('search.user_search_history_id_seq'::regclass);


--
-- TOC entry 5850 (class 2606 OID 19298)
-- Name: bookings ex_bookings_no_overlap_per_specialist; Type: CONSTRAINT; Schema: booking; Owner: postgres
--

ALTER TABLE ONLY booking.bookings
    ADD CONSTRAINT ex_bookings_no_overlap_per_specialist EXCLUDE USING gist (provider_id WITH =, specialist_id WITH =, selected_date WITH =, tsrange(((selected_date)::timestamp without time zone + (selected_time_from)::interval), ((selected_date)::timestamp without time zone + (selected_time_to)::interval), '[)'::text) WITH &&) WHERE (((booking_status)::text = ANY ((ARRAY['Pending'::character varying, 'Confirmed'::character varying])::text[])));


--
-- TOC entry 5854 (class 2606 OID 19256)
-- Name: bookings pk_booking; Type: CONSTRAINT; Schema: booking; Owner: postgres
--

ALTER TABLE ONLY booking.bookings
    ADD CONSTRAINT pk_booking PRIMARY KEY (provider_id, service_id, specialist_id, selected_date, selected_time);


--
-- TOC entry 5856 (class 2606 OID 19274)
-- Name: bookings uq_bookings_id; Type: CONSTRAINT; Schema: booking; Owner: postgres
--

ALTER TABLE ONLY booking.bookings
    ADD CONSTRAINT uq_bookings_id UNIQUE (id);


--
-- TOC entry 5859 (class 2606 OID 18397)
-- Name: category_groups category_groups_pkey; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.category_groups
    ADD CONSTRAINT category_groups_pkey PRIMARY KEY (id);


--
-- TOC entry 5590 (class 2606 OID 16967)
-- Name: __EFMigrationsHistory pk___ef_migrations_history; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category."__EFMigrationsHistory"
    ADD CONSTRAINT pk___ef_migrations_history PRIMARY KEY (migration_id);


--
-- TOC entry 5873 (class 2606 OID 18550)
-- Name: addon_details pk_addon_details; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.addon_details
    ADD CONSTRAINT pk_addon_details PRIMARY KEY (id);


--
-- TOC entry 5870 (class 2606 OID 18541)
-- Name: addons pk_addons; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.addons
    ADD CONSTRAINT pk_addons PRIMARY KEY (id);


--
-- TOC entry 5592 (class 2606 OID 16969)
-- Name: attribute_types pk_attribute_types; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.attribute_types
    ADD CONSTRAINT pk_attribute_types PRIMARY KEY (id);


--
-- TOC entry 5595 (class 2606 OID 16971)
-- Name: categories pk_categories; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.categories
    ADD CONSTRAINT pk_categories PRIMARY KEY (id);


--
-- TOC entry 5597 (class 2606 OID 16973)
-- Name: currencies pk_currencies; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.currencies
    ADD CONSTRAINT pk_currencies PRIMARY KEY (id);


--
-- TOC entry 5600 (class 2606 OID 16975)
-- Name: inbox_message_consumers pk_inbox_message_consumers; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.inbox_message_consumers
    ADD CONSTRAINT pk_inbox_message_consumers PRIMARY KEY (message_id, name);


--
-- TOC entry 5606 (class 2606 OID 16977)
-- Name: inbox_messages pk_inbox_messages; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.inbox_messages
    ADD CONSTRAINT pk_inbox_messages PRIMARY KEY (id);


--
-- TOC entry 5609 (class 2606 OID 16979)
-- Name: internal_command_message_consumers pk_internal_command_message_consumers; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.internal_command_message_consumers
    ADD CONSTRAINT pk_internal_command_message_consumers PRIMARY KEY (message_id, name);


--
-- TOC entry 5615 (class 2606 OID 16981)
-- Name: internal_command_messages pk_internal_command_messages; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.internal_command_messages
    ADD CONSTRAINT pk_internal_command_messages PRIMARY KEY (id);


--
-- TOC entry 5588 (class 2606 OID 16983)
-- Name: LocationType pk_location_type; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category."LocationType"
    ADD CONSTRAINT pk_location_type PRIMARY KEY (id);


--
-- TOC entry 5620 (class 2606 OID 16985)
-- Name: locations pk_locations; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.locations
    ADD CONSTRAINT pk_locations PRIMARY KEY (id);


--
-- TOC entry 5625 (class 2606 OID 16987)
-- Name: outbox_message_consumers pk_outbox_message_consumers; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.outbox_message_consumers
    ADD CONSTRAINT pk_outbox_message_consumers PRIMARY KEY (message_id, name);


--
-- TOC entry 5631 (class 2606 OID 16989)
-- Name: outbox_messages pk_outbox_messages; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.outbox_messages
    ADD CONSTRAINT pk_outbox_messages PRIMARY KEY (id);


--
-- TOC entry 5633 (class 2606 OID 16991)
-- Name: provider_attribute_definition_domain_options pk_provider_attribute_definition_domain_options; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.provider_attribute_definition_domain_options
    ADD CONSTRAINT pk_provider_attribute_definition_domain_options PRIMARY KEY (provider_attribute_definition_id, id);


--
-- TOC entry 5637 (class 2606 OID 16993)
-- Name: provider_attribute_definitions pk_provider_attribute_definitions; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.provider_attribute_definitions
    ADD CONSTRAINT pk_provider_attribute_definitions PRIMARY KEY (id);


--
-- TOC entry 5641 (class 2606 OID 16995)
-- Name: provider_attributes pk_provider_attributes; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.provider_attributes
    ADD CONSTRAINT pk_provider_attributes PRIMARY KEY (id);


--
-- TOC entry 5645 (class 2606 OID 16997)
-- Name: provider_gallery_items pk_provider_gallery_items; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.provider_gallery_items
    ADD CONSTRAINT pk_provider_gallery_items PRIMARY KEY (id);


--
-- TOC entry 5914 (class 2606 OID 19475)
-- Name: provider_languages pk_provider_languages; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.provider_languages
    ADD CONSTRAINT pk_provider_languages PRIMARY KEY (service_provider_id, language);


--
-- TOC entry 5649 (class 2606 OID 16999)
-- Name: provider_policies pk_provider_policies; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.provider_policies
    ADD CONSTRAINT pk_provider_policies PRIMARY KEY (id);


--
-- TOC entry 5876 (class 2606 OID 18562)
-- Name: provider_service_addons pk_provider_service_addons; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.provider_service_addons
    ADD CONSTRAINT pk_provider_service_addons PRIMARY KEY (provider_service_id, addon_id);


--
-- TOC entry 5923 (class 2606 OID 19519)
-- Name: provider_service_gallery_items pk_provider_service_gallery_items; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.provider_service_gallery_items
    ADD CONSTRAINT pk_provider_service_gallery_items PRIMARY KEY (id);


--
-- TOC entry 5655 (class 2606 OID 17001)
-- Name: provider_services pk_provider_services; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.provider_services
    ADD CONSTRAINT pk_provider_services PRIMARY KEY (id);


--
-- TOC entry 5660 (class 2606 OID 17003)
-- Name: provider_staffs pk_provider_staffs; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.provider_staffs
    ADD CONSTRAINT pk_provider_staffs PRIMARY KEY (id);


--
-- TOC entry 5662 (class 2606 OID 17005)
-- Name: provider_types pk_provider_types; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.provider_types
    ADD CONSTRAINT pk_provider_types PRIMARY KEY (id);


--
-- TOC entry 5664 (class 2606 OID 17007)
-- Name: service_attribute_definition_options pk_service_attribute_definition_options; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.service_attribute_definition_options
    ADD CONSTRAINT pk_service_attribute_definition_options PRIMARY KEY (service_attribute_definition_id, id);


--
-- TOC entry 5668 (class 2606 OID 17009)
-- Name: service_attribute_definitions pk_service_attribute_definitions; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.service_attribute_definitions
    ADD CONSTRAINT pk_service_attribute_definitions PRIMARY KEY (id);


--
-- TOC entry 5672 (class 2606 OID 17011)
-- Name: service_attribute_values pk_service_attribute_values; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.service_attribute_values
    ADD CONSTRAINT pk_service_attribute_values PRIMARY KEY (id);


--
-- TOC entry 5674 (class 2606 OID 17013)
-- Name: service_definition_domain_requirements pk_service_definition_domain_requirements; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.service_definition_domain_requirements
    ADD CONSTRAINT pk_service_definition_domain_requirements PRIMARY KEY (service_definition_id, id);


--
-- TOC entry 5677 (class 2606 OID 17015)
-- Name: service_definitions pk_service_definitions; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.service_definitions
    ADD CONSTRAINT pk_service_definitions PRIMARY KEY (id);


--
-- TOC entry 5683 (class 2606 OID 17017)
-- Name: service_provider_comments pk_service_provider_comments; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.service_provider_comments
    ADD CONSTRAINT pk_service_provider_comments PRIMARY KEY (id);


--
-- TOC entry 5685 (class 2606 OID 17019)
-- Name: service_provider_grades pk_service_provider_grades; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.service_provider_grades
    ADD CONSTRAINT pk_service_provider_grades PRIMARY KEY (id);


--
-- TOC entry 5687 (class 2606 OID 17021)
-- Name: service_provider_request_statuses pk_service_provider_request_statuses; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.service_provider_request_statuses
    ADD CONSTRAINT pk_service_provider_request_statuses PRIMARY KEY (id);


--
-- TOC entry 5692 (class 2606 OID 17023)
-- Name: service_provider_requests pk_service_provider_requests; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.service_provider_requests
    ADD CONSTRAINT pk_service_provider_requests PRIMARY KEY (id);


--
-- TOC entry 5703 (class 2606 OID 17025)
-- Name: service_providers pk_service_providers; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.service_providers
    ADD CONSTRAINT pk_service_providers PRIMARY KEY (id);


--
-- TOC entry 5890 (class 2606 OID 19355)
-- Name: service_upload_file_requirements pk_service_upload_file_requirements; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.service_upload_file_requirements
    ADD CONSTRAINT pk_service_upload_file_requirements PRIMARY KEY (id);


--
-- TOC entry 5705 (class 2606 OID 17027)
-- Name: staff pk_staff; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.staff
    ADD CONSTRAINT pk_staff PRIMARY KEY (id);


--
-- TOC entry 5907 (class 2606 OID 19435)
-- Name: staff_achievements pk_staff_achievements; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.staff_achievements
    ADD CONSTRAINT pk_staff_achievements PRIMARY KEY (id);


--
-- TOC entry 5711 (class 2606 OID 17029)
-- Name: staff_availabilities pk_staff_availabilities; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.staff_availabilities
    ADD CONSTRAINT pk_staff_availabilities PRIMARY KEY (id);


--
-- TOC entry 5713 (class 2606 OID 17031)
-- Name: staff_availability_statuses pk_staff_availability_statuses; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.staff_availability_statuses
    ADD CONSTRAINT pk_staff_availability_statuses PRIMARY KEY (id);


--
-- TOC entry 5911 (class 2606 OID 19453)
-- Name: staff_before_after pk_staff_before_after; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.staff_before_after
    ADD CONSTRAINT pk_staff_before_after PRIMARY KEY (id);


--
-- TOC entry 5903 (class 2606 OID 19418)
-- Name: staff_certifications pk_staff_certifications; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.staff_certifications
    ADD CONSTRAINT pk_staff_certifications PRIMARY KEY (id);


--
-- TOC entry 5879 (class 2606 OID 18586)
-- Name: staff_credentials pk_staff_credentials; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.staff_credentials
    ADD CONSTRAINT pk_staff_credentials PRIMARY KEY (id);


--
-- TOC entry 5900 (class 2606 OID 19402)
-- Name: staff_education pk_staff_education; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.staff_education
    ADD CONSTRAINT pk_staff_education PRIMARY KEY (id);


--
-- TOC entry 5918 (class 2606 OID 19497)
-- Name: staff_gallery_items pk_staff_gallery_items; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.staff_gallery_items
    ADD CONSTRAINT pk_staff_gallery_items PRIMARY KEY (id);


--
-- TOC entry 5893 (class 2606 OID 19374)
-- Name: staff_languages pk_staff_languages; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.staff_languages
    ADD CONSTRAINT pk_staff_languages PRIMARY KEY (staff_id, language);


--
-- TOC entry 5718 (class 2606 OID 17033)
-- Name: staff_services pk_staff_services; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.staff_services
    ADD CONSTRAINT pk_staff_services PRIMARY KEY (id);


--
-- TOC entry 5896 (class 2606 OID 19388)
-- Name: staff_specializations pk_staff_specializations; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.staff_specializations
    ADD CONSTRAINT pk_staff_specializations PRIMARY KEY (staff_id, specialty);


--
-- TOC entry 5837 (class 2606 OID 17878)
-- Name: provider_certifications provider_certifications_pkey; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.provider_certifications
    ADD CONSTRAINT provider_certifications_pkey PRIMARY KEY (id);


--
-- TOC entry 5842 (class 2606 OID 17897)
-- Name: provider_recommendations provider_recommendations_pkey; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.provider_recommendations
    ADD CONSTRAINT provider_recommendations_pkey PRIMARY KEY (id);


--
-- TOC entry 5840 (class 2606 OID 17890)
-- Name: review_images review_images_pkey; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.review_images
    ADD CONSTRAINT review_images_pkey PRIMARY KEY (id);


--
-- TOC entry 5848 (class 2606 OID 17919)
-- Name: service_faqs service_faqs_pkey; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.service_faqs
    ADD CONSTRAINT service_faqs_pkey PRIMARY KEY (id);


--
-- TOC entry 5844 (class 2606 OID 17903)
-- Name: service_included service_included_pkey; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.service_included
    ADD CONSTRAINT service_included_pkey PRIMARY KEY (id);


--
-- TOC entry 5846 (class 2606 OID 17911)
-- Name: service_process service_process_pkey; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.service_process
    ADD CONSTRAINT service_process_pkey PRIMARY KEY (id);


--
-- TOC entry 5881 (class 2606 OID 19319)
-- Name: favorites favorites_pkey; Type: CONSTRAINT; Schema: customer; Owner: postgres
--

ALTER TABLE ONLY customer.favorites
    ADD CONSTRAINT favorites_pkey PRIMARY KEY (id);


--
-- TOC entry 5720 (class 2606 OID 17035)
-- Name: __EFMigrationsHistory pk___ef_migrations_history; Type: CONSTRAINT; Schema: customer; Owner: postgres
--

ALTER TABLE ONLY customer."__EFMigrationsHistory"
    ADD CONSTRAINT pk___ef_migrations_history PRIMARY KEY (migration_id);


--
-- TOC entry 5722 (class 2606 OID 17037)
-- Name: consulting_selected_document_references pk_consulting_selected_document_references; Type: CONSTRAINT; Schema: customer; Owner: postgres
--

ALTER TABLE ONLY customer.consulting_selected_document_references
    ADD CONSTRAINT pk_consulting_selected_document_references PRIMARY KEY (consulting_id, customer_document_id);


--
-- TOC entry 5726 (class 2606 OID 17039)
-- Name: consultings pk_consultings; Type: CONSTRAINT; Schema: customer; Owner: postgres
--

ALTER TABLE ONLY customer.consultings
    ADD CONSTRAINT pk_consultings PRIMARY KEY (id);


--
-- TOC entry 5728 (class 2606 OID 17041)
-- Name: customer_document_types pk_customer_document_types; Type: CONSTRAINT; Schema: customer; Owner: postgres
--

ALTER TABLE ONLY customer.customer_document_types
    ADD CONSTRAINT pk_customer_document_types PRIMARY KEY (id);


--
-- TOC entry 5732 (class 2606 OID 17043)
-- Name: customer_documents pk_customer_documents; Type: CONSTRAINT; Schema: customer; Owner: postgres
--

ALTER TABLE ONLY customer.customer_documents
    ADD CONSTRAINT pk_customer_documents PRIMARY KEY (id);


--
-- TOC entry 5736 (class 2606 OID 17045)
-- Name: customers pk_customers; Type: CONSTRAINT; Schema: customer; Owner: postgres
--

ALTER TABLE ONLY customer.customers
    ADD CONSTRAINT pk_customers PRIMARY KEY (id);


--
-- TOC entry 5739 (class 2606 OID 17047)
-- Name: inbox_message_consumers pk_inbox_message_consumers; Type: CONSTRAINT; Schema: customer; Owner: postgres
--

ALTER TABLE ONLY customer.inbox_message_consumers
    ADD CONSTRAINT pk_inbox_message_consumers PRIMARY KEY (message_id, name);


--
-- TOC entry 5745 (class 2606 OID 17049)
-- Name: inbox_messages pk_inbox_messages; Type: CONSTRAINT; Schema: customer; Owner: postgres
--

ALTER TABLE ONLY customer.inbox_messages
    ADD CONSTRAINT pk_inbox_messages PRIMARY KEY (id);


--
-- TOC entry 5748 (class 2606 OID 17051)
-- Name: internal_command_message_consumers pk_internal_command_message_consumers; Type: CONSTRAINT; Schema: customer; Owner: postgres
--

ALTER TABLE ONLY customer.internal_command_message_consumers
    ADD CONSTRAINT pk_internal_command_message_consumers PRIMARY KEY (message_id, name);


--
-- TOC entry 5754 (class 2606 OID 17053)
-- Name: internal_command_messages pk_internal_command_messages; Type: CONSTRAINT; Schema: customer; Owner: postgres
--

ALTER TABLE ONLY customer.internal_command_messages
    ADD CONSTRAINT pk_internal_command_messages PRIMARY KEY (id);


--
-- TOC entry 5757 (class 2606 OID 17055)
-- Name: outbox_message_consumers pk_outbox_message_consumers; Type: CONSTRAINT; Schema: customer; Owner: postgres
--

ALTER TABLE ONLY customer.outbox_message_consumers
    ADD CONSTRAINT pk_outbox_message_consumers PRIMARY KEY (message_id, name);


--
-- TOC entry 5763 (class 2606 OID 17057)
-- Name: outbox_messages pk_outbox_messages; Type: CONSTRAINT; Schema: customer; Owner: postgres
--

ALTER TABLE ONLY customer.outbox_messages
    ADD CONSTRAINT pk_outbox_messages PRIMARY KEY (id);


--
-- TOC entry 5886 (class 2606 OID 19321)
-- Name: favorites uq_favorites_customer_type_entity; Type: CONSTRAINT; Schema: customer; Owner: postgres
--

ALTER TABLE ONLY customer.favorites
    ADD CONSTRAINT uq_favorites_customer_type_entity UNIQUE (customer_id, favorite_type, entity_id);


--
-- TOC entry 5765 (class 2606 OID 17059)
-- Name: __EFMigrationsHistory pk___ef_migrations_history; Type: CONSTRAINT; Schema: identity; Owner: postgres
--

ALTER TABLE ONLY identity."__EFMigrationsHistory"
    ADD CONSTRAINT pk___ef_migrations_history PRIMARY KEY (migration_id);


--
-- TOC entry 5769 (class 2606 OID 17061)
-- Name: access_tokens pk_access_tokens; Type: CONSTRAINT; Schema: identity; Owner: postgres
--

ALTER TABLE ONLY identity.access_tokens
    ADD CONSTRAINT pk_access_tokens PRIMARY KEY (id);


--
-- TOC entry 5772 (class 2606 OID 17063)
-- Name: asp_net_role_claims pk_asp_net_role_claims; Type: CONSTRAINT; Schema: identity; Owner: postgres
--

ALTER TABLE ONLY identity.asp_net_role_claims
    ADD CONSTRAINT pk_asp_net_role_claims PRIMARY KEY (id);


--
-- TOC entry 5775 (class 2606 OID 17065)
-- Name: asp_net_roles pk_asp_net_roles; Type: CONSTRAINT; Schema: identity; Owner: postgres
--

ALTER TABLE ONLY identity.asp_net_roles
    ADD CONSTRAINT pk_asp_net_roles PRIMARY KEY (id);


--
-- TOC entry 5778 (class 2606 OID 17067)
-- Name: asp_net_user_claims pk_asp_net_user_claims; Type: CONSTRAINT; Schema: identity; Owner: postgres
--

ALTER TABLE ONLY identity.asp_net_user_claims
    ADD CONSTRAINT pk_asp_net_user_claims PRIMARY KEY (id);


--
-- TOC entry 5781 (class 2606 OID 17069)
-- Name: asp_net_user_logins pk_asp_net_user_logins; Type: CONSTRAINT; Schema: identity; Owner: postgres
--

ALTER TABLE ONLY identity.asp_net_user_logins
    ADD CONSTRAINT pk_asp_net_user_logins PRIMARY KEY (login_provider, provider_key);


--
-- TOC entry 5784 (class 2606 OID 17071)
-- Name: asp_net_user_roles pk_asp_net_user_roles; Type: CONSTRAINT; Schema: identity; Owner: postgres
--

ALTER TABLE ONLY identity.asp_net_user_roles
    ADD CONSTRAINT pk_asp_net_user_roles PRIMARY KEY (user_id, role_id);


--
-- TOC entry 5786 (class 2606 OID 17073)
-- Name: asp_net_user_tokens pk_asp_net_user_tokens; Type: CONSTRAINT; Schema: identity; Owner: postgres
--

ALTER TABLE ONLY identity.asp_net_user_tokens
    ADD CONSTRAINT pk_asp_net_user_tokens PRIMARY KEY (user_id, login_provider, name);


--
-- TOC entry 5792 (class 2606 OID 17075)
-- Name: asp_net_users pk_asp_net_users; Type: CONSTRAINT; Schema: identity; Owner: postgres
--

ALTER TABLE ONLY identity.asp_net_users
    ADD CONSTRAINT pk_asp_net_users PRIMARY KEY (id);


--
-- TOC entry 5794 (class 2606 OID 17077)
-- Name: email_verification_codes pk_email_verification_codes; Type: CONSTRAINT; Schema: identity; Owner: postgres
--

ALTER TABLE ONLY identity.email_verification_codes
    ADD CONSTRAINT pk_email_verification_codes PRIMARY KEY (id);


--
-- TOC entry 5797 (class 2606 OID 17079)
-- Name: inbox_message_consumers pk_inbox_message_consumers; Type: CONSTRAINT; Schema: identity; Owner: postgres
--

ALTER TABLE ONLY identity.inbox_message_consumers
    ADD CONSTRAINT pk_inbox_message_consumers PRIMARY KEY (message_id, name);


--
-- TOC entry 5803 (class 2606 OID 17081)
-- Name: inbox_messages pk_inbox_messages; Type: CONSTRAINT; Schema: identity; Owner: postgres
--

ALTER TABLE ONLY identity.inbox_messages
    ADD CONSTRAINT pk_inbox_messages PRIMARY KEY (id);


--
-- TOC entry 5806 (class 2606 OID 17083)
-- Name: internal_command_message_consumers pk_internal_command_message_consumers; Type: CONSTRAINT; Schema: identity; Owner: postgres
--

ALTER TABLE ONLY identity.internal_command_message_consumers
    ADD CONSTRAINT pk_internal_command_message_consumers PRIMARY KEY (message_id, name);


--
-- TOC entry 5812 (class 2606 OID 17085)
-- Name: internal_command_messages pk_internal_command_messages; Type: CONSTRAINT; Schema: identity; Owner: postgres
--

ALTER TABLE ONLY identity.internal_command_messages
    ADD CONSTRAINT pk_internal_command_messages PRIMARY KEY (id);


--
-- TOC entry 5815 (class 2606 OID 17087)
-- Name: outbox_message_consumers pk_outbox_message_consumers; Type: CONSTRAINT; Schema: identity; Owner: postgres
--

ALTER TABLE ONLY identity.outbox_message_consumers
    ADD CONSTRAINT pk_outbox_message_consumers PRIMARY KEY (message_id, name);


--
-- TOC entry 5821 (class 2606 OID 17089)
-- Name: outbox_messages pk_outbox_messages; Type: CONSTRAINT; Schema: identity; Owner: postgres
--

ALTER TABLE ONLY identity.outbox_messages
    ADD CONSTRAINT pk_outbox_messages PRIMARY KEY (id);


--
-- TOC entry 5823 (class 2606 OID 17091)
-- Name: password_reset_codes pk_password_reset_codes; Type: CONSTRAINT; Schema: identity; Owner: postgres
--

ALTER TABLE ONLY identity.password_reset_codes
    ADD CONSTRAINT pk_password_reset_codes PRIMARY KEY (id);


--
-- TOC entry 5828 (class 2606 OID 17093)
-- Name: phone_login_codes pk_phone_login_codes; Type: CONSTRAINT; Schema: identity; Owner: postgres
--

ALTER TABLE ONLY identity.phone_login_codes
    ADD CONSTRAINT pk_phone_login_codes PRIMARY KEY (id);


--
-- TOC entry 5832 (class 2606 OID 17095)
-- Name: refresh_tokens pk_refresh_tokens; Type: CONSTRAINT; Schema: identity; Owner: postgres
--

ALTER TABLE ONLY identity.refresh_tokens
    ADD CONSTRAINT pk_refresh_tokens PRIMARY KEY (id);


--
-- TOC entry 5868 (class 2606 OID 18506)
-- Name: offers offers_pkey; Type: CONSTRAINT; Schema: marketing; Owner: postgres
--

ALTER TABLE ONLY marketing.offers
    ADD CONSTRAINT offers_pkey PRIMARY KEY (id);


--
-- TOC entry 5835 (class 2606 OID 17097)
-- Name: translation_audit translation_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.translation_audit
    ADD CONSTRAINT translation_audit_pkey PRIMARY KEY (id);


--
-- TOC entry 5864 (class 2606 OID 18414)
-- Name: user_search_history user_search_history_pkey; Type: CONSTRAINT; Schema: search; Owner: postgres
--

ALTER TABLE ONLY search.user_search_history
    ADD CONSTRAINT user_search_history_pkey PRIMARY KEY (id);


--
-- TOC entry 5851 (class 1259 OID 19296)
-- Name: ix_booking_bookings_provider_service_specialist_selected_date; Type: INDEX; Schema: booking; Owner: postgres
--

CREATE INDEX ix_booking_bookings_provider_service_specialist_selected_date ON booking.bookings USING btree (provider_id, service_id, specialist_id, selected_date);


--
-- TOC entry 5852 (class 1259 OID 19295)
-- Name: ix_booking_bookings_provider_specialist_selected_date; Type: INDEX; Schema: booking; Owner: postgres
--

CREATE INDEX ix_booking_bookings_provider_specialist_selected_date ON booking.bookings USING btree (provider_id, specialist_id, selected_date);


--
-- TOC entry 5857 (class 1259 OID 19366)
-- Name: ux_bookings_one_pending_checkout_per_user; Type: INDEX; Schema: booking; Owner: postgres
--

CREATE UNIQUE INDEX ux_bookings_one_pending_checkout_per_user ON booking.bookings USING btree (user_id) WHERE ((booking_status)::text = 'Pending'::text);


--
-- TOC entry 5601 (class 1259 OID 17098)
-- Name: idx_inbox_messages_occurred_on; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX idx_inbox_messages_occurred_on ON category.inbox_messages USING btree (occurred_on_utc);


--
-- TOC entry 5602 (class 1259 OID 17099)
-- Name: idx_inbox_messages_processed_occurred; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX idx_inbox_messages_processed_occurred ON category.inbox_messages USING btree (processed_on_utc, occurred_on_utc);


--
-- TOC entry 5603 (class 1259 OID 17100)
-- Name: idx_inbox_messages_processed_on; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX idx_inbox_messages_processed_on ON category.inbox_messages USING btree (processed_on_utc);


--
-- TOC entry 5604 (class 1259 OID 17101)
-- Name: idx_inbox_messages_unprocessed; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX idx_inbox_messages_unprocessed ON category.inbox_messages USING btree (occurred_on_utc, processed_on_utc) INCLUDE (id, type, content) WHERE (processed_on_utc IS NULL);


--
-- TOC entry 5610 (class 1259 OID 17102)
-- Name: idx_internal_command_messages_occurred_on; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX idx_internal_command_messages_occurred_on ON category.internal_command_messages USING btree (occurred_on_utc);


--
-- TOC entry 5611 (class 1259 OID 17103)
-- Name: idx_internal_command_messages_processed_occurred; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX idx_internal_command_messages_processed_occurred ON category.internal_command_messages USING btree (processed_on_utc, occurred_on_utc);


--
-- TOC entry 5612 (class 1259 OID 17104)
-- Name: idx_internal_command_messages_processed_on; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX idx_internal_command_messages_processed_on ON category.internal_command_messages USING btree (processed_on_utc);


--
-- TOC entry 5613 (class 1259 OID 17105)
-- Name: idx_internal_command_messages_unprocessed; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX idx_internal_command_messages_unprocessed ON category.internal_command_messages USING btree (occurred_on_utc, processed_on_utc) INCLUDE (id, type, content) WHERE (processed_on_utc IS NULL);


--
-- TOC entry 5626 (class 1259 OID 17106)
-- Name: idx_outbox_messages_occurred_on; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX idx_outbox_messages_occurred_on ON category.outbox_messages USING btree (occurred_on_utc);


--
-- TOC entry 5627 (class 1259 OID 17107)
-- Name: idx_outbox_messages_processed_occurred; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX idx_outbox_messages_processed_occurred ON category.outbox_messages USING btree (processed_on_utc, occurred_on_utc);


--
-- TOC entry 5628 (class 1259 OID 17108)
-- Name: idx_outbox_messages_processed_on; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX idx_outbox_messages_processed_on ON category.outbox_messages USING btree (processed_on_utc);


--
-- TOC entry 5629 (class 1259 OID 17109)
-- Name: idx_outbox_messages_unprocessed; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX idx_outbox_messages_unprocessed ON category.outbox_messages USING btree (occurred_on_utc, processed_on_utc) INCLUDE (id, type, content) WHERE (processed_on_utc IS NULL);


--
-- TOC entry 5650 (class 1259 OID 18403)
-- Name: idx_provider_services_search; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX idx_provider_services_search ON category.provider_services USING gin (search_vector);


--
-- TOC entry 5693 (class 1259 OID 18404)
-- Name: idx_providers_search; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX idx_providers_search ON category.service_providers USING gin (search_vector);


--
-- TOC entry 5598 (class 1259 OID 17110)
-- Name: inbox_message_consumers_message_id_name; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX inbox_message_consumers_message_id_name ON category.inbox_message_consumers USING btree (message_id, name);


--
-- TOC entry 5607 (class 1259 OID 17111)
-- Name: internal_command_message_consumers_message_id_name; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX internal_command_message_consumers_message_id_name ON category.internal_command_message_consumers USING btree (message_id, name);


--
-- TOC entry 5871 (class 1259 OID 18573)
-- Name: ix_addon_details_addon_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_addon_details_addon_id ON category.addon_details USING btree (addon_id);


--
-- TOC entry 5593 (class 1259 OID 17112)
-- Name: ix_categories_parent_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_categories_parent_id ON category.categories USING btree (parent_id);


--
-- TOC entry 5616 (class 1259 OID 17113)
-- Name: ix_locations_code; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_locations_code ON category.locations USING btree (code);


--
-- TOC entry 5617 (class 1259 OID 17114)
-- Name: ix_locations_location_type_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_locations_location_type_id ON category.locations USING btree (location_type_id);


--
-- TOC entry 5618 (class 1259 OID 17115)
-- Name: ix_locations_parent_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_locations_parent_id ON category.locations USING btree (parent_id);


--
-- TOC entry 5634 (class 1259 OID 17116)
-- Name: ix_provider_attribute_definitions_attribute_type_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_provider_attribute_definitions_attribute_type_id ON category.provider_attribute_definitions USING btree (attribute_type_id);


--
-- TOC entry 5635 (class 1259 OID 17117)
-- Name: ix_provider_attribute_definitions_provider_type_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_provider_attribute_definitions_provider_type_id ON category.provider_attribute_definitions USING btree (provider_type_id);


--
-- TOC entry 5638 (class 1259 OID 17118)
-- Name: ix_provider_attributes_attribute_definition_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_provider_attributes_attribute_definition_id ON category.provider_attributes USING btree (attribute_definition_id);


--
-- TOC entry 5639 (class 1259 OID 17119)
-- Name: ix_provider_attributes_service_provider_id_attribute_definitio; Type: INDEX; Schema: category; Owner: postgres
--

CREATE UNIQUE INDEX ix_provider_attributes_service_provider_id_attribute_definitio ON category.provider_attributes USING btree (service_provider_id, attribute_definition_id);


--
-- TOC entry 5642 (class 1259 OID 17120)
-- Name: ix_provider_gallery_items_display_order; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_provider_gallery_items_display_order ON category.provider_gallery_items USING btree (display_order);


--
-- TOC entry 5643 (class 1259 OID 17121)
-- Name: ix_provider_gallery_items_service_provider_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_provider_gallery_items_service_provider_id ON category.provider_gallery_items USING btree (service_provider_id);


--
-- TOC entry 5912 (class 1259 OID 19481)
-- Name: ix_provider_languages_service_provider_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_provider_languages_service_provider_id ON category.provider_languages USING btree (service_provider_id);


--
-- TOC entry 5646 (class 1259 OID 17122)
-- Name: ix_provider_policies_service_provider_id_type_translations; Type: INDEX; Schema: category; Owner: postgres
--

CREATE UNIQUE INDEX ix_provider_policies_service_provider_id_type_translations ON category.provider_policies USING btree (service_provider_id, type_translations);


--
-- TOC entry 5647 (class 1259 OID 17123)
-- Name: ix_provider_policies_type_translations; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_provider_policies_type_translations ON category.provider_policies USING btree (type_translations);


--
-- TOC entry 5920 (class 1259 OID 19526)
-- Name: ix_provider_service_gallery_items_display_order; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_provider_service_gallery_items_display_order ON category.provider_service_gallery_items USING btree (provider_service_id, display_order);


--
-- TOC entry 5921 (class 1259 OID 19525)
-- Name: ix_provider_service_gallery_items_service_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_provider_service_gallery_items_service_id ON category.provider_service_gallery_items USING btree (provider_service_id);


--
-- TOC entry 5651 (class 1259 OID 17124)
-- Name: ix_provider_services_is_active; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_provider_services_is_active ON category.provider_services USING btree (is_active);


--
-- TOC entry 5652 (class 1259 OID 17125)
-- Name: ix_provider_services_service_definition_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_provider_services_service_definition_id ON category.provider_services USING btree (service_definition_id);


--
-- TOC entry 5653 (class 1259 OID 17126)
-- Name: ix_provider_services_service_provider_id_service_definition_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE UNIQUE INDEX ix_provider_services_service_provider_id_service_definition_id ON category.provider_services USING btree (service_provider_id, service_definition_id);


--
-- TOC entry 5656 (class 1259 OID 17127)
-- Name: ix_provider_staffs_is_active; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_provider_staffs_is_active ON category.provider_staffs USING btree (is_active);


--
-- TOC entry 5657 (class 1259 OID 17128)
-- Name: ix_provider_staffs_service_provider_id_staff_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE UNIQUE INDEX ix_provider_staffs_service_provider_id_staff_id ON category.provider_staffs USING btree (service_provider_id, staff_id);


--
-- TOC entry 5658 (class 1259 OID 17129)
-- Name: ix_provider_staffs_staff_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_provider_staffs_staff_id ON category.provider_staffs USING btree (staff_id);


--
-- TOC entry 5874 (class 1259 OID 18574)
-- Name: ix_psa_addon_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_psa_addon_id ON category.provider_service_addons USING btree (addon_id);


--
-- TOC entry 5838 (class 1259 OID 19466)
-- Name: ix_review_images_review_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_review_images_review_id ON category.review_images USING btree (review_id);


--
-- TOC entry 5665 (class 1259 OID 17130)
-- Name: ix_service_attribute_definitions_attribute_type_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_service_attribute_definitions_attribute_type_id ON category.service_attribute_definitions USING btree (attribute_type_id);


--
-- TOC entry 5666 (class 1259 OID 17131)
-- Name: ix_service_attribute_definitions_service_definition_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_service_attribute_definitions_service_definition_id ON category.service_attribute_definitions USING btree (service_definition_id);


--
-- TOC entry 5669 (class 1259 OID 17132)
-- Name: ix_service_attribute_values_attribute_definition_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_service_attribute_values_attribute_definition_id ON category.service_attribute_values USING btree (attribute_definition_id);


--
-- TOC entry 5670 (class 1259 OID 17133)
-- Name: ix_service_attribute_values_provider_service_id_attribute_defi; Type: INDEX; Schema: category; Owner: postgres
--

CREATE UNIQUE INDEX ix_service_attribute_values_provider_service_id_attribute_defi ON category.service_attribute_values USING btree (provider_service_id, attribute_definition_id);


--
-- TOC entry 5675 (class 1259 OID 17134)
-- Name: ix_service_definitions_category_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_service_definitions_category_id ON category.service_definitions USING btree (category_id);


--
-- TOC entry 5678 (class 1259 OID 17135)
-- Name: ix_service_provider_comments_create_date; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_service_provider_comments_create_date ON category.service_provider_comments USING btree (create_date);


--
-- TOC entry 5679 (class 1259 OID 17136)
-- Name: ix_service_provider_comments_customer_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_service_provider_comments_customer_id ON category.service_provider_comments USING btree (customer_id);


--
-- TOC entry 5680 (class 1259 OID 17137)
-- Name: ix_service_provider_comments_service_provider_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_service_provider_comments_service_provider_id ON category.service_provider_comments USING btree (service_provider_id);


--
-- TOC entry 5681 (class 1259 OID 17138)
-- Name: ix_service_provider_comments_service_provider_id_is_public; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_service_provider_comments_service_provider_id_is_public ON category.service_provider_comments USING btree (service_provider_id, is_public);


--
-- TOC entry 5688 (class 1259 OID 17139)
-- Name: ix_service_provider_requests_customer_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_service_provider_requests_customer_id ON category.service_provider_requests USING btree (customer_id);


--
-- TOC entry 5689 (class 1259 OID 17140)
-- Name: ix_service_provider_requests_request_status_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_service_provider_requests_request_status_id ON category.service_provider_requests USING btree (request_status_id);


--
-- TOC entry 5690 (class 1259 OID 17141)
-- Name: ix_service_provider_requests_service_provider_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_service_provider_requests_service_provider_id ON category.service_provider_requests USING btree (service_provider_id);


--
-- TOC entry 5694 (class 1259 OID 17142)
-- Name: ix_service_providers_country_city; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_service_providers_country_city ON category.service_providers USING btree (country, city);


--
-- TOC entry 5695 (class 1259 OID 17143)
-- Name: ix_service_providers_grade_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_service_providers_grade_id ON category.service_providers USING btree (grade_id);


--
-- TOC entry 5696 (class 1259 OID 17144)
-- Name: ix_service_providers_grade_id_provider_type_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_service_providers_grade_id_provider_type_id ON category.service_providers USING btree (grade_id, provider_type_id);


--
-- TOC entry 5697 (class 1259 OID 17145)
-- Name: ix_service_providers_grade_id_provider_type_id_country_city; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_service_providers_grade_id_provider_type_id_country_city ON category.service_providers USING btree (grade_id, provider_type_id, country, city);


--
-- TOC entry 5698 (class 1259 OID 17146)
-- Name: ix_service_providers_is_active; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_service_providers_is_active ON category.service_providers USING btree (is_active);


--
-- TOC entry 5699 (class 1259 OID 17147)
-- Name: ix_service_providers_name_translations; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_service_providers_name_translations ON category.service_providers USING btree (name_translations);


--
-- TOC entry 5700 (class 1259 OID 17148)
-- Name: ix_service_providers_provider_type_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_service_providers_provider_type_id ON category.service_providers USING btree (provider_type_id);


--
-- TOC entry 5701 (class 1259 OID 17149)
-- Name: ix_service_providers_provider_type_id_country_city; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_service_providers_provider_type_id_country_city ON category.service_providers USING btree (provider_type_id, country, city);


--
-- TOC entry 5904 (class 1259 OID 19441)
-- Name: ix_staff_achievements_staff_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_staff_achievements_staff_id ON category.staff_achievements USING btree (staff_id);


--
-- TOC entry 5905 (class 1259 OID 19442)
-- Name: ix_staff_achievements_staff_id_display_order; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_staff_achievements_staff_id_display_order ON category.staff_achievements USING btree (staff_id, display_order);


--
-- TOC entry 5706 (class 1259 OID 17150)
-- Name: ix_staff_availabilities_availability_status_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_staff_availabilities_availability_status_id ON category.staff_availabilities USING btree (availability_status_id);


--
-- TOC entry 5707 (class 1259 OID 17151)
-- Name: ix_staff_availabilities_staff_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_staff_availabilities_staff_id ON category.staff_availabilities USING btree (staff_id);


--
-- TOC entry 5708 (class 1259 OID 17152)
-- Name: ix_staff_availabilities_staff_id_day_of_week; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_staff_availabilities_staff_id_day_of_week ON category.staff_availabilities USING btree (staff_id, day_of_week);


--
-- TOC entry 5709 (class 1259 OID 19294)
-- Name: ix_staff_availabilities_staff_id_specific_date; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_staff_availabilities_staff_id_specific_date ON category.staff_availabilities USING btree (staff_id, specific_date) WHERE (specific_date IS NOT NULL);


--
-- TOC entry 5908 (class 1259 OID 19459)
-- Name: ix_staff_before_after_staff_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_staff_before_after_staff_id ON category.staff_before_after USING btree (staff_id);


--
-- TOC entry 5909 (class 1259 OID 19460)
-- Name: ix_staff_before_after_staff_id_display_order; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_staff_before_after_staff_id_display_order ON category.staff_before_after USING btree (staff_id, display_order);


--
-- TOC entry 5901 (class 1259 OID 19424)
-- Name: ix_staff_certifications_staff_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_staff_certifications_staff_id ON category.staff_certifications USING btree (staff_id);


--
-- TOC entry 5877 (class 1259 OID 18592)
-- Name: ix_staff_credentials_staff_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_staff_credentials_staff_id ON category.staff_credentials USING btree (staff_id);


--
-- TOC entry 5897 (class 1259 OID 19408)
-- Name: ix_staff_education_staff_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_staff_education_staff_id ON category.staff_education USING btree (staff_id);


--
-- TOC entry 5898 (class 1259 OID 19409)
-- Name: ix_staff_education_staff_id_year; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_staff_education_staff_id_year ON category.staff_education USING btree (staff_id, year DESC);


--
-- TOC entry 5915 (class 1259 OID 19504)
-- Name: ix_staff_gallery_items_display_order; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_staff_gallery_items_display_order ON category.staff_gallery_items USING btree (staff_id, display_order);


--
-- TOC entry 5916 (class 1259 OID 19503)
-- Name: ix_staff_gallery_items_staff_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_staff_gallery_items_staff_id ON category.staff_gallery_items USING btree (staff_id);


--
-- TOC entry 5891 (class 1259 OID 19380)
-- Name: ix_staff_languages_staff_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_staff_languages_staff_id ON category.staff_languages USING btree (staff_id);


--
-- TOC entry 5714 (class 1259 OID 19293)
-- Name: ix_staff_services_service_definition_id_staff_id_active; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_staff_services_service_definition_id_staff_id_active ON category.staff_services USING btree (service_definition_id, staff_id) WHERE (is_active = true);


--
-- TOC entry 5715 (class 1259 OID 17153)
-- Name: ix_staff_services_staff_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_staff_services_staff_id ON category.staff_services USING btree (staff_id);


--
-- TOC entry 5716 (class 1259 OID 17154)
-- Name: ix_staff_services_staff_id_service_definition_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE UNIQUE INDEX ix_staff_services_staff_id_service_definition_id ON category.staff_services USING btree (staff_id, service_definition_id);


--
-- TOC entry 5894 (class 1259 OID 19394)
-- Name: ix_staff_specializations_staff_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_staff_specializations_staff_id ON category.staff_specializations USING btree (staff_id);


--
-- TOC entry 5887 (class 1259 OID 19361)
-- Name: ix_sufr_service_definition_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_sufr_service_definition_id ON category.service_upload_file_requirements USING btree (service_definition_id);


--
-- TOC entry 5888 (class 1259 OID 19362)
-- Name: ix_sufr_service_definition_id_display_order; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_sufr_service_definition_id_display_order ON category.service_upload_file_requirements USING btree (service_definition_id, display_order);


--
-- TOC entry 5623 (class 1259 OID 17155)
-- Name: outbox_message_consumers_message_id_name; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX outbox_message_consumers_message_id_name ON category.outbox_message_consumers USING btree (message_id, name);


--
-- TOC entry 5621 (class 1259 OID 17156)
-- Name: ux_locations_city_parent_code; Type: INDEX; Schema: category; Owner: postgres
--

CREATE UNIQUE INDEX ux_locations_city_parent_code ON category.locations USING btree (parent_id, code) WHERE (location_type_id = 2);


--
-- TOC entry 5622 (class 1259 OID 17157)
-- Name: ux_locations_country_code; Type: INDEX; Schema: category; Owner: postgres
--

CREATE UNIQUE INDEX ux_locations_country_code ON category.locations USING btree (code) WHERE (location_type_id = 1);


--
-- TOC entry 5924 (class 1259 OID 19527)
-- Name: ux_provider_service_gallery_items_one_primary; Type: INDEX; Schema: category; Owner: postgres
--

CREATE UNIQUE INDEX ux_provider_service_gallery_items_one_primary ON category.provider_service_gallery_items USING btree (provider_service_id) WHERE (is_primary = true);


--
-- TOC entry 5919 (class 1259 OID 19505)
-- Name: ux_staff_gallery_items_one_primary; Type: INDEX; Schema: category; Owner: postgres
--

CREATE UNIQUE INDEX ux_staff_gallery_items_one_primary ON category.staff_gallery_items USING btree (staff_id) WHERE (is_primary = true);


--
-- TOC entry 5740 (class 1259 OID 17158)
-- Name: idx_inbox_messages_occurred_on; Type: INDEX; Schema: customer; Owner: postgres
--

CREATE INDEX idx_inbox_messages_occurred_on ON customer.inbox_messages USING btree (occurred_on_utc);


--
-- TOC entry 5741 (class 1259 OID 17159)
-- Name: idx_inbox_messages_processed_occurred; Type: INDEX; Schema: customer; Owner: postgres
--

CREATE INDEX idx_inbox_messages_processed_occurred ON customer.inbox_messages USING btree (processed_on_utc, occurred_on_utc);


--
-- TOC entry 5742 (class 1259 OID 17160)
-- Name: idx_inbox_messages_processed_on; Type: INDEX; Schema: customer; Owner: postgres
--

CREATE INDEX idx_inbox_messages_processed_on ON customer.inbox_messages USING btree (processed_on_utc);


--
-- TOC entry 5743 (class 1259 OID 17161)
-- Name: idx_inbox_messages_unprocessed; Type: INDEX; Schema: customer; Owner: postgres
--

CREATE INDEX idx_inbox_messages_unprocessed ON customer.inbox_messages USING btree (occurred_on_utc, processed_on_utc) INCLUDE (id, type, content) WHERE (processed_on_utc IS NULL);


--
-- TOC entry 5749 (class 1259 OID 17162)
-- Name: idx_internal_command_messages_occurred_on; Type: INDEX; Schema: customer; Owner: postgres
--

CREATE INDEX idx_internal_command_messages_occurred_on ON customer.internal_command_messages USING btree (occurred_on_utc);


--
-- TOC entry 5750 (class 1259 OID 17163)
-- Name: idx_internal_command_messages_processed_occurred; Type: INDEX; Schema: customer; Owner: postgres
--

CREATE INDEX idx_internal_command_messages_processed_occurred ON customer.internal_command_messages USING btree (processed_on_utc, occurred_on_utc);


--
-- TOC entry 5751 (class 1259 OID 17164)
-- Name: idx_internal_command_messages_processed_on; Type: INDEX; Schema: customer; Owner: postgres
--

CREATE INDEX idx_internal_command_messages_processed_on ON customer.internal_command_messages USING btree (processed_on_utc);


--
-- TOC entry 5752 (class 1259 OID 17165)
-- Name: idx_internal_command_messages_unprocessed; Type: INDEX; Schema: customer; Owner: postgres
--

CREATE INDEX idx_internal_command_messages_unprocessed ON customer.internal_command_messages USING btree (occurred_on_utc, processed_on_utc) INCLUDE (id, type, content) WHERE (processed_on_utc IS NULL);


--
-- TOC entry 5758 (class 1259 OID 17166)
-- Name: idx_outbox_messages_occurred_on; Type: INDEX; Schema: customer; Owner: postgres
--

CREATE INDEX idx_outbox_messages_occurred_on ON customer.outbox_messages USING btree (occurred_on_utc);


--
-- TOC entry 5759 (class 1259 OID 17167)
-- Name: idx_outbox_messages_processed_occurred; Type: INDEX; Schema: customer; Owner: postgres
--

CREATE INDEX idx_outbox_messages_processed_occurred ON customer.outbox_messages USING btree (processed_on_utc, occurred_on_utc);


--
-- TOC entry 5760 (class 1259 OID 17168)
-- Name: idx_outbox_messages_processed_on; Type: INDEX; Schema: customer; Owner: postgres
--

CREATE INDEX idx_outbox_messages_processed_on ON customer.outbox_messages USING btree (processed_on_utc);


--
-- TOC entry 5761 (class 1259 OID 17169)
-- Name: idx_outbox_messages_unprocessed; Type: INDEX; Schema: customer; Owner: postgres
--

CREATE INDEX idx_outbox_messages_unprocessed ON customer.outbox_messages USING btree (occurred_on_utc, processed_on_utc) INCLUDE (id, type, content) WHERE (processed_on_utc IS NULL);


--
-- TOC entry 5737 (class 1259 OID 17170)
-- Name: inbox_message_consumers_message_id_name; Type: INDEX; Schema: customer; Owner: postgres
--

CREATE INDEX inbox_message_consumers_message_id_name ON customer.inbox_message_consumers USING btree (message_id, name);


--
-- TOC entry 5746 (class 1259 OID 17171)
-- Name: internal_command_message_consumers_message_id_name; Type: INDEX; Schema: customer; Owner: postgres
--

CREATE INDEX internal_command_message_consumers_message_id_name ON customer.internal_command_message_consumers USING btree (message_id, name);


--
-- TOC entry 5723 (class 1259 OID 17172)
-- Name: ix_consultings_category_id; Type: INDEX; Schema: customer; Owner: postgres
--

CREATE INDEX ix_consultings_category_id ON customer.consultings USING btree (category_id);


--
-- TOC entry 5724 (class 1259 OID 17173)
-- Name: ix_consultings_customer_id; Type: INDEX; Schema: customer; Owner: postgres
--

CREATE INDEX ix_consultings_customer_id ON customer.consultings USING btree (customer_id);


--
-- TOC entry 5729 (class 1259 OID 17174)
-- Name: ix_customer_documents_customer_id; Type: INDEX; Schema: customer; Owner: postgres
--

CREATE INDEX ix_customer_documents_customer_id ON customer.customer_documents USING btree (customer_id);


--
-- TOC entry 5730 (class 1259 OID 17175)
-- Name: ix_customer_documents_document_type_id; Type: INDEX; Schema: customer; Owner: postgres
--

CREATE INDEX ix_customer_documents_document_type_id ON customer.customer_documents USING btree (document_type_id);


--
-- TOC entry 5733 (class 1259 OID 17176)
-- Name: ix_customers_email; Type: INDEX; Schema: customer; Owner: postgres
--

CREATE UNIQUE INDEX ix_customers_email ON customer.customers USING btree (email);


--
-- TOC entry 5734 (class 1259 OID 17177)
-- Name: ix_customers_phone_number_phone_number_country_code; Type: INDEX; Schema: customer; Owner: postgres
--

CREATE UNIQUE INDEX ix_customers_phone_number_phone_number_country_code ON customer.customers USING btree (phone_number, phone_number_country_code);


--
-- TOC entry 5882 (class 1259 OID 19327)
-- Name: ix_favorites_customer_id; Type: INDEX; Schema: customer; Owner: postgres
--

CREATE INDEX ix_favorites_customer_id ON customer.favorites USING btree (customer_id);


--
-- TOC entry 5883 (class 1259 OID 19328)
-- Name: ix_favorites_customer_type; Type: INDEX; Schema: customer; Owner: postgres
--

CREATE INDEX ix_favorites_customer_type ON customer.favorites USING btree (customer_id, favorite_type);


--
-- TOC entry 5884 (class 1259 OID 19329)
-- Name: ix_favorites_entity; Type: INDEX; Schema: customer; Owner: postgres
--

CREATE INDEX ix_favorites_entity ON customer.favorites USING btree (entity_id);


--
-- TOC entry 5755 (class 1259 OID 17178)
-- Name: outbox_message_consumers_message_id_name; Type: INDEX; Schema: customer; Owner: postgres
--

CREATE INDEX outbox_message_consumers_message_id_name ON customer.outbox_message_consumers USING btree (message_id, name);


--
-- TOC entry 5787 (class 1259 OID 17179)
-- Name: EmailIndex; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE UNIQUE INDEX "EmailIndex" ON identity.asp_net_users USING btree (normalized_email);


--
-- TOC entry 5773 (class 1259 OID 17180)
-- Name: RoleNameIndex; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE UNIQUE INDEX "RoleNameIndex" ON identity.asp_net_roles USING btree (normalized_name);


--
-- TOC entry 5788 (class 1259 OID 17181)
-- Name: UserNameIndex; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE UNIQUE INDEX "UserNameIndex" ON identity.asp_net_users USING btree (normalized_user_name);


--
-- TOC entry 5798 (class 1259 OID 17182)
-- Name: idx_inbox_messages_occurred_on; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE INDEX idx_inbox_messages_occurred_on ON identity.inbox_messages USING btree (occurred_on_utc);


--
-- TOC entry 5799 (class 1259 OID 17183)
-- Name: idx_inbox_messages_processed_occurred; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE INDEX idx_inbox_messages_processed_occurred ON identity.inbox_messages USING btree (processed_on_utc, occurred_on_utc);


--
-- TOC entry 5800 (class 1259 OID 17184)
-- Name: idx_inbox_messages_processed_on; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE INDEX idx_inbox_messages_processed_on ON identity.inbox_messages USING btree (processed_on_utc);


--
-- TOC entry 5801 (class 1259 OID 17185)
-- Name: idx_inbox_messages_unprocessed; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE INDEX idx_inbox_messages_unprocessed ON identity.inbox_messages USING btree (occurred_on_utc, processed_on_utc) INCLUDE (id, type, content) WHERE (processed_on_utc IS NULL);


--
-- TOC entry 5807 (class 1259 OID 17186)
-- Name: idx_internal_command_messages_occurred_on; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE INDEX idx_internal_command_messages_occurred_on ON identity.internal_command_messages USING btree (occurred_on_utc);


--
-- TOC entry 5808 (class 1259 OID 17187)
-- Name: idx_internal_command_messages_processed_occurred; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE INDEX idx_internal_command_messages_processed_occurred ON identity.internal_command_messages USING btree (processed_on_utc, occurred_on_utc);


--
-- TOC entry 5809 (class 1259 OID 17188)
-- Name: idx_internal_command_messages_processed_on; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE INDEX idx_internal_command_messages_processed_on ON identity.internal_command_messages USING btree (processed_on_utc);


--
-- TOC entry 5810 (class 1259 OID 17189)
-- Name: idx_internal_command_messages_unprocessed; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE INDEX idx_internal_command_messages_unprocessed ON identity.internal_command_messages USING btree (occurred_on_utc, processed_on_utc) INCLUDE (id, type, content) WHERE (processed_on_utc IS NULL);


--
-- TOC entry 5816 (class 1259 OID 17190)
-- Name: idx_outbox_messages_occurred_on; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE INDEX idx_outbox_messages_occurred_on ON identity.outbox_messages USING btree (occurred_on_utc);


--
-- TOC entry 5817 (class 1259 OID 17191)
-- Name: idx_outbox_messages_processed_occurred; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE INDEX idx_outbox_messages_processed_occurred ON identity.outbox_messages USING btree (processed_on_utc, occurred_on_utc);


--
-- TOC entry 5818 (class 1259 OID 17192)
-- Name: idx_outbox_messages_processed_on; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE INDEX idx_outbox_messages_processed_on ON identity.outbox_messages USING btree (processed_on_utc);


--
-- TOC entry 5819 (class 1259 OID 17193)
-- Name: idx_outbox_messages_unprocessed; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE INDEX idx_outbox_messages_unprocessed ON identity.outbox_messages USING btree (occurred_on_utc, processed_on_utc) INCLUDE (id, type, content) WHERE (processed_on_utc IS NULL);


--
-- TOC entry 5795 (class 1259 OID 17194)
-- Name: inbox_message_consumers_message_id_name; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE INDEX inbox_message_consumers_message_id_name ON identity.inbox_message_consumers USING btree (message_id, name);


--
-- TOC entry 5804 (class 1259 OID 17195)
-- Name: internal_command_message_consumers_message_id_name; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE INDEX internal_command_message_consumers_message_id_name ON identity.internal_command_message_consumers USING btree (message_id, name);


--
-- TOC entry 5766 (class 1259 OID 17196)
-- Name: ix_access_tokens_token_user_id; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE UNIQUE INDEX ix_access_tokens_token_user_id ON identity.access_tokens USING btree (token, user_id);


--
-- TOC entry 5767 (class 1259 OID 17197)
-- Name: ix_access_tokens_user_id; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE INDEX ix_access_tokens_user_id ON identity.access_tokens USING btree (user_id);


--
-- TOC entry 5770 (class 1259 OID 17198)
-- Name: ix_asp_net_role_claims_role_id; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE INDEX ix_asp_net_role_claims_role_id ON identity.asp_net_role_claims USING btree (role_id);


--
-- TOC entry 5776 (class 1259 OID 17199)
-- Name: ix_asp_net_user_claims_user_id; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE INDEX ix_asp_net_user_claims_user_id ON identity.asp_net_user_claims USING btree (user_id);


--
-- TOC entry 5779 (class 1259 OID 17200)
-- Name: ix_asp_net_user_logins_user_id; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE INDEX ix_asp_net_user_logins_user_id ON identity.asp_net_user_logins USING btree (user_id);


--
-- TOC entry 5782 (class 1259 OID 17201)
-- Name: ix_asp_net_user_roles_role_id; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE INDEX ix_asp_net_user_roles_role_id ON identity.asp_net_user_roles USING btree (role_id);


--
-- TOC entry 5789 (class 1259 OID 17202)
-- Name: ix_asp_net_users_email; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE UNIQUE INDEX ix_asp_net_users_email ON identity.asp_net_users USING btree (email);


--
-- TOC entry 5790 (class 1259 OID 17203)
-- Name: ix_asp_net_users_phone_number_country_code_phone_number; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE UNIQUE INDEX ix_asp_net_users_phone_number_country_code_phone_number ON identity.asp_net_users USING btree (phone_number_country_code, phone_number);


--
-- TOC entry 5824 (class 1259 OID 17204)
-- Name: ix_phone_login_codes_expires_at; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE INDEX ix_phone_login_codes_expires_at ON identity.phone_login_codes USING btree (expires_at);


--
-- TOC entry 5825 (class 1259 OID 17205)
-- Name: ix_phone_login_codes_user_id; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE INDEX ix_phone_login_codes_user_id ON identity.phone_login_codes USING btree (user_id);


--
-- TOC entry 5826 (class 1259 OID 17206)
-- Name: ix_phone_login_codes_user_id_is_invalidated_expires_at; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE INDEX ix_phone_login_codes_user_id_is_invalidated_expires_at ON identity.phone_login_codes USING btree (user_id, is_invalidated, expires_at);


--
-- TOC entry 5829 (class 1259 OID 17207)
-- Name: ix_refresh_tokens_token_user_id; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE UNIQUE INDEX ix_refresh_tokens_token_user_id ON identity.refresh_tokens USING btree (token, user_id);


--
-- TOC entry 5830 (class 1259 OID 17208)
-- Name: ix_refresh_tokens_user_id; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE INDEX ix_refresh_tokens_user_id ON identity.refresh_tokens USING btree (user_id);


--
-- TOC entry 5813 (class 1259 OID 17209)
-- Name: outbox_message_consumers_message_id_name; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE INDEX outbox_message_consumers_message_id_name ON identity.outbox_message_consumers USING btree (message_id, name);


--
-- TOC entry 5865 (class 1259 OID 18512)
-- Name: idx_offers_active; Type: INDEX; Schema: marketing; Owner: postgres
--

CREATE INDEX idx_offers_active ON marketing.offers USING btree (is_active, valid_until);


--
-- TOC entry 5866 (class 1259 OID 18516)
-- Name: idx_offers_provider_service; Type: INDEX; Schema: marketing; Owner: postgres
--

CREATE INDEX idx_offers_provider_service ON marketing.offers USING btree (provider_service_id);


--
-- TOC entry 5833 (class 1259 OID 17210)
-- Name: ix_translation_audit_lookup; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_translation_audit_lookup ON public.translation_audit USING btree (table_name, column_name, row_pk, target_locale, created_at DESC);


--
-- TOC entry 5860 (class 1259 OID 18519)
-- Name: idx_search_history_category; Type: INDEX; Schema: search; Owner: postgres
--

CREATE INDEX idx_search_history_category ON search.user_search_history USING btree (category_id);


--
-- TOC entry 5861 (class 1259 OID 18518)
-- Name: idx_search_history_term; Type: INDEX; Schema: search; Owner: postgres
--

CREATE INDEX idx_search_history_term ON search.user_search_history USING btree (normalized_term);


--
-- TOC entry 5862 (class 1259 OID 18517)
-- Name: idx_search_history_user; Type: INDEX; Schema: search; Owner: postgres
--

CREATE INDEX idx_search_history_user ON search.user_search_history USING btree (user_id, created_at DESC);


--
-- TOC entry 5968 (class 2606 OID 19280)
-- Name: bookings fk_booking_bookings_provider_services_service_id; Type: FK CONSTRAINT; Schema: booking; Owner: postgres
--

ALTER TABLE ONLY booking.bookings
    ADD CONSTRAINT fk_booking_bookings_provider_services_service_id FOREIGN KEY (service_id) REFERENCES category.provider_services(id);


--
-- TOC entry 5969 (class 2606 OID 19275)
-- Name: bookings fk_booking_bookings_service_providers_provider_id; Type: FK CONSTRAINT; Schema: booking; Owner: postgres
--

ALTER TABLE ONLY booking.bookings
    ADD CONSTRAINT fk_booking_bookings_service_providers_provider_id FOREIGN KEY (provider_id) REFERENCES category.service_providers(id);


--
-- TOC entry 5970 (class 2606 OID 19285)
-- Name: bookings fk_booking_bookings_staff_specialist_id; Type: FK CONSTRAINT; Schema: booking; Owner: postgres
--

ALTER TABLE ONLY booking.bookings
    ADD CONSTRAINT fk_booking_bookings_staff_specialist_id FOREIGN KEY (specialist_id) REFERENCES category.staff(id);


--
-- TOC entry 5925 (class 2606 OID 18398)
-- Name: categories categories_group_id_fkey; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.categories
    ADD CONSTRAINT categories_group_id_fkey FOREIGN KEY (group_id) REFERENCES category.category_groups(id);


--
-- TOC entry 5972 (class 2606 OID 18551)
-- Name: addon_details fk_addon_details_addons; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.addon_details
    ADD CONSTRAINT fk_addon_details_addons FOREIGN KEY (addon_id) REFERENCES category.addons(id) ON DELETE CASCADE;


--
-- TOC entry 5926 (class 2606 OID 17211)
-- Name: categories fk_categories_categories_parent_id; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.categories
    ADD CONSTRAINT fk_categories_categories_parent_id FOREIGN KEY (parent_id) REFERENCES category.categories(id);


--
-- TOC entry 5927 (class 2606 OID 17216)
-- Name: locations fk_locations_location_type_location_type_id; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.locations
    ADD CONSTRAINT fk_locations_location_type_location_type_id FOREIGN KEY (location_type_id) REFERENCES category."LocationType"(id) ON DELETE CASCADE;


--
-- TOC entry 5928 (class 2606 OID 17221)
-- Name: locations fk_locations_locations_parent_id; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.locations
    ADD CONSTRAINT fk_locations_locations_parent_id FOREIGN KEY (parent_id) REFERENCES category.locations(id);


--
-- TOC entry 5929 (class 2606 OID 17226)
-- Name: provider_attribute_definition_domain_options fk_provider_attribute_definition_domain_options_provider_attri; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.provider_attribute_definition_domain_options
    ADD CONSTRAINT fk_provider_attribute_definition_domain_options_provider_attri FOREIGN KEY (provider_attribute_definition_id) REFERENCES category.provider_attribute_definitions(id) ON DELETE CASCADE;


--
-- TOC entry 5930 (class 2606 OID 17231)
-- Name: provider_attribute_definitions fk_provider_attribute_definitions_attribute_types_attribute_ty; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.provider_attribute_definitions
    ADD CONSTRAINT fk_provider_attribute_definitions_attribute_types_attribute_ty FOREIGN KEY (attribute_type_id) REFERENCES category.attribute_types(id) ON DELETE CASCADE;


--
-- TOC entry 5931 (class 2606 OID 17236)
-- Name: provider_attribute_definitions fk_provider_attribute_definitions_provider_types_provider_type; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.provider_attribute_definitions
    ADD CONSTRAINT fk_provider_attribute_definitions_provider_types_provider_type FOREIGN KEY (provider_type_id) REFERENCES category.provider_types(id) ON DELETE CASCADE;


--
-- TOC entry 5932 (class 2606 OID 17241)
-- Name: provider_attributes fk_provider_attributes_service_providers_service_provider_id; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.provider_attributes
    ADD CONSTRAINT fk_provider_attributes_service_providers_service_provider_id FOREIGN KEY (service_provider_id) REFERENCES category.service_providers(id) ON DELETE CASCADE;


--
-- TOC entry 5933 (class 2606 OID 17246)
-- Name: provider_gallery_items fk_provider_gallery_items_service_providers_service_provider_id; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.provider_gallery_items
    ADD CONSTRAINT fk_provider_gallery_items_service_providers_service_provider_id FOREIGN KEY (service_provider_id) REFERENCES category.service_providers(id) ON DELETE CASCADE;


--
-- TOC entry 5984 (class 2606 OID 19476)
-- Name: provider_languages fk_provider_languages_service_provider; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.provider_languages
    ADD CONSTRAINT fk_provider_languages_service_provider FOREIGN KEY (service_provider_id) REFERENCES category.service_providers(id) ON DELETE CASCADE;


--
-- TOC entry 5934 (class 2606 OID 17251)
-- Name: provider_policies fk_provider_policies_service_providers_service_provider_id; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.provider_policies
    ADD CONSTRAINT fk_provider_policies_service_providers_service_provider_id FOREIGN KEY (service_provider_id) REFERENCES category.service_providers(id) ON DELETE CASCADE;


--
-- TOC entry 5986 (class 2606 OID 19520)
-- Name: provider_service_gallery_items fk_provider_service_gallery_items_provider_service; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.provider_service_gallery_items
    ADD CONSTRAINT fk_provider_service_gallery_items_provider_service FOREIGN KEY (provider_service_id) REFERENCES category.provider_services(id) ON DELETE CASCADE;


--
-- TOC entry 5935 (class 2606 OID 17256)
-- Name: provider_services fk_provider_services_service_definitions_service_definition_id; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.provider_services
    ADD CONSTRAINT fk_provider_services_service_definitions_service_definition_id FOREIGN KEY (service_definition_id) REFERENCES category.service_definitions(id);


--
-- TOC entry 5936 (class 2606 OID 17261)
-- Name: provider_services fk_provider_services_service_providers_service_provider_id; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.provider_services
    ADD CONSTRAINT fk_provider_services_service_providers_service_provider_id FOREIGN KEY (service_provider_id) REFERENCES category.service_providers(id) ON DELETE CASCADE;


--
-- TOC entry 5937 (class 2606 OID 17266)
-- Name: provider_staffs fk_provider_staffs_service_providers_service_provider_id; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.provider_staffs
    ADD CONSTRAINT fk_provider_staffs_service_providers_service_provider_id FOREIGN KEY (service_provider_id) REFERENCES category.service_providers(id) ON DELETE CASCADE;


--
-- TOC entry 5938 (class 2606 OID 17271)
-- Name: provider_staffs fk_provider_staffs_staffs_staff_id; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.provider_staffs
    ADD CONSTRAINT fk_provider_staffs_staffs_staff_id FOREIGN KEY (staff_id) REFERENCES category.staff(id);


--
-- TOC entry 5973 (class 2606 OID 18568)
-- Name: provider_service_addons fk_psa_addons; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.provider_service_addons
    ADD CONSTRAINT fk_psa_addons FOREIGN KEY (addon_id) REFERENCES category.addons(id) ON DELETE CASCADE;


--
-- TOC entry 5974 (class 2606 OID 18563)
-- Name: provider_service_addons fk_psa_provider_services; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.provider_service_addons
    ADD CONSTRAINT fk_psa_provider_services FOREIGN KEY (provider_service_id) REFERENCES category.provider_services(id) ON DELETE CASCADE;


--
-- TOC entry 5967 (class 2606 OID 19461)
-- Name: review_images fk_review_images_service_provider_comments_review_id; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.review_images
    ADD CONSTRAINT fk_review_images_service_provider_comments_review_id FOREIGN KEY (review_id) REFERENCES category.service_provider_comments(id) ON DELETE CASCADE;


--
-- TOC entry 5939 (class 2606 OID 17276)
-- Name: service_attribute_definition_options fk_service_attribute_definition_options_service_attribute_defi; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.service_attribute_definition_options
    ADD CONSTRAINT fk_service_attribute_definition_options_service_attribute_defi FOREIGN KEY (service_attribute_definition_id) REFERENCES category.service_attribute_definitions(id) ON DELETE CASCADE;


--
-- TOC entry 5940 (class 2606 OID 17281)
-- Name: service_attribute_definitions fk_service_attribute_definitions_attribute_types_attribute_typ; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.service_attribute_definitions
    ADD CONSTRAINT fk_service_attribute_definitions_attribute_types_attribute_typ FOREIGN KEY (attribute_type_id) REFERENCES category.attribute_types(id) ON DELETE CASCADE;


--
-- TOC entry 5941 (class 2606 OID 17286)
-- Name: service_attribute_definitions fk_service_attribute_definitions_service_definitions_service_d; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.service_attribute_definitions
    ADD CONSTRAINT fk_service_attribute_definitions_service_definitions_service_d FOREIGN KEY (service_definition_id) REFERENCES category.service_definitions(id) ON DELETE CASCADE;


--
-- TOC entry 5942 (class 2606 OID 17291)
-- Name: service_attribute_values fk_service_attribute_values_provider_services_provider_service; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.service_attribute_values
    ADD CONSTRAINT fk_service_attribute_values_provider_services_provider_service FOREIGN KEY (provider_service_id) REFERENCES category.provider_services(id) ON DELETE CASCADE;


--
-- TOC entry 5943 (class 2606 OID 17296)
-- Name: service_definition_domain_requirements fk_service_definition_domain_requirements_service_definitions_; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.service_definition_domain_requirements
    ADD CONSTRAINT fk_service_definition_domain_requirements_service_definitions_ FOREIGN KEY (service_definition_id) REFERENCES category.service_definitions(id) ON DELETE CASCADE;


--
-- TOC entry 5944 (class 2606 OID 17301)
-- Name: service_definitions fk_service_definitions_categories_category_id; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.service_definitions
    ADD CONSTRAINT fk_service_definitions_categories_category_id FOREIGN KEY (category_id) REFERENCES category.categories(id);


--
-- TOC entry 5945 (class 2606 OID 17306)
-- Name: service_provider_comments fk_service_provider_comments_service_providers_service_provide; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.service_provider_comments
    ADD CONSTRAINT fk_service_provider_comments_service_providers_service_provide FOREIGN KEY (service_provider_id) REFERENCES category.service_providers(id) ON DELETE CASCADE;


--
-- TOC entry 5946 (class 2606 OID 17311)
-- Name: service_provider_requests fk_service_provider_requests_service_provider_request_statuses; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.service_provider_requests
    ADD CONSTRAINT fk_service_provider_requests_service_provider_request_statuses FOREIGN KEY (request_status_id) REFERENCES category.service_provider_request_statuses(id) ON DELETE CASCADE;


--
-- TOC entry 5947 (class 2606 OID 17316)
-- Name: service_provider_requests fk_service_provider_requests_service_providers_service_provide; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.service_provider_requests
    ADD CONSTRAINT fk_service_provider_requests_service_providers_service_provide FOREIGN KEY (service_provider_id) REFERENCES category.service_providers(id) ON DELETE CASCADE;


--
-- TOC entry 5948 (class 2606 OID 17321)
-- Name: service_providers fk_service_providers_provider_types_provider_type_id; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.service_providers
    ADD CONSTRAINT fk_service_providers_provider_types_provider_type_id FOREIGN KEY (provider_type_id) REFERENCES category.provider_types(id);


--
-- TOC entry 5949 (class 2606 OID 17326)
-- Name: service_providers fk_service_providers_service_provider_grades_grade_id; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.service_providers
    ADD CONSTRAINT fk_service_providers_service_provider_grades_grade_id FOREIGN KEY (grade_id) REFERENCES category.service_provider_grades(id);


--
-- TOC entry 5977 (class 2606 OID 19356)
-- Name: service_upload_file_requirements fk_service_upload_file_requirements_service_definition; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.service_upload_file_requirements
    ADD CONSTRAINT fk_service_upload_file_requirements_service_definition FOREIGN KEY (service_definition_id) REFERENCES category.service_definitions(id) ON DELETE CASCADE;


--
-- TOC entry 5982 (class 2606 OID 19436)
-- Name: staff_achievements fk_staff_achievements_staff; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.staff_achievements
    ADD CONSTRAINT fk_staff_achievements_staff FOREIGN KEY (staff_id) REFERENCES category.staff(id) ON DELETE CASCADE;


--
-- TOC entry 5950 (class 2606 OID 17331)
-- Name: staff_availabilities fk_staff_availabilities_staff_availability_statuses_availabili; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.staff_availabilities
    ADD CONSTRAINT fk_staff_availabilities_staff_availability_statuses_availabili FOREIGN KEY (availability_status_id) REFERENCES category.staff_availability_statuses(id) ON DELETE CASCADE;


--
-- TOC entry 5951 (class 2606 OID 17336)
-- Name: staff_availabilities fk_staff_availabilities_staffs_staff_id; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.staff_availabilities
    ADD CONSTRAINT fk_staff_availabilities_staffs_staff_id FOREIGN KEY (staff_id) REFERENCES category.staff(id) ON DELETE CASCADE;


--
-- TOC entry 5983 (class 2606 OID 19454)
-- Name: staff_before_after fk_staff_before_after_staff; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.staff_before_after
    ADD CONSTRAINT fk_staff_before_after_staff FOREIGN KEY (staff_id) REFERENCES category.staff(id) ON DELETE CASCADE;


--
-- TOC entry 5981 (class 2606 OID 19419)
-- Name: staff_certifications fk_staff_certifications_staff; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.staff_certifications
    ADD CONSTRAINT fk_staff_certifications_staff FOREIGN KEY (staff_id) REFERENCES category.staff(id) ON DELETE CASCADE;


--
-- TOC entry 5975 (class 2606 OID 18587)
-- Name: staff_credentials fk_staff_credentials_staff; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.staff_credentials
    ADD CONSTRAINT fk_staff_credentials_staff FOREIGN KEY (staff_id) REFERENCES category.staff(id) ON DELETE CASCADE;


--
-- TOC entry 5980 (class 2606 OID 19403)
-- Name: staff_education fk_staff_education_staff; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.staff_education
    ADD CONSTRAINT fk_staff_education_staff FOREIGN KEY (staff_id) REFERENCES category.staff(id) ON DELETE CASCADE;


--
-- TOC entry 5985 (class 2606 OID 19498)
-- Name: staff_gallery_items fk_staff_gallery_items_staff; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.staff_gallery_items
    ADD CONSTRAINT fk_staff_gallery_items_staff FOREIGN KEY (staff_id) REFERENCES category.staff(id) ON DELETE CASCADE;


--
-- TOC entry 5978 (class 2606 OID 19375)
-- Name: staff_languages fk_staff_languages_staff; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.staff_languages
    ADD CONSTRAINT fk_staff_languages_staff FOREIGN KEY (staff_id) REFERENCES category.staff(id) ON DELETE CASCADE;


--
-- TOC entry 5952 (class 2606 OID 19250)
-- Name: staff_services fk_staff_services_service_definitions_service_definition_id; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.staff_services
    ADD CONSTRAINT fk_staff_services_service_definitions_service_definition_id FOREIGN KEY (service_definition_id) REFERENCES category.service_definitions(id) ON DELETE CASCADE;


--
-- TOC entry 5953 (class 2606 OID 17341)
-- Name: staff_services fk_staff_services_staffs_staff_id; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.staff_services
    ADD CONSTRAINT fk_staff_services_staffs_staff_id FOREIGN KEY (staff_id) REFERENCES category.staff(id) ON DELETE CASCADE;


--
-- TOC entry 5979 (class 2606 OID 19389)
-- Name: staff_specializations fk_staff_specializations_staff; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.staff_specializations
    ADD CONSTRAINT fk_staff_specializations_staff FOREIGN KEY (staff_id) REFERENCES category.staff(id) ON DELETE CASCADE;


--
-- TOC entry 5954 (class 2606 OID 17346)
-- Name: consulting_selected_document_references fk_consulting_selected_document_references_consultings_consult; Type: FK CONSTRAINT; Schema: customer; Owner: postgres
--

ALTER TABLE ONLY customer.consulting_selected_document_references
    ADD CONSTRAINT fk_consulting_selected_document_references_consultings_consult FOREIGN KEY (consulting_id) REFERENCES customer.consultings(id) ON DELETE CASCADE;


--
-- TOC entry 5955 (class 2606 OID 17351)
-- Name: consultings fk_consultings_customers_customer_id; Type: FK CONSTRAINT; Schema: customer; Owner: postgres
--

ALTER TABLE ONLY customer.consultings
    ADD CONSTRAINT fk_consultings_customers_customer_id FOREIGN KEY (customer_id) REFERENCES customer.customers(id) ON DELETE RESTRICT;


--
-- TOC entry 5956 (class 2606 OID 17356)
-- Name: customer_documents fk_customer_documents_customer_document_types_document_type_id; Type: FK CONSTRAINT; Schema: customer; Owner: postgres
--

ALTER TABLE ONLY customer.customer_documents
    ADD CONSTRAINT fk_customer_documents_customer_document_types_document_type_id FOREIGN KEY (document_type_id) REFERENCES customer.customer_document_types(id) ON DELETE CASCADE;


--
-- TOC entry 5957 (class 2606 OID 17361)
-- Name: customer_documents fk_customer_documents_customers_customer_id; Type: FK CONSTRAINT; Schema: customer; Owner: postgres
--

ALTER TABLE ONLY customer.customer_documents
    ADD CONSTRAINT fk_customer_documents_customers_customer_id FOREIGN KEY (customer_id) REFERENCES customer.customers(id) ON DELETE CASCADE;


--
-- TOC entry 5976 (class 2606 OID 19322)
-- Name: favorites fk_favorites_customer; Type: FK CONSTRAINT; Schema: customer; Owner: postgres
--

ALTER TABLE ONLY customer.favorites
    ADD CONSTRAINT fk_favorites_customer FOREIGN KEY (customer_id) REFERENCES customer.customers(id) ON DELETE CASCADE;


--
-- TOC entry 5958 (class 2606 OID 17366)
-- Name: access_tokens fk_access_tokens_asp_net_users_user_id; Type: FK CONSTRAINT; Schema: identity; Owner: postgres
--

ALTER TABLE ONLY identity.access_tokens
    ADD CONSTRAINT fk_access_tokens_asp_net_users_user_id FOREIGN KEY (user_id) REFERENCES identity.asp_net_users(id) ON DELETE CASCADE;


--
-- TOC entry 5959 (class 2606 OID 17371)
-- Name: asp_net_role_claims fk_asp_net_role_claims_asp_net_roles_role_id; Type: FK CONSTRAINT; Schema: identity; Owner: postgres
--

ALTER TABLE ONLY identity.asp_net_role_claims
    ADD CONSTRAINT fk_asp_net_role_claims_asp_net_roles_role_id FOREIGN KEY (role_id) REFERENCES identity.asp_net_roles(id) ON DELETE CASCADE;


--
-- TOC entry 5960 (class 2606 OID 17376)
-- Name: asp_net_user_claims fk_asp_net_user_claims_asp_net_users_user_id; Type: FK CONSTRAINT; Schema: identity; Owner: postgres
--

ALTER TABLE ONLY identity.asp_net_user_claims
    ADD CONSTRAINT fk_asp_net_user_claims_asp_net_users_user_id FOREIGN KEY (user_id) REFERENCES identity.asp_net_users(id) ON DELETE CASCADE;


--
-- TOC entry 5961 (class 2606 OID 17381)
-- Name: asp_net_user_logins fk_asp_net_user_logins_asp_net_users_user_id; Type: FK CONSTRAINT; Schema: identity; Owner: postgres
--

ALTER TABLE ONLY identity.asp_net_user_logins
    ADD CONSTRAINT fk_asp_net_user_logins_asp_net_users_user_id FOREIGN KEY (user_id) REFERENCES identity.asp_net_users(id) ON DELETE CASCADE;


--
-- TOC entry 5962 (class 2606 OID 17386)
-- Name: asp_net_user_roles fk_asp_net_user_roles_asp_net_roles_role_id; Type: FK CONSTRAINT; Schema: identity; Owner: postgres
--

ALTER TABLE ONLY identity.asp_net_user_roles
    ADD CONSTRAINT fk_asp_net_user_roles_asp_net_roles_role_id FOREIGN KEY (role_id) REFERENCES identity.asp_net_roles(id) ON DELETE CASCADE;


--
-- TOC entry 5963 (class 2606 OID 17391)
-- Name: asp_net_user_roles fk_asp_net_user_roles_asp_net_users_user_id; Type: FK CONSTRAINT; Schema: identity; Owner: postgres
--

ALTER TABLE ONLY identity.asp_net_user_roles
    ADD CONSTRAINT fk_asp_net_user_roles_asp_net_users_user_id FOREIGN KEY (user_id) REFERENCES identity.asp_net_users(id) ON DELETE CASCADE;


--
-- TOC entry 5964 (class 2606 OID 17396)
-- Name: asp_net_user_tokens fk_asp_net_user_tokens_asp_net_users_user_id; Type: FK CONSTRAINT; Schema: identity; Owner: postgres
--

ALTER TABLE ONLY identity.asp_net_user_tokens
    ADD CONSTRAINT fk_asp_net_user_tokens_asp_net_users_user_id FOREIGN KEY (user_id) REFERENCES identity.asp_net_users(id) ON DELETE CASCADE;


--
-- TOC entry 5965 (class 2606 OID 17401)
-- Name: phone_login_codes fk_phone_login_codes_asp_net_users_user_id; Type: FK CONSTRAINT; Schema: identity; Owner: postgres
--

ALTER TABLE ONLY identity.phone_login_codes
    ADD CONSTRAINT fk_phone_login_codes_asp_net_users_user_id FOREIGN KEY (user_id) REFERENCES identity.asp_net_users(id) ON DELETE CASCADE;


--
-- TOC entry 5966 (class 2606 OID 17406)
-- Name: refresh_tokens fk_refresh_tokens_asp_net_users_user_id; Type: FK CONSTRAINT; Schema: identity; Owner: postgres
--

ALTER TABLE ONLY identity.refresh_tokens
    ADD CONSTRAINT fk_refresh_tokens_asp_net_users_user_id FOREIGN KEY (user_id) REFERENCES identity.asp_net_users(id) ON DELETE CASCADE;


--
-- TOC entry 5971 (class 2606 OID 18507)
-- Name: offers offers_provider_service_id_fkey; Type: FK CONSTRAINT; Schema: marketing; Owner: postgres
--

ALTER TABLE ONLY marketing.offers
    ADD CONSTRAINT offers_provider_service_id_fkey FOREIGN KEY (provider_service_id) REFERENCES category.provider_services(id);


-- Completed on 2026-04-18 01:15:45

--
-- PostgreSQL database dump complete
--

