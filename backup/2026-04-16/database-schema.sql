--
-- PostgreSQL database dump
--

-- Dumped from database version 16.0
-- Dumped by pg_dump version 17.1

-- Started on 2026-04-27 00:47:20

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
-- TOC entry 17 (class 2615 OID 19549)
-- Name: auth; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA auth;


ALTER SCHEMA auth OWNER TO postgres;

--
-- TOC entry 14 (class 2615 OID 17935)
-- Name: booking; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA booking;


ALTER SCHEMA booking OWNER TO postgres;

--
-- TOC entry 10 (class 2615 OID 16398)
-- Name: category; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA category;


ALTER SCHEMA category OWNER TO postgres;

--
-- TOC entry 25 (class 2615 OID 23108)
-- Name: commercial; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA commercial;


ALTER SCHEMA commercial OWNER TO postgres;

--
-- TOC entry 11 (class 2615 OID 16399)
-- Name: common; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA common;


ALTER SCHEMA common OWNER TO postgres;

--
-- TOC entry 12 (class 2615 OID 16400)
-- Name: customer; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA customer;


ALTER SCHEMA customer OWNER TO postgres;

--
-- TOC entry 24 (class 2615 OID 22913)
-- Name: finance; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA finance;


ALTER SCHEMA finance OWNER TO postgres;

--
-- TOC entry 8180 (class 0 OID 0)
-- Dependencies: 24
-- Name: SCHEMA finance; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA finance IS 'Currency metadata, exchange rates, FX quotes, and marketplace currency conversion support.';


--
-- TOC entry 23 (class 2615 OID 22192)
-- Name: form_builder; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA form_builder;


ALTER SCHEMA form_builder OWNER TO postgres;

--
-- TOC entry 13 (class 2615 OID 16401)
-- Name: identity; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA identity;


ALTER SCHEMA identity OWNER TO postgres;

--
-- TOC entry 19 (class 2615 OID 19731)
-- Name: loyalty; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA loyalty;


ALTER SCHEMA loyalty OWNER TO postgres;

--
-- TOC entry 16 (class 2615 OID 18139)
-- Name: marketing; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA marketing;


ALTER SCHEMA marketing OWNER TO postgres;

--
-- TOC entry 18 (class 2615 OID 19615)
-- Name: media; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA media;


ALTER SCHEMA media OWNER TO postgres;

--
-- TOC entry 20 (class 2615 OID 20093)
-- Name: notify; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA notify;


ALTER SCHEMA notify OWNER TO postgres;

--
-- TOC entry 22 (class 2615 OID 21787)
-- Name: provider_portal; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA provider_portal;


ALTER SCHEMA provider_portal OWNER TO postgres;

--
-- TOC entry 15 (class 2615 OID 18023)
-- Name: search; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA search;


ALTER SCHEMA search OWNER TO postgres;

--
-- TOC entry 21 (class 2615 OID 20168)
-- Name: shop; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA shop;


ALTER SCHEMA shop OWNER TO postgres;

--
-- TOC entry 4 (class 3079 OID 18596)
-- Name: btree_gist; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public;


--
-- TOC entry 8181 (class 0 OID 0)
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
-- TOC entry 8182 (class 0 OID 0)
-- Dependencies: 3
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- TOC entry 5 (class 3079 OID 22876)
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- TOC entry 8183 (class 0 OID 0)
-- Dependencies: 5
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- TOC entry 2 (class 3079 OID 16402)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- TOC entry 8184 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- TOC entry 1629 (class 1247 OID 19306)
-- Name: favorite_type; Type: TYPE; Schema: customer; Owner: postgres
--

CREATE TYPE customer.favorite_type AS ENUM (
    'provider',
    'service',
    'specialist'
);


ALTER TYPE customer.favorite_type OWNER TO postgres;

--
-- TOC entry 1926 (class 1247 OID 21202)
-- Name: discount_type; Type: TYPE; Schema: marketing; Owner: postgres
--

CREATE TYPE marketing.discount_type AS ENUM (
    'percent',
    'fixed'
);


ALTER TYPE marketing.discount_type OWNER TO postgres;

--
-- TOC entry 1929 (class 1247 OID 21208)
-- Name: referral_invitation_status; Type: TYPE; Schema: marketing; Owner: postgres
--

CREATE TYPE marketing.referral_invitation_status AS ENUM (
    'sent',
    'registered',
    'profile_completed',
    'qualified',
    'rewarded',
    'cancelled'
);


ALTER TYPE marketing.referral_invitation_status OWNER TO postgres;

--
-- TOC entry 1917 (class 1247 OID 21179)
-- Name: referral_program_status; Type: TYPE; Schema: marketing; Owner: postgres
--

CREATE TYPE marketing.referral_program_status AS ENUM (
    'draft',
    'active',
    'archived'
);


ALTER TYPE marketing.referral_program_status OWNER TO postgres;

--
-- TOC entry 1923 (class 1247 OID 21196)
-- Name: reward_recipient; Type: TYPE; Schema: marketing; Owner: postgres
--

CREATE TYPE marketing.reward_recipient AS ENUM (
    'referrer',
    'referee'
);


ALTER TYPE marketing.reward_recipient OWNER TO postgres;

--
-- TOC entry 1920 (class 1247 OID 21186)
-- Name: reward_trigger; Type: TYPE; Schema: marketing; Owner: postgres
--

CREATE TYPE marketing.reward_trigger AS ENUM (
    'signup',
    'profile_completed',
    'referral_joined',
    'first_booking_completed'
);


ALTER TYPE marketing.reward_trigger OWNER TO postgres;

--
-- TOC entry 1932 (class 1247 OID 21222)
-- Name: user_coupon_status; Type: TYPE; Schema: marketing; Owner: postgres
--

CREATE TYPE marketing.user_coupon_status AS ENUM (
    'issued',
    'reserved',
    'redeemed',
    'expired',
    'cancelled'
);


ALTER TYPE marketing.user_coupon_status OWNER TO postgres;

--
-- TOC entry 1740 (class 1247 OID 20102)
-- Name: delivery_channel; Type: TYPE; Schema: notify; Owner: postgres
--

CREATE TYPE notify.delivery_channel AS ENUM (
    'in_app',
    'email',
    'sms',
    'push',
    'phone_call'
);


ALTER TYPE notify.delivery_channel OWNER TO postgres;

--
-- TOC entry 1743 (class 1247 OID 20114)
-- Name: notification_status; Type: TYPE; Schema: notify; Owner: postgres
--

CREATE TYPE notify.notification_status AS ENUM (
    'queued',
    'processing',
    'sent',
    'failed',
    'cancelled'
);


ALTER TYPE notify.notification_status OWNER TO postgres;

--
-- TOC entry 1737 (class 1247 OID 20095)
-- Name: notification_type; Type: TYPE; Schema: notify; Owner: postgres
--

CREATE TYPE notify.notification_type AS ENUM (
    'booking',
    'offer',
    'system'
);


ALTER TYPE notify.notification_type OWNER TO postgres;

--
-- TOC entry 1956 (class 1247 OID 21802)
-- Name: application_status; Type: TYPE; Schema: provider_portal; Owner: postgres
--

CREATE TYPE provider_portal.application_status AS ENUM (
    'draft',
    'submitted',
    'in_review',
    'approved',
    'rejected',
    'disabled'
);


ALTER TYPE provider_portal.application_status OWNER TO postgres;

--
-- TOC entry 1953 (class 1247 OID 21789)
-- Name: membership_role; Type: TYPE; Schema: provider_portal; Owner: postgres
--

CREATE TYPE provider_portal.membership_role AS ENUM (
    'owner',
    'admin',
    'manager',
    'editor',
    'viewer',
    'staff'
);


ALTER TYPE provider_portal.membership_role OWNER TO postgres;

--
-- TOC entry 1962 (class 1247 OID 21826)
-- Name: section_page_kind; Type: TYPE; Schema: provider_portal; Owner: postgres
--

CREATE TYPE provider_portal.section_page_kind AS ENUM (
    'dashboard',
    'bookings',
    'services',
    'staff',
    'media',
    'availability',
    'reviews',
    'offers',
    'analytics',
    'billing',
    'support',
    'settings',
    'custom',
    'applications'
);


ALTER TYPE provider_portal.section_page_kind OWNER TO postgres;

--
-- TOC entry 1959 (class 1247 OID 21816)
-- Name: ticket_status; Type: TYPE; Schema: provider_portal; Owner: postgres
--

CREATE TYPE provider_portal.ticket_status AS ENUM (
    'open',
    'in_progress',
    'resolved',
    'closed'
);


ALTER TYPE provider_portal.ticket_status OWNER TO postgres;

--
-- TOC entry 1773 (class 1247 OID 20268)
-- Name: address_type; Type: TYPE; Schema: shop; Owner: postgres
--

CREATE TYPE shop.address_type AS ENUM (
    'shipping',
    'billing'
);


ALTER TYPE shop.address_type OWNER TO postgres;

--
-- TOC entry 1761 (class 1247 OID 20202)
-- Name: cart_status; Type: TYPE; Schema: shop; Owner: postgres
--

CREATE TYPE shop.cart_status AS ENUM (
    'active',
    'converted',
    'abandoned',
    'expired'
);


ALTER TYPE shop.cart_status OWNER TO postgres;

--
-- TOC entry 1794 (class 1247 OID 20332)
-- Name: comparison_status; Type: TYPE; Schema: shop; Owner: postgres
--

CREATE TYPE shop.comparison_status AS ENUM (
    'active',
    'removed'
);


ALTER TYPE shop.comparison_status OWNER TO postgres;

--
-- TOC entry 1776 (class 1247 OID 20274)
-- Name: coupon_type; Type: TYPE; Schema: shop; Owner: postgres
--

CREATE TYPE shop.coupon_type AS ENUM (
    'fixed',
    'percentage',
    'free_shipping'
);


ALTER TYPE shop.coupon_type OWNER TO postgres;

--
-- TOC entry 1779 (class 1247 OID 20282)
-- Name: discount_scope; Type: TYPE; Schema: shop; Owner: postgres
--

CREATE TYPE shop.discount_scope AS ENUM (
    'cart',
    'product',
    'category',
    'brand',
    'shipping'
);


ALTER TYPE shop.discount_scope OWNER TO postgres;

--
-- TOC entry 1788 (class 1247 OID 20316)
-- Name: fulfillment_type; Type: TYPE; Schema: shop; Owner: postgres
--

CREATE TYPE shop.fulfillment_type AS ENUM (
    'delivery',
    'pickup',
    'download'
);


ALTER TYPE shop.fulfillment_type OWNER TO postgres;

--
-- TOC entry 1758 (class 1247 OID 20188)
-- Name: inventory_movement_type; Type: TYPE; Schema: shop; Owner: postgres
--

CREATE TYPE shop.inventory_movement_type AS ENUM (
    'inbound',
    'outbound',
    'adjustment',
    'reservation',
    'release',
    'return'
);


ALTER TYPE shop.inventory_movement_type OWNER TO postgres;

--
-- TOC entry 1764 (class 1247 OID 20212)
-- Name: order_status; Type: TYPE; Schema: shop; Owner: postgres
--

CREATE TYPE shop.order_status AS ENUM (
    'pending',
    'awaiting_payment',
    'paid',
    'processing',
    'partially_shipped',
    'shipped',
    'completed',
    'cancelled',
    'refunded',
    'partially_refunded',
    'returned'
);


ALTER TYPE shop.order_status OWNER TO postgres;

--
-- TOC entry 1767 (class 1247 OID 20236)
-- Name: payment_status; Type: TYPE; Schema: shop; Owner: postgres
--

CREATE TYPE shop.payment_status AS ENUM (
    'pending',
    'authorized',
    'captured',
    'failed',
    'voided',
    'partially_refunded',
    'refunded'
);


ALTER TYPE shop.payment_status OWNER TO postgres;

--
-- TOC entry 1755 (class 1247 OID 20180)
-- Name: product_status; Type: TYPE; Schema: shop; Owner: postgres
--

CREATE TYPE shop.product_status AS ENUM (
    'draft',
    'active',
    'archived'
);


ALTER TYPE shop.product_status OWNER TO postgres;

--
-- TOC entry 1752 (class 1247 OID 20170)
-- Name: product_type; Type: TYPE; Schema: shop; Owner: postgres
--

CREATE TYPE shop.product_type AS ENUM (
    'simple',
    'variant',
    'bundle',
    'digital'
);


ALTER TYPE shop.product_type OWNER TO postgres;

--
-- TOC entry 1791 (class 1247 OID 20324)
-- Name: question_status; Type: TYPE; Schema: shop; Owner: postgres
--

CREATE TYPE shop.question_status AS ENUM (
    'open',
    'answered',
    'hidden'
);


ALTER TYPE shop.question_status OWNER TO postgres;

--
-- TOC entry 1785 (class 1247 OID 20302)
-- Name: return_status; Type: TYPE; Schema: shop; Owner: postgres
--

CREATE TYPE shop.return_status AS ENUM (
    'requested',
    'approved',
    'rejected',
    'received',
    'refunded',
    'cancelled'
);


ALTER TYPE shop.return_status OWNER TO postgres;

--
-- TOC entry 1782 (class 1247 OID 20294)
-- Name: review_status; Type: TYPE; Schema: shop; Owner: postgres
--

CREATE TYPE shop.review_status AS ENUM (
    'pending',
    'approved',
    'rejected'
);


ALTER TYPE shop.review_status OWNER TO postgres;

--
-- TOC entry 1770 (class 1247 OID 20252)
-- Name: shipment_status; Type: TYPE; Schema: shop; Owner: postgres
--

CREATE TYPE shop.shipment_status AS ENUM (
    'pending',
    'ready',
    'packed',
    'shipped',
    'delivered',
    'failed',
    'returned'
);


ALTER TYPE shop.shipment_status OWNER TO postgres;

--
-- TOC entry 511 (class 1255 OID 22607)
-- Name: set_last_modified_date(); Type: FUNCTION; Schema: booking; Owner: postgres
--

CREATE FUNCTION booking.set_last_modified_date() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN

    IF EXISTS(SELECT 1 
             FROM information_schema.columns 
             WHERE table_name = TG_TABLE_NAME AND column_name = 'updated_at') THEN
    NEW.updated_at = now();
  END IF;

    IF EXISTS(SELECT 1 
             FROM information_schema.columns 
             WHERE table_name = TG_TABLE_NAME AND column_name = 'last_modified_date') THEN
    NEW.last_modified_date = now();
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION booking.set_last_modified_date() OWNER TO postgres;

--
-- TOC entry 711 (class 1255 OID 23109)
-- Name: set_updated_at(); Type: FUNCTION; Schema: commercial; Owner: postgres
--

CREATE FUNCTION commercial.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION commercial.set_updated_at() OWNER TO postgres;

--
-- TOC entry 467 (class 1255 OID 19304)
-- Name: get_translation(jsonb, text, text); Type: FUNCTION; Schema: common; Owner: postgres
--

CREATE FUNCTION common.get_translation(translations jsonb, preferred_language text, fallback_language text DEFAULT 'en-US'::text) RETURNS text
    LANGUAGE sql IMMUTABLE
    AS $$
WITH safe AS (
  SELECT CASE
    WHEN translations IS NULL THEN '{}'::jsonb
    WHEN jsonb_typeof(translations) = 'object' THEN translations
    WHEN jsonb_typeof(translations) = 'string' THEN jsonb_build_object(
      COALESCE(NULLIF(BTRIM(preferred_language), ''), NULLIF(BTRIM(fallback_language), ''), 'en-US'),
      translations #>> '{}'
    )
    ELSE '{}'::jsonb
  END AS translations
),
p AS (
  SELECT
    NULLIF(BTRIM(preferred_language), '') AS preferred_language,
    NULLIF(BTRIM(fallback_language), '') AS fallback_language,
    LOWER(REPLACE(NULLIF(BTRIM(preferred_language), ''), '_', '-')) AS preferred_norm,
    LOWER(REPLACE(NULLIF(BTRIM(fallback_language), ''), '_', '-')) AS fallback_norm,
    SPLIT_PART(LOWER(REPLACE(NULLIF(BTRIM(preferred_language), ''), '_', '-')), '-', 1) AS preferred_base,
    SPLIT_PART(LOWER(REPLACE(NULLIF(BTRIM(fallback_language), ''), '_', '-')), '-', 1) AS fallback_base
),
candidates AS (
  SELECT 1 AS ord, NULLIF(BTRIM(safe.translations ->> p.preferred_language), '') AS value
  FROM safe CROSS JOIN p

  UNION ALL

  SELECT 2 AS ord, NULLIF(BTRIM(e.value), '') AS value
  FROM safe CROSS JOIN p
  CROSS JOIN LATERAL jsonb_each_text(safe.translations) e
  WHERE p.preferred_norm IS NOT NULL
    AND LOWER(REPLACE(e.key, '_', '-')) = p.preferred_norm

  UNION ALL

  SELECT 3 AS ord, NULLIF(BTRIM(e.value), '') AS value
  FROM safe CROSS JOIN p
  CROSS JOIN LATERAL jsonb_each_text(safe.translations) e
  WHERE p.preferred_base IS NOT NULL
    AND SPLIT_PART(LOWER(REPLACE(e.key, '_', '-')), '-', 1) = p.preferred_base

  UNION ALL

  SELECT 4 AS ord, NULLIF(BTRIM(safe.translations ->> p.fallback_language), '') AS value
  FROM safe CROSS JOIN p

  UNION ALL

  SELECT 5 AS ord, NULLIF(BTRIM(e.value), '') AS value
  FROM safe CROSS JOIN p
  CROSS JOIN LATERAL jsonb_each_text(safe.translations) e
  WHERE p.fallback_norm IS NOT NULL
    AND LOWER(REPLACE(e.key, '_', '-')) = p.fallback_norm

  UNION ALL

  SELECT 6 AS ord, NULLIF(BTRIM(e.value), '') AS value
  FROM safe CROSS JOIN p
  CROSS JOIN LATERAL jsonb_each_text(safe.translations) e
  WHERE p.fallback_base IS NOT NULL
    AND SPLIT_PART(LOWER(REPLACE(e.key, '_', '-')), '-', 1) = p.fallback_base

  UNION ALL

  SELECT 7 AS ord, NULLIF(BTRIM(e.value), '') AS value
  FROM safe
  CROSS JOIN LATERAL jsonb_each_text(safe.translations) e
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


ALTER FUNCTION common.get_translation(translations jsonb, preferred_language text, fallback_language text) OWNER TO postgres;

--
-- TOC entry 489 (class 1255 OID 19467)
-- Name: get_translation_t(jsonb, text, text); Type: FUNCTION; Schema: common; Owner: postgres
--

CREATE FUNCTION common.get_translation_t(translations jsonb, preferred_language text, fallback_language text DEFAULT 'en-US'::text) RETURNS text
    LANGUAGE sql IMMUTABLE
    AS $$
WITH safe AS (
  SELECT CASE
    WHEN translations IS NULL THEN '{}'::jsonb
    WHEN jsonb_typeof(translations) = 'object' THEN translations
    WHEN jsonb_typeof(translations) = 'string' THEN jsonb_build_object(
      COALESCE(NULLIF(BTRIM(preferred_language), ''), NULLIF(BTRIM(fallback_language), ''), 'en-US'),
      translations #>> '{}'
    )
    ELSE '{}'::jsonb
  END AS translations
),
p AS (
  SELECT
    NULLIF(BTRIM(preferred_language), '') AS preferred_language,
    NULLIF(BTRIM(fallback_language), '') AS fallback_language,
    LOWER(REPLACE(NULLIF(BTRIM(preferred_language), ''), '_', '-')) AS preferred_norm,
    LOWER(REPLACE(NULLIF(BTRIM(fallback_language), ''), '_', '-')) AS fallback_norm,
    SPLIT_PART(LOWER(REPLACE(NULLIF(BTRIM(preferred_language), ''), '_', '-')), '-', 1) AS preferred_base,
    SPLIT_PART(LOWER(REPLACE(NULLIF(BTRIM(fallback_language), ''), '_', '-')), '-', 1) AS fallback_base
),
candidates AS (
  SELECT 1 AS ord, NULLIF(BTRIM(safe.translations ->> p.preferred_language), '') AS value
  FROM safe CROSS JOIN p

  UNION ALL

  SELECT 2 AS ord, NULLIF(BTRIM(e.value), '') AS value
  FROM safe CROSS JOIN p
  CROSS JOIN LATERAL jsonb_each_text(safe.translations) e
  WHERE p.preferred_norm IS NOT NULL
    AND LOWER(REPLACE(e.key, '_', '-')) = p.preferred_norm

  UNION ALL

  SELECT 3 AS ord, NULLIF(BTRIM(e.value), '') AS value
  FROM safe CROSS JOIN p
  CROSS JOIN LATERAL jsonb_each_text(safe.translations) e
  WHERE p.preferred_base IS NOT NULL
    AND SPLIT_PART(LOWER(REPLACE(e.key, '_', '-')), '-', 1) = p.preferred_base

  UNION ALL

  SELECT 4 AS ord, NULLIF(BTRIM(safe.translations ->> p.fallback_language), '') AS value
  FROM safe CROSS JOIN p

  UNION ALL

  SELECT 5 AS ord, NULLIF(BTRIM(e.value), '') AS value
  FROM safe CROSS JOIN p
  CROSS JOIN LATERAL jsonb_each_text(safe.translations) e
  WHERE p.fallback_norm IS NOT NULL
    AND LOWER(REPLACE(e.key, '_', '-')) = p.fallback_norm

  UNION ALL

  SELECT 6 AS ord, NULLIF(BTRIM(e.value), '') AS value
  FROM safe CROSS JOIN p
  CROSS JOIN LATERAL jsonb_each_text(safe.translations) e
  WHERE p.fallback_base IS NOT NULL
    AND SPLIT_PART(LOWER(REPLACE(e.key, '_', '-')), '-', 1) = p.fallback_base

  UNION ALL

  SELECT 7 AS ord, NULLIF(BTRIM(e.value), '') AS value
  FROM safe
  CROSS JOIN LATERAL jsonb_each_text(safe.translations) e
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

--
-- TOC entry 554 (class 1255 OID 23048)
-- Name: before_exchange_rate_write(); Type: FUNCTION; Schema: finance; Owner: postgres
--

CREATE FUNCTION finance.before_exchange_rate_write() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  new.base_currency_code = upper(btrim(new.base_currency_code));
  new.quote_currency_code = upper(btrim(new.quote_currency_code));

  if new.is_latest then
    update finance.exchange_rates
       set is_latest = false
     where base_currency_code = new.base_currency_code
       and quote_currency_code = new.quote_currency_code
       and id is distinct from new.id
       and is_latest = true;
  end if;

  return new;
end;
$$;


ALTER FUNCTION finance.before_exchange_rate_write() OWNER TO postgres;

--
-- TOC entry 505 (class 1255 OID 23052)
-- Name: convert_money(numeric, character varying, character varying, text); Type: FUNCTION; Schema: finance; Owner: postgres
--

CREATE FUNCTION finance.convert_money(p_amount numeric, p_source_currency_code character varying, p_target_currency_code character varying, p_margin_profile text DEFAULT 'standard'::text) RETURNS TABLE(source_amount numeric, source_currency_code character varying, target_amount numeric, target_currency_code character varying, base_rate numeric, applied_rate numeric, margin_percent numeric, exchange_rate_ids uuid[], rate_path text[], as_of timestamp with time zone, expires_at timestamp with time zone)
    LANGUAGE plpgsql STABLE
    AS $$
declare
  v_rate record;
  v_margin numeric := 0;
  v_source varchar(10) := upper(btrim(p_source_currency_code));
  v_target varchar(10) := upper(btrim(p_target_currency_code));
begin
  select * into v_rate from finance.get_latest_rate(v_source, v_target) limit 1;

  select coalesce(pm.margin_percent, mp.default_margin_percent, 0)
    into v_margin
  from finance.fx_margin_profiles mp
  left join finance.fx_pair_margins pm
    on pm.profile_code = mp.code
   and pm.base_currency_code = v_source
   and pm.quote_currency_code = v_target
   and pm.is_active = true
  where mp.code = coalesce(nullif(p_margin_profile, ''), 'standard')
    and mp.is_active = true
  limit 1;

  v_margin := coalesce(v_margin, 0);

  return query select
    p_amount,
    v_source,
    finance.round_money(p_amount * v_rate.base_rate * (1 + (v_margin / 100)), v_target),
    v_target,
    v_rate.base_rate,
    (v_rate.base_rate * (1 + (v_margin / 100))),
    v_margin,
    v_rate.exchange_rate_ids,
    v_rate.rate_path,
    v_rate.as_of,
    v_rate.expires_at;
end;
$$;


ALTER FUNCTION finance.convert_money(p_amount numeric, p_source_currency_code character varying, p_target_currency_code character varying, p_margin_profile text) OWNER TO postgres;

--
-- TOC entry 654 (class 1255 OID 23051)
-- Name: get_latest_rate(character varying, character varying); Type: FUNCTION; Schema: finance; Owner: postgres
--

CREATE FUNCTION finance.get_latest_rate(p_source_currency_code character varying, p_target_currency_code character varying) RETURNS TABLE(base_rate numeric, exchange_rate_ids uuid[], rate_path text[], as_of timestamp with time zone, expires_at timestamp with time zone, source text)
    LANGUAGE plpgsql STABLE
    AS $$
declare
  v_source varchar(10) := upper(btrim(p_source_currency_code));
  v_target varchar(10) := upper(btrim(p_target_currency_code));
  v_direct record;
  v_inverse record;
  v_a record;
  v_b record;
begin
  if v_source = v_target then
    return query select 1::numeric, array[]::uuid[], array[v_source, v_target]::text[], now(), null::timestamptz, 'same_currency'::text;
    return;
  end if;

  select * into v_direct
  from finance.exchange_rates er
  where er.base_currency_code = v_source
    and er.quote_currency_code = v_target
    and er.is_latest = true
    and (er.expires_at is null or er.expires_at > now())
  order by er.as_of desc
  limit 1;

  if found then
    return query select v_direct.rate, array[v_direct.id]::uuid[], array[v_source, v_target]::text[], v_direct.as_of, v_direct.expires_at, v_direct.source::text;
    return;
  end if;

  select * into v_inverse
  from finance.exchange_rates er
  where er.base_currency_code = v_target
    and er.quote_currency_code = v_source
    and er.is_latest = true
    and (er.expires_at is null or er.expires_at > now())
  order by er.as_of desc
  limit 1;

  if found then
    return query select (1 / v_inverse.rate), array[v_inverse.id]::uuid[], array[v_source, v_target]::text[], v_inverse.as_of, v_inverse.expires_at, concat(v_inverse.source, ':inverse')::text;
    return;
  end if;

  -- USD pivot path. This is enough for phase one if admin enters all rates versus USD.
  if v_source <> 'USD' and v_target <> 'USD' then
    select * into v_a from finance.get_latest_rate(v_source, 'USD') limit 1;
    select * into v_b from finance.get_latest_rate('USD', v_target) limit 1;

    if v_a.base_rate is not null and v_b.base_rate is not null then
      return query select
        (v_a.base_rate * v_b.base_rate),
        (coalesce(v_a.exchange_rate_ids, array[]::uuid[]) || coalesce(v_b.exchange_rate_ids, array[]::uuid[])),
        array[v_source, 'USD', v_target]::text[],
        greatest(v_a.as_of, v_b.as_of),
        least(v_a.expires_at, v_b.expires_at),
        'usd_pivot'::text;
      return;
    end if;
  end if;

  raise exception 'No active exchange rate found from % to %', v_source, v_target
    using errcode = 'P0001';
end;
$$;


ALTER FUNCTION finance.get_latest_rate(p_source_currency_code character varying, p_target_currency_code character varying) OWNER TO postgres;

--
-- TOC entry 582 (class 1255 OID 23050)
-- Name: round_money(numeric, character varying); Type: FUNCTION; Schema: finance; Owner: postgres
--

CREATE FUNCTION finance.round_money(p_amount numeric, p_currency_code character varying) RETURNS numeric
    LANGUAGE sql STABLE
    AS $$
  select round(
    coalesce(p_amount, 0),
    coalesce((select decimal_digits from finance.currencies where code = upper(btrim(p_currency_code))), 2)::int
  );
$$;


ALTER FUNCTION finance.round_money(p_amount numeric, p_currency_code character varying) OWNER TO postgres;

--
-- TOC entry 713 (class 1255 OID 23043)
-- Name: set_updated_at(); Type: FUNCTION; Schema: finance; Owner: postgres
--

CREATE FUNCTION finance.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION finance.set_updated_at() OWNER TO postgres;

--
-- TOC entry 529 (class 1255 OID 22417)
-- Name: set_last_modified_date(); Type: FUNCTION; Schema: form_builder; Owner: postgres
--

CREATE FUNCTION form_builder.set_last_modified_date() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.last_modified_date = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION form_builder.set_last_modified_date() OWNER TO postgres;

--
-- TOC entry 609 (class 1255 OID 22756)
-- Name: set_last_modified_date(); Type: FUNCTION; Schema: identity; Owner: postgres
--

CREATE FUNCTION identity.set_last_modified_date() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  new.last_modified_date = now();
  return new;
end;
$$;


ALTER FUNCTION identity.set_last_modified_date() OWNER TO postgres;

--
-- TOC entry 477 (class 1255 OID 19643)
-- Name: set_last_modified_date(); Type: FUNCTION; Schema: media; Owner: postgres
--

CREATE FUNCTION media.set_last_modified_date() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.last_modified_date = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION media.set_last_modified_date() OWNER TO postgres;

--
-- TOC entry 715 (class 1255 OID 20166)
-- Name: create_booking_notification(uuid, character varying, text, uuid, character varying, character varying, text); Type: FUNCTION; Schema: notify; Owner: postgres
--

CREATE FUNCTION notify.create_booking_notification(p_customer_id uuid, p_title character varying, p_body text, p_booking_id uuid, p_email character varying DEFAULT NULL::character varying, p_phone character varying DEFAULT NULL::character varying, p_push_token text DEFAULT NULL::text) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
declare
  v_notification_id uuid;
begin
  insert into notify.notifications (
    customer_id,
    notification_type,
    title,
    body,
    entity_type,
    entity_id,
    status
  )
  values (
    p_customer_id,
    'booking',
    p_title,
    p_body,
    'booking',
    p_booking_id,
    'queued'
  )
  returning id into v_notification_id;

  insert into notify.notification_deliveries (
    notification_id,
    channel,
    recipient_email,
    recipient_phone,
    recipient_push_token,
    status
  )
  values
    (v_notification_id, 'in_app', null, null, null, 'sent'),
    (v_notification_id, 'email', p_email, null, null, 'queued'),
    (v_notification_id, 'sms', null, p_phone, null, 'queued'),
    (v_notification_id, 'push', null, null, p_push_token, 'queued');

  return v_notification_id;
end;
$$;


ALTER FUNCTION notify.create_booking_notification(p_customer_id uuid, p_title character varying, p_body text, p_booking_id uuid, p_email character varying, p_phone character varying, p_push_token text) OWNER TO postgres;

--
-- TOC entry 684 (class 1255 OID 20163)
-- Name: set_updated_at(); Type: FUNCTION; Schema: notify; Owner: postgres
--

CREATE FUNCTION notify.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION notify.set_updated_at() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 341 (class 1259 OID 19570)
-- Name: role_table_permissions; Type: TABLE; Schema: auth; Owner: postgres
--

CREATE TABLE auth.role_table_permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    role_id uuid NOT NULL,
    schema_name text NOT NULL,
    table_name text NOT NULL,
    can_read boolean DEFAULT false NOT NULL,
    can_create boolean DEFAULT false NOT NULL,
    can_update boolean DEFAULT false NOT NULL,
    can_delete boolean DEFAULT false NOT NULL
);


ALTER TABLE auth.role_table_permissions OWNER TO postgres;

--
-- TOC entry 339 (class 1259 OID 19550)
-- Name: roles; Type: TABLE; Schema: auth; Owner: postgres
--

CREATE TABLE auth.roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL
);


ALTER TABLE auth.roles OWNER TO postgres;

--
-- TOC entry 340 (class 1259 OID 19560)
-- Name: user_roles; Type: TABLE; Schema: auth; Owner: postgres
--

CREATE TABLE auth.user_roles (
    user_id uuid NOT NULL,
    role_id uuid NOT NULL
);


ALTER TABLE auth.user_roles OWNER TO postgres;

--
-- TOC entry 360 (class 1259 OID 20032)
-- Name: booking_addons; Type: TABLE; Schema: booking; Owner: postgres
--

CREATE TABLE booking.booking_addons (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    booking_id uuid NOT NULL,
    addon_id text NOT NULL,
    source_type text NOT NULL,
    addon_kind text NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    unit_price numeric(18,2) DEFAULT 0 NOT NULL,
    config jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    currency_code character varying(10) DEFAULT 'USD'::character varying NOT NULL,
    source_unit_price numeric(18,2),
    display_unit_price numeric(18,2),
    exchange_rate numeric(24,12),
    exchange_rate_ids uuid[] DEFAULT ARRAY[]::uuid[] NOT NULL,
    fx_quote_id uuid
);


ALTER TABLE booking.booking_addons OWNER TO postgres;

--
-- TOC entry 434 (class 1259 OID 22560)
-- Name: booking_child_bookings; Type: TABLE; Schema: booking; Owner: postgres
--

CREATE TABLE booking.booking_child_bookings (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    parent_booking_id uuid NOT NULL,
    provider_type_id uuid NOT NULL,
    provider_id uuid,
    service_id uuid,
    specialist_id uuid,
    selected_date date,
    selected_date_from date,
    selected_date_to date,
    selected_time time without time zone,
    selected_time_from time without time zone,
    selected_time_to time without time zone,
    adults integer,
    children integer,
    infants integer,
    rooms integer,
    booking_ui_mode text DEFAULT 'default_slot'::text NOT NULL,
    form_submission_id uuid,
    subtotal_amount numeric(18,2) DEFAULT 0 NOT NULL,
    currency character varying(15) DEFAULT 'USD'::character varying NOT NULL,
    status character varying(30) DEFAULT 'Confirmed'::character varying NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now() NOT NULL,
    provider_notes text,
    provider_updated_at timestamp with time zone,
    CONSTRAINT ck_booking_child_bookings_guest_counts CHECK (((COALESCE(adults, 0) >= 0) AND (COALESCE(children, 0) >= 0) AND (COALESCE(infants, 0) >= 0) AND (COALESCE(rooms, 0) >= 0))),
    CONSTRAINT ck_booking_child_bookings_ui_mode CHECK ((booking_ui_mode = ANY (ARRAY['default_slot'::text, 'date_range'::text, 'custom_form'::text])))
);


ALTER TABLE booking.booking_child_bookings OWNER TO postgres;

--
-- TOC entry 361 (class 1259 OID 20055)
-- Name: booking_documents; Type: TABLE; Schema: booking; Owner: postgres
--

CREATE TABLE booking.booking_documents (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    booking_id uuid NOT NULL,
    requirement_id uuid,
    title text NOT NULL,
    file_name text NOT NULL,
    file_url text NOT NULL,
    mime_type text,
    size_bytes bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE booking.booking_documents OWNER TO postgres;

--
-- TOC entry 358 (class 1259 OID 19996)
-- Name: booking_draft_addons; Type: TABLE; Schema: booking; Owner: postgres
--

CREATE TABLE booking.booking_draft_addons (
    draft_id uuid NOT NULL,
    addon_id text NOT NULL,
    source_type text NOT NULL,
    addon_kind text NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    unit_price numeric(18,2) DEFAULT 0 NOT NULL,
    config jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    currency_code character varying(10) DEFAULT 'USD'::character varying NOT NULL,
    source_unit_price numeric(18,2),
    display_unit_price numeric(18,2),
    exchange_rate numeric(24,12),
    exchange_rate_ids uuid[] DEFAULT ARRAY[]::uuid[] NOT NULL,
    fx_quote_id uuid
);


ALTER TABLE booking.booking_draft_addons OWNER TO postgres;

--
-- TOC entry 433 (class 1259 OID 22512)
-- Name: booking_draft_child_bookings; Type: TABLE; Schema: booking; Owner: postgres
--

CREATE TABLE booking.booking_draft_child_bookings (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    parent_draft_id uuid NOT NULL,
    provider_type_id uuid NOT NULL,
    provider_id uuid,
    service_id uuid,
    specialist_id uuid,
    selected_date date,
    selected_date_from date,
    selected_date_to date,
    selected_time time without time zone,
    selected_time_from time without time zone,
    selected_time_to time without time zone,
    adults integer,
    children integer,
    infants integer,
    rooms integer,
    booking_ui_mode text DEFAULT 'default_slot'::text NOT NULL,
    form_submission_id uuid,
    subtotal_amount numeric(18,2) DEFAULT 0 NOT NULL,
    currency character varying(15) DEFAULT 'USD'::character varying NOT NULL,
    status character varying(30) DEFAULT 'Draft'::character varying NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_booking_draft_child_bookings_guest_counts CHECK (((COALESCE(adults, 0) >= 0) AND (COALESCE(children, 0) >= 0) AND (COALESCE(infants, 0) >= 0) AND (COALESCE(rooms, 0) >= 0))),
    CONSTRAINT ck_booking_draft_child_bookings_ui_mode CHECK ((booking_ui_mode = ANY (ARRAY['default_slot'::text, 'date_range'::text, 'custom_form'::text])))
);


ALTER TABLE booking.booking_draft_child_bookings OWNER TO postgres;

--
-- TOC entry 359 (class 1259 OID 20017)
-- Name: booking_draft_documents; Type: TABLE; Schema: booking; Owner: postgres
--

CREATE TABLE booking.booking_draft_documents (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    draft_id uuid NOT NULL,
    requirement_id uuid,
    title text NOT NULL,
    file_name text NOT NULL,
    file_url text NOT NULL,
    mime_type text,
    size_bytes bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE booking.booking_draft_documents OWNER TO postgres;

--
-- TOC entry 357 (class 1259 OID 19960)
-- Name: booking_drafts; Type: TABLE; Schema: booking; Owner: postgres
--

CREATE TABLE booking.booking_drafts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    provider_id uuid,
    service_id uuid,
    specialist_id uuid,
    selected_date date,
    selected_time time without time zone,
    selected_time_from time without time zone,
    selected_time_to time without time zone,
    use_lsevin boolean DEFAULT false NOT NULL,
    current_step integer DEFAULT 1 NOT NULL,
    payment_method text,
    currency character varying(15) DEFAULT 'USD'::character varying NOT NULL,
    subtotal_amount numeric(18,2) DEFAULT 0 NOT NULL,
    addons_amount numeric(18,2) DEFAULT 0 NOT NULL,
    total_amount numeric(18,2) DEFAULT 0 NOT NULL,
    status character varying(30) DEFAULT 'Draft'::character varying NOT NULL,
    notes text,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    submitted_at timestamp with time zone,
    selected_date_from time without time zone,
    selected_date_to time without time zone,
    source_currency_code character varying(10),
    display_currency_code character varying(10),
    payment_currency_code character varying(10),
    settlement_currency_code character varying(10),
    source_subtotal_amount numeric(18,2),
    source_addons_amount numeric(18,2),
    source_total_amount numeric(18,2),
    display_subtotal_amount numeric(18,2),
    display_addons_amount numeric(18,2),
    display_total_amount numeric(18,2),
    exchange_rate numeric(24,12),
    exchange_rate_ids uuid[] DEFAULT ARRAY[]::uuid[] NOT NULL,
    fx_quote_id uuid,
    pricing_snapshot jsonb DEFAULT '{}'::jsonb NOT NULL,
    CONSTRAINT ck_booking_drafts_current_step CHECK ((current_step >= 1))
);


ALTER TABLE booking.booking_drafts OWNER TO postgres;

--
-- TOC entry 315 (class 1259 OID 18381)
-- Name: bookings; Type: TABLE; Schema: booking; Owner: postgres
--

CREATE TABLE booking.bookings (
    provider_id uuid NOT NULL,
    service_id uuid NOT NULL,
    specialist_id uuid,
    selected_date date,
    selected_date_from time without time zone,
    selected_date_to time without time zone,
    selected_time time without time zone,
    selected_time_from time without time zone,
    selected_time_to time without time zone,
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
    currency_code character varying(10),
    total_amount numeric(18,2),
    paid_amount numeric(18,2) DEFAULT 0 NOT NULL,
    payment_reference character varying(150),
    wallet_payment_intent_id uuid,
    applied_coupon_id uuid,
    applied_discount_type character varying(20),
    applied_discount_value numeric(10,2),
    applied_discount_amount numeric(18,2),
    provider_notes text,
    provider_updated_at timestamp with time zone,
    booking_ui_mode text DEFAULT 'default_slot'::text NOT NULL,
    form_submission_id uuid,
    adults integer,
    children integer,
    infants integer,
    rooms integer,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    source_draft_id uuid,
    source_currency_code character varying(10),
    display_currency_code character varying(10),
    payment_currency_code character varying(10),
    settlement_currency_code character varying(10),
    source_subtotal_amount numeric(18,2),
    source_addons_amount numeric(18,2),
    source_total_amount numeric(18,2),
    display_subtotal_amount numeric(18,2),
    display_addons_amount numeric(18,2),
    display_total_amount numeric(18,2),
    exchange_rate numeric(24,12),
    exchange_rate_ids uuid[] DEFAULT ARRAY[]::uuid[] NOT NULL,
    fx_quote_id uuid,
    pricing_snapshot jsonb DEFAULT '{}'::jsonb NOT NULL,
    CONSTRAINT ck_bookings_booking_ui_mode CHECK ((booking_ui_mode = ANY (ARRAY['default_slot'::text, 'date_range'::text, 'custom_form'::text]))),
    CONSTRAINT ck_bookings_time_range CHECK ((selected_time_from < selected_time_to))
);


ALTER TABLE booking.bookings OWNER TO postgres;

--
-- TOC entry 362 (class 1259 OID 20070)
-- Name: payments; Type: TABLE; Schema: booking; Owner: postgres
--

CREATE TABLE booking.payments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    booking_id uuid NOT NULL,
    user_id uuid,
    payment_method text NOT NULL,
    gateway text,
    amount numeric(18,2) NOT NULL,
    currency character varying(15) DEFAULT 'USD'::character varying NOT NULL,
    status character varying(30) DEFAULT 'Pending'::character varying NOT NULL,
    external_reference text,
    gateway_payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    source_currency_code character varying(10),
    settlement_currency_code character varying(10),
    source_amount numeric(18,2),
    settlement_amount numeric(18,2),
    exchange_rate numeric(24,12),
    exchange_rate_ids uuid[] DEFAULT ARRAY[]::uuid[] NOT NULL,
    fx_quote_id uuid
);


ALTER TABLE booking.payments OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 16413)
-- Name: Currency; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category."Currency" (
    "Id" bigint NOT NULL,
    "Price" money,
    "Symbol" character varying
);


ALTER TABLE category."Currency" OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 16418)
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
-- TOC entry 237 (class 1259 OID 16419)
-- Name: LocationType; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category."LocationType" (
    id integer NOT NULL,
    name character varying(50) NOT NULL
);


ALTER TABLE category."LocationType" OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 16422)
-- Name: __EFMigrationsHistory; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category."__EFMigrationsHistory" (
    migration_id character varying(150) NOT NULL,
    product_version character varying(32) NOT NULL
);


ALTER TABLE category."__EFMigrationsHistory" OWNER TO postgres;

--
-- TOC entry 324 (class 1259 OID 18542)
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
-- TOC entry 323 (class 1259 OID 18530)
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
    last_modified_date timestamp with time zone DEFAULT now(),
    source_type text DEFAULT 'lsevin'::text NOT NULL,
    addon_kind text DEFAULT 'simple'::text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    config_schema jsonb DEFAULT '{}'::jsonb NOT NULL,
    currency_code character varying(10) DEFAULT 'USD'::character varying NOT NULL,
    CONSTRAINT ck_addons_kind CHECK ((addon_kind = ANY (ARRAY['simple'::text, 'hotel'::text, 'airport_pickup'::text, 'transport'::text, 'insurance'::text, 'other'::text]))),
    CONSTRAINT ck_addons_source_type CHECK ((source_type = ANY (ARRAY['provider'::text, 'lsevin'::text])))
);


ALTER TABLE category.addons OWNER TO postgres;

--
-- TOC entry 239 (class 1259 OID 16425)
-- Name: attribute_types; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.attribute_types (
    id integer NOT NULL,
    name character varying(25) NOT NULL
);


ALTER TABLE category.attribute_types OWNER TO postgres;

--
-- TOC entry 240 (class 1259 OID 16428)
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
    icon text,
    display_in_home_page boolean
);


ALTER TABLE category.categories OWNER TO postgres;

--
-- TOC entry 317 (class 1259 OID 18392)
-- Name: category_groups; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.category_groups (
    id integer NOT NULL,
    title character varying(200) NOT NULL
);


ALTER TABLE category.category_groups OWNER TO postgres;

--
-- TOC entry 316 (class 1259 OID 18391)
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
-- TOC entry 8185 (class 0 OID 0)
-- Dependencies: 316
-- Name: category_groups_id_seq; Type: SEQUENCE OWNED BY; Schema: category; Owner: postgres
--

ALTER SEQUENCE category.category_groups_id_seq OWNED BY category.category_groups.id;


--
-- TOC entry 241 (class 1259 OID 16436)
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
-- TOC entry 242 (class 1259 OID 16446)
-- Name: inbox_message_consumers; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.inbox_message_consumers (
    message_id uuid NOT NULL,
    name character varying(500) NOT NULL
);


ALTER TABLE category.inbox_message_consumers OWNER TO postgres;

--
-- TOC entry 243 (class 1259 OID 16451)
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
-- TOC entry 244 (class 1259 OID 16456)
-- Name: internal_command_message_consumers; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.internal_command_message_consumers (
    message_id uuid NOT NULL,
    name character varying(500) NOT NULL
);


ALTER TABLE category.internal_command_message_consumers OWNER TO postgres;

--
-- TOC entry 245 (class 1259 OID 16461)
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
-- TOC entry 246 (class 1259 OID 16466)
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
-- TOC entry 247 (class 1259 OID 16473)
-- Name: outbox_message_consumers; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.outbox_message_consumers (
    message_id uuid NOT NULL,
    name character varying(500) NOT NULL
);


ALTER TABLE category.outbox_message_consumers OWNER TO postgres;

--
-- TOC entry 248 (class 1259 OID 16478)
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
-- TOC entry 342 (class 1259 OID 19599)
-- Name: picked_locations; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.picked_locations (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    locationid uuid NOT NULL,
    image character varying(500) NOT NULL,
    latitude numeric(10,7),
    longitude numeric(10,7)
);


ALTER TABLE category.picked_locations OWNER TO postgres;

--
-- TOC entry 249 (class 1259 OID 16483)
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
-- TOC entry 250 (class 1259 OID 16488)
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
-- TOC entry 251 (class 1259 OID 16489)
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
-- TOC entry 252 (class 1259 OID 16494)
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
-- TOC entry 309 (class 1259 OID 17872)
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
-- TOC entry 253 (class 1259 OID 16499)
-- Name: provider_gallery_items; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.provider_gallery_items (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
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
-- TOC entry 336 (class 1259 OID 19468)
-- Name: provider_languages; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.provider_languages (
    service_provider_id uuid NOT NULL,
    language text NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE category.provider_languages OWNER TO postgres;

--
-- TOC entry 254 (class 1259 OID 16504)
-- Name: provider_policies; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.provider_policies (
    id uuid NOT NULL,
    type_translations jsonb NOT NULL,
    description_translations jsonb NOT NULL,
    service_provider_id uuid NOT NULL,
    create_date timestamp with time zone NOT NULL,
    last_modified_date timestamp with time zone,
    provider_policy_type_id uuid
);


ALTER TABLE category.provider_policies OWNER TO postgres;

--
-- TOC entry 444 (class 1259 OID 22843)
-- Name: provider_policy_types; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.provider_policy_types (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code text NOT NULL,
    name_translations jsonb DEFAULT '{}'::jsonb NOT NULL,
    description_translations jsonb DEFAULT '{}'::jsonb NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now(),
    CONSTRAINT ck_provider_policy_types_description_object CHECK ((jsonb_typeof(description_translations) = 'object'::text)),
    CONSTRAINT ck_provider_policy_types_name_object CHECK ((jsonb_typeof(name_translations) = 'object'::text))
);


ALTER TABLE category.provider_policy_types OWNER TO postgres;

--
-- TOC entry 311 (class 1259 OID 17891)
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
-- TOC entry 325 (class 1259 OID 18556)
-- Name: provider_service_addons; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.provider_service_addons (
    provider_service_id uuid NOT NULL,
    addon_id text NOT NULL
);


ALTER TABLE category.provider_service_addons OWNER TO postgres;

--
-- TOC entry 338 (class 1259 OID 19506)
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
-- TOC entry 255 (class 1259 OID 16509)
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
-- TOC entry 256 (class 1259 OID 16515)
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
-- TOC entry 257 (class 1259 OID 16520)
-- Name: provider_types; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.provider_types (
    id uuid NOT NULL,
    name_translations jsonb NOT NULL,
    description_translations jsonb NOT NULL,
    is_active boolean NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now(),
    icon_url character varying(250),
    image_url text
);


ALTER TABLE category.provider_types OWNER TO postgres;

--
-- TOC entry 8186 (class 0 OID 0)
-- Dependencies: 257
-- Name: COLUMN provider_types.image_url; Type: COMMENT; Schema: category; Owner: postgres
--

COMMENT ON COLUMN category.provider_types.image_url IS 'Media id or legacy URL used as the provider/product type image in admin and app UI.';


--
-- TOC entry 310 (class 1259 OID 17885)
-- Name: review_images; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.review_images (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    review_id uuid NOT NULL,
    image_url character varying(250)
);


ALTER TABLE category.review_images OWNER TO postgres;

--
-- TOC entry 258 (class 1259 OID 16527)
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
-- TOC entry 259 (class 1259 OID 16532)
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
-- TOC entry 260 (class 1259 OID 16533)
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
-- TOC entry 261 (class 1259 OID 16538)
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
-- TOC entry 435 (class 1259 OID 22622)
-- Name: service_definition_addon_provider_types; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.service_definition_addon_provider_types (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    service_definition_id uuid NOT NULL,
    provider_type_id uuid NOT NULL,
    icon text,
    display_order integer DEFAULT 0 NOT NULL,
    is_required boolean DEFAULT false NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now()
);


ALTER TABLE category.service_definition_addon_provider_types OWNER TO postgres;

--
-- TOC entry 262 (class 1259 OID 16543)
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
-- TOC entry 263 (class 1259 OID 16548)
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
-- TOC entry 264 (class 1259 OID 16549)
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
    last_modified_date timestamp with time zone DEFAULT now(),
    requires_specialist boolean DEFAULT true NOT NULL,
    booking_ui_mode text DEFAULT 'default_slot'::text NOT NULL,
    CONSTRAINT ck_service_definitions_booking_ui_mode CHECK ((booking_ui_mode = ANY (ARRAY['default_slot'::text, 'date_range'::text, 'custom_form'::text])))
);


ALTER TABLE category.service_definitions OWNER TO postgres;

--
-- TOC entry 314 (class 1259 OID 17912)
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
-- TOC entry 312 (class 1259 OID 17898)
-- Name: service_included; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.service_included (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    service_id uuid NOT NULL,
    item character varying(200) NOT NULL
);


ALTER TABLE category.service_included OWNER TO postgres;

--
-- TOC entry 313 (class 1259 OID 17904)
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
-- TOC entry 265 (class 1259 OID 16556)
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
-- TOC entry 266 (class 1259 OID 16562)
-- Name: service_provider_grades; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.service_provider_grades (
    id integer NOT NULL,
    name character varying(25) NOT NULL
);


ALTER TABLE category.service_provider_grades OWNER TO postgres;

--
-- TOC entry 267 (class 1259 OID 16565)
-- Name: service_provider_request_statuses; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.service_provider_request_statuses (
    id integer NOT NULL,
    name character varying(25) NOT NULL
);


ALTER TABLE category.service_provider_request_statuses OWNER TO postgres;

--
-- TOC entry 268 (class 1259 OID 16568)
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
-- TOC entry 269 (class 1259 OID 16575)
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
-- TOC entry 329 (class 1259 OID 19338)
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
-- TOC entry 270 (class 1259 OID 16582)
-- Name: staff; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.staff (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
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
-- TOC entry 334 (class 1259 OID 19425)
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
-- TOC entry 271 (class 1259 OID 16589)
-- Name: staff_availabilities; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.staff_availabilities (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
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
-- TOC entry 272 (class 1259 OID 16592)
-- Name: staff_availability_statuses; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.staff_availability_statuses (
    id integer NOT NULL,
    name character varying(25) NOT NULL
);


ALTER TABLE category.staff_availability_statuses OWNER TO postgres;

--
-- TOC entry 335 (class 1259 OID 19443)
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
-- TOC entry 333 (class 1259 OID 19410)
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
-- TOC entry 326 (class 1259 OID 18578)
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
-- TOC entry 332 (class 1259 OID 19395)
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
-- TOC entry 337 (class 1259 OID 19484)
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
-- TOC entry 330 (class 1259 OID 19367)
-- Name: staff_languages; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.staff_languages (
    staff_id uuid NOT NULL,
    language text NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE category.staff_languages OWNER TO postgres;

--
-- TOC entry 273 (class 1259 OID 16595)
-- Name: staff_services; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.staff_services (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    service_definition_id uuid NOT NULL,
    is_active boolean NOT NULL,
    notes_translations jsonb NOT NULL,
    staff_id uuid NOT NULL,
    create_date timestamp with time zone NOT NULL,
    last_modified_date timestamp with time zone
);


ALTER TABLE category.staff_services OWNER TO postgres;

--
-- TOC entry 331 (class 1259 OID 19381)
-- Name: staff_specializations; Type: TABLE; Schema: category; Owner: postgres
--

CREATE TABLE category.staff_specializations (
    staff_id uuid NOT NULL,
    specialty text NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE category.staff_specializations OWNER TO postgres;

--
-- TOC entry 452 (class 1259 OID 23132)
-- Name: booking_charge_lines; Type: TABLE; Schema: commercial; Owner: postgres
--

CREATE TABLE commercial.booking_charge_lines (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    booking_id uuid NOT NULL,
    booking_child_id uuid,
    booking_addon_id uuid,
    provider_id uuid,
    provider_type_id uuid,
    provider_service_id uuid,
    service_definition_id uuid,
    addon_id text,
    policy_id uuid,
    line_type text NOT NULL,
    source_type text,
    description text NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    source_currency_code character varying(10) NOT NULL,
    display_currency_code character varying(10),
    payment_currency_code character varying(10) NOT NULL,
    settlement_currency_code character varying(10) NOT NULL,
    source_gross_amount numeric(18,2) DEFAULT 0 NOT NULL,
    payment_gross_amount numeric(18,2) DEFAULT 0 NOT NULL,
    settlement_gross_amount numeric(18,2) DEFAULT 0 NOT NULL,
    discount_amount numeric(18,2) DEFAULT 0 NOT NULL,
    net_amount numeric(18,2) DEFAULT 0 NOT NULL,
    platform_fee_amount numeric(18,2) DEFAULT 0 NOT NULL,
    provider_payable_amount numeric(18,2) DEFAULT 0 NOT NULL,
    gateway_fee_amount numeric(18,2) DEFAULT 0 NOT NULL,
    exchange_rate numeric(24,12),
    exchange_rate_ids uuid[] DEFAULT ARRAY[]::uuid[] NOT NULL,
    fx_quote_id uuid,
    snapshot_json jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_commercial_booking_charge_lines_line_type CHECK ((line_type = ANY (ARRAY['main_service'::text, 'child_booking'::text, 'addon'::text]))),
    CONSTRAINT ck_commercial_booking_charge_lines_quantity_positive CHECK ((quantity > 0))
);


ALTER TABLE commercial.booking_charge_lines OWNER TO postgres;

--
-- TOC entry 455 (class 1259 OID 23263)
-- Name: refund_lines; Type: TABLE; Schema: commercial; Owner: postgres
--

CREATE TABLE commercial.refund_lines (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    refund_request_id uuid NOT NULL,
    booking_id uuid NOT NULL,
    booking_child_id uuid,
    booking_addon_id uuid,
    charge_line_id uuid,
    line_type text NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    source_currency_code character varying(10) NOT NULL,
    payment_currency_code character varying(10) NOT NULL,
    settlement_currency_code character varying(10) NOT NULL,
    source_refund_amount numeric(18,2) DEFAULT 0 NOT NULL,
    payment_refund_amount numeric(18,2) DEFAULT 0 NOT NULL,
    settlement_reversal_amount numeric(18,2) DEFAULT 0 NOT NULL,
    exchange_rate numeric(24,12),
    exchange_rate_ids uuid[] DEFAULT ARRAY[]::uuid[] NOT NULL,
    fx_quote_id uuid,
    snapshot_json jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_commercial_refund_lines_line_type CHECK ((line_type = ANY (ARRAY['main_service'::text, 'child_booking'::text, 'addon'::text]))),
    CONSTRAINT ck_commercial_refund_lines_quantity_positive CHECK ((quantity > 0))
);


ALTER TABLE commercial.refund_lines OWNER TO postgres;

--
-- TOC entry 458 (class 1259 OID 23370)
-- Name: booking_financial_summaries; Type: VIEW; Schema: commercial; Owner: postgres
--

CREATE VIEW commercial.booking_financial_summaries AS
 SELECT b.id AS booking_id,
    b.user_id,
    (COALESCE(sum(cl.payment_gross_amount), (0)::numeric))::numeric(18,2) AS payment_gross_amount,
    (COALESCE(sum(cl.discount_amount), (0)::numeric))::numeric(18,2) AS discount_amount,
    (COALESCE(sum(cl.net_amount), (0)::numeric))::numeric(18,2) AS net_amount,
    (COALESCE(sum(cl.platform_fee_amount), (0)::numeric))::numeric(18,2) AS platform_fee_amount,
    (COALESCE(sum(cl.provider_payable_amount), (0)::numeric))::numeric(18,2) AS provider_payable_amount,
    (COALESCE(sum(cl.gateway_fee_amount), (0)::numeric))::numeric(18,2) AS gateway_fee_amount,
    (COALESCE(sum(rl.payment_refund_amount), (0)::numeric))::numeric(18,2) AS refunded_amount,
    (GREATEST((COALESCE(sum(cl.net_amount), (0)::numeric) - COALESCE(sum(rl.payment_refund_amount), (0)::numeric)), (0)::numeric))::numeric(18,2) AS remaining_net_amount
   FROM ((booking.bookings b
     LEFT JOIN commercial.booking_charge_lines cl ON ((cl.booking_id = b.id)))
     LEFT JOIN commercial.refund_lines rl ON ((rl.booking_id = b.id)))
  GROUP BY b.id, b.user_id;


ALTER VIEW commercial.booking_financial_summaries OWNER TO postgres;

--
-- TOC entry 451 (class 1259 OID 23110)
-- Name: compensation_policies; Type: TABLE; Schema: commercial; Owner: postgres
--

CREATE TABLE commercial.compensation_policies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    scope_type text NOT NULL,
    scope_id text,
    applies_to text NOT NULL,
    fee_mode text DEFAULT 'percent'::text NOT NULL,
    platform_percent numeric(8,4) DEFAULT 0 NOT NULL,
    platform_fixed_amount numeric(18,2) DEFAULT 0 NOT NULL,
    minimum_platform_amount numeric(18,2) DEFAULT 0 NOT NULL,
    provider_percent_override numeric(8,4),
    gateway_fee_mode text DEFAULT 'platform_pays'::text NOT NULL,
    currency_code character varying(10),
    priority integer DEFAULT 100 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    effective_from timestamp with time zone,
    effective_to timestamp with time zone,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_commercial_compensation_policies_applies_to CHECK ((applies_to = ANY (ARRAY['main_booking'::text, 'child_booking'::text, 'addon'::text]))),
    CONSTRAINT ck_commercial_compensation_policies_fee_mode CHECK ((fee_mode = ANY (ARRAY['percent'::text, 'fixed'::text, 'hybrid'::text]))),
    CONSTRAINT ck_commercial_compensation_policies_gateway_fee_mode CHECK ((gateway_fee_mode = ANY (ARRAY['platform_pays'::text, 'provider_pays'::text, 'split'::text]))),
    CONSTRAINT ck_commercial_compensation_policies_scope_type CHECK ((scope_type = ANY (ARRAY['global'::text, 'provider_type'::text, 'provider'::text, 'service_definition'::text, 'provider_service'::text, 'addon'::text])))
);


ALTER TABLE commercial.compensation_policies OWNER TO postgres;

--
-- TOC entry 453 (class 1259 OID 23205)
-- Name: provider_ledgers; Type: TABLE; Schema: commercial; Owner: postgres
--

CREATE TABLE commercial.provider_ledgers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_id uuid NOT NULL,
    booking_id uuid,
    booking_child_id uuid,
    charge_line_id uuid,
    entry_type text NOT NULL,
    amount numeric(18,2) NOT NULL,
    currency_code character varying(10) NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    reference_type text,
    reference_id uuid,
    notes text,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_commercial_provider_ledgers_entry_type CHECK ((entry_type = ANY (ARRAY['earning'::text, 'adjustment'::text, 'reversal'::text, 'payout'::text]))),
    CONSTRAINT ck_commercial_provider_ledgers_status CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'paid'::text, 'cancelled'::text])))
);


ALTER TABLE commercial.provider_ledgers OWNER TO postgres;

--
-- TOC entry 457 (class 1259 OID 23333)
-- Name: provider_settlement_reversals; Type: TABLE; Schema: commercial; Owner: postgres
--

CREATE TABLE commercial.provider_settlement_reversals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_id uuid NOT NULL,
    booking_id uuid NOT NULL,
    booking_child_id uuid,
    refund_line_id uuid NOT NULL,
    provider_ledger_id uuid,
    amount numeric(18,2) NOT NULL,
    currency_code character varying(10) NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_commercial_provider_settlement_reversals_status CHECK ((status = ANY (ARRAY['pending'::text, 'applied'::text, 'cancelled'::text])))
);


ALTER TABLE commercial.provider_settlement_reversals OWNER TO postgres;

--
-- TOC entry 454 (class 1259 OID 23239)
-- Name: refund_requests; Type: TABLE; Schema: commercial; Owner: postgres
--

CREATE TABLE commercial.refund_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    booking_id uuid NOT NULL,
    payment_id uuid,
    requested_by_user_id uuid,
    refund_scope text DEFAULT 'full'::text NOT NULL,
    reason text NOT NULL,
    customer_note text,
    admin_note text,
    status text DEFAULT 'requested'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_commercial_refund_requests_scope CHECK ((refund_scope = ANY (ARRAY['full'::text, 'partial'::text]))),
    CONSTRAINT ck_commercial_refund_requests_status CHECK ((status = ANY (ARRAY['requested'::text, 'approved'::text, 'rejected'::text, 'processing'::text, 'refunded'::text, 'failed'::text, 'cancelled'::text])))
);


ALTER TABLE commercial.refund_requests OWNER TO postgres;

--
-- TOC entry 456 (class 1259 OID 23310)
-- Name: refunds; Type: TABLE; Schema: commercial; Owner: postgres
--

CREATE TABLE commercial.refunds (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    refund_request_id uuid NOT NULL,
    payment_id uuid,
    gateway text,
    gateway_reference text,
    refund_amount numeric(18,2) NOT NULL,
    currency_code character varying(10) NOT NULL,
    status text DEFAULT 'processing'::text NOT NULL,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    processed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_commercial_refunds_status CHECK ((status = ANY (ARRAY['processing'::text, 'refunded'::text, 'failed'::text, 'cancelled'::text])))
);


ALTER TABLE commercial.refunds OWNER TO postgres;

--
-- TOC entry 274 (class 1259 OID 16600)
-- Name: __EFMigrationsHistory; Type: TABLE; Schema: customer; Owner: postgres
--

CREATE TABLE customer."__EFMigrationsHistory" (
    migration_id character varying(150) NOT NULL,
    product_version character varying(32) NOT NULL
);


ALTER TABLE customer."__EFMigrationsHistory" OWNER TO postgres;

--
-- TOC entry 275 (class 1259 OID 16603)
-- Name: consulting_selected_document_references; Type: TABLE; Schema: customer; Owner: postgres
--

CREATE TABLE customer.consulting_selected_document_references (
    customer_document_id uuid NOT NULL,
    consulting_id uuid NOT NULL
);


ALTER TABLE customer.consulting_selected_document_references OWNER TO postgres;

--
-- TOC entry 276 (class 1259 OID 16606)
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
-- TOC entry 277 (class 1259 OID 16615)
-- Name: customer_document_types; Type: TABLE; Schema: customer; Owner: postgres
--

CREATE TABLE customer.customer_document_types (
    id integer NOT NULL,
    name character varying(25) NOT NULL
);


ALTER TABLE customer.customer_document_types OWNER TO postgres;

--
-- TOC entry 278 (class 1259 OID 16618)
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
-- TOC entry 279 (class 1259 OID 16622)
-- Name: customers; Type: TABLE; Schema: customer; Owner: postgres
--

CREATE TABLE customer.customers (
    id uuid NOT NULL,
    phone_number character varying(15) NOT NULL,
    phone_number_country_code character varying(3) NOT NULL,
    email character varying(250) NOT NULL,
    birth_date timestamp with time zone,
    street_translations jsonb,
    city character varying(100),
    country character varying(100),
    detail_translations jsonb,
    zip_code character varying(50),
    first_name character varying(100) NOT NULL,
    last_name character varying(50) NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now(),
    gender character varying(25),
    is_active boolean DEFAULT true NOT NULL,
    latitude numeric(10,7),
    longitude numeric(10,7),
    is_profile_confirmed boolean DEFAULT false NOT NULL,
    profile_confirmed_at timestamp with time zone
);


ALTER TABLE customer.customers OWNER TO postgres;

--
-- TOC entry 328 (class 1259 OID 19314)
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
-- TOC entry 327 (class 1259 OID 19313)
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
-- TOC entry 280 (class 1259 OID 16630)
-- Name: inbox_message_consumers; Type: TABLE; Schema: customer; Owner: postgres
--

CREATE TABLE customer.inbox_message_consumers (
    message_id uuid NOT NULL,
    name character varying(500) NOT NULL
);


ALTER TABLE customer.inbox_message_consumers OWNER TO postgres;

--
-- TOC entry 281 (class 1259 OID 16635)
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
-- TOC entry 282 (class 1259 OID 16640)
-- Name: internal_command_message_consumers; Type: TABLE; Schema: customer; Owner: postgres
--

CREATE TABLE customer.internal_command_message_consumers (
    message_id uuid NOT NULL,
    name character varying(500) NOT NULL
);


ALTER TABLE customer.internal_command_message_consumers OWNER TO postgres;

--
-- TOC entry 283 (class 1259 OID 16645)
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
-- TOC entry 437 (class 1259 OID 22672)
-- Name: medical_profile_allergies; Type: TABLE; Schema: customer; Owner: postgres
--

CREATE TABLE customer.medical_profile_allergies (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    customer_id uuid NOT NULL,
    name character varying(200) NOT NULL,
    severity character varying(20) DEFAULT 'moderate'::character varying NOT NULL,
    notes text,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_medical_profile_allergies_severity CHECK (((severity)::text = ANY ((ARRAY['mild'::character varying, 'moderate'::character varying, 'severe'::character varying])::text[])))
);


ALTER TABLE customer.medical_profile_allergies OWNER TO postgres;

--
-- TOC entry 439 (class 1259 OID 22704)
-- Name: medical_profile_conditions; Type: TABLE; Schema: customer; Owner: postgres
--

CREATE TABLE customer.medical_profile_conditions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    customer_id uuid NOT NULL,
    name character varying(200) NOT NULL,
    diagnosed_date date,
    notes text,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE customer.medical_profile_conditions OWNER TO postgres;

--
-- TOC entry 440 (class 1259 OID 22719)
-- Name: medical_profile_documents; Type: TABLE; Schema: customer; Owner: postgres
--

CREATE TABLE customer.medical_profile_documents (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    customer_id uuid NOT NULL,
    document_type_id integer,
    title character varying(250) NOT NULL,
    file_name character varying(255) NOT NULL,
    file_url text NOT NULL,
    mime_type character varying(255),
    size_bytes bigint,
    media_id uuid,
    created_by uuid,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now() NOT NULL,
    is_archived boolean DEFAULT false NOT NULL
);


ALTER TABLE customer.medical_profile_documents OWNER TO postgres;

--
-- TOC entry 438 (class 1259 OID 22689)
-- Name: medical_profile_medications; Type: TABLE; Schema: customer; Owner: postgres
--

CREATE TABLE customer.medical_profile_medications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    customer_id uuid NOT NULL,
    name character varying(200) NOT NULL,
    dosage character varying(100) NOT NULL,
    frequency character varying(100) NOT NULL,
    notes text,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE customer.medical_profile_medications OWNER TO postgres;

--
-- TOC entry 436 (class 1259 OID 22658)
-- Name: medical_profiles; Type: TABLE; Schema: customer; Owner: postgres
--

CREATE TABLE customer.medical_profiles (
    customer_id uuid NOT NULL,
    emergency_contact_name character varying(200),
    emergency_contact_phone character varying(40),
    emergency_contact_relationship character varying(100),
    notes text,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE customer.medical_profiles OWNER TO postgres;

--
-- TOC entry 284 (class 1259 OID 16650)
-- Name: outbox_message_consumers; Type: TABLE; Schema: customer; Owner: postgres
--

CREATE TABLE customer.outbox_message_consumers (
    message_id uuid NOT NULL,
    name character varying(500) NOT NULL
);


ALTER TABLE customer.outbox_message_consumers OWNER TO postgres;

--
-- TOC entry 285 (class 1259 OID 16655)
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
-- TOC entry 353 (class 1259 OID 19847)
-- Name: wallet_accounts; Type: TABLE; Schema: customer; Owner: postgres
--

CREATE TABLE customer.wallet_accounts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    default_currency character varying(10) DEFAULT 'USD'::character varying NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_wallet_accounts_default_currency CHECK (((char_length((default_currency)::text) >= 3) AND (char_length((default_currency)::text) <= 10)))
);


ALTER TABLE customer.wallet_accounts OWNER TO postgres;

--
-- TOC entry 355 (class 1259 OID 19899)
-- Name: wallet_transactions; Type: TABLE; Schema: customer; Owner: postgres
--

CREATE TABLE customer.wallet_transactions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    wallet_account_id uuid NOT NULL,
    user_id uuid NOT NULL,
    booking_id uuid,
    payment_intent_id uuid,
    transaction_type character varying(40) NOT NULL,
    direction character varying(10) NOT NULL,
    status character varying(20) DEFAULT 'completed'::character varying NOT NULL,
    payment_method character varying(30),
    title character varying(200) NOT NULL,
    subtitle character varying(200),
    currency_code character varying(10) NOT NULL,
    amount numeric(18,2) NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    occurred_at timestamp with time zone DEFAULT now() NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_wallet_transactions_amount_non_zero CHECK ((amount <> (0)::numeric)),
    CONSTRAINT ck_wallet_transactions_direction CHECK (((direction)::text = ANY ((ARRAY['credit'::character varying, 'debit'::character varying])::text[]))),
    CONSTRAINT ck_wallet_transactions_signed_amount_matches_direction CHECK (((((direction)::text = 'credit'::text) AND (amount > (0)::numeric)) OR (((direction)::text = 'debit'::text) AND (amount < (0)::numeric)))),
    CONSTRAINT ck_wallet_transactions_status CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'processing'::character varying, 'completed'::character varying, 'failed'::character varying, 'cancelled'::character varying, 'refunded'::character varying])::text[]))),
    CONSTRAINT ck_wallet_transactions_type CHECK (((transaction_type)::text = ANY ((ARRAY['topup'::character varying, 'booking_payment'::character varying, 'refund'::character varying, 'cashback'::character varying, 'referral_bonus'::character varying, 'manual_adjustment'::character varying, 'withdrawal'::character varying])::text[])))
);


ALTER TABLE customer.wallet_transactions OWNER TO postgres;

--
-- TOC entry 356 (class 1259 OID 19941)
-- Name: wallet_balances; Type: VIEW; Schema: customer; Owner: postgres
--

CREATE VIEW customer.wallet_balances AS
 SELECT wa.id AS wallet_account_id,
    wa.user_id,
    c.currency_code,
    (COALESCE(sum(
        CASE
            WHEN ((wt.status)::text = 'completed'::text) THEN wt.amount
            ELSE (0)::numeric
        END), (0)::numeric))::numeric(18,2) AS available_amount,
    (COALESCE(sum(
        CASE
            WHEN ((wt.status)::text = ANY ((ARRAY['pending'::character varying, 'processing'::character varying])::text[])) THEN wt.amount
            ELSE (0)::numeric
        END), (0)::numeric))::numeric(18,2) AS pending_amount
   FROM ((customer.wallet_accounts wa
     CROSS JOIN ( VALUES ('USD'::text), ('EUR'::text), ('GBP'::text), ('AED'::text)) c(currency_code))
     LEFT JOIN customer.wallet_transactions wt ON (((wt.wallet_account_id = wa.id) AND ((wt.currency_code)::text = c.currency_code))))
  GROUP BY wa.id, wa.user_id, c.currency_code;


ALTER VIEW customer.wallet_balances OWNER TO postgres;

--
-- TOC entry 354 (class 1259 OID 19865)
-- Name: wallet_payment_intents; Type: TABLE; Schema: customer; Owner: postgres
--

CREATE TABLE customer.wallet_payment_intents (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    wallet_account_id uuid NOT NULL,
    user_id uuid NOT NULL,
    booking_id uuid,
    intent_type character varying(30) NOT NULL,
    payment_method character varying(30) NOT NULL,
    gateway_name character varying(50),
    gateway_reference character varying(150),
    client_secret text,
    redirect_url text,
    currency_code character varying(10) NOT NULL,
    amount numeric(18,2) NOT NULL,
    status character varying(30) DEFAULT 'pending'::character varying NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    expires_at timestamp with time zone,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_wallet_payment_intents_amount_positive CHECK ((amount > (0)::numeric)),
    CONSTRAINT ck_wallet_payment_intents_intent_type CHECK (((intent_type)::text = ANY ((ARRAY['topup'::character varying, 'booking_payment'::character varying])::text[]))),
    CONSTRAINT ck_wallet_payment_intents_method CHECK (((payment_method)::text = ANY ((ARRAY['card'::character varying, 'bank'::character varying, 'apple'::character varying, 'wallet'::character varying])::text[]))),
    CONSTRAINT ck_wallet_payment_intents_status CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'requires_action'::character varying, 'processing'::character varying, 'succeeded'::character varying, 'failed'::character varying, 'cancelled'::character varying, 'expired'::character varying])::text[])))
);


ALTER TABLE customer.wallet_payment_intents OWNER TO postgres;

--
-- TOC entry 446 (class 1259 OID 22933)
-- Name: country_currency_defaults; Type: TABLE; Schema: finance; Owner: postgres
--

CREATE TABLE finance.country_currency_defaults (
    country_code character varying(10) NOT NULL,
    currency_code character varying(10) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE finance.country_currency_defaults OWNER TO postgres;

--
-- TOC entry 445 (class 1259 OID 22914)
-- Name: currencies; Type: TABLE; Schema: finance; Owner: postgres
--

CREATE TABLE finance.currencies (
    code character varying(10) NOT NULL,
    name text NOT NULL,
    native_name text,
    symbol text NOT NULL,
    decimal_digits smallint DEFAULT 2 NOT NULL,
    is_iso boolean DEFAULT true NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    is_display_enabled boolean DEFAULT true NOT NULL,
    is_payment_enabled boolean DEFAULT false NOT NULL,
    is_settlement_enabled boolean DEFAULT false NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_finance_currencies_code_nonempty CHECK (((length(btrim((code)::text)) >= 3) AND (length(btrim((code)::text)) <= 10))),
    CONSTRAINT ck_finance_currencies_decimal_digits CHECK (((decimal_digits >= 0) AND (decimal_digits <= 6)))
);


ALTER TABLE finance.currencies OWNER TO postgres;

--
-- TOC entry 447 (class 1259 OID 22946)
-- Name: exchange_rates; Type: TABLE; Schema: finance; Owner: postgres
--

CREATE TABLE finance.exchange_rates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    base_currency_code character varying(10) NOT NULL,
    quote_currency_code character varying(10) NOT NULL,
    rate numeric(24,12) NOT NULL,
    source text DEFAULT 'manual_admin'::text NOT NULL,
    provider_reference text,
    as_of timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone,
    is_latest boolean DEFAULT true NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    CONSTRAINT ck_finance_exchange_rates_not_same CHECK (((base_currency_code)::text <> (quote_currency_code)::text)),
    CONSTRAINT ck_finance_exchange_rates_rate_positive CHECK ((rate > (0)::numeric))
);


ALTER TABLE finance.exchange_rates OWNER TO postgres;

--
-- TOC entry 448 (class 1259 OID 22973)
-- Name: fx_margin_profiles; Type: TABLE; Schema: finance; Owner: postgres
--

CREATE TABLE finance.fx_margin_profiles (
    code text NOT NULL,
    name text NOT NULL,
    default_margin_percent numeric(8,4) DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_finance_fx_margin_profiles_nonnegative CHECK ((default_margin_percent >= (0)::numeric))
);


ALTER TABLE finance.fx_margin_profiles OWNER TO postgres;

--
-- TOC entry 449 (class 1259 OID 22985)
-- Name: fx_pair_margins; Type: TABLE; Schema: finance; Owner: postgres
--

CREATE TABLE finance.fx_pair_margins (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_code text NOT NULL,
    base_currency_code character varying(10) NOT NULL,
    quote_currency_code character varying(10) NOT NULL,
    margin_percent numeric(8,4) DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_finance_fx_pair_margins_nonnegative CHECK ((margin_percent >= (0)::numeric))
);


ALTER TABLE finance.fx_pair_margins OWNER TO postgres;

--
-- TOC entry 450 (class 1259 OID 23015)
-- Name: fx_quotes; Type: TABLE; Schema: finance; Owner: postgres
--

CREATE TABLE finance.fx_quotes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    source_amount numeric(18,2) NOT NULL,
    source_currency_code character varying(10) NOT NULL,
    target_currency_code character varying(10) NOT NULL,
    converted_amount numeric(18,2) NOT NULL,
    base_rate numeric(24,12) NOT NULL,
    applied_rate numeric(24,12) NOT NULL,
    margin_percent numeric(8,4) DEFAULT 0 NOT NULL,
    rate_path text[] DEFAULT ARRAY[]::text[] NOT NULL,
    exchange_rate_ids uuid[] DEFAULT ARRAY[]::uuid[] NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '00:15:00'::interval) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    CONSTRAINT ck_finance_fx_quotes_amount_positive CHECK (((source_amount >= (0)::numeric) AND (converted_amount >= (0)::numeric))),
    CONSTRAINT ck_finance_fx_quotes_status CHECK ((status = ANY (ARRAY['active'::text, 'used'::text, 'expired'::text, 'cancelled'::text])))
);


ALTER TABLE finance.fx_quotes OWNER TO postgres;

--
-- TOC entry 8187 (class 0 OID 0)
-- Dependencies: 450
-- Name: TABLE fx_quotes; Type: COMMENT; Schema: finance; Owner: postgres
--

COMMENT ON TABLE finance.fx_quotes IS 'Locked checkout/display quote. Store this ID on booking/payment snapshots to prevent future rate changes from changing past totals.';


--
-- TOC entry 430 (class 1259 OID 22329)
-- Name: field_conditions; Type: TABLE; Schema: form_builder; Owner: postgres
--

CREATE TABLE form_builder.field_conditions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    field_id uuid NOT NULL,
    depends_on_field_id uuid NOT NULL,
    condition_type text DEFAULT 'equals'::text NOT NULL,
    expected_value jsonb,
    action text DEFAULT 'show'::text NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_condition_action CHECK ((action = ANY (ARRAY['show'::text, 'hide'::text, 'require'::text, 'disable'::text]))),
    CONSTRAINT ck_condition_type CHECK ((condition_type = ANY (ARRAY['equals'::text, 'not_equals'::text, 'in'::text, 'not_in'::text, 'greater_than'::text, 'less_than'::text, 'has_value'::text, 'not_has_value'::text])))
);


ALTER TABLE form_builder.field_conditions OWNER TO postgres;

--
-- TOC entry 429 (class 1259 OID 22309)
-- Name: field_options; Type: TABLE; Schema: form_builder; Owner: postgres
--

CREATE TABLE form_builder.field_options (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    field_id uuid NOT NULL,
    value text NOT NULL,
    label text NOT NULL,
    label_translations jsonb DEFAULT '{}'::jsonb NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE form_builder.field_options OWNER TO postgres;

--
-- TOC entry 424 (class 1259 OID 22193)
-- Name: field_types; Type: TABLE; Schema: form_builder; Owner: postgres
--

CREATE TABLE form_builder.field_types (
    code text NOT NULL,
    display_name text NOT NULL,
    category text DEFAULT 'input'::text NOT NULL,
    supports_options boolean DEFAULT false NOT NULL,
    supports_conditions boolean DEFAULT true NOT NULL,
    supports_multilingual boolean DEFAULT false NOT NULL,
    supports_media boolean DEFAULT false NOT NULL,
    supports_repeatable boolean DEFAULT false NOT NULL,
    configuration_schema jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE form_builder.field_types OWNER TO postgres;

--
-- TOC entry 428 (class 1259 OID 22269)
-- Name: form_fields; Type: TABLE; Schema: form_builder; Owner: postgres
--

CREATE TABLE form_builder.form_fields (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    form_version_id uuid NOT NULL,
    section_id uuid,
    parent_field_id uuid,
    key text NOT NULL,
    field_type_code text NOT NULL,
    label text NOT NULL,
    placeholder text,
    help_text text,
    default_value jsonb,
    is_required boolean DEFAULT false NOT NULL,
    is_hidden boolean DEFAULT false NOT NULL,
    is_repeatable boolean DEFAULT false NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    column_span integer DEFAULT 12 NOT NULL,
    settings jsonb DEFAULT '{}'::jsonb NOT NULL,
    validation_rules jsonb DEFAULT '{}'::jsonb NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_form_field_col_span CHECK (((column_span >= 1) AND (column_span <= 12)))
);


ALTER TABLE form_builder.form_fields OWNER TO postgres;

--
-- TOC entry 427 (class 1259 OID 22250)
-- Name: form_sections; Type: TABLE; Schema: form_builder; Owner: postgres
--

CREATE TABLE form_builder.form_sections (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    form_version_id uuid NOT NULL,
    key text NOT NULL,
    title text,
    description text,
    display_order integer DEFAULT 0 NOT NULL,
    settings jsonb DEFAULT '{}'::jsonb NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE form_builder.form_sections OWNER TO postgres;

--
-- TOC entry 426 (class 1259 OID 22226)
-- Name: form_versions; Type: TABLE; Schema: form_builder; Owner: postgres
--

CREATE TABLE form_builder.form_versions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    form_id uuid NOT NULL,
    version_number integer NOT NULL,
    title text NOT NULL,
    schema_version integer DEFAULT 1 NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    locales text[] DEFAULT ARRAY['en-US'::text] NOT NULL,
    settings jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_active boolean DEFAULT false NOT NULL,
    published_at timestamp with time zone,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_form_version_status CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])))
);


ALTER TABLE form_builder.form_versions OWNER TO postgres;

--
-- TOC entry 425 (class 1259 OID 22210)
-- Name: forms; Type: TABLE; Schema: form_builder; Owner: postgres
--

CREATE TABLE form_builder.forms (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    key text NOT NULL,
    name text NOT NULL,
    description text,
    form_scope text DEFAULT 'service_booking'::text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_form_scope CHECK ((form_scope = ANY (ARRAY['service_booking'::text, 'addon_booking'::text, 'generic'::text])))
);


ALTER TABLE form_builder.forms OWNER TO postgres;

--
-- TOC entry 431 (class 1259 OID 22353)
-- Name: service_definition_forms; Type: TABLE; Schema: form_builder; Owner: postgres
--

CREATE TABLE form_builder.service_definition_forms (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    service_definition_id uuid NOT NULL,
    form_id uuid NOT NULL,
    usage_scope text DEFAULT 'main_booking'::text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_service_definition_forms_usage_scope CHECK ((usage_scope = ANY (ARRAY['main_booking'::text, 'child_addon_booking'::text])))
);


ALTER TABLE form_builder.service_definition_forms OWNER TO postgres;

--
-- TOC entry 432 (class 1259 OID 22378)
-- Name: submissions; Type: TABLE; Schema: form_builder; Owner: postgres
--

CREATE TABLE form_builder.submissions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    form_version_id uuid NOT NULL,
    service_definition_id uuid,
    booking_draft_id uuid,
    booking_draft_child_id uuid,
    booking_id uuid,
    booking_child_id uuid,
    submitted_by_user_id uuid,
    locale text,
    submission_scope text DEFAULT 'booking'::text NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    normalized_payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now() NOT NULL,
    submitted_at timestamp with time zone,
    CONSTRAINT ck_submissions_scope CHECK ((submission_scope = ANY (ARRAY['booking'::text, 'admin_preview'::text, 'generic'::text]))),
    CONSTRAINT ck_submissions_status CHECK ((status = ANY (ARRAY['draft'::text, 'submitted'::text, 'archived'::text])))
);


ALTER TABLE form_builder.submissions OWNER TO postgres;

--
-- TOC entry 286 (class 1259 OID 16660)
-- Name: __EFMigrationsHistory; Type: TABLE; Schema: identity; Owner: postgres
--

CREATE TABLE identity."__EFMigrationsHistory" (
    migration_id character varying(150) NOT NULL,
    product_version character varying(32) NOT NULL
);


ALTER TABLE identity."__EFMigrationsHistory" OWNER TO postgres;

--
-- TOC entry 287 (class 1259 OID 16663)
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
-- TOC entry 442 (class 1259 OID 22794)
-- Name: account_deletion_requests; Type: TABLE; Schema: identity; Owner: postgres
--

CREATE TABLE identity.account_deletion_requests (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    reason text,
    status character varying(20) DEFAULT 'requested'::character varying NOT NULL,
    requested_at timestamp with time zone DEFAULT now() NOT NULL,
    reviewed_at timestamp with time zone,
    reviewed_by uuid,
    review_note text,
    cancellation_requested_at timestamp with time zone,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_account_deletion_requests_status CHECK (((status)::text = ANY ((ARRAY['requested'::character varying, 'under_review'::character varying, 'approved'::character varying, 'rejected'::character varying, 'cancelled'::character varying, 'completed'::character varying])::text[])))
);


ALTER TABLE identity.account_deletion_requests OWNER TO postgres;

--
-- TOC entry 288 (class 1259 OID 16668)
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
-- TOC entry 289 (class 1259 OID 16673)
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
-- TOC entry 290 (class 1259 OID 16674)
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
-- TOC entry 291 (class 1259 OID 16679)
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
-- TOC entry 292 (class 1259 OID 16684)
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
-- TOC entry 293 (class 1259 OID 16685)
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
-- TOC entry 294 (class 1259 OID 16690)
-- Name: asp_net_user_roles; Type: TABLE; Schema: identity; Owner: postgres
--

CREATE TABLE identity.asp_net_user_roles (
    user_id uuid NOT NULL,
    role_id uuid NOT NULL
);


ALTER TABLE identity.asp_net_user_roles OWNER TO postgres;

--
-- TOC entry 295 (class 1259 OID 16693)
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
-- TOC entry 296 (class 1259 OID 16698)
-- Name: asp_net_users; Type: TABLE; Schema: identity; Owner: postgres
--

CREATE TABLE identity.asp_net_users (
    id uuid NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(50) NOT NULL,
    phone_number_country_code character varying(5) NOT NULL,
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
    access_failed_count integer NOT NULL,
    is_profile_confirmed boolean DEFAULT false NOT NULL,
    profile_confirmed_at timestamp with time zone,
    birth_date date,
    gender character varying(25),
    address character varying(500),
    city character varying(100),
    country character varying(100),
    profile_image_url character varying(500),
    profile_image_updated_at timestamp with time zone
);


ALTER TABLE identity.asp_net_users OWNER TO postgres;

--
-- TOC entry 297 (class 1259 OID 16705)
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
-- TOC entry 298 (class 1259 OID 16708)
-- Name: inbox_message_consumers; Type: TABLE; Schema: identity; Owner: postgres
--

CREATE TABLE identity.inbox_message_consumers (
    message_id uuid NOT NULL,
    name character varying(500) NOT NULL
);


ALTER TABLE identity.inbox_message_consumers OWNER TO postgres;

--
-- TOC entry 299 (class 1259 OID 16713)
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
-- TOC entry 300 (class 1259 OID 16718)
-- Name: internal_command_message_consumers; Type: TABLE; Schema: identity; Owner: postgres
--

CREATE TABLE identity.internal_command_message_consumers (
    message_id uuid NOT NULL,
    name character varying(500) NOT NULL
);


ALTER TABLE identity.internal_command_message_consumers OWNER TO postgres;

--
-- TOC entry 301 (class 1259 OID 16723)
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
-- TOC entry 302 (class 1259 OID 16728)
-- Name: outbox_message_consumers; Type: TABLE; Schema: identity; Owner: postgres
--

CREATE TABLE identity.outbox_message_consumers (
    message_id uuid NOT NULL,
    name character varying(500) NOT NULL
);


ALTER TABLE identity.outbox_message_consumers OWNER TO postgres;

--
-- TOC entry 303 (class 1259 OID 16733)
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
-- TOC entry 304 (class 1259 OID 16738)
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
-- TOC entry 305 (class 1259 OID 16741)
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
-- TOC entry 306 (class 1259 OID 16746)
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
-- TOC entry 346 (class 1259 OID 19683)
-- Name: user_preferences; Type: TABLE; Schema: identity; Owner: postgres
--

CREATE TABLE identity.user_preferences (
    user_id uuid NOT NULL,
    selected_country_location_id uuid,
    selected_city_location_id uuid,
    selected_picked_location_id uuid,
    selected_source character varying(20) DEFAULT 'manual'::character varying NOT NULL,
    use_current_location boolean DEFAULT false NOT NULL,
    current_latitude numeric(10,7),
    current_longitude numeric(10,7),
    preferred_locale character varying(10) DEFAULT 'en'::character varying NOT NULL,
    preferred_currency_code character varying(3) DEFAULT 'USD'::character varying NOT NULL,
    preferred_theme character varying(20) DEFAULT 'system'::character varying NOT NULL,
    distance_unit character varying(5) DEFAULT 'km'::character varying NOT NULL,
    notifications_enabled boolean DEFAULT true NOT NULL,
    marketing_notifications_enabled boolean DEFAULT false NOT NULL,
    extra_preferences jsonb DEFAULT '{}'::jsonb NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_user_preferences_currency_code_len CHECK ((char_length((preferred_currency_code)::text) = 3)),
    CONSTRAINT ck_user_preferences_distance_unit CHECK (((distance_unit)::text = ANY ((ARRAY['km'::character varying, 'mi'::character varying])::text[]))),
    CONSTRAINT ck_user_preferences_gps_pair CHECK ((((current_latitude IS NULL) AND (current_longitude IS NULL)) OR ((current_latitude IS NOT NULL) AND (current_longitude IS NOT NULL)))),
    CONSTRAINT ck_user_preferences_selected_source CHECK (((selected_source)::text = ANY ((ARRAY['manual'::character varying, 'picked_location'::character varying, 'gps'::character varying])::text[]))),
    CONSTRAINT ck_user_preferences_theme CHECK (((preferred_theme)::text = ANY ((ARRAY['system'::character varying, 'light'::character varying, 'dark'::character varying])::text[])))
);


ALTER TABLE identity.user_preferences OWNER TO postgres;

--
-- TOC entry 443 (class 1259 OID 22818)
-- Name: user_security_settings; Type: TABLE; Schema: identity; Owner: postgres
--

CREATE TABLE identity.user_security_settings (
    user_id uuid NOT NULL,
    biometric_enabled boolean DEFAULT false NOT NULL,
    location_permission_status character varying(20) DEFAULT 'unknown'::character varying NOT NULL,
    notification_permission_status character varying(20) DEFAULT 'unknown'::character varying NOT NULL,
    location_permission_synced_at timestamp with time zone,
    notification_permission_synced_at timestamp with time zone,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_user_security_settings_location_status CHECK (((location_permission_status)::text = ANY ((ARRAY['unknown'::character varying, 'granted'::character varying, 'denied'::character varying, 'unsupported'::character varying, 'prompt'::character varying])::text[]))),
    CONSTRAINT ck_user_security_settings_notification_status CHECK (((notification_permission_status)::text = ANY ((ARRAY['unknown'::character varying, 'granted'::character varying, 'denied'::character varying, 'unsupported'::character varying, 'prompt'::character varying])::text[])))
);


ALTER TABLE identity.user_security_settings OWNER TO postgres;

--
-- TOC entry 441 (class 1259 OID 22774)
-- Name: user_sessions; Type: TABLE; Schema: identity; Owner: postgres
--

CREATE TABLE identity.user_sessions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    session_token_hash text,
    device_name character varying(200),
    platform character varying(100),
    browser_name character varying(100),
    ip_address character varying(64),
    country character varying(100),
    city character varying(100),
    is_current boolean DEFAULT false NOT NULL,
    last_seen_at timestamp with time zone DEFAULT now() NOT NULL,
    revoked_at timestamp with time zone,
    revoke_reason text,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE identity.user_sessions OWNER TO postgres;

--
-- TOC entry 348 (class 1259 OID 19745)
-- Name: accounts; Type: TABLE; Schema: loyalty; Owner: postgres
--

CREATE TABLE loyalty.accounts (
    customer_id uuid NOT NULL,
    points_balance integer DEFAULT 0 NOT NULL,
    lifetime_points integer DEFAULT 0 NOT NULL,
    current_tier_id uuid,
    referral_code text NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone
);


ALTER TABLE loyalty.accounts OWNER TO postgres;

--
-- TOC entry 351 (class 1259 OID 19806)
-- Name: coupons; Type: TABLE; Schema: loyalty; Owner: postgres
--

CREATE TABLE loyalty.coupons (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code text NOT NULL,
    title text NOT NULL,
    description text,
    discount_type text NOT NULL,
    discount_value numeric(18,2) NOT NULL,
    min_purchase numeric(18,2) DEFAULT 0 NOT NULL,
    starts_at timestamp with time zone,
    expires_at timestamp with time zone,
    usage_limit integer,
    is_active boolean DEFAULT true NOT NULL,
    provider_service_id uuid,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone
);


ALTER TABLE loyalty.coupons OWNER TO postgres;

--
-- TOC entry 352 (class 1259 OID 19824)
-- Name: customer_coupons; Type: TABLE; Schema: loyalty; Owner: postgres
--

CREATE TABLE loyalty.customer_coupons (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    customer_id uuid NOT NULL,
    coupon_id uuid NOT NULL,
    status text DEFAULT 'Available'::text NOT NULL,
    assigned_at timestamp with time zone DEFAULT now() NOT NULL,
    redeemed_at timestamp with time zone,
    booking_id uuid
);


ALTER TABLE loyalty.customer_coupons OWNER TO postgres;

--
-- TOC entry 349 (class 1259 OID 19767)
-- Name: ledger; Type: TABLE; Schema: loyalty; Owner: postgres
--

CREATE TABLE loyalty.ledger (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    customer_id uuid NOT NULL,
    booking_id uuid,
    entry_type text NOT NULL,
    points_delta integer NOT NULL,
    money_delta numeric(18,2),
    description text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE loyalty.ledger OWNER TO postgres;

--
-- TOC entry 350 (class 1259 OID 19783)
-- Name: referrals; Type: TABLE; Schema: loyalty; Owner: postgres
--

CREATE TABLE loyalty.referrals (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    referrer_customer_id uuid NOT NULL,
    referred_customer_id uuid,
    referral_code text NOT NULL,
    status text DEFAULT 'Pending'::text NOT NULL,
    reward_amount numeric(18,2) DEFAULT 0 NOT NULL,
    reward_points integer DEFAULT 0 NOT NULL,
    qualified_at timestamp with time zone,
    create_date timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE loyalty.referrals OWNER TO postgres;

--
-- TOC entry 347 (class 1259 OID 19732)
-- Name: tiers; Type: TABLE; Schema: loyalty; Owner: postgres
--

CREATE TABLE loyalty.tiers (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    min_points integer NOT NULL,
    cashback_percent numeric(5,2) DEFAULT 0 NOT NULL,
    benefits jsonb DEFAULT '[]'::jsonb NOT NULL,
    color_from text,
    color_to text,
    icon text,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone
);


ALTER TABLE loyalty.tiers OWNER TO postgres;

--
-- TOC entry 321 (class 1259 OID 18497)
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
    description_translations jsonb DEFAULT '{}'::jsonb NOT NULL,
    CONSTRAINT valid_until_check CHECK ((valid_until > created_at))
);


ALTER TABLE marketing.offers OWNER TO postgres;

--
-- TOC entry 320 (class 1259 OID 18496)
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
-- TOC entry 8188 (class 0 OID 0)
-- Dependencies: 320
-- Name: offers_id_seq; Type: SEQUENCE OWNED BY; Schema: marketing; Owner: postgres
--

ALTER SEQUENCE marketing.offers_id_seq OWNED BY marketing.offers.id;


--
-- TOC entry 407 (class 1259 OID 21271)
-- Name: referral_codes; Type: TABLE; Schema: marketing; Owner: postgres
--

CREATE TABLE marketing.referral_codes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    program_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    code character varying(50) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    last_used_at timestamp with time zone
);


ALTER TABLE marketing.referral_codes OWNER TO postgres;

--
-- TOC entry 408 (class 1259 OID 21293)
-- Name: referral_invitations; Type: TABLE; Schema: marketing; Owner: postgres
--

CREATE TABLE marketing.referral_invitations (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    program_id uuid NOT NULL,
    referral_code_id uuid NOT NULL,
    referrer_customer_id uuid NOT NULL,
    referee_customer_id uuid,
    referee_email character varying(250),
    referee_phone character varying(30),
    invite_channel character varying(50),
    status marketing.referral_invitation_status DEFAULT 'sent'::marketing.referral_invitation_status NOT NULL,
    invited_at timestamp with time zone DEFAULT now() NOT NULL,
    signed_up_at timestamp with time zone,
    profile_completed_at timestamp with time zone,
    qualified_at timestamp with time zone,
    first_booking_completed_at timestamp with time zone,
    notes text,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE marketing.referral_invitations OWNER TO postgres;

--
-- TOC entry 405 (class 1259 OID 21233)
-- Name: referral_programs; Type: TABLE; Schema: marketing; Owner: postgres
--

CREATE TABLE marketing.referral_programs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code character varying(100) NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    status marketing.referral_program_status DEFAULT 'draft'::marketing.referral_program_status NOT NULL,
    starts_at timestamp with time zone,
    ends_at timestamp with time zone,
    is_default boolean DEFAULT false NOT NULL,
    allow_stacking boolean DEFAULT false NOT NULL,
    require_previous_coupon_redeemed boolean DEFAULT true NOT NULL,
    max_referrals_per_referrer integer,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_referral_programs_max_referrals_nonnegative CHECK (((max_referrals_per_referrer IS NULL) OR (max_referrals_per_referrer >= 0)))
);


ALTER TABLE marketing.referral_programs OWNER TO postgres;

--
-- TOC entry 406 (class 1259 OID 21251)
-- Name: referral_reward_rules; Type: TABLE; Schema: marketing; Owner: postgres
--

CREATE TABLE marketing.referral_reward_rules (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    program_id uuid NOT NULL,
    trigger marketing.reward_trigger NOT NULL,
    recipient marketing.reward_recipient NOT NULL,
    referral_ordinal integer,
    discount_type marketing.discount_type NOT NULL,
    discount_value numeric(10,2) NOT NULL,
    currency_code character varying(15),
    title character varying(200) NOT NULL,
    description text,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    requires_previous_coupon_redeemed boolean DEFAULT true NOT NULL,
    max_issuance_per_user integer,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_referral_reward_rules_discount_positive CHECK ((discount_value > (0)::numeric)),
    CONSTRAINT ck_referral_reward_rules_referral_ordinal_positive CHECK (((referral_ordinal IS NULL) OR (referral_ordinal > 0)))
);


ALTER TABLE marketing.referral_reward_rules OWNER TO postgres;

--
-- TOC entry 410 (class 1259 OID 21363)
-- Name: referral_share_events; Type: TABLE; Schema: marketing; Owner: postgres
--

CREATE TABLE marketing.referral_share_events (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    referral_code_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    channel character varying(50) NOT NULL,
    shared_at timestamp with time zone DEFAULT now() NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE marketing.referral_share_events OWNER TO postgres;

--
-- TOC entry 409 (class 1259 OID 21324)
-- Name: user_discount_coupons; Type: TABLE; Schema: marketing; Owner: postgres
--

CREATE TABLE marketing.user_discount_coupons (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    customer_id uuid NOT NULL,
    program_id uuid NOT NULL,
    reward_rule_id uuid,
    referral_invitation_id uuid,
    code character varying(50) NOT NULL,
    source_type character varying(50) DEFAULT 'referral'::character varying NOT NULL,
    title character varying(200) NOT NULL,
    description text,
    discount_type marketing.discount_type NOT NULL,
    discount_value numeric(10,2) NOT NULL,
    currency_code character varying(15),
    status marketing.user_coupon_status DEFAULT 'issued'::marketing.user_coupon_status NOT NULL,
    queue_position integer DEFAULT 1 NOT NULL,
    is_combinable boolean DEFAULT false NOT NULL,
    requires_previous_coupon_redeemed boolean DEFAULT true NOT NULL,
    issued_at timestamp with time zone DEFAULT now() NOT NULL,
    reserved_at timestamp with time zone,
    redeemed_at timestamp with time zone,
    expires_at timestamp with time zone,
    order_reference character varying(100),
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    CONSTRAINT ck_user_discount_coupons_discount_positive CHECK ((discount_value > (0)::numeric)),
    CONSTRAINT ck_user_discount_coupons_queue_position_positive CHECK ((queue_position > 0))
);


ALTER TABLE marketing.user_discount_coupons OWNER TO postgres;

--
-- TOC entry 343 (class 1259 OID 19619)
-- Name: media_library; Type: TABLE; Schema: media; Owner: postgres
--

CREATE TABLE media.media_library (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title_translations jsonb DEFAULT '{}'::jsonb NOT NULL,
    description_translations jsonb DEFAULT '{}'::jsonb NOT NULL,
    alt_translations jsonb DEFAULT '{}'::jsonb NOT NULL,
    original_name character varying(255) NOT NULL,
    stored_name character varying(255) NOT NULL,
    file_url text NOT NULL,
    storage_path text,
    storage_key text,
    mime_type character varying(255) NOT NULL,
    extension character varying(50),
    media_type character varying(20) NOT NULL,
    file_size bigint DEFAULT 0 NOT NULL,
    width integer,
    height integer,
    duration_seconds integer,
    created_by uuid,
    is_public boolean DEFAULT true NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT media_library_media_type_check CHECK (((media_type)::text = ANY ((ARRAY['image'::character varying, 'video'::character varying, 'file'::character varying])::text[])))
);


ALTER TABLE media.media_library OWNER TO postgres;

--
-- TOC entry 345 (class 1259 OID 19672)
-- Name: media_type; Type: TABLE; Schema: media; Owner: postgres
--

CREATE TABLE media.media_type (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(200)
);


ALTER TABLE media.media_type OWNER TO postgres;

--
-- TOC entry 344 (class 1259 OID 19661)
-- Name: sponsered_slider; Type: TABLE; Schema: media; Owner: postgres
--

CREATE TABLE media.sponsered_slider (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    link character varying(500),
    url character varying(500),
    media_type_id uuid,
    title text,
    subtitle text,
    button_label text DEFAULT 'Learn More'::text,
    display_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


ALTER TABLE media.sponsered_slider OWNER TO postgres;

--
-- TOC entry 364 (class 1259 OID 20142)
-- Name: notification_deliveries; Type: TABLE; Schema: notify; Owner: postgres
--

CREATE TABLE notify.notification_deliveries (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    notification_id uuid NOT NULL,
    channel notify.delivery_channel NOT NULL,
    recipient_email character varying(250),
    recipient_phone character varying(25),
    recipient_push_token text,
    provider_response text,
    status notify.notification_status DEFAULT 'queued'::notify.notification_status NOT NULL,
    attempted_at timestamp with time zone,
    delivered_at timestamp with time zone,
    failed_at timestamp with time zone,
    error_message text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE notify.notification_deliveries OWNER TO postgres;

--
-- TOC entry 363 (class 1259 OID 20125)
-- Name: notifications; Type: TABLE; Schema: notify; Owner: postgres
--

CREATE TABLE notify.notifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    customer_id uuid NOT NULL,
    notification_type notify.notification_type NOT NULL,
    title character varying(250) NOT NULL,
    body text NOT NULL,
    entity_type character varying(100),
    entity_id uuid,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    status notify.notification_status DEFAULT 'queued'::notify.notification_status NOT NULL,
    read_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE notify.notifications OWNER TO postgres;

--
-- TOC entry 413 (class 1259 OID 21900)
-- Name: form_definitions; Type: TABLE; Schema: provider_portal; Owner: postgres
--

CREATE TABLE provider_portal.form_definitions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    provider_type_id uuid,
    code text NOT NULL,
    scope text NOT NULL,
    title_translations jsonb DEFAULT '{}'::jsonb NOT NULL,
    description_translations jsonb DEFAULT '{}'::jsonb NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    settings jsonb DEFAULT '{}'::jsonb NOT NULL,
    published_at timestamp with time zone,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE provider_portal.form_definitions OWNER TO postgres;

--
-- TOC entry 415 (class 1259 OID 21953)
-- Name: form_field_options; Type: TABLE; Schema: provider_portal; Owner: postgres
--

CREATE TABLE provider_portal.form_field_options (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    form_field_id uuid NOT NULL,
    option_value text NOT NULL,
    label_translations jsonb DEFAULT '{}'::jsonb NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    is_enabled boolean DEFAULT true NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE provider_portal.form_field_options OWNER TO postgres;

--
-- TOC entry 414 (class 1259 OID 21923)
-- Name: form_fields; Type: TABLE; Schema: provider_portal; Owner: postgres
--

CREATE TABLE provider_portal.form_fields (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    form_definition_id uuid NOT NULL,
    field_key text NOT NULL,
    label_translations jsonb DEFAULT '{}'::jsonb NOT NULL,
    help_translations jsonb DEFAULT '{}'::jsonb NOT NULL,
    placeholder_translations jsonb DEFAULT '{}'::jsonb NOT NULL,
    field_type text NOT NULL,
    data_type text DEFAULT 'string'::text NOT NULL,
    column_binding text,
    value_path text,
    is_required boolean DEFAULT false NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    width text,
    option_source_kind text DEFAULT 'none'::text NOT NULL,
    option_source_config jsonb DEFAULT '{}'::jsonb NOT NULL,
    validation_rules jsonb DEFAULT '{}'::jsonb NOT NULL,
    default_value jsonb,
    conditional_logic jsonb DEFAULT '{}'::jsonb NOT NULL,
    ui_props jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_enabled boolean DEFAULT true NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE provider_portal.form_fields OWNER TO postgres;

--
-- TOC entry 417 (class 1259 OID 22000)
-- Name: onboarding_applications; Type: TABLE; Schema: provider_portal; Owner: postgres
--

CREATE TABLE provider_portal.onboarding_applications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    application_number text DEFAULT concat('APP-', to_char(now(), 'YYYYMMDD'::text), '-', upper(SUBSTRING(replace((public.uuid_generate_v4())::text, '-'::text, ''::text) FROM 1 FOR 8))),
    applicant_user_id uuid NOT NULL,
    provider_type_id uuid NOT NULL,
    service_provider_id uuid,
    current_form_definition_id uuid,
    current_step integer DEFAULT 1 NOT NULL,
    status provider_portal.application_status DEFAULT 'draft'::provider_portal.application_status NOT NULL,
    legal_name text,
    display_name_translations jsonb DEFAULT '{}'::jsonb NOT NULL,
    email character varying(250),
    phone_number_country_code character varying(5),
    phone_number character varying(20),
    country_location_id uuid,
    city_location_id uuid,
    address_text text,
    website_url text,
    submission_payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    internal_note text,
    review_reason text,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    submitted_at timestamp with time zone,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE provider_portal.onboarding_applications OWNER TO postgres;

--
-- TOC entry 418 (class 1259 OID 22053)
-- Name: onboarding_documents; Type: TABLE; Schema: provider_portal; Owner: postgres
--

CREATE TABLE provider_portal.onboarding_documents (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    application_id uuid NOT NULL,
    document_kind text NOT NULL,
    media_id uuid,
    file_url text,
    title text,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE provider_portal.onboarding_documents OWNER TO postgres;

--
-- TOC entry 422 (class 1259 OID 22146)
-- Name: payout_accounts; Type: TABLE; Schema: provider_portal; Owner: postgres
--

CREATE TABLE provider_portal.payout_accounts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    service_provider_id uuid NOT NULL,
    account_holder_name text NOT NULL,
    bank_name text,
    iban text,
    swift_code text,
    account_number_last4 text,
    country character varying(15),
    currency_code character varying(10) DEFAULT 'USD'::character varying NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE provider_portal.payout_accounts OWNER TO postgres;

--
-- TOC entry 423 (class 1259 OID 22164)
-- Name: portal_invoices; Type: TABLE; Schema: provider_portal; Owner: postgres
--

CREATE TABLE provider_portal.portal_invoices (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    service_provider_id uuid NOT NULL,
    billing_period_start date,
    billing_period_end date,
    currency_code character varying(10) DEFAULT 'USD'::character varying NOT NULL,
    subtotal numeric(18,2) DEFAULT 0 NOT NULL,
    tax_total numeric(18,2) DEFAULT 0 NOT NULL,
    total numeric(18,2) DEFAULT 0 NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    pdf_url text,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE provider_portal.portal_invoices OWNER TO postgres;

--
-- TOC entry 412 (class 1259 OID 21876)
-- Name: portal_sections; Type: TABLE; Schema: provider_portal; Owner: postgres
--

CREATE TABLE provider_portal.portal_sections (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    provider_type_id uuid NOT NULL,
    section_key text NOT NULL,
    label_translations jsonb DEFAULT '{}'::jsonb NOT NULL,
    description_translations jsonb DEFAULT '{}'::jsonb NOT NULL,
    icon_name text,
    page_kind provider_portal.section_page_kind DEFAULT 'custom'::provider_portal.section_page_kind NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    is_enabled boolean DEFAULT true NOT NULL,
    settings jsonb DEFAULT '{}'::jsonb NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE provider_portal.portal_sections OWNER TO postgres;

--
-- TOC entry 416 (class 1259 OID 21973)
-- Name: provider_members; Type: TABLE; Schema: provider_portal; Owner: postgres
--

CREATE TABLE provider_portal.provider_members (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    service_provider_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role provider_portal.membership_role DEFAULT 'owner'::provider_portal.membership_role NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE provider_portal.provider_members OWNER TO postgres;

--
-- TOC entry 419 (class 1259 OID 22074)
-- Name: provider_operating_hours; Type: TABLE; Schema: provider_portal; Owner: postgres
--

CREATE TABLE provider_portal.provider_operating_hours (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    service_provider_id uuid NOT NULL,
    day_of_week smallint NOT NULL,
    opens_at time without time zone,
    closes_at time without time zone,
    is_closed boolean DEFAULT false NOT NULL,
    slot_interval_minutes integer DEFAULT 15 NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT provider_operating_hours_day_of_week_check CHECK (((day_of_week >= 1) AND (day_of_week <= 7))),
    CONSTRAINT provider_operating_hours_slot_interval_minutes_check CHECK ((slot_interval_minutes > 0))
);


ALTER TABLE provider_portal.provider_operating_hours OWNER TO postgres;

--
-- TOC entry 420 (class 1259 OID 22096)
-- Name: provider_service_addon_settings; Type: TABLE; Schema: provider_portal; Owner: postgres
--

CREATE TABLE provider_portal.provider_service_addon_settings (
    provider_service_id uuid NOT NULL,
    addon_id text NOT NULL,
    is_enabled boolean DEFAULT true NOT NULL,
    custom_price numeric(18,2),
    custom_config jsonb DEFAULT '{}'::jsonb NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE provider_portal.provider_service_addon_settings OWNER TO postgres;

--
-- TOC entry 411 (class 1259 OID 21855)
-- Name: provider_type_catalog; Type: TABLE; Schema: provider_portal; Owner: postgres
--

CREATE TABLE provider_portal.provider_type_catalog (
    provider_type_id uuid NOT NULL,
    code text NOT NULL,
    description_translations jsonb DEFAULT '{}'::jsonb NOT NULL,
    icon_name text,
    sort_order integer DEFAULT 0 NOT NULL,
    is_enabled boolean DEFAULT true NOT NULL,
    is_onboarding_enabled boolean DEFAULT true NOT NULL,
    onboarding_form_code text,
    profile_form_code text,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE provider_portal.provider_type_catalog OWNER TO postgres;

--
-- TOC entry 421 (class 1259 OID 22117)
-- Name: support_tickets; Type: TABLE; Schema: provider_portal; Owner: postgres
--

CREATE TABLE provider_portal.support_tickets (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    service_provider_id uuid NOT NULL,
    created_by_user_id uuid,
    assigned_to_user_id uuid,
    subject text NOT NULL,
    message text NOT NULL,
    status provider_portal.ticket_status DEFAULT 'open'::provider_portal.ticket_status NOT NULL,
    priority text DEFAULT 'normal'::text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE provider_portal.support_tickets OWNER TO postgres;

--
-- TOC entry 307 (class 1259 OID 16751)
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
-- TOC entry 308 (class 1259 OID 16757)
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
-- TOC entry 8189 (class 0 OID 0)
-- Dependencies: 308
-- Name: translation_audit_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.translation_audit_id_seq OWNED BY public.translation_audit.id;


--
-- TOC entry 322 (class 1259 OID 18520)
-- Name: trending_searches; Type: TABLE; Schema: search; Owner: postgres
--

CREATE TABLE search.trending_searches (
    term text,
    trend text,
    calculated_at timestamp without time zone
);


ALTER TABLE search.trending_searches OWNER TO postgres;

--
-- TOC entry 319 (class 1259 OID 18406)
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
-- TOC entry 318 (class 1259 OID 18405)
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
-- TOC entry 8190 (class 0 OID 0)
-- Dependencies: 318
-- Name: user_search_history_id_seq; Type: SEQUENCE OWNED BY; Schema: search; Owner: postgres
--

ALTER SEQUENCE search.user_search_history_id_seq OWNED BY search.user_search_history.id;


--
-- TOC entry 383 (class 1259 OID 20705)
-- Name: abandoned_carts; Type: TABLE; Schema: shop; Owner: postgres
--

CREATE TABLE shop.abandoned_carts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    cart_id uuid NOT NULL,
    customer_id uuid,
    guest_email text,
    detected_at timestamp with time zone DEFAULT now() NOT NULL,
    recovered_at timestamp with time zone,
    recovery_token text,
    notification_status text DEFAULT 'pending'::text NOT NULL
);


ALTER TABLE shop.abandoned_carts OWNER TO postgres;

--
-- TOC entry 371 (class 1259 OID 20464)
-- Name: attribute_values; Type: TABLE; Schema: shop; Owner: postgres
--

CREATE TABLE shop.attribute_values (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    attribute_id uuid NOT NULL,
    value text NOT NULL,
    display_name_translations jsonb DEFAULT '{}'::jsonb NOT NULL,
    color_hex text,
    image_url text,
    create_date timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE shop.attribute_values OWNER TO postgres;

--
-- TOC entry 370 (class 1259 OID 20449)
-- Name: attributes; Type: TABLE; Schema: shop; Owner: postgres
--

CREATE TABLE shop.attributes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name_translations jsonb DEFAULT '{}'::jsonb NOT NULL,
    slug text NOT NULL,
    display_type text DEFAULT 'select'::text NOT NULL,
    is_variant_defining boolean DEFAULT false NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE shop.attributes OWNER TO postgres;

--
-- TOC entry 365 (class 1259 OID 20337)
-- Name: brands; Type: TABLE; Schema: shop; Owner: postgres
--

CREATE TABLE shop.brands (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name_translations jsonb DEFAULT '{}'::jsonb NOT NULL,
    description_translations jsonb DEFAULT '{}'::jsonb NOT NULL,
    slug text NOT NULL,
    logo_url text,
    website_url text,
    is_active boolean DEFAULT true NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE shop.brands OWNER TO postgres;

--
-- TOC entry 382 (class 1259 OID 20676)
-- Name: cart_items; Type: TABLE; Schema: shop; Owner: postgres
--

CREATE TABLE shop.cart_items (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    cart_id uuid NOT NULL,
    product_id uuid NOT NULL,
    variant_id uuid,
    quantity integer NOT NULL,
    unit_price numeric(18,2) NOT NULL,
    compare_at_price numeric(18,2),
    currency character varying(15) DEFAULT 'USD'::character varying NOT NULL,
    saved_for_later boolean DEFAULT false NOT NULL,
    item_snapshot jsonb DEFAULT '{}'::jsonb NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_shop_cart_items_quantity_positive CHECK ((quantity > 0))
);


ALTER TABLE shop.cart_items OWNER TO postgres;

--
-- TOC entry 381 (class 1259 OID 20658)
-- Name: carts; Type: TABLE; Schema: shop; Owner: postgres
--

CREATE TABLE shop.carts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    customer_id uuid,
    guest_token text,
    currency character varying(15) DEFAULT 'USD'::character varying NOT NULL,
    status shop.cart_status DEFAULT 'active'::shop.cart_status NOT NULL,
    coupon_code text,
    pricing_snapshot jsonb DEFAULT '{}'::jsonb NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone,
    converted_order_id uuid
);


ALTER TABLE shop.carts OWNER TO postgres;

--
-- TOC entry 366 (class 1259 OID 20352)
-- Name: categories; Type: TABLE; Schema: shop; Owner: postgres
--

CREATE TABLE shop.categories (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    parent_id uuid,
    name_translations jsonb DEFAULT '{}'::jsonb NOT NULL,
    description_translations jsonb DEFAULT '{}'::jsonb NOT NULL,
    slug text NOT NULL,
    image_url text,
    banner_url text,
    icon text,
    gradient text,
    is_active boolean DEFAULT true NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    seo_title_translations jsonb DEFAULT '{}'::jsonb NOT NULL,
    seo_description_translations jsonb DEFAULT '{}'::jsonb NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE shop.categories OWNER TO postgres;

--
-- TOC entry 403 (class 1259 OID 21137)
-- Name: compare_list_items; Type: TABLE; Schema: shop; Owner: postgres
--

CREATE TABLE shop.compare_list_items (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    compare_list_id uuid NOT NULL,
    product_id uuid NOT NULL,
    status shop.comparison_status DEFAULT 'active'::shop.comparison_status NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE shop.compare_list_items OWNER TO postgres;

--
-- TOC entry 402 (class 1259 OID 21122)
-- Name: compare_lists; Type: TABLE; Schema: shop; Owner: postgres
--

CREATE TABLE shop.compare_lists (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    customer_id uuid,
    guest_token text,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE shop.compare_lists OWNER TO postgres;

--
-- TOC entry 385 (class 1259 OID 20748)
-- Name: coupon_redemptions; Type: TABLE; Schema: shop; Owner: postgres
--

CREATE TABLE shop.coupon_redemptions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    coupon_id uuid NOT NULL,
    order_id uuid,
    customer_id uuid,
    cart_id uuid,
    code text NOT NULL,
    amount numeric(18,2) DEFAULT 0 NOT NULL,
    redeemed_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE shop.coupon_redemptions OWNER TO postgres;

--
-- TOC entry 384 (class 1259 OID 20729)
-- Name: coupons; Type: TABLE; Schema: shop; Owner: postgres
--

CREATE TABLE shop.coupons (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code text NOT NULL,
    title_translations jsonb DEFAULT '{}'::jsonb NOT NULL,
    description_translations jsonb DEFAULT '{}'::jsonb NOT NULL,
    coupon_type shop.coupon_type NOT NULL,
    value numeric(18,2) NOT NULL,
    currency character varying(15),
    is_active boolean DEFAULT true NOT NULL,
    starts_at timestamp with time zone,
    expires_at timestamp with time zone,
    min_subtotal numeric(18,2) DEFAULT 0 NOT NULL,
    max_discount_amount numeric(18,2),
    usage_limit integer,
    usage_per_customer integer,
    stackable boolean DEFAULT false NOT NULL,
    scope shop.discount_scope DEFAULT 'cart'::shop.discount_scope NOT NULL,
    applies_to jsonb DEFAULT '{}'::jsonb NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE shop.coupons OWNER TO postgres;

--
-- TOC entry 378 (class 1259 OID 20602)
-- Name: customer_addresses; Type: TABLE; Schema: shop; Owner: postgres
--

CREATE TABLE shop.customer_addresses (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    customer_id uuid NOT NULL,
    address_type shop.address_type DEFAULT 'shipping'::shop.address_type NOT NULL,
    full_name text NOT NULL,
    phone_number_country_code character varying(3),
    phone_number character varying(20),
    country character varying(15) NOT NULL,
    city character varying(15) NOT NULL,
    state_region text,
    address_line_1 text NOT NULL,
    address_line_2 text,
    postal_code text,
    company text,
    is_default boolean DEFAULT false NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE shop.customer_addresses OWNER TO postgres;

--
-- TOC entry 379 (class 1259 OID 20619)
-- Name: delivery_methods; Type: TABLE; Schema: shop; Owner: postgres
--

CREATE TABLE shop.delivery_methods (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code text NOT NULL,
    name_translations jsonb DEFAULT '{}'::jsonb NOT NULL,
    description_translations jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    base_fee numeric(18,2) DEFAULT 0 NOT NULL,
    estimated_days_min integer,
    estimated_days_max integer,
    supports_pickup boolean DEFAULT false NOT NULL,
    supports_time_slots boolean DEFAULT false NOT NULL,
    rules jsonb DEFAULT '{}'::jsonb NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE shop.delivery_methods OWNER TO postgres;

--
-- TOC entry 376 (class 1259 OID 20558)
-- Name: inventory; Type: TABLE; Schema: shop; Owner: postgres
--

CREATE TABLE shop.inventory (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    product_id uuid NOT NULL,
    variant_id uuid,
    warehouse_id uuid NOT NULL,
    on_hand integer DEFAULT 0 NOT NULL,
    reserved integer DEFAULT 0 NOT NULL,
    reorder_threshold integer DEFAULT 0 NOT NULL,
    safety_stock integer DEFAULT 0 NOT NULL,
    last_counted_at timestamp with time zone,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_shop_inventory_on_hand_nonnegative CHECK ((on_hand >= 0)),
    CONSTRAINT ck_shop_inventory_reserved_le_on_hand CHECK ((reserved <= on_hand)),
    CONSTRAINT ck_shop_inventory_reserved_nonnegative CHECK ((reserved >= 0))
);


ALTER TABLE shop.inventory OWNER TO postgres;

--
-- TOC entry 377 (class 1259 OID 20588)
-- Name: inventory_movements; Type: TABLE; Schema: shop; Owner: postgres
--

CREATE TABLE shop.inventory_movements (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    inventory_id uuid NOT NULL,
    movement_type shop.inventory_movement_type NOT NULL,
    quantity integer NOT NULL,
    reference_type text,
    reference_id uuid,
    note text,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid
);


ALTER TABLE shop.inventory_movements OWNER TO postgres;

--
-- TOC entry 388 (class 1259 OID 20821)
-- Name: order_addresses; Type: TABLE; Schema: shop; Owner: postgres
--

CREATE TABLE shop.order_addresses (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    order_id uuid NOT NULL,
    address_type shop.address_type NOT NULL,
    full_name text NOT NULL,
    phone_number_country_code character varying(3),
    phone_number character varying(20),
    country character varying(15) NOT NULL,
    city character varying(15) NOT NULL,
    state_region text,
    address_line_1 text NOT NULL,
    address_line_2 text,
    postal_code text,
    company text,
    create_date timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE shop.order_addresses OWNER TO postgres;

--
-- TOC entry 389 (class 1259 OID 20835)
-- Name: order_items; Type: TABLE; Schema: shop; Owner: postgres
--

CREATE TABLE shop.order_items (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    order_id uuid NOT NULL,
    product_id uuid,
    variant_id uuid,
    sku text,
    quantity integer NOT NULL,
    currency character varying(15) DEFAULT 'USD'::character varying NOT NULL,
    unit_price_snapshot numeric(18,2) NOT NULL,
    compare_at_price_snapshot numeric(18,2),
    discount_total_snapshot numeric(18,2) DEFAULT 0 NOT NULL,
    tax_total_snapshot numeric(18,2) DEFAULT 0 NOT NULL,
    line_total_snapshot numeric(18,2) DEFAULT 0 NOT NULL,
    product_name_snapshot jsonb DEFAULT '{}'::jsonb NOT NULL,
    variant_name_snapshot jsonb DEFAULT '{}'::jsonb NOT NULL,
    attributes_snapshot jsonb DEFAULT '{}'::jsonb NOT NULL,
    image_url_snapshot text,
    fulfillment_status shop.shipment_status DEFAULT 'pending'::shop.shipment_status NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE shop.order_items OWNER TO postgres;

--
-- TOC entry 390 (class 1259 OID 20867)
-- Name: order_status_history; Type: TABLE; Schema: shop; Owner: postgres
--

CREATE TABLE shop.order_status_history (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    order_id uuid NOT NULL,
    from_status shop.order_status,
    to_status shop.order_status NOT NULL,
    note text,
    changed_by uuid,
    create_date timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE shop.order_status_history OWNER TO postgres;

--
-- TOC entry 387 (class 1259 OID 20788)
-- Name: orders; Type: TABLE; Schema: shop; Owner: postgres
--

CREATE TABLE shop.orders (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    order_number text NOT NULL,
    customer_id uuid,
    cart_id uuid,
    email text NOT NULL,
    currency character varying(15) DEFAULT 'USD'::character varying NOT NULL,
    status shop.order_status DEFAULT 'pending'::shop.order_status NOT NULL,
    payment_status shop.payment_status DEFAULT 'pending'::shop.payment_status NOT NULL,
    fulfillment_status shop.shipment_status DEFAULT 'pending'::shop.shipment_status NOT NULL,
    subtotal numeric(18,2) DEFAULT 0 NOT NULL,
    discount_total numeric(18,2) DEFAULT 0 NOT NULL,
    shipping_total numeric(18,2) DEFAULT 0 NOT NULL,
    tax_total numeric(18,2) DEFAULT 0 NOT NULL,
    grand_total numeric(18,2) DEFAULT 0 NOT NULL,
    coupon_code text,
    note text,
    placed_at timestamp with time zone DEFAULT now() NOT NULL,
    paid_at timestamp with time zone,
    cancelled_at timestamp with time zone,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now() NOT NULL,
    meta jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE shop.orders OWNER TO postgres;

--
-- TOC entry 380 (class 1259 OID 20638)
-- Name: payment_methods; Type: TABLE; Schema: shop; Owner: postgres
--

CREATE TABLE shop.payment_methods (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code text NOT NULL,
    name_translations jsonb DEFAULT '{}'::jsonb NOT NULL,
    description_translations jsonb DEFAULT '{}'::jsonb NOT NULL,
    provider text,
    configuration jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    supports_authorize boolean DEFAULT false NOT NULL,
    supports_capture boolean DEFAULT false NOT NULL,
    supports_refund boolean DEFAULT false NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE shop.payment_methods OWNER TO postgres;

--
-- TOC entry 391 (class 1259 OID 20881)
-- Name: payment_transactions; Type: TABLE; Schema: shop; Owner: postgres
--

CREATE TABLE shop.payment_transactions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    order_id uuid NOT NULL,
    payment_method_id uuid,
    provider text,
    provider_transaction_id text,
    amount numeric(18,2) NOT NULL,
    currency character varying(15) DEFAULT 'USD'::character varying NOT NULL,
    status shop.payment_status DEFAULT 'pending'::shop.payment_status NOT NULL,
    type text DEFAULT 'charge'::text NOT NULL,
    request_payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    response_payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    authorized_at timestamp with time zone,
    captured_at timestamp with time zone,
    failed_at timestamp with time zone,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE shop.payment_transactions OWNER TO postgres;

--
-- TOC entry 386 (class 1259 OID 20773)
-- Name: pricing_rules; Type: TABLE; Schema: shop; Owner: postgres
--

CREATE TABLE shop.pricing_rules (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    description text,
    scope shop.discount_scope NOT NULL,
    rule_type text NOT NULL,
    priority integer DEFAULT 100 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    stackable boolean DEFAULT false NOT NULL,
    starts_at timestamp with time zone,
    ends_at timestamp with time zone,
    conditions jsonb DEFAULT '{}'::jsonb NOT NULL,
    actions jsonb DEFAULT '{}'::jsonb NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE shop.pricing_rules OWNER TO postgres;

--
-- TOC entry 372 (class 1259 OID 20481)
-- Name: product_attributes; Type: TABLE; Schema: shop; Owner: postgres
--

CREATE TABLE shop.product_attributes (
    product_id uuid NOT NULL,
    attribute_id uuid NOT NULL,
    is_required boolean DEFAULT false NOT NULL,
    display_order integer DEFAULT 0 NOT NULL
);


ALTER TABLE shop.product_attributes OWNER TO postgres;

--
-- TOC entry 368 (class 1259 OID 20413)
-- Name: product_categories; Type: TABLE; Schema: shop; Owner: postgres
--

CREATE TABLE shop.product_categories (
    product_id uuid NOT NULL,
    category_id uuid NOT NULL,
    is_primary boolean DEFAULT false NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE shop.product_categories OWNER TO postgres;

--
-- TOC entry 369 (class 1259 OID 20431)
-- Name: product_media; Type: TABLE; Schema: shop; Owner: postgres
--

CREATE TABLE shop.product_media (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    product_id uuid NOT NULL,
    variant_id uuid,
    url text NOT NULL,
    media_type character varying(50) DEFAULT 'image'::character varying NOT NULL,
    alt_translations jsonb DEFAULT '{}'::jsonb NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    is_primary boolean DEFAULT false NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE shop.product_media OWNER TO postgres;

--
-- TOC entry 400 (class 1259 OID 21082)
-- Name: product_questions; Type: TABLE; Schema: shop; Owner: postgres
--

CREATE TABLE shop.product_questions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    product_id uuid NOT NULL,
    customer_id uuid,
    question text NOT NULL,
    answer text,
    answered_by uuid,
    status shop.question_status DEFAULT 'open'::shop.question_status NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE shop.product_questions OWNER TO postgres;

--
-- TOC entry 399 (class 1259 OID 21054)
-- Name: product_reviews; Type: TABLE; Schema: shop; Owner: postgres
--

CREATE TABLE shop.product_reviews (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    product_id uuid NOT NULL,
    order_item_id uuid,
    customer_id uuid,
    rating integer NOT NULL,
    title text,
    body text,
    status shop.review_status DEFAULT 'pending'::shop.review_status NOT NULL,
    is_verified_purchase boolean DEFAULT false NOT NULL,
    helpful_count integer DEFAULT 0 NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE shop.product_reviews OWNER TO postgres;

--
-- TOC entry 373 (class 1259 OID 20498)
-- Name: product_variants; Type: TABLE; Schema: shop; Owner: postgres
--

CREATE TABLE shop.product_variants (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    product_id uuid NOT NULL,
    title_translations jsonb DEFAULT '{}'::jsonb NOT NULL,
    slug text NOT NULL,
    sku text NOT NULL,
    barcode text,
    currency character varying(15) DEFAULT 'USD'::character varying NOT NULL,
    price numeric(18,2) DEFAULT 0 NOT NULL,
    compare_at_price numeric(18,2),
    cost_price numeric(18,2),
    is_default boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    allow_backorder boolean DEFAULT false NOT NULL,
    option_key text NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE shop.product_variants OWNER TO postgres;

--
-- TOC entry 367 (class 1259 OID 20375)
-- Name: products; Type: TABLE; Schema: shop; Owner: postgres
--

CREATE TABLE shop.products (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    product_type shop.product_type DEFAULT 'simple'::shop.product_type NOT NULL,
    status shop.product_status DEFAULT 'draft'::shop.product_status NOT NULL,
    brand_id uuid,
    primary_category_id uuid,
    name_translations jsonb DEFAULT '{}'::jsonb NOT NULL,
    short_description_translations jsonb DEFAULT '{}'::jsonb NOT NULL,
    description_translations jsonb DEFAULT '{}'::jsonb NOT NULL,
    slug text NOT NULL,
    sku_prefix text,
    base_currency character varying(15) DEFAULT 'USD'::character varying NOT NULL,
    base_price numeric(18,2) DEFAULT 0 NOT NULL,
    compare_at_price numeric(18,2),
    cost_price numeric(18,2),
    tax_class text DEFAULT 'standard'::text NOT NULL,
    weight_grams integer,
    length_mm integer,
    width_mm integer,
    height_mm integer,
    is_featured boolean DEFAULT false NOT NULL,
    is_best_seller boolean DEFAULT false NOT NULL,
    is_new_arrival boolean DEFAULT false NOT NULL,
    allow_backorder boolean DEFAULT false NOT NULL,
    requires_shipping boolean DEFAULT true NOT NULL,
    fulfillment_type shop.fulfillment_type DEFAULT 'delivery'::shop.fulfillment_type NOT NULL,
    published_at timestamp with time zone,
    seo_title_translations jsonb DEFAULT '{}'::jsonb NOT NULL,
    seo_description_translations jsonb DEFAULT '{}'::jsonb NOT NULL,
    search_vector tsvector,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE shop.products OWNER TO postgres;

--
-- TOC entry 401 (class 1259 OID 21103)
-- Name: recently_viewed_products; Type: TABLE; Schema: shop; Owner: postgres
--

CREATE TABLE shop.recently_viewed_products (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    customer_id uuid,
    guest_token text,
    product_id uuid NOT NULL,
    viewed_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE shop.recently_viewed_products OWNER TO postgres;

--
-- TOC entry 396 (class 1259 OID 20992)
-- Name: refunds; Type: TABLE; Schema: shop; Owner: postgres
--

CREATE TABLE shop.refunds (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    order_id uuid NOT NULL,
    payment_transaction_id uuid,
    amount numeric(18,2) NOT NULL,
    currency character varying(15) DEFAULT 'USD'::character varying NOT NULL,
    reason text,
    status shop.payment_status DEFAULT 'pending'::shop.payment_status NOT NULL,
    refunded_at timestamp with time zone,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE shop.refunds OWNER TO postgres;

--
-- TOC entry 395 (class 1259 OID 20973)
-- Name: return_items; Type: TABLE; Schema: shop; Owner: postgres
--

CREATE TABLE shop.return_items (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    return_request_id uuid NOT NULL,
    order_item_id uuid NOT NULL,
    quantity integer NOT NULL,
    reason text,
    condition_note text,
    create_date timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE shop.return_items OWNER TO postgres;

--
-- TOC entry 394 (class 1259 OID 20951)
-- Name: return_requests; Type: TABLE; Schema: shop; Owner: postgres
--

CREATE TABLE shop.return_requests (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    order_id uuid NOT NULL,
    customer_id uuid,
    status shop.return_status DEFAULT 'requested'::shop.return_status NOT NULL,
    reason text NOT NULL,
    requested_at timestamp with time zone DEFAULT now() NOT NULL,
    reviewed_at timestamp with time zone,
    review_note text,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE shop.return_requests OWNER TO postgres;

--
-- TOC entry 393 (class 1259 OID 20934)
-- Name: shipment_items; Type: TABLE; Schema: shop; Owner: postgres
--

CREATE TABLE shop.shipment_items (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    shipment_id uuid NOT NULL,
    order_item_id uuid NOT NULL,
    quantity integer NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE shop.shipment_items OWNER TO postgres;

--
-- TOC entry 392 (class 1259 OID 20906)
-- Name: shipments; Type: TABLE; Schema: shop; Owner: postgres
--

CREATE TABLE shop.shipments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    order_id uuid NOT NULL,
    delivery_method_id uuid,
    warehouse_id uuid,
    status shop.shipment_status DEFAULT 'pending'::shop.shipment_status NOT NULL,
    shipment_number text NOT NULL,
    tracking_number text,
    carrier text,
    shipped_at timestamp with time zone,
    delivered_at timestamp with time zone,
    label_url text,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE shop.shipments OWNER TO postgres;

--
-- TOC entry 404 (class 1259 OID 21170)
-- Name: v_product_price_summary; Type: VIEW; Schema: shop; Owner: postgres
--

CREATE VIEW shop.v_product_price_summary AS
 WITH product_inventory AS (
         SELECT i.product_id,
            (COALESCE(sum((i.on_hand - i.reserved)), (0)::bigint))::integer AS available_qty
           FROM shop.inventory i
          WHERE (i.variant_id IS NULL)
          GROUP BY i.product_id
        ), variant_inventory AS (
         SELECT i.variant_id,
            (COALESCE(sum((i.on_hand - i.reserved)), (0)::bigint))::integer AS available_qty
           FROM shop.inventory i
          WHERE (i.variant_id IS NOT NULL)
          GROUP BY i.variant_id
        ), variant_summary AS (
         SELECT pv.product_id,
            count(*) FILTER (WHERE ((pv.deleted_at IS NULL) AND (pv.is_active = true))) AS variant_count,
            min(pv.price) FILTER (WHERE ((pv.deleted_at IS NULL) AND (pv.is_active = true))) AS min_price,
            max(pv.price) FILTER (WHERE ((pv.deleted_at IS NULL) AND (pv.is_active = true))) AS max_price,
            bool_or(((COALESCE(vi.available_qty, 0) > 0) OR pv.allow_backorder)) FILTER (WHERE ((pv.deleted_at IS NULL) AND (pv.is_active = true))) AS has_stock
           FROM (shop.product_variants pv
             LEFT JOIN variant_inventory vi ON ((vi.variant_id = pv.id)))
          GROUP BY pv.product_id
        )
 SELECT p.id AS product_id,
    COALESCE(vs.min_price, p.base_price) AS min_price,
    COALESCE(vs.max_price, p.base_price) AS max_price,
        CASE
            WHEN (COALESCE(vs.variant_count, (0)::bigint) > 0) THEN COALESCE(vs.has_stock, false)
            ELSE ((COALESCE(pi.available_qty, 0) > 0) OR p.allow_backorder)
        END AS has_stock
   FROM ((shop.products p
     LEFT JOIN variant_summary vs ON ((vs.product_id = p.id)))
     LEFT JOIN product_inventory pi ON ((pi.product_id = p.id)));


ALTER VIEW shop.v_product_price_summary OWNER TO postgres;

--
-- TOC entry 374 (class 1259 OID 20525)
-- Name: variant_attribute_values; Type: TABLE; Schema: shop; Owner: postgres
--

CREATE TABLE shop.variant_attribute_values (
    variant_id uuid NOT NULL,
    attribute_id uuid NOT NULL,
    attribute_value_id uuid NOT NULL
);


ALTER TABLE shop.variant_attribute_values OWNER TO postgres;

--
-- TOC entry 375 (class 1259 OID 20545)
-- Name: warehouses; Type: TABLE; Schema: shop; Owner: postgres
--

CREATE TABLE shop.warehouses (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    country character varying(15),
    city character varying(15),
    address_line_1 text,
    postal_code text,
    is_active boolean DEFAULT true NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE shop.warehouses OWNER TO postgres;

--
-- TOC entry 398 (class 1259 OID 21032)
-- Name: wishlist_items; Type: TABLE; Schema: shop; Owner: postgres
--

CREATE TABLE shop.wishlist_items (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    wishlist_id uuid NOT NULL,
    product_id uuid NOT NULL,
    variant_id uuid,
    create_date timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE shop.wishlist_items OWNER TO postgres;

--
-- TOC entry 397 (class 1259 OID 21014)
-- Name: wishlists; Type: TABLE; Schema: shop; Owner: postgres
--

CREATE TABLE shop.wishlists (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    customer_id uuid NOT NULL,
    name text DEFAULT 'Default'::text NOT NULL,
    create_date timestamp with time zone DEFAULT now() NOT NULL,
    last_modified_date timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE shop.wishlists OWNER TO postgres;

--
-- TOC entry 6155 (class 2604 OID 18395)
-- Name: category_groups id; Type: DEFAULT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.category_groups ALTER COLUMN id SET DEFAULT nextval('category.category_groups_id_seq'::regclass);


--
-- TOC entry 6158 (class 2604 OID 18500)
-- Name: offers id; Type: DEFAULT; Schema: marketing; Owner: postgres
--

ALTER TABLE ONLY marketing.offers ALTER COLUMN id SET DEFAULT nextval('marketing.offers_id_seq'::regclass);


--
-- TOC entry 6136 (class 2604 OID 16758)
-- Name: translation_audit id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.translation_audit ALTER COLUMN id SET DEFAULT nextval('public.translation_audit_id_seq'::regclass);


--
-- TOC entry 6156 (class 2604 OID 18409)
-- Name: user_search_history id; Type: DEFAULT; Schema: search; Owner: postgres
--

ALTER TABLE ONLY search.user_search_history ALTER COLUMN id SET DEFAULT nextval('search.user_search_history_id_seq'::regclass);


--
-- TOC entry 7321 (class 2606 OID 19581)
-- Name: role_table_permissions role_table_permissions_pkey; Type: CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.role_table_permissions
    ADD CONSTRAINT role_table_permissions_pkey PRIMARY KEY (id);


--
-- TOC entry 7323 (class 2606 OID 19583)
-- Name: role_table_permissions role_table_permissions_role_id_schema_name_table_name_key; Type: CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.role_table_permissions
    ADD CONSTRAINT role_table_permissions_role_id_schema_name_table_name_key UNIQUE (role_id, schema_name, table_name);


--
-- TOC entry 7314 (class 2606 OID 19559)
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- TOC entry 7316 (class 2606 OID 19557)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- TOC entry 7318 (class 2606 OID 19564)
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, role_id);


--
-- TOC entry 7395 (class 2606 OID 20043)
-- Name: booking_addons booking_addons_pkey; Type: CONSTRAINT; Schema: booking; Owner: postgres
--

ALTER TABLE ONLY booking.booking_addons
    ADD CONSTRAINT booking_addons_pkey PRIMARY KEY (id);


--
-- TOC entry 7654 (class 2606 OID 22576)
-- Name: booking_child_bookings booking_child_bookings_pkey; Type: CONSTRAINT; Schema: booking; Owner: postgres
--

ALTER TABLE ONLY booking.booking_child_bookings
    ADD CONSTRAINT booking_child_bookings_pkey PRIMARY KEY (id);


--
-- TOC entry 7398 (class 2606 OID 20063)
-- Name: booking_documents booking_documents_pkey; Type: CONSTRAINT; Schema: booking; Owner: postgres
--

ALTER TABLE ONLY booking.booking_documents
    ADD CONSTRAINT booking_documents_pkey PRIMARY KEY (id);


--
-- TOC entry 7390 (class 2606 OID 20006)
-- Name: booking_draft_addons booking_draft_addons_pkey; Type: CONSTRAINT; Schema: booking; Owner: postgres
--

ALTER TABLE ONLY booking.booking_draft_addons
    ADD CONSTRAINT booking_draft_addons_pkey PRIMARY KEY (draft_id, addon_id);


--
-- TOC entry 7650 (class 2606 OID 22528)
-- Name: booking_draft_child_bookings booking_draft_child_bookings_pkey; Type: CONSTRAINT; Schema: booking; Owner: postgres
--

ALTER TABLE ONLY booking.booking_draft_child_bookings
    ADD CONSTRAINT booking_draft_child_bookings_pkey PRIMARY KEY (id);


--
-- TOC entry 7392 (class 2606 OID 20025)
-- Name: booking_draft_documents booking_draft_documents_pkey; Type: CONSTRAINT; Schema: booking; Owner: postgres
--

ALTER TABLE ONLY booking.booking_draft_documents
    ADD CONSTRAINT booking_draft_documents_pkey PRIMARY KEY (id);


--
-- TOC entry 7385 (class 2606 OID 19978)
-- Name: booking_drafts booking_drafts_pkey; Type: CONSTRAINT; Schema: booking; Owner: postgres
--

ALTER TABLE ONLY booking.booking_drafts
    ADD CONSTRAINT booking_drafts_pkey PRIMARY KEY (id);


--
-- TOC entry 7233 (class 2606 OID 22460)
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: booking; Owner: postgres
--

ALTER TABLE ONLY booking.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- TOC entry 7235 (class 2606 OID 22462)
-- Name: bookings ex_bookings_no_overlap_per_specialist; Type: CONSTRAINT; Schema: booking; Owner: postgres
--

ALTER TABLE ONLY booking.bookings
    ADD CONSTRAINT ex_bookings_no_overlap_per_specialist EXCLUDE USING gist (provider_id WITH =, specialist_id WITH =, selected_date WITH =, tsrange(((selected_date)::timestamp without time zone + (selected_time_from)::interval), ((selected_date)::timestamp without time zone + (selected_time_to)::interval), '[)'::text) WITH &&) WHERE (((specialist_id IS NOT NULL) AND (booking_ui_mode = 'default_slot'::text) AND (selected_date IS NOT NULL) AND (selected_time_from IS NOT NULL) AND (selected_time_to IS NOT NULL) AND ((booking_status)::text = ANY (ARRAY[('Pending'::character varying)::text, ('Confirmed'::character varying)::text]))));


--
-- TOC entry 7402 (class 2606 OID 20082)
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: booking; Owner: postgres
--

ALTER TABLE ONLY booking.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- TOC entry 7241 (class 2606 OID 19274)
-- Name: bookings uq_bookings_id; Type: CONSTRAINT; Schema: booking; Owner: postgres
--

ALTER TABLE ONLY booking.bookings
    ADD CONSTRAINT uq_bookings_id UNIQUE (id);


--
-- TOC entry 7245 (class 2606 OID 18397)
-- Name: category_groups category_groups_pkey; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.category_groups
    ADD CONSTRAINT category_groups_pkey PRIMARY KEY (id);


--
-- TOC entry 6967 (class 2606 OID 16967)
-- Name: __EFMigrationsHistory pk___ef_migrations_history; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category."__EFMigrationsHistory"
    ADD CONSTRAINT pk___ef_migrations_history PRIMARY KEY (migration_id);


--
-- TOC entry 7259 (class 2606 OID 18550)
-- Name: addon_details pk_addon_details; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.addon_details
    ADD CONSTRAINT pk_addon_details PRIMARY KEY (id);


--
-- TOC entry 7256 (class 2606 OID 18541)
-- Name: addons pk_addons; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.addons
    ADD CONSTRAINT pk_addons PRIMARY KEY (id);


--
-- TOC entry 6969 (class 2606 OID 16969)
-- Name: attribute_types pk_attribute_types; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.attribute_types
    ADD CONSTRAINT pk_attribute_types PRIMARY KEY (id);


--
-- TOC entry 6973 (class 2606 OID 16971)
-- Name: categories pk_categories; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.categories
    ADD CONSTRAINT pk_categories PRIMARY KEY (id);


--
-- TOC entry 6975 (class 2606 OID 16973)
-- Name: currencies pk_currencies; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.currencies
    ADD CONSTRAINT pk_currencies PRIMARY KEY (id);


--
-- TOC entry 6978 (class 2606 OID 16975)
-- Name: inbox_message_consumers pk_inbox_message_consumers; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.inbox_message_consumers
    ADD CONSTRAINT pk_inbox_message_consumers PRIMARY KEY (message_id, name);


--
-- TOC entry 6984 (class 2606 OID 16977)
-- Name: inbox_messages pk_inbox_messages; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.inbox_messages
    ADD CONSTRAINT pk_inbox_messages PRIMARY KEY (id);


--
-- TOC entry 6987 (class 2606 OID 16979)
-- Name: internal_command_message_consumers pk_internal_command_message_consumers; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.internal_command_message_consumers
    ADD CONSTRAINT pk_internal_command_message_consumers PRIMARY KEY (message_id, name);


--
-- TOC entry 6993 (class 2606 OID 16981)
-- Name: internal_command_messages pk_internal_command_messages; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.internal_command_messages
    ADD CONSTRAINT pk_internal_command_messages PRIMARY KEY (id);


--
-- TOC entry 6965 (class 2606 OID 16983)
-- Name: LocationType pk_location_type; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category."LocationType"
    ADD CONSTRAINT pk_location_type PRIMARY KEY (id);


--
-- TOC entry 6998 (class 2606 OID 16985)
-- Name: locations pk_locations; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.locations
    ADD CONSTRAINT pk_locations PRIMARY KEY (id);


--
-- TOC entry 7003 (class 2606 OID 16987)
-- Name: outbox_message_consumers pk_outbox_message_consumers; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.outbox_message_consumers
    ADD CONSTRAINT pk_outbox_message_consumers PRIMARY KEY (message_id, name);


--
-- TOC entry 7009 (class 2606 OID 16989)
-- Name: outbox_messages pk_outbox_messages; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.outbox_messages
    ADD CONSTRAINT pk_outbox_messages PRIMARY KEY (id);


--
-- TOC entry 7325 (class 2606 OID 19605)
-- Name: picked_locations pk_picked_locations; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.picked_locations
    ADD CONSTRAINT pk_picked_locations PRIMARY KEY (id);


--
-- TOC entry 7011 (class 2606 OID 16991)
-- Name: provider_attribute_definition_domain_options pk_provider_attribute_definition_domain_options; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.provider_attribute_definition_domain_options
    ADD CONSTRAINT pk_provider_attribute_definition_domain_options PRIMARY KEY (provider_attribute_definition_id, id);


--
-- TOC entry 7015 (class 2606 OID 16993)
-- Name: provider_attribute_definitions pk_provider_attribute_definitions; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.provider_attribute_definitions
    ADD CONSTRAINT pk_provider_attribute_definitions PRIMARY KEY (id);


--
-- TOC entry 7019 (class 2606 OID 16995)
-- Name: provider_attributes pk_provider_attributes; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.provider_attributes
    ADD CONSTRAINT pk_provider_attributes PRIMARY KEY (id);


--
-- TOC entry 7023 (class 2606 OID 16997)
-- Name: provider_gallery_items pk_provider_gallery_items; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.provider_gallery_items
    ADD CONSTRAINT pk_provider_gallery_items PRIMARY KEY (id);


--
-- TOC entry 7302 (class 2606 OID 19475)
-- Name: provider_languages pk_provider_languages; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.provider_languages
    ADD CONSTRAINT pk_provider_languages PRIMARY KEY (service_provider_id, language);


--
-- TOC entry 7028 (class 2606 OID 16999)
-- Name: provider_policies pk_provider_policies; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.provider_policies
    ADD CONSTRAINT pk_provider_policies PRIMARY KEY (id);


--
-- TOC entry 7687 (class 2606 OID 22858)
-- Name: provider_policy_types pk_provider_policy_types; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.provider_policy_types
    ADD CONSTRAINT pk_provider_policy_types PRIMARY KEY (id);


--
-- TOC entry 7262 (class 2606 OID 18562)
-- Name: provider_service_addons pk_provider_service_addons; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.provider_service_addons
    ADD CONSTRAINT pk_provider_service_addons PRIMARY KEY (provider_service_id, addon_id);


--
-- TOC entry 7311 (class 2606 OID 19519)
-- Name: provider_service_gallery_items pk_provider_service_gallery_items; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.provider_service_gallery_items
    ADD CONSTRAINT pk_provider_service_gallery_items PRIMARY KEY (id);


--
-- TOC entry 7034 (class 2606 OID 17001)
-- Name: provider_services pk_provider_services; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.provider_services
    ADD CONSTRAINT pk_provider_services PRIMARY KEY (id);


--
-- TOC entry 7039 (class 2606 OID 17003)
-- Name: provider_staffs pk_provider_staffs; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.provider_staffs
    ADD CONSTRAINT pk_provider_staffs PRIMARY KEY (id);


--
-- TOC entry 7041 (class 2606 OID 17005)
-- Name: provider_types pk_provider_types; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.provider_types
    ADD CONSTRAINT pk_provider_types PRIMARY KEY (id);


--
-- TOC entry 7043 (class 2606 OID 17007)
-- Name: service_attribute_definition_options pk_service_attribute_definition_options; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.service_attribute_definition_options
    ADD CONSTRAINT pk_service_attribute_definition_options PRIMARY KEY (service_attribute_definition_id, id);


--
-- TOC entry 7047 (class 2606 OID 17009)
-- Name: service_attribute_definitions pk_service_attribute_definitions; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.service_attribute_definitions
    ADD CONSTRAINT pk_service_attribute_definitions PRIMARY KEY (id);


--
-- TOC entry 7051 (class 2606 OID 17011)
-- Name: service_attribute_values pk_service_attribute_values; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.service_attribute_values
    ADD CONSTRAINT pk_service_attribute_values PRIMARY KEY (id);


--
-- TOC entry 7053 (class 2606 OID 17013)
-- Name: service_definition_domain_requirements pk_service_definition_domain_requirements; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.service_definition_domain_requirements
    ADD CONSTRAINT pk_service_definition_domain_requirements PRIMARY KEY (service_definition_id, id);


--
-- TOC entry 7058 (class 2606 OID 17015)
-- Name: service_definitions pk_service_definitions; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.service_definitions
    ADD CONSTRAINT pk_service_definitions PRIMARY KEY (id);


--
-- TOC entry 7064 (class 2606 OID 17017)
-- Name: service_provider_comments pk_service_provider_comments; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.service_provider_comments
    ADD CONSTRAINT pk_service_provider_comments PRIMARY KEY (id);


--
-- TOC entry 7066 (class 2606 OID 17019)
-- Name: service_provider_grades pk_service_provider_grades; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.service_provider_grades
    ADD CONSTRAINT pk_service_provider_grades PRIMARY KEY (id);


--
-- TOC entry 7068 (class 2606 OID 17021)
-- Name: service_provider_request_statuses pk_service_provider_request_statuses; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.service_provider_request_statuses
    ADD CONSTRAINT pk_service_provider_request_statuses PRIMARY KEY (id);


--
-- TOC entry 7073 (class 2606 OID 17023)
-- Name: service_provider_requests pk_service_provider_requests; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.service_provider_requests
    ADD CONSTRAINT pk_service_provider_requests PRIMARY KEY (id);


--
-- TOC entry 7085 (class 2606 OID 17025)
-- Name: service_providers pk_service_providers; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.service_providers
    ADD CONSTRAINT pk_service_providers PRIMARY KEY (id);


--
-- TOC entry 7278 (class 2606 OID 19355)
-- Name: service_upload_file_requirements pk_service_upload_file_requirements; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.service_upload_file_requirements
    ADD CONSTRAINT pk_service_upload_file_requirements PRIMARY KEY (id);


--
-- TOC entry 7088 (class 2606 OID 17027)
-- Name: staff pk_staff; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.staff
    ADD CONSTRAINT pk_staff PRIMARY KEY (id);


--
-- TOC entry 7295 (class 2606 OID 19435)
-- Name: staff_achievements pk_staff_achievements; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.staff_achievements
    ADD CONSTRAINT pk_staff_achievements PRIMARY KEY (id);


--
-- TOC entry 7094 (class 2606 OID 17029)
-- Name: staff_availabilities pk_staff_availabilities; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.staff_availabilities
    ADD CONSTRAINT pk_staff_availabilities PRIMARY KEY (id);


--
-- TOC entry 7096 (class 2606 OID 17031)
-- Name: staff_availability_statuses pk_staff_availability_statuses; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.staff_availability_statuses
    ADD CONSTRAINT pk_staff_availability_statuses PRIMARY KEY (id);


--
-- TOC entry 7299 (class 2606 OID 19453)
-- Name: staff_before_after pk_staff_before_after; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.staff_before_after
    ADD CONSTRAINT pk_staff_before_after PRIMARY KEY (id);


--
-- TOC entry 7291 (class 2606 OID 19418)
-- Name: staff_certifications pk_staff_certifications; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.staff_certifications
    ADD CONSTRAINT pk_staff_certifications PRIMARY KEY (id);


--
-- TOC entry 7265 (class 2606 OID 18586)
-- Name: staff_credentials pk_staff_credentials; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.staff_credentials
    ADD CONSTRAINT pk_staff_credentials PRIMARY KEY (id);


--
-- TOC entry 7288 (class 2606 OID 19402)
-- Name: staff_education pk_staff_education; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.staff_education
    ADD CONSTRAINT pk_staff_education PRIMARY KEY (id);


--
-- TOC entry 7306 (class 2606 OID 19497)
-- Name: staff_gallery_items pk_staff_gallery_items; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.staff_gallery_items
    ADD CONSTRAINT pk_staff_gallery_items PRIMARY KEY (id);


--
-- TOC entry 7281 (class 2606 OID 19374)
-- Name: staff_languages pk_staff_languages; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.staff_languages
    ADD CONSTRAINT pk_staff_languages PRIMARY KEY (staff_id, language);


--
-- TOC entry 7101 (class 2606 OID 17033)
-- Name: staff_services pk_staff_services; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.staff_services
    ADD CONSTRAINT pk_staff_services PRIMARY KEY (id);


--
-- TOC entry 7284 (class 2606 OID 19388)
-- Name: staff_specializations pk_staff_specializations; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.staff_specializations
    ADD CONSTRAINT pk_staff_specializations PRIMARY KEY (staff_id, specialty);


--
-- TOC entry 7220 (class 2606 OID 17878)
-- Name: provider_certifications provider_certifications_pkey; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.provider_certifications
    ADD CONSTRAINT provider_certifications_pkey PRIMARY KEY (id);


--
-- TOC entry 7225 (class 2606 OID 17897)
-- Name: provider_recommendations provider_recommendations_pkey; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.provider_recommendations
    ADD CONSTRAINT provider_recommendations_pkey PRIMARY KEY (id);


--
-- TOC entry 7223 (class 2606 OID 17890)
-- Name: review_images review_images_pkey; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.review_images
    ADD CONSTRAINT review_images_pkey PRIMARY KEY (id);


--
-- TOC entry 7658 (class 2606 OID 22633)
-- Name: service_definition_addon_provider_types service_definition_addon_provider_types_pkey; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.service_definition_addon_provider_types
    ADD CONSTRAINT service_definition_addon_provider_types_pkey PRIMARY KEY (id);


--
-- TOC entry 7231 (class 2606 OID 17919)
-- Name: service_faqs service_faqs_pkey; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.service_faqs
    ADD CONSTRAINT service_faqs_pkey PRIMARY KEY (id);


--
-- TOC entry 7227 (class 2606 OID 17903)
-- Name: service_included service_included_pkey; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.service_included
    ADD CONSTRAINT service_included_pkey PRIMARY KEY (id);


--
-- TOC entry 7229 (class 2606 OID 17911)
-- Name: service_process service_process_pkey; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.service_process
    ADD CONSTRAINT service_process_pkey PRIMARY KEY (id);


--
-- TOC entry 7689 (class 2606 OID 22860)
-- Name: provider_policy_types uq_provider_policy_types_code; Type: CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.provider_policy_types
    ADD CONSTRAINT uq_provider_policy_types_code UNIQUE (code);


--
-- TOC entry 7710 (class 2606 OID 23154)
-- Name: booking_charge_lines booking_charge_lines_pkey; Type: CONSTRAINT; Schema: commercial; Owner: postgres
--

ALTER TABLE ONLY commercial.booking_charge_lines
    ADD CONSTRAINT booking_charge_lines_pkey PRIMARY KEY (id);


--
-- TOC entry 7708 (class 2606 OID 23131)
-- Name: compensation_policies compensation_policies_pkey; Type: CONSTRAINT; Schema: commercial; Owner: postgres
--

ALTER TABLE ONLY commercial.compensation_policies
    ADD CONSTRAINT compensation_policies_pkey PRIMARY KEY (id);


--
-- TOC entry 7712 (class 2606 OID 23218)
-- Name: provider_ledgers provider_ledgers_pkey; Type: CONSTRAINT; Schema: commercial; Owner: postgres
--

ALTER TABLE ONLY commercial.provider_ledgers
    ADD CONSTRAINT provider_ledgers_pkey PRIMARY KEY (id);


--
-- TOC entry 7720 (class 2606 OID 23344)
-- Name: provider_settlement_reversals provider_settlement_reversals_pkey; Type: CONSTRAINT; Schema: commercial; Owner: postgres
--

ALTER TABLE ONLY commercial.provider_settlement_reversals
    ADD CONSTRAINT provider_settlement_reversals_pkey PRIMARY KEY (id);


--
-- TOC entry 7716 (class 2606 OID 23279)
-- Name: refund_lines refund_lines_pkey; Type: CONSTRAINT; Schema: commercial; Owner: postgres
--

ALTER TABLE ONLY commercial.refund_lines
    ADD CONSTRAINT refund_lines_pkey PRIMARY KEY (id);


--
-- TOC entry 7714 (class 2606 OID 23252)
-- Name: refund_requests refund_requests_pkey; Type: CONSTRAINT; Schema: commercial; Owner: postgres
--

ALTER TABLE ONLY commercial.refund_requests
    ADD CONSTRAINT refund_requests_pkey PRIMARY KEY (id);


--
-- TOC entry 7718 (class 2606 OID 23322)
-- Name: refunds refunds_pkey; Type: CONSTRAINT; Schema: commercial; Owner: postgres
--

ALTER TABLE ONLY commercial.refunds
    ADD CONSTRAINT refunds_pkey PRIMARY KEY (id);


--
-- TOC entry 7267 (class 2606 OID 19319)
-- Name: favorites favorites_pkey; Type: CONSTRAINT; Schema: customer; Owner: postgres
--

ALTER TABLE ONLY customer.favorites
    ADD CONSTRAINT favorites_pkey PRIMARY KEY (id);


--
-- TOC entry 7664 (class 2606 OID 22683)
-- Name: medical_profile_allergies medical_profile_allergies_pkey; Type: CONSTRAINT; Schema: customer; Owner: postgres
--

ALTER TABLE ONLY customer.medical_profile_allergies
    ADD CONSTRAINT medical_profile_allergies_pkey PRIMARY KEY (id);


--
-- TOC entry 7670 (class 2606 OID 22713)
-- Name: medical_profile_conditions medical_profile_conditions_pkey; Type: CONSTRAINT; Schema: customer; Owner: postgres
--

ALTER TABLE ONLY customer.medical_profile_conditions
    ADD CONSTRAINT medical_profile_conditions_pkey PRIMARY KEY (id);


--
-- TOC entry 7673 (class 2606 OID 22729)
-- Name: medical_profile_documents medical_profile_documents_pkey; Type: CONSTRAINT; Schema: customer; Owner: postgres
--

ALTER TABLE ONLY customer.medical_profile_documents
    ADD CONSTRAINT medical_profile_documents_pkey PRIMARY KEY (id);


--
-- TOC entry 7667 (class 2606 OID 22698)
-- Name: medical_profile_medications medical_profile_medications_pkey; Type: CONSTRAINT; Schema: customer; Owner: postgres
--

ALTER TABLE ONLY customer.medical_profile_medications
    ADD CONSTRAINT medical_profile_medications_pkey PRIMARY KEY (id);


--
-- TOC entry 7661 (class 2606 OID 22666)
-- Name: medical_profiles medical_profiles_pkey; Type: CONSTRAINT; Schema: customer; Owner: postgres
--

ALTER TABLE ONLY customer.medical_profiles
    ADD CONSTRAINT medical_profiles_pkey PRIMARY KEY (customer_id);


--
-- TOC entry 7103 (class 2606 OID 17035)
-- Name: __EFMigrationsHistory pk___ef_migrations_history; Type: CONSTRAINT; Schema: customer; Owner: postgres
--

ALTER TABLE ONLY customer."__EFMigrationsHistory"
    ADD CONSTRAINT pk___ef_migrations_history PRIMARY KEY (migration_id);


--
-- TOC entry 7105 (class 2606 OID 17037)
-- Name: consulting_selected_document_references pk_consulting_selected_document_references; Type: CONSTRAINT; Schema: customer; Owner: postgres
--

ALTER TABLE ONLY customer.consulting_selected_document_references
    ADD CONSTRAINT pk_consulting_selected_document_references PRIMARY KEY (consulting_id, customer_document_id);


--
-- TOC entry 7109 (class 2606 OID 17039)
-- Name: consultings pk_consultings; Type: CONSTRAINT; Schema: customer; Owner: postgres
--

ALTER TABLE ONLY customer.consultings
    ADD CONSTRAINT pk_consultings PRIMARY KEY (id);


--
-- TOC entry 7111 (class 2606 OID 17041)
-- Name: customer_document_types pk_customer_document_types; Type: CONSTRAINT; Schema: customer; Owner: postgres
--

ALTER TABLE ONLY customer.customer_document_types
    ADD CONSTRAINT pk_customer_document_types PRIMARY KEY (id);


--
-- TOC entry 7115 (class 2606 OID 17043)
-- Name: customer_documents pk_customer_documents; Type: CONSTRAINT; Schema: customer; Owner: postgres
--

ALTER TABLE ONLY customer.customer_documents
    ADD CONSTRAINT pk_customer_documents PRIMARY KEY (id);


--
-- TOC entry 7119 (class 2606 OID 17045)
-- Name: customers pk_customers; Type: CONSTRAINT; Schema: customer; Owner: postgres
--

ALTER TABLE ONLY customer.customers
    ADD CONSTRAINT pk_customers PRIMARY KEY (id);


--
-- TOC entry 7122 (class 2606 OID 17047)
-- Name: inbox_message_consumers pk_inbox_message_consumers; Type: CONSTRAINT; Schema: customer; Owner: postgres
--

ALTER TABLE ONLY customer.inbox_message_consumers
    ADD CONSTRAINT pk_inbox_message_consumers PRIMARY KEY (message_id, name);


--
-- TOC entry 7128 (class 2606 OID 17049)
-- Name: inbox_messages pk_inbox_messages; Type: CONSTRAINT; Schema: customer; Owner: postgres
--

ALTER TABLE ONLY customer.inbox_messages
    ADD CONSTRAINT pk_inbox_messages PRIMARY KEY (id);


--
-- TOC entry 7131 (class 2606 OID 17051)
-- Name: internal_command_message_consumers pk_internal_command_message_consumers; Type: CONSTRAINT; Schema: customer; Owner: postgres
--

ALTER TABLE ONLY customer.internal_command_message_consumers
    ADD CONSTRAINT pk_internal_command_message_consumers PRIMARY KEY (message_id, name);


--
-- TOC entry 7137 (class 2606 OID 17053)
-- Name: internal_command_messages pk_internal_command_messages; Type: CONSTRAINT; Schema: customer; Owner: postgres
--

ALTER TABLE ONLY customer.internal_command_messages
    ADD CONSTRAINT pk_internal_command_messages PRIMARY KEY (id);


--
-- TOC entry 7140 (class 2606 OID 17055)
-- Name: outbox_message_consumers pk_outbox_message_consumers; Type: CONSTRAINT; Schema: customer; Owner: postgres
--

ALTER TABLE ONLY customer.outbox_message_consumers
    ADD CONSTRAINT pk_outbox_message_consumers PRIMARY KEY (message_id, name);


--
-- TOC entry 7146 (class 2606 OID 17057)
-- Name: outbox_messages pk_outbox_messages; Type: CONSTRAINT; Schema: customer; Owner: postgres
--

ALTER TABLE ONLY customer.outbox_messages
    ADD CONSTRAINT pk_outbox_messages PRIMARY KEY (id);


--
-- TOC entry 7274 (class 2606 OID 19321)
-- Name: favorites uq_favorites_customer_type_entity; Type: CONSTRAINT; Schema: customer; Owner: postgres
--

ALTER TABLE ONLY customer.favorites
    ADD CONSTRAINT uq_favorites_customer_type_entity UNIQUE (customer_id, favorite_type, entity_id);


--
-- TOC entry 7370 (class 2606 OID 19857)
-- Name: wallet_accounts wallet_accounts_pkey; Type: CONSTRAINT; Schema: customer; Owner: postgres
--

ALTER TABLE ONLY customer.wallet_accounts
    ADD CONSTRAINT wallet_accounts_pkey PRIMARY KEY (id);


--
-- TOC entry 7372 (class 2606 OID 19859)
-- Name: wallet_accounts wallet_accounts_user_id_key; Type: CONSTRAINT; Schema: customer; Owner: postgres
--

ALTER TABLE ONLY customer.wallet_accounts
    ADD CONSTRAINT wallet_accounts_user_id_key UNIQUE (user_id);


--
-- TOC entry 7377 (class 2606 OID 19880)
-- Name: wallet_payment_intents wallet_payment_intents_pkey; Type: CONSTRAINT; Schema: customer; Owner: postgres
--

ALTER TABLE ONLY customer.wallet_payment_intents
    ADD CONSTRAINT wallet_payment_intents_pkey PRIMARY KEY (id);


--
-- TOC entry 7383 (class 2606 OID 19916)
-- Name: wallet_transactions wallet_transactions_pkey; Type: CONSTRAINT; Schema: customer; Owner: postgres
--

ALTER TABLE ONLY customer.wallet_transactions
    ADD CONSTRAINT wallet_transactions_pkey PRIMARY KEY (id);


--
-- TOC entry 7693 (class 2606 OID 22940)
-- Name: country_currency_defaults country_currency_defaults_pkey; Type: CONSTRAINT; Schema: finance; Owner: postgres
--

ALTER TABLE ONLY finance.country_currency_defaults
    ADD CONSTRAINT country_currency_defaults_pkey PRIMARY KEY (country_code);


--
-- TOC entry 7691 (class 2606 OID 22932)
-- Name: currencies currencies_pkey; Type: CONSTRAINT; Schema: finance; Owner: postgres
--

ALTER TABLE ONLY finance.currencies
    ADD CONSTRAINT currencies_pkey PRIMARY KEY (code);


--
-- TOC entry 7695 (class 2606 OID 22960)
-- Name: exchange_rates exchange_rates_pkey; Type: CONSTRAINT; Schema: finance; Owner: postgres
--

ALTER TABLE ONLY finance.exchange_rates
    ADD CONSTRAINT exchange_rates_pkey PRIMARY KEY (id);


--
-- TOC entry 7699 (class 2606 OID 22984)
-- Name: fx_margin_profiles fx_margin_profiles_pkey; Type: CONSTRAINT; Schema: finance; Owner: postgres
--

ALTER TABLE ONLY finance.fx_margin_profiles
    ADD CONSTRAINT fx_margin_profiles_pkey PRIMARY KEY (code);


--
-- TOC entry 7701 (class 2606 OID 22997)
-- Name: fx_pair_margins fx_pair_margins_pkey; Type: CONSTRAINT; Schema: finance; Owner: postgres
--

ALTER TABLE ONLY finance.fx_pair_margins
    ADD CONSTRAINT fx_pair_margins_pkey PRIMARY KEY (id);


--
-- TOC entry 7705 (class 2606 OID 23031)
-- Name: fx_quotes fx_quotes_pkey; Type: CONSTRAINT; Schema: finance; Owner: postgres
--

ALTER TABLE ONLY finance.fx_quotes
    ADD CONSTRAINT fx_quotes_pkey PRIMARY KEY (id);


--
-- TOC entry 7703 (class 2606 OID 22999)
-- Name: fx_pair_margins uq_finance_fx_pair_margins; Type: CONSTRAINT; Schema: finance; Owner: postgres
--

ALTER TABLE ONLY finance.fx_pair_margins
    ADD CONSTRAINT uq_finance_fx_pair_margins UNIQUE (profile_code, base_currency_code, quote_currency_code);


--
-- TOC entry 7640 (class 2606 OID 22342)
-- Name: field_conditions field_conditions_pkey; Type: CONSTRAINT; Schema: form_builder; Owner: postgres
--

ALTER TABLE ONLY form_builder.field_conditions
    ADD CONSTRAINT field_conditions_pkey PRIMARY KEY (id);


--
-- TOC entry 7636 (class 2606 OID 22321)
-- Name: field_options field_options_pkey; Type: CONSTRAINT; Schema: form_builder; Owner: postgres
--

ALTER TABLE ONLY form_builder.field_options
    ADD CONSTRAINT field_options_pkey PRIMARY KEY (id);


--
-- TOC entry 7617 (class 2606 OID 22209)
-- Name: field_types field_types_pkey; Type: CONSTRAINT; Schema: form_builder; Owner: postgres
--

ALTER TABLE ONLY form_builder.field_types
    ADD CONSTRAINT field_types_pkey PRIMARY KEY (code);


--
-- TOC entry 7632 (class 2606 OID 22286)
-- Name: form_fields form_fields_pkey; Type: CONSTRAINT; Schema: form_builder; Owner: postgres
--

ALTER TABLE ONLY form_builder.form_fields
    ADD CONSTRAINT form_fields_pkey PRIMARY KEY (id);


--
-- TOC entry 7628 (class 2606 OID 22261)
-- Name: form_sections form_sections_pkey; Type: CONSTRAINT; Schema: form_builder; Owner: postgres
--

ALTER TABLE ONLY form_builder.form_sections
    ADD CONSTRAINT form_sections_pkey PRIMARY KEY (id);


--
-- TOC entry 7623 (class 2606 OID 22241)
-- Name: form_versions form_versions_pkey; Type: CONSTRAINT; Schema: form_builder; Owner: postgres
--

ALTER TABLE ONLY form_builder.form_versions
    ADD CONSTRAINT form_versions_pkey PRIMARY KEY (id);


--
-- TOC entry 7619 (class 2606 OID 22225)
-- Name: forms forms_key_key; Type: CONSTRAINT; Schema: form_builder; Owner: postgres
--

ALTER TABLE ONLY form_builder.forms
    ADD CONSTRAINT forms_key_key UNIQUE (key);


--
-- TOC entry 7621 (class 2606 OID 22223)
-- Name: forms forms_pkey; Type: CONSTRAINT; Schema: form_builder; Owner: postgres
--

ALTER TABLE ONLY form_builder.forms
    ADD CONSTRAINT forms_pkey PRIMARY KEY (id);


--
-- TOC entry 7642 (class 2606 OID 22366)
-- Name: service_definition_forms service_definition_forms_pkey; Type: CONSTRAINT; Schema: form_builder; Owner: postgres
--

ALTER TABLE ONLY form_builder.service_definition_forms
    ADD CONSTRAINT service_definition_forms_pkey PRIMARY KEY (id);


--
-- TOC entry 7648 (class 2606 OID 22393)
-- Name: submissions submissions_pkey; Type: CONSTRAINT; Schema: form_builder; Owner: postgres
--

ALTER TABLE ONLY form_builder.submissions
    ADD CONSTRAINT submissions_pkey PRIMARY KEY (id);


--
-- TOC entry 7638 (class 2606 OID 22323)
-- Name: field_options uq_field_option_value; Type: CONSTRAINT; Schema: form_builder; Owner: postgres
--

ALTER TABLE ONLY form_builder.field_options
    ADD CONSTRAINT uq_field_option_value UNIQUE (field_id, value);


--
-- TOC entry 7634 (class 2606 OID 22288)
-- Name: form_fields uq_form_field_key; Type: CONSTRAINT; Schema: form_builder; Owner: postgres
--

ALTER TABLE ONLY form_builder.form_fields
    ADD CONSTRAINT uq_form_field_key UNIQUE (form_version_id, key);


--
-- TOC entry 7630 (class 2606 OID 22263)
-- Name: form_sections uq_form_section_key; Type: CONSTRAINT; Schema: form_builder; Owner: postgres
--

ALTER TABLE ONLY form_builder.form_sections
    ADD CONSTRAINT uq_form_section_key UNIQUE (form_version_id, key);


--
-- TOC entry 7625 (class 2606 OID 22243)
-- Name: form_versions uq_form_versions_form_version; Type: CONSTRAINT; Schema: form_builder; Owner: postgres
--

ALTER TABLE ONLY form_builder.form_versions
    ADD CONSTRAINT uq_form_versions_form_version UNIQUE (form_id, version_number);


--
-- TOC entry 7680 (class 2606 OID 22806)
-- Name: account_deletion_requests account_deletion_requests_pkey; Type: CONSTRAINT; Schema: identity; Owner: postgres
--

ALTER TABLE ONLY identity.account_deletion_requests
    ADD CONSTRAINT account_deletion_requests_pkey PRIMARY KEY (id);


--
-- TOC entry 7148 (class 2606 OID 17059)
-- Name: __EFMigrationsHistory pk___ef_migrations_history; Type: CONSTRAINT; Schema: identity; Owner: postgres
--

ALTER TABLE ONLY identity."__EFMigrationsHistory"
    ADD CONSTRAINT pk___ef_migrations_history PRIMARY KEY (migration_id);


--
-- TOC entry 7152 (class 2606 OID 17061)
-- Name: access_tokens pk_access_tokens; Type: CONSTRAINT; Schema: identity; Owner: postgres
--

ALTER TABLE ONLY identity.access_tokens
    ADD CONSTRAINT pk_access_tokens PRIMARY KEY (id);


--
-- TOC entry 7155 (class 2606 OID 17063)
-- Name: asp_net_role_claims pk_asp_net_role_claims; Type: CONSTRAINT; Schema: identity; Owner: postgres
--

ALTER TABLE ONLY identity.asp_net_role_claims
    ADD CONSTRAINT pk_asp_net_role_claims PRIMARY KEY (id);


--
-- TOC entry 7158 (class 2606 OID 17065)
-- Name: asp_net_roles pk_asp_net_roles; Type: CONSTRAINT; Schema: identity; Owner: postgres
--

ALTER TABLE ONLY identity.asp_net_roles
    ADD CONSTRAINT pk_asp_net_roles PRIMARY KEY (id);


--
-- TOC entry 7161 (class 2606 OID 17067)
-- Name: asp_net_user_claims pk_asp_net_user_claims; Type: CONSTRAINT; Schema: identity; Owner: postgres
--

ALTER TABLE ONLY identity.asp_net_user_claims
    ADD CONSTRAINT pk_asp_net_user_claims PRIMARY KEY (id);


--
-- TOC entry 7164 (class 2606 OID 17069)
-- Name: asp_net_user_logins pk_asp_net_user_logins; Type: CONSTRAINT; Schema: identity; Owner: postgres
--

ALTER TABLE ONLY identity.asp_net_user_logins
    ADD CONSTRAINT pk_asp_net_user_logins PRIMARY KEY (login_provider, provider_key);


--
-- TOC entry 7167 (class 2606 OID 17071)
-- Name: asp_net_user_roles pk_asp_net_user_roles; Type: CONSTRAINT; Schema: identity; Owner: postgres
--

ALTER TABLE ONLY identity.asp_net_user_roles
    ADD CONSTRAINT pk_asp_net_user_roles PRIMARY KEY (user_id, role_id);


--
-- TOC entry 7169 (class 2606 OID 17073)
-- Name: asp_net_user_tokens pk_asp_net_user_tokens; Type: CONSTRAINT; Schema: identity; Owner: postgres
--

ALTER TABLE ONLY identity.asp_net_user_tokens
    ADD CONSTRAINT pk_asp_net_user_tokens PRIMARY KEY (user_id, login_provider, name);


--
-- TOC entry 7175 (class 2606 OID 17075)
-- Name: asp_net_users pk_asp_net_users; Type: CONSTRAINT; Schema: identity; Owner: postgres
--

ALTER TABLE ONLY identity.asp_net_users
    ADD CONSTRAINT pk_asp_net_users PRIMARY KEY (id);


--
-- TOC entry 7177 (class 2606 OID 17077)
-- Name: email_verification_codes pk_email_verification_codes; Type: CONSTRAINT; Schema: identity; Owner: postgres
--

ALTER TABLE ONLY identity.email_verification_codes
    ADD CONSTRAINT pk_email_verification_codes PRIMARY KEY (id);


--
-- TOC entry 7180 (class 2606 OID 17079)
-- Name: inbox_message_consumers pk_inbox_message_consumers; Type: CONSTRAINT; Schema: identity; Owner: postgres
--

ALTER TABLE ONLY identity.inbox_message_consumers
    ADD CONSTRAINT pk_inbox_message_consumers PRIMARY KEY (message_id, name);


--
-- TOC entry 7186 (class 2606 OID 17081)
-- Name: inbox_messages pk_inbox_messages; Type: CONSTRAINT; Schema: identity; Owner: postgres
--

ALTER TABLE ONLY identity.inbox_messages
    ADD CONSTRAINT pk_inbox_messages PRIMARY KEY (id);


--
-- TOC entry 7189 (class 2606 OID 17083)
-- Name: internal_command_message_consumers pk_internal_command_message_consumers; Type: CONSTRAINT; Schema: identity; Owner: postgres
--

ALTER TABLE ONLY identity.internal_command_message_consumers
    ADD CONSTRAINT pk_internal_command_message_consumers PRIMARY KEY (message_id, name);


--
-- TOC entry 7195 (class 2606 OID 17085)
-- Name: internal_command_messages pk_internal_command_messages; Type: CONSTRAINT; Schema: identity; Owner: postgres
--

ALTER TABLE ONLY identity.internal_command_messages
    ADD CONSTRAINT pk_internal_command_messages PRIMARY KEY (id);


--
-- TOC entry 7198 (class 2606 OID 17087)
-- Name: outbox_message_consumers pk_outbox_message_consumers; Type: CONSTRAINT; Schema: identity; Owner: postgres
--

ALTER TABLE ONLY identity.outbox_message_consumers
    ADD CONSTRAINT pk_outbox_message_consumers PRIMARY KEY (message_id, name);


--
-- TOC entry 7204 (class 2606 OID 17089)
-- Name: outbox_messages pk_outbox_messages; Type: CONSTRAINT; Schema: identity; Owner: postgres
--

ALTER TABLE ONLY identity.outbox_messages
    ADD CONSTRAINT pk_outbox_messages PRIMARY KEY (id);


--
-- TOC entry 7206 (class 2606 OID 17091)
-- Name: password_reset_codes pk_password_reset_codes; Type: CONSTRAINT; Schema: identity; Owner: postgres
--

ALTER TABLE ONLY identity.password_reset_codes
    ADD CONSTRAINT pk_password_reset_codes PRIMARY KEY (id);


--
-- TOC entry 7211 (class 2606 OID 17093)
-- Name: phone_login_codes pk_phone_login_codes; Type: CONSTRAINT; Schema: identity; Owner: postgres
--

ALTER TABLE ONLY identity.phone_login_codes
    ADD CONSTRAINT pk_phone_login_codes PRIMARY KEY (id);


--
-- TOC entry 7215 (class 2606 OID 17095)
-- Name: refresh_tokens pk_refresh_tokens; Type: CONSTRAINT; Schema: identity; Owner: postgres
--

ALTER TABLE ONLY identity.refresh_tokens
    ADD CONSTRAINT pk_refresh_tokens PRIMARY KEY (id);


--
-- TOC entry 7345 (class 2606 OID 19705)
-- Name: user_preferences pk_user_preferences; Type: CONSTRAINT; Schema: identity; Owner: postgres
--

ALTER TABLE ONLY identity.user_preferences
    ADD CONSTRAINT pk_user_preferences PRIMARY KEY (user_id);


--
-- TOC entry 7684 (class 2606 OID 22829)
-- Name: user_security_settings user_security_settings_pkey; Type: CONSTRAINT; Schema: identity; Owner: postgres
--

ALTER TABLE ONLY identity.user_security_settings
    ADD CONSTRAINT user_security_settings_pkey PRIMARY KEY (user_id);


--
-- TOC entry 7677 (class 2606 OID 22785)
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: identity; Owner: postgres
--

ALTER TABLE ONLY identity.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- TOC entry 7351 (class 2606 OID 19754)
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: loyalty; Owner: postgres
--

ALTER TABLE ONLY loyalty.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (customer_id);


--
-- TOC entry 7353 (class 2606 OID 19756)
-- Name: accounts accounts_referral_code_key; Type: CONSTRAINT; Schema: loyalty; Owner: postgres
--

ALTER TABLE ONLY loyalty.accounts
    ADD CONSTRAINT accounts_referral_code_key UNIQUE (referral_code);


--
-- TOC entry 7361 (class 2606 OID 19818)
-- Name: coupons coupons_code_key; Type: CONSTRAINT; Schema: loyalty; Owner: postgres
--

ALTER TABLE ONLY loyalty.coupons
    ADD CONSTRAINT coupons_code_key UNIQUE (code);


--
-- TOC entry 7363 (class 2606 OID 19816)
-- Name: coupons coupons_pkey; Type: CONSTRAINT; Schema: loyalty; Owner: postgres
--

ALTER TABLE ONLY loyalty.coupons
    ADD CONSTRAINT coupons_pkey PRIMARY KEY (id);


--
-- TOC entry 7365 (class 2606 OID 19835)
-- Name: customer_coupons customer_coupons_customer_id_coupon_id_key; Type: CONSTRAINT; Schema: loyalty; Owner: postgres
--

ALTER TABLE ONLY loyalty.customer_coupons
    ADD CONSTRAINT customer_coupons_customer_id_coupon_id_key UNIQUE (customer_id, coupon_id);


--
-- TOC entry 7367 (class 2606 OID 19833)
-- Name: customer_coupons customer_coupons_pkey; Type: CONSTRAINT; Schema: loyalty; Owner: postgres
--

ALTER TABLE ONLY loyalty.customer_coupons
    ADD CONSTRAINT customer_coupons_pkey PRIMARY KEY (id);


--
-- TOC entry 7356 (class 2606 OID 19776)
-- Name: ledger ledger_pkey; Type: CONSTRAINT; Schema: loyalty; Owner: postgres
--

ALTER TABLE ONLY loyalty.ledger
    ADD CONSTRAINT ledger_pkey PRIMARY KEY (id);


--
-- TOC entry 7359 (class 2606 OID 19794)
-- Name: referrals referrals_pkey; Type: CONSTRAINT; Schema: loyalty; Owner: postgres
--

ALTER TABLE ONLY loyalty.referrals
    ADD CONSTRAINT referrals_pkey PRIMARY KEY (id);


--
-- TOC entry 7347 (class 2606 OID 19744)
-- Name: tiers tiers_name_key; Type: CONSTRAINT; Schema: loyalty; Owner: postgres
--

ALTER TABLE ONLY loyalty.tiers
    ADD CONSTRAINT tiers_name_key UNIQUE (name);


--
-- TOC entry 7349 (class 2606 OID 19742)
-- Name: tiers tiers_pkey; Type: CONSTRAINT; Schema: loyalty; Owner: postgres
--

ALTER TABLE ONLY loyalty.tiers
    ADD CONSTRAINT tiers_pkey PRIMARY KEY (id);


--
-- TOC entry 7254 (class 2606 OID 18506)
-- Name: offers offers_pkey; Type: CONSTRAINT; Schema: marketing; Owner: postgres
--

ALTER TABLE ONLY marketing.offers
    ADD CONSTRAINT offers_pkey PRIMARY KEY (id);


--
-- TOC entry 7545 (class 2606 OID 21280)
-- Name: referral_codes referral_codes_code_key; Type: CONSTRAINT; Schema: marketing; Owner: postgres
--

ALTER TABLE ONLY marketing.referral_codes
    ADD CONSTRAINT referral_codes_code_key UNIQUE (code);


--
-- TOC entry 7547 (class 2606 OID 21278)
-- Name: referral_codes referral_codes_pkey; Type: CONSTRAINT; Schema: marketing; Owner: postgres
--

ALTER TABLE ONLY marketing.referral_codes
    ADD CONSTRAINT referral_codes_pkey PRIMARY KEY (id);


--
-- TOC entry 7553 (class 2606 OID 21303)
-- Name: referral_invitations referral_invitations_pkey; Type: CONSTRAINT; Schema: marketing; Owner: postgres
--

ALTER TABLE ONLY marketing.referral_invitations
    ADD CONSTRAINT referral_invitations_pkey PRIMARY KEY (id);


--
-- TOC entry 7537 (class 2606 OID 21250)
-- Name: referral_programs referral_programs_code_key; Type: CONSTRAINT; Schema: marketing; Owner: postgres
--

ALTER TABLE ONLY marketing.referral_programs
    ADD CONSTRAINT referral_programs_code_key UNIQUE (code);


--
-- TOC entry 7539 (class 2606 OID 21248)
-- Name: referral_programs referral_programs_pkey; Type: CONSTRAINT; Schema: marketing; Owner: postgres
--

ALTER TABLE ONLY marketing.referral_programs
    ADD CONSTRAINT referral_programs_pkey PRIMARY KEY (id);


--
-- TOC entry 7542 (class 2606 OID 21265)
-- Name: referral_reward_rules referral_reward_rules_pkey; Type: CONSTRAINT; Schema: marketing; Owner: postgres
--

ALTER TABLE ONLY marketing.referral_reward_rules
    ADD CONSTRAINT referral_reward_rules_pkey PRIMARY KEY (id);


--
-- TOC entry 7562 (class 2606 OID 21372)
-- Name: referral_share_events referral_share_events_pkey; Type: CONSTRAINT; Schema: marketing; Owner: postgres
--

ALTER TABLE ONLY marketing.referral_share_events
    ADD CONSTRAINT referral_share_events_pkey PRIMARY KEY (id);


--
-- TOC entry 7549 (class 2606 OID 21282)
-- Name: referral_codes uq_referral_codes_program_customer; Type: CONSTRAINT; Schema: marketing; Owner: postgres
--

ALTER TABLE ONLY marketing.referral_codes
    ADD CONSTRAINT uq_referral_codes_program_customer UNIQUE (program_id, customer_id);


--
-- TOC entry 7557 (class 2606 OID 21342)
-- Name: user_discount_coupons user_discount_coupons_code_key; Type: CONSTRAINT; Schema: marketing; Owner: postgres
--

ALTER TABLE ONLY marketing.user_discount_coupons
    ADD CONSTRAINT user_discount_coupons_code_key UNIQUE (code);


--
-- TOC entry 7559 (class 2606 OID 21340)
-- Name: user_discount_coupons user_discount_coupons_pkey; Type: CONSTRAINT; Schema: marketing; Owner: postgres
--

ALTER TABLE ONLY marketing.user_discount_coupons
    ADD CONSTRAINT user_discount_coupons_pkey PRIMARY KEY (id);


--
-- TOC entry 7335 (class 2606 OID 19634)
-- Name: media_library media_library_pkey; Type: CONSTRAINT; Schema: media; Owner: postgres
--

ALTER TABLE ONLY media.media_library
    ADD CONSTRAINT media_library_pkey PRIMARY KEY (id);


--
-- TOC entry 7340 (class 2606 OID 19677)
-- Name: media_type media_type_pkey; Type: CONSTRAINT; Schema: media; Owner: postgres
--

ALTER TABLE ONLY media.media_type
    ADD CONSTRAINT media_type_pkey PRIMARY KEY (id);


--
-- TOC entry 7338 (class 2606 OID 19668)
-- Name: sponsered_slider sponsered_slider_pkey; Type: CONSTRAINT; Schema: media; Owner: postgres
--

ALTER TABLE ONLY media.sponsered_slider
    ADD CONSTRAINT sponsered_slider_pkey PRIMARY KEY (id);


--
-- TOC entry 7411 (class 2606 OID 20152)
-- Name: notification_deliveries notification_deliveries_pkey; Type: CONSTRAINT; Schema: notify; Owner: postgres
--

ALTER TABLE ONLY notify.notification_deliveries
    ADD CONSTRAINT notification_deliveries_pkey PRIMARY KEY (id);


--
-- TOC entry 7407 (class 2606 OID 20136)
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: notify; Owner: postgres
--

ALTER TABLE ONLY notify.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- TOC entry 7574 (class 2606 OID 21914)
-- Name: form_definitions form_definitions_pkey; Type: CONSTRAINT; Schema: provider_portal; Owner: postgres
--

ALTER TABLE ONLY provider_portal.form_definitions
    ADD CONSTRAINT form_definitions_pkey PRIMARY KEY (id);


--
-- TOC entry 7576 (class 2606 OID 21916)
-- Name: form_definitions form_definitions_provider_type_id_code_version_key; Type: CONSTRAINT; Schema: provider_portal; Owner: postgres
--

ALTER TABLE ONLY provider_portal.form_definitions
    ADD CONSTRAINT form_definitions_provider_type_id_code_version_key UNIQUE (provider_type_id, code, version);


--
-- TOC entry 7584 (class 2606 OID 21966)
-- Name: form_field_options form_field_options_form_field_id_option_value_key; Type: CONSTRAINT; Schema: provider_portal; Owner: postgres
--

ALTER TABLE ONLY provider_portal.form_field_options
    ADD CONSTRAINT form_field_options_form_field_id_option_value_key UNIQUE (form_field_id, option_value);


--
-- TOC entry 7586 (class 2606 OID 21964)
-- Name: form_field_options form_field_options_pkey; Type: CONSTRAINT; Schema: provider_portal; Owner: postgres
--

ALTER TABLE ONLY provider_portal.form_field_options
    ADD CONSTRAINT form_field_options_pkey PRIMARY KEY (id);


--
-- TOC entry 7579 (class 2606 OID 21946)
-- Name: form_fields form_fields_form_definition_id_field_key_key; Type: CONSTRAINT; Schema: provider_portal; Owner: postgres
--

ALTER TABLE ONLY provider_portal.form_fields
    ADD CONSTRAINT form_fields_form_definition_id_field_key_key UNIQUE (form_definition_id, field_key);


--
-- TOC entry 7581 (class 2606 OID 21944)
-- Name: form_fields form_fields_pkey; Type: CONSTRAINT; Schema: provider_portal; Owner: postgres
--

ALTER TABLE ONLY provider_portal.form_fields
    ADD CONSTRAINT form_fields_pkey PRIMARY KEY (id);


--
-- TOC entry 7597 (class 2606 OID 22015)
-- Name: onboarding_applications onboarding_applications_application_number_key; Type: CONSTRAINT; Schema: provider_portal; Owner: postgres
--

ALTER TABLE ONLY provider_portal.onboarding_applications
    ADD CONSTRAINT onboarding_applications_application_number_key UNIQUE (application_number);


--
-- TOC entry 7599 (class 2606 OID 22013)
-- Name: onboarding_applications onboarding_applications_pkey; Type: CONSTRAINT; Schema: provider_portal; Owner: postgres
--

ALTER TABLE ONLY provider_portal.onboarding_applications
    ADD CONSTRAINT onboarding_applications_pkey PRIMARY KEY (id);


--
-- TOC entry 7602 (class 2606 OID 22062)
-- Name: onboarding_documents onboarding_documents_pkey; Type: CONSTRAINT; Schema: provider_portal; Owner: postgres
--

ALTER TABLE ONLY provider_portal.onboarding_documents
    ADD CONSTRAINT onboarding_documents_pkey PRIMARY KEY (id);


--
-- TOC entry 7613 (class 2606 OID 22158)
-- Name: payout_accounts payout_accounts_pkey; Type: CONSTRAINT; Schema: provider_portal; Owner: postgres
--

ALTER TABLE ONLY provider_portal.payout_accounts
    ADD CONSTRAINT payout_accounts_pkey PRIMARY KEY (id);


--
-- TOC entry 7615 (class 2606 OID 22179)
-- Name: portal_invoices portal_invoices_pkey; Type: CONSTRAINT; Schema: provider_portal; Owner: postgres
--

ALTER TABLE ONLY provider_portal.portal_invoices
    ADD CONSTRAINT portal_invoices_pkey PRIMARY KEY (id);


--
-- TOC entry 7570 (class 2606 OID 21891)
-- Name: portal_sections portal_sections_pkey; Type: CONSTRAINT; Schema: provider_portal; Owner: postgres
--

ALTER TABLE ONLY provider_portal.portal_sections
    ADD CONSTRAINT portal_sections_pkey PRIMARY KEY (id);


--
-- TOC entry 7572 (class 2606 OID 21893)
-- Name: portal_sections portal_sections_provider_type_id_section_key_key; Type: CONSTRAINT; Schema: provider_portal; Owner: postgres
--

ALTER TABLE ONLY provider_portal.portal_sections
    ADD CONSTRAINT portal_sections_provider_type_id_section_key_key UNIQUE (provider_type_id, section_key);


--
-- TOC entry 7591 (class 2606 OID 21985)
-- Name: provider_members provider_members_pkey; Type: CONSTRAINT; Schema: provider_portal; Owner: postgres
--

ALTER TABLE ONLY provider_portal.provider_members
    ADD CONSTRAINT provider_members_pkey PRIMARY KEY (id);


--
-- TOC entry 7593 (class 2606 OID 21987)
-- Name: provider_members provider_members_service_provider_id_user_id_key; Type: CONSTRAINT; Schema: provider_portal; Owner: postgres
--

ALTER TABLE ONLY provider_portal.provider_members
    ADD CONSTRAINT provider_members_service_provider_id_user_id_key UNIQUE (service_provider_id, user_id);


--
-- TOC entry 7604 (class 2606 OID 22088)
-- Name: provider_operating_hours provider_operating_hours_pkey; Type: CONSTRAINT; Schema: provider_portal; Owner: postgres
--

ALTER TABLE ONLY provider_portal.provider_operating_hours
    ADD CONSTRAINT provider_operating_hours_pkey PRIMARY KEY (id);


--
-- TOC entry 7606 (class 2606 OID 22090)
-- Name: provider_operating_hours provider_operating_hours_service_provider_id_day_of_week_key; Type: CONSTRAINT; Schema: provider_portal; Owner: postgres
--

ALTER TABLE ONLY provider_portal.provider_operating_hours
    ADD CONSTRAINT provider_operating_hours_service_provider_id_day_of_week_key UNIQUE (service_provider_id, day_of_week);


--
-- TOC entry 7608 (class 2606 OID 22106)
-- Name: provider_service_addon_settings provider_service_addon_settings_pkey; Type: CONSTRAINT; Schema: provider_portal; Owner: postgres
--

ALTER TABLE ONLY provider_portal.provider_service_addon_settings
    ADD CONSTRAINT provider_service_addon_settings_pkey PRIMARY KEY (provider_service_id, addon_id);


--
-- TOC entry 7565 (class 2606 OID 21869)
-- Name: provider_type_catalog provider_type_catalog_code_key; Type: CONSTRAINT; Schema: provider_portal; Owner: postgres
--

ALTER TABLE ONLY provider_portal.provider_type_catalog
    ADD CONSTRAINT provider_type_catalog_code_key UNIQUE (code);


--
-- TOC entry 7567 (class 2606 OID 21867)
-- Name: provider_type_catalog provider_type_catalog_pkey; Type: CONSTRAINT; Schema: provider_portal; Owner: postgres
--

ALTER TABLE ONLY provider_portal.provider_type_catalog
    ADD CONSTRAINT provider_type_catalog_pkey PRIMARY KEY (provider_type_id);


--
-- TOC entry 7611 (class 2606 OID 22129)
-- Name: support_tickets support_tickets_pkey; Type: CONSTRAINT; Schema: provider_portal; Owner: postgres
--

ALTER TABLE ONLY provider_portal.support_tickets
    ADD CONSTRAINT support_tickets_pkey PRIMARY KEY (id);


--
-- TOC entry 7218 (class 2606 OID 17097)
-- Name: translation_audit translation_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.translation_audit
    ADD CONSTRAINT translation_audit_pkey PRIMARY KEY (id);


--
-- TOC entry 7250 (class 2606 OID 18414)
-- Name: user_search_history user_search_history_pkey; Type: CONSTRAINT; Schema: search; Owner: postgres
--

ALTER TABLE ONLY search.user_search_history
    ADD CONSTRAINT user_search_history_pkey PRIMARY KEY (id);


--
-- TOC entry 7480 (class 2606 OID 20716)
-- Name: abandoned_carts abandoned_carts_cart_id_key; Type: CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.abandoned_carts
    ADD CONSTRAINT abandoned_carts_cart_id_key UNIQUE (cart_id);


--
-- TOC entry 7482 (class 2606 OID 20714)
-- Name: abandoned_carts abandoned_carts_pkey; Type: CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.abandoned_carts
    ADD CONSTRAINT abandoned_carts_pkey PRIMARY KEY (id);


--
-- TOC entry 7484 (class 2606 OID 20718)
-- Name: abandoned_carts abandoned_carts_recovery_token_key; Type: CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.abandoned_carts
    ADD CONSTRAINT abandoned_carts_recovery_token_key UNIQUE (recovery_token);


--
-- TOC entry 7440 (class 2606 OID 20473)
-- Name: attribute_values attribute_values_pkey; Type: CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.attribute_values
    ADD CONSTRAINT attribute_values_pkey PRIMARY KEY (id);


--
-- TOC entry 7436 (class 2606 OID 20461)
-- Name: attributes attributes_pkey; Type: CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.attributes
    ADD CONSTRAINT attributes_pkey PRIMARY KEY (id);


--
-- TOC entry 7438 (class 2606 OID 20463)
-- Name: attributes attributes_slug_key; Type: CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.attributes
    ADD CONSTRAINT attributes_slug_key UNIQUE (slug);


--
-- TOC entry 7413 (class 2606 OID 20349)
-- Name: brands brands_pkey; Type: CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.brands
    ADD CONSTRAINT brands_pkey PRIMARY KEY (id);


--
-- TOC entry 7415 (class 2606 OID 20351)
-- Name: brands brands_slug_key; Type: CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.brands
    ADD CONSTRAINT brands_slug_key UNIQUE (slug);


--
-- TOC entry 7478 (class 2606 OID 20689)
-- Name: cart_items cart_items_pkey; Type: CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);


--
-- TOC entry 7476 (class 2606 OID 20670)
-- Name: carts carts_pkey; Type: CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.carts
    ADD CONSTRAINT carts_pkey PRIMARY KEY (id);


--
-- TOC entry 7417 (class 2606 OID 20367)
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- TOC entry 7419 (class 2606 OID 20369)
-- Name: categories categories_slug_key; Type: CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.categories
    ADD CONSTRAINT categories_slug_key UNIQUE (slug);


--
-- TOC entry 7535 (class 2606 OID 21144)
-- Name: compare_list_items compare_list_items_pkey; Type: CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.compare_list_items
    ADD CONSTRAINT compare_list_items_pkey PRIMARY KEY (id);


--
-- TOC entry 7533 (class 2606 OID 21131)
-- Name: compare_lists compare_lists_pkey; Type: CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.compare_lists
    ADD CONSTRAINT compare_lists_pkey PRIMARY KEY (id);


--
-- TOC entry 7490 (class 2606 OID 20757)
-- Name: coupon_redemptions coupon_redemptions_pkey; Type: CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.coupon_redemptions
    ADD CONSTRAINT coupon_redemptions_pkey PRIMARY KEY (id);


--
-- TOC entry 7486 (class 2606 OID 20747)
-- Name: coupons coupons_code_key; Type: CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.coupons
    ADD CONSTRAINT coupons_code_key UNIQUE (code);


--
-- TOC entry 7488 (class 2606 OID 20745)
-- Name: coupons coupons_pkey; Type: CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.coupons
    ADD CONSTRAINT coupons_pkey PRIMARY KEY (id);


--
-- TOC entry 7466 (class 2606 OID 20613)
-- Name: customer_addresses customer_addresses_pkey; Type: CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.customer_addresses
    ADD CONSTRAINT customer_addresses_pkey PRIMARY KEY (id);


--
-- TOC entry 7468 (class 2606 OID 20637)
-- Name: delivery_methods delivery_methods_code_key; Type: CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.delivery_methods
    ADD CONSTRAINT delivery_methods_code_key UNIQUE (code);


--
-- TOC entry 7470 (class 2606 OID 20635)
-- Name: delivery_methods delivery_methods_pkey; Type: CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.delivery_methods
    ADD CONSTRAINT delivery_methods_pkey PRIMARY KEY (id);


--
-- TOC entry 7464 (class 2606 OID 20596)
-- Name: inventory_movements inventory_movements_pkey; Type: CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.inventory_movements
    ADD CONSTRAINT inventory_movements_pkey PRIMARY KEY (id);


--
-- TOC entry 7461 (class 2606 OID 20572)
-- Name: inventory inventory_pkey; Type: CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.inventory
    ADD CONSTRAINT inventory_pkey PRIMARY KEY (id);


--
-- TOC entry 7500 (class 2606 OID 20829)
-- Name: order_addresses order_addresses_pkey; Type: CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.order_addresses
    ADD CONSTRAINT order_addresses_pkey PRIMARY KEY (id);


--
-- TOC entry 7502 (class 2606 OID 20851)
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- TOC entry 7504 (class 2606 OID 20875)
-- Name: order_status_history order_status_history_pkey; Type: CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.order_status_history
    ADD CONSTRAINT order_status_history_pkey PRIMARY KEY (id);


--
-- TOC entry 7496 (class 2606 OID 20810)
-- Name: orders orders_order_number_key; Type: CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.orders
    ADD CONSTRAINT orders_order_number_key UNIQUE (order_number);


--
-- TOC entry 7498 (class 2606 OID 20808)
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- TOC entry 7472 (class 2606 OID 20657)
-- Name: payment_methods payment_methods_code_key; Type: CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.payment_methods
    ADD CONSTRAINT payment_methods_code_key UNIQUE (code);


--
-- TOC entry 7474 (class 2606 OID 20655)
-- Name: payment_methods payment_methods_pkey; Type: CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.payment_methods
    ADD CONSTRAINT payment_methods_pkey PRIMARY KEY (id);


--
-- TOC entry 7506 (class 2606 OID 20895)
-- Name: payment_transactions payment_transactions_pkey; Type: CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.payment_transactions
    ADD CONSTRAINT payment_transactions_pkey PRIMARY KEY (id);


--
-- TOC entry 7492 (class 2606 OID 20787)
-- Name: pricing_rules pricing_rules_pkey; Type: CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.pricing_rules
    ADD CONSTRAINT pricing_rules_pkey PRIMARY KEY (id);


--
-- TOC entry 7444 (class 2606 OID 20487)
-- Name: product_attributes product_attributes_pkey; Type: CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.product_attributes
    ADD CONSTRAINT product_attributes_pkey PRIMARY KEY (product_id, attribute_id);


--
-- TOC entry 7430 (class 2606 OID 20419)
-- Name: product_categories product_categories_pkey; Type: CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.product_categories
    ADD CONSTRAINT product_categories_pkey PRIMARY KEY (product_id, category_id);


--
-- TOC entry 7434 (class 2606 OID 20443)
-- Name: product_media product_media_pkey; Type: CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.product_media
    ADD CONSTRAINT product_media_pkey PRIMARY KEY (id);


--
-- TOC entry 7529 (class 2606 OID 21092)
-- Name: product_questions product_questions_pkey; Type: CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.product_questions
    ADD CONSTRAINT product_questions_pkey PRIMARY KEY (id);


--
-- TOC entry 7527 (class 2606 OID 21066)
-- Name: product_reviews product_reviews_pkey; Type: CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.product_reviews
    ADD CONSTRAINT product_reviews_pkey PRIMARY KEY (id);


--
-- TOC entry 7447 (class 2606 OID 20513)
-- Name: product_variants product_variants_pkey; Type: CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.product_variants
    ADD CONSTRAINT product_variants_pkey PRIMARY KEY (id);


--
-- TOC entry 7449 (class 2606 OID 20515)
-- Name: product_variants product_variants_sku_key; Type: CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.product_variants
    ADD CONSTRAINT product_variants_sku_key UNIQUE (sku);


--
-- TOC entry 7426 (class 2606 OID 20400)
-- Name: products products_pkey; Type: CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- TOC entry 7428 (class 2606 OID 20402)
-- Name: products products_slug_key; Type: CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.products
    ADD CONSTRAINT products_slug_key UNIQUE (slug);


--
-- TOC entry 7531 (class 2606 OID 21111)
-- Name: recently_viewed_products recently_viewed_products_pkey; Type: CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.recently_viewed_products
    ADD CONSTRAINT recently_viewed_products_pkey PRIMARY KEY (id);


--
-- TOC entry 7518 (class 2606 OID 21003)
-- Name: refunds refunds_pkey; Type: CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.refunds
    ADD CONSTRAINT refunds_pkey PRIMARY KEY (id);


--
-- TOC entry 7516 (class 2606 OID 20981)
-- Name: return_items return_items_pkey; Type: CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.return_items
    ADD CONSTRAINT return_items_pkey PRIMARY KEY (id);


--
-- TOC entry 7514 (class 2606 OID 20962)
-- Name: return_requests return_requests_pkey; Type: CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.return_requests
    ADD CONSTRAINT return_requests_pkey PRIMARY KEY (id);


--
-- TOC entry 7512 (class 2606 OID 20940)
-- Name: shipment_items shipment_items_pkey; Type: CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.shipment_items
    ADD CONSTRAINT shipment_items_pkey PRIMARY KEY (id);


--
-- TOC entry 7508 (class 2606 OID 20916)
-- Name: shipments shipments_pkey; Type: CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.shipments
    ADD CONSTRAINT shipments_pkey PRIMARY KEY (id);


--
-- TOC entry 7510 (class 2606 OID 20918)
-- Name: shipments shipments_shipment_number_key; Type: CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.shipments
    ADD CONSTRAINT shipments_shipment_number_key UNIQUE (shipment_number);


--
-- TOC entry 7442 (class 2606 OID 20475)
-- Name: attribute_values uq_shop_attribute_values; Type: CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.attribute_values
    ADD CONSTRAINT uq_shop_attribute_values UNIQUE (attribute_id, value);


--
-- TOC entry 7451 (class 2606 OID 20519)
-- Name: product_variants uq_shop_product_variants_option_key; Type: CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.product_variants
    ADD CONSTRAINT uq_shop_product_variants_option_key UNIQUE (product_id, option_key);


--
-- TOC entry 7453 (class 2606 OID 20517)
-- Name: product_variants uq_shop_product_variants_slug; Type: CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.product_variants
    ADD CONSTRAINT uq_shop_product_variants_slug UNIQUE (slug);


--
-- TOC entry 7520 (class 2606 OID 21026)
-- Name: wishlists uq_shop_wishlists_customer_name; Type: CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.wishlists
    ADD CONSTRAINT uq_shop_wishlists_customer_name UNIQUE (customer_id, name);


--
-- TOC entry 7455 (class 2606 OID 20529)
-- Name: variant_attribute_values variant_attribute_values_pkey; Type: CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.variant_attribute_values
    ADD CONSTRAINT variant_attribute_values_pkey PRIMARY KEY (variant_id, attribute_id);


--
-- TOC entry 7457 (class 2606 OID 20557)
-- Name: warehouses warehouses_code_key; Type: CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.warehouses
    ADD CONSTRAINT warehouses_code_key UNIQUE (code);


--
-- TOC entry 7459 (class 2606 OID 20555)
-- Name: warehouses warehouses_pkey; Type: CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.warehouses
    ADD CONSTRAINT warehouses_pkey PRIMARY KEY (id);


--
-- TOC entry 7524 (class 2606 OID 21038)
-- Name: wishlist_items wishlist_items_pkey; Type: CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.wishlist_items
    ADD CONSTRAINT wishlist_items_pkey PRIMARY KEY (id);


--
-- TOC entry 7522 (class 2606 OID 21024)
-- Name: wishlists wishlists_pkey; Type: CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.wishlists
    ADD CONSTRAINT wishlists_pkey PRIMARY KEY (id);


--
-- TOC entry 7319 (class 1259 OID 19589)
-- Name: ix_role_table_permissions_lookup; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX ix_role_table_permissions_lookup ON auth.role_table_permissions USING btree (role_id, schema_name, table_name);


--
-- TOC entry 7396 (class 1259 OID 20054)
-- Name: ix_booking_addons_booking_id; Type: INDEX; Schema: booking; Owner: postgres
--

CREATE INDEX ix_booking_addons_booking_id ON booking.booking_addons USING btree (booking_id);


--
-- TOC entry 7236 (class 1259 OID 19296)
-- Name: ix_booking_bookings_provider_service_specialist_selected_date; Type: INDEX; Schema: booking; Owner: postgres
--

CREATE INDEX ix_booking_bookings_provider_service_specialist_selected_date ON booking.bookings USING btree (provider_id, service_id, specialist_id, selected_date);


--
-- TOC entry 7237 (class 1259 OID 19295)
-- Name: ix_booking_bookings_provider_specialist_selected_date; Type: INDEX; Schema: booking; Owner: postgres
--

CREATE INDEX ix_booking_bookings_provider_specialist_selected_date ON booking.bookings USING btree (provider_id, specialist_id, selected_date);


--
-- TOC entry 7655 (class 1259 OID 22870)
-- Name: ix_booking_child_bookings_parent_booking_id_status; Type: INDEX; Schema: booking; Owner: postgres
--

CREATE INDEX ix_booking_child_bookings_parent_booking_id_status ON booking.booking_child_bookings USING btree (parent_booking_id, status);


--
-- TOC entry 7399 (class 1259 OID 20069)
-- Name: ix_booking_documents_booking_id; Type: INDEX; Schema: booking; Owner: postgres
--

CREATE INDEX ix_booking_documents_booking_id ON booking.booking_documents USING btree (booking_id);


--
-- TOC entry 7393 (class 1259 OID 20031)
-- Name: ix_booking_draft_documents_draft_id; Type: INDEX; Schema: booking; Owner: postgres
--

CREATE INDEX ix_booking_draft_documents_draft_id ON booking.booking_draft_documents USING btree (draft_id);


--
-- TOC entry 7386 (class 1259 OID 19995)
-- Name: ix_booking_drafts_provider_service_specialist; Type: INDEX; Schema: booking; Owner: postgres
--

CREATE INDEX ix_booking_drafts_provider_service_specialist ON booking.booking_drafts USING btree (provider_id, service_id, specialist_id);


--
-- TOC entry 7387 (class 1259 OID 19994)
-- Name: ix_booking_drafts_user_status; Type: INDEX; Schema: booking; Owner: postgres
--

CREATE INDEX ix_booking_drafts_user_status ON booking.booking_drafts USING btree (user_id, status, updated_at DESC);


--
-- TOC entry 7238 (class 1259 OID 19953)
-- Name: ix_bookings_payment_reference; Type: INDEX; Schema: booking; Owner: postgres
--

CREATE INDEX ix_bookings_payment_reference ON booking.bookings USING btree (payment_reference);


--
-- TOC entry 7239 (class 1259 OID 19952)
-- Name: ix_bookings_wallet_payment_intent_id; Type: INDEX; Schema: booking; Owner: postgres
--

CREATE INDEX ix_bookings_wallet_payment_intent_id ON booking.bookings USING btree (wallet_payment_intent_id);


--
-- TOC entry 7400 (class 1259 OID 20088)
-- Name: ix_payments_booking_id; Type: INDEX; Schema: booking; Owner: postgres
--

CREATE INDEX ix_payments_booking_id ON booking.payments USING btree (booking_id);


--
-- TOC entry 7656 (class 1259 OID 22647)
-- Name: ux_booking_child_one_per_provider_type; Type: INDEX; Schema: booking; Owner: postgres
--

CREATE UNIQUE INDEX ux_booking_child_one_per_provider_type ON booking.booking_child_bookings USING btree (parent_booking_id, provider_type_id);


--
-- TOC entry 7651 (class 1259 OID 22646)
-- Name: ux_booking_draft_child_one_per_provider_type; Type: INDEX; Schema: booking; Owner: postgres
--

CREATE UNIQUE INDEX ux_booking_draft_child_one_per_provider_type ON booking.booking_draft_child_bookings USING btree (parent_draft_id, provider_type_id);


--
-- TOC entry 7652 (class 1259 OID 22559)
-- Name: ux_booking_draft_child_one_provider_type; Type: INDEX; Schema: booking; Owner: postgres
--

CREATE UNIQUE INDEX ux_booking_draft_child_one_provider_type ON booking.booking_draft_child_bookings USING btree (parent_draft_id, provider_type_id);


--
-- TOC entry 7388 (class 1259 OID 22648)
-- Name: ux_booking_drafts_one_active_per_user; Type: INDEX; Schema: booking; Owner: postgres
--

CREATE UNIQUE INDEX ux_booking_drafts_one_active_per_user ON booking.booking_drafts USING btree (user_id) WHERE ((status)::text = ANY ((ARRAY['Draft'::character varying, 'InProgress'::character varying])::text[]));


--
-- TOC entry 7242 (class 1259 OID 19366)
-- Name: ux_bookings_one_pending_checkout_per_user; Type: INDEX; Schema: booking; Owner: postgres
--

CREATE UNIQUE INDEX ux_bookings_one_pending_checkout_per_user ON booking.bookings USING btree (user_id) WHERE ((booking_status)::text = 'Pending'::text);


--
-- TOC entry 7243 (class 1259 OID 22657)
-- Name: ux_bookings_source_draft_id; Type: INDEX; Schema: booking; Owner: postgres
--

CREATE UNIQUE INDEX ux_bookings_source_draft_id ON booking.bookings USING btree (source_draft_id) WHERE (source_draft_id IS NOT NULL);


--
-- TOC entry 6979 (class 1259 OID 17098)
-- Name: idx_inbox_messages_occurred_on; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX idx_inbox_messages_occurred_on ON category.inbox_messages USING btree (occurred_on_utc);


--
-- TOC entry 6980 (class 1259 OID 17099)
-- Name: idx_inbox_messages_processed_occurred; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX idx_inbox_messages_processed_occurred ON category.inbox_messages USING btree (processed_on_utc, occurred_on_utc);


--
-- TOC entry 6981 (class 1259 OID 17100)
-- Name: idx_inbox_messages_processed_on; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX idx_inbox_messages_processed_on ON category.inbox_messages USING btree (processed_on_utc);


--
-- TOC entry 6982 (class 1259 OID 17101)
-- Name: idx_inbox_messages_unprocessed; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX idx_inbox_messages_unprocessed ON category.inbox_messages USING btree (occurred_on_utc, processed_on_utc) INCLUDE (id, type, content) WHERE (processed_on_utc IS NULL);


--
-- TOC entry 6988 (class 1259 OID 17102)
-- Name: idx_internal_command_messages_occurred_on; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX idx_internal_command_messages_occurred_on ON category.internal_command_messages USING btree (occurred_on_utc);


--
-- TOC entry 6989 (class 1259 OID 17103)
-- Name: idx_internal_command_messages_processed_occurred; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX idx_internal_command_messages_processed_occurred ON category.internal_command_messages USING btree (processed_on_utc, occurred_on_utc);


--
-- TOC entry 6990 (class 1259 OID 17104)
-- Name: idx_internal_command_messages_processed_on; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX idx_internal_command_messages_processed_on ON category.internal_command_messages USING btree (processed_on_utc);


--
-- TOC entry 6991 (class 1259 OID 17105)
-- Name: idx_internal_command_messages_unprocessed; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX idx_internal_command_messages_unprocessed ON category.internal_command_messages USING btree (occurred_on_utc, processed_on_utc) INCLUDE (id, type, content) WHERE (processed_on_utc IS NULL);


--
-- TOC entry 7004 (class 1259 OID 17106)
-- Name: idx_outbox_messages_occurred_on; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX idx_outbox_messages_occurred_on ON category.outbox_messages USING btree (occurred_on_utc);


--
-- TOC entry 7005 (class 1259 OID 17107)
-- Name: idx_outbox_messages_processed_occurred; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX idx_outbox_messages_processed_occurred ON category.outbox_messages USING btree (processed_on_utc, occurred_on_utc);


--
-- TOC entry 7006 (class 1259 OID 17108)
-- Name: idx_outbox_messages_processed_on; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX idx_outbox_messages_processed_on ON category.outbox_messages USING btree (processed_on_utc);


--
-- TOC entry 7007 (class 1259 OID 17109)
-- Name: idx_outbox_messages_unprocessed; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX idx_outbox_messages_unprocessed ON category.outbox_messages USING btree (occurred_on_utc, processed_on_utc) INCLUDE (id, type, content) WHERE (processed_on_utc IS NULL);


--
-- TOC entry 7029 (class 1259 OID 18403)
-- Name: idx_provider_services_search; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX idx_provider_services_search ON category.provider_services USING gin (search_vector);


--
-- TOC entry 7074 (class 1259 OID 18404)
-- Name: idx_providers_search; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX idx_providers_search ON category.service_providers USING gin (search_vector);


--
-- TOC entry 6976 (class 1259 OID 17110)
-- Name: inbox_message_consumers_message_id_name; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX inbox_message_consumers_message_id_name ON category.inbox_message_consumers USING btree (message_id, name);


--
-- TOC entry 6985 (class 1259 OID 17111)
-- Name: internal_command_message_consumers_message_id_name; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX internal_command_message_consumers_message_id_name ON category.internal_command_message_consumers USING btree (message_id, name);


--
-- TOC entry 7257 (class 1259 OID 18573)
-- Name: ix_addon_details_addon_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_addon_details_addon_id ON category.addon_details USING btree (addon_id);


--
-- TOC entry 6970 (class 1259 OID 22873)
-- Name: ix_categories_name_translations_trgm; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_categories_name_translations_trgm ON category.categories USING gin (((name_translations)::text) public.gin_trgm_ops);


--
-- TOC entry 6971 (class 1259 OID 17112)
-- Name: ix_categories_parent_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_categories_parent_id ON category.categories USING btree (parent_id);


--
-- TOC entry 6994 (class 1259 OID 17113)
-- Name: ix_locations_code; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_locations_code ON category.locations USING btree (code);


--
-- TOC entry 6995 (class 1259 OID 17114)
-- Name: ix_locations_location_type_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_locations_location_type_id ON category.locations USING btree (location_type_id);


--
-- TOC entry 6996 (class 1259 OID 17115)
-- Name: ix_locations_parent_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_locations_parent_id ON category.locations USING btree (parent_id);


--
-- TOC entry 7012 (class 1259 OID 17116)
-- Name: ix_provider_attribute_definitions_attribute_type_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_provider_attribute_definitions_attribute_type_id ON category.provider_attribute_definitions USING btree (attribute_type_id);


--
-- TOC entry 7013 (class 1259 OID 17117)
-- Name: ix_provider_attribute_definitions_provider_type_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_provider_attribute_definitions_provider_type_id ON category.provider_attribute_definitions USING btree (provider_type_id);


--
-- TOC entry 7016 (class 1259 OID 17118)
-- Name: ix_provider_attributes_attribute_definition_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_provider_attributes_attribute_definition_id ON category.provider_attributes USING btree (attribute_definition_id);


--
-- TOC entry 7017 (class 1259 OID 17119)
-- Name: ix_provider_attributes_service_provider_id_attribute_definitio; Type: INDEX; Schema: category; Owner: postgres
--

CREATE UNIQUE INDEX ix_provider_attributes_service_provider_id_attribute_definitio ON category.provider_attributes USING btree (service_provider_id, attribute_definition_id);


--
-- TOC entry 7020 (class 1259 OID 17120)
-- Name: ix_provider_gallery_items_display_order; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_provider_gallery_items_display_order ON category.provider_gallery_items USING btree (display_order);


--
-- TOC entry 7021 (class 1259 OID 17121)
-- Name: ix_provider_gallery_items_service_provider_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_provider_gallery_items_service_provider_id ON category.provider_gallery_items USING btree (service_provider_id);


--
-- TOC entry 7300 (class 1259 OID 19481)
-- Name: ix_provider_languages_service_provider_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_provider_languages_service_provider_id ON category.provider_languages USING btree (service_provider_id);


--
-- TOC entry 7024 (class 1259 OID 22867)
-- Name: ix_provider_policies_policy_type_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_provider_policies_policy_type_id ON category.provider_policies USING btree (provider_policy_type_id);


--
-- TOC entry 7025 (class 1259 OID 17122)
-- Name: ix_provider_policies_service_provider_id_type_translations; Type: INDEX; Schema: category; Owner: postgres
--

CREATE UNIQUE INDEX ix_provider_policies_service_provider_id_type_translations ON category.provider_policies USING btree (service_provider_id, type_translations);


--
-- TOC entry 7026 (class 1259 OID 17123)
-- Name: ix_provider_policies_type_translations; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_provider_policies_type_translations ON category.provider_policies USING btree (type_translations);


--
-- TOC entry 7685 (class 1259 OID 22866)
-- Name: ix_provider_policy_types_active_order; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_provider_policy_types_active_order ON category.provider_policy_types USING btree (is_active, display_order);


--
-- TOC entry 7308 (class 1259 OID 19526)
-- Name: ix_provider_service_gallery_items_display_order; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_provider_service_gallery_items_display_order ON category.provider_service_gallery_items USING btree (provider_service_id, display_order);


--
-- TOC entry 7309 (class 1259 OID 19525)
-- Name: ix_provider_service_gallery_items_service_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_provider_service_gallery_items_service_id ON category.provider_service_gallery_items USING btree (provider_service_id);


--
-- TOC entry 7030 (class 1259 OID 17124)
-- Name: ix_provider_services_is_active; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_provider_services_is_active ON category.provider_services USING btree (is_active);


--
-- TOC entry 7031 (class 1259 OID 17125)
-- Name: ix_provider_services_service_definition_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_provider_services_service_definition_id ON category.provider_services USING btree (service_definition_id);


--
-- TOC entry 7032 (class 1259 OID 17126)
-- Name: ix_provider_services_service_provider_id_service_definition_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE UNIQUE INDEX ix_provider_services_service_provider_id_service_definition_id ON category.provider_services USING btree (service_provider_id, service_definition_id);


--
-- TOC entry 7035 (class 1259 OID 17127)
-- Name: ix_provider_staffs_is_active; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_provider_staffs_is_active ON category.provider_staffs USING btree (is_active);


--
-- TOC entry 7036 (class 1259 OID 17128)
-- Name: ix_provider_staffs_service_provider_id_staff_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE UNIQUE INDEX ix_provider_staffs_service_provider_id_staff_id ON category.provider_staffs USING btree (service_provider_id, staff_id);


--
-- TOC entry 7037 (class 1259 OID 17129)
-- Name: ix_provider_staffs_staff_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_provider_staffs_staff_id ON category.provider_staffs USING btree (staff_id);


--
-- TOC entry 7260 (class 1259 OID 18574)
-- Name: ix_psa_addon_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_psa_addon_id ON category.provider_service_addons USING btree (addon_id);


--
-- TOC entry 7221 (class 1259 OID 19466)
-- Name: ix_review_images_review_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_review_images_review_id ON category.review_images USING btree (review_id);


--
-- TOC entry 7054 (class 1259 OID 22872)
-- Name: ix_sd_description_translations_trgm; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_sd_description_translations_trgm ON category.service_definitions USING gin (((description_translations)::text) public.gin_trgm_ops);


--
-- TOC entry 7055 (class 1259 OID 22871)
-- Name: ix_sd_name_translations_trgm; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_sd_name_translations_trgm ON category.service_definitions USING gin (((name_translations)::text) public.gin_trgm_ops);


--
-- TOC entry 7044 (class 1259 OID 17130)
-- Name: ix_service_attribute_definitions_attribute_type_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_service_attribute_definitions_attribute_type_id ON category.service_attribute_definitions USING btree (attribute_type_id);


--
-- TOC entry 7045 (class 1259 OID 17131)
-- Name: ix_service_attribute_definitions_service_definition_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_service_attribute_definitions_service_definition_id ON category.service_attribute_definitions USING btree (service_definition_id);


--
-- TOC entry 7048 (class 1259 OID 17132)
-- Name: ix_service_attribute_values_attribute_definition_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_service_attribute_values_attribute_definition_id ON category.service_attribute_values USING btree (attribute_definition_id);


--
-- TOC entry 7049 (class 1259 OID 17133)
-- Name: ix_service_attribute_values_provider_service_id_attribute_defi; Type: INDEX; Schema: category; Owner: postgres
--

CREATE UNIQUE INDEX ix_service_attribute_values_provider_service_id_attribute_defi ON category.service_attribute_values USING btree (provider_service_id, attribute_definition_id);


--
-- TOC entry 7056 (class 1259 OID 17134)
-- Name: ix_service_definitions_category_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_service_definitions_category_id ON category.service_definitions USING btree (category_id);


--
-- TOC entry 7059 (class 1259 OID 17135)
-- Name: ix_service_provider_comments_create_date; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_service_provider_comments_create_date ON category.service_provider_comments USING btree (create_date);


--
-- TOC entry 7060 (class 1259 OID 17136)
-- Name: ix_service_provider_comments_customer_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_service_provider_comments_customer_id ON category.service_provider_comments USING btree (customer_id);


--
-- TOC entry 7061 (class 1259 OID 17137)
-- Name: ix_service_provider_comments_service_provider_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_service_provider_comments_service_provider_id ON category.service_provider_comments USING btree (service_provider_id);


--
-- TOC entry 7062 (class 1259 OID 17138)
-- Name: ix_service_provider_comments_service_provider_id_is_public; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_service_provider_comments_service_provider_id_is_public ON category.service_provider_comments USING btree (service_provider_id, is_public);


--
-- TOC entry 7069 (class 1259 OID 17139)
-- Name: ix_service_provider_requests_customer_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_service_provider_requests_customer_id ON category.service_provider_requests USING btree (customer_id);


--
-- TOC entry 7070 (class 1259 OID 17140)
-- Name: ix_service_provider_requests_request_status_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_service_provider_requests_request_status_id ON category.service_provider_requests USING btree (request_status_id);


--
-- TOC entry 7071 (class 1259 OID 17141)
-- Name: ix_service_provider_requests_service_provider_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_service_provider_requests_service_provider_id ON category.service_provider_requests USING btree (service_provider_id);


--
-- TOC entry 7075 (class 1259 OID 17142)
-- Name: ix_service_providers_country_city; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_service_providers_country_city ON category.service_providers USING btree (country, city);


--
-- TOC entry 7076 (class 1259 OID 17143)
-- Name: ix_service_providers_grade_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_service_providers_grade_id ON category.service_providers USING btree (grade_id);


--
-- TOC entry 7077 (class 1259 OID 17144)
-- Name: ix_service_providers_grade_id_provider_type_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_service_providers_grade_id_provider_type_id ON category.service_providers USING btree (grade_id, provider_type_id);


--
-- TOC entry 7078 (class 1259 OID 17145)
-- Name: ix_service_providers_grade_id_provider_type_id_country_city; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_service_providers_grade_id_provider_type_id_country_city ON category.service_providers USING btree (grade_id, provider_type_id, country, city);


--
-- TOC entry 7079 (class 1259 OID 17146)
-- Name: ix_service_providers_is_active; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_service_providers_is_active ON category.service_providers USING btree (is_active);


--
-- TOC entry 7080 (class 1259 OID 17147)
-- Name: ix_service_providers_name_translations; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_service_providers_name_translations ON category.service_providers USING btree (name_translations);


--
-- TOC entry 7081 (class 1259 OID 22874)
-- Name: ix_service_providers_name_translations_trgm; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_service_providers_name_translations_trgm ON category.service_providers USING gin (((name_translations)::text) public.gin_trgm_ops);


--
-- TOC entry 7082 (class 1259 OID 17148)
-- Name: ix_service_providers_provider_type_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_service_providers_provider_type_id ON category.service_providers USING btree (provider_type_id);


--
-- TOC entry 7083 (class 1259 OID 17149)
-- Name: ix_service_providers_provider_type_id_country_city; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_service_providers_provider_type_id_country_city ON category.service_providers USING btree (provider_type_id, country, city);


--
-- TOC entry 7292 (class 1259 OID 19441)
-- Name: ix_staff_achievements_staff_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_staff_achievements_staff_id ON category.staff_achievements USING btree (staff_id);


--
-- TOC entry 7293 (class 1259 OID 19442)
-- Name: ix_staff_achievements_staff_id_display_order; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_staff_achievements_staff_id_display_order ON category.staff_achievements USING btree (staff_id, display_order);


--
-- TOC entry 7089 (class 1259 OID 17150)
-- Name: ix_staff_availabilities_availability_status_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_staff_availabilities_availability_status_id ON category.staff_availabilities USING btree (availability_status_id);


--
-- TOC entry 7090 (class 1259 OID 17151)
-- Name: ix_staff_availabilities_staff_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_staff_availabilities_staff_id ON category.staff_availabilities USING btree (staff_id);


--
-- TOC entry 7091 (class 1259 OID 17152)
-- Name: ix_staff_availabilities_staff_id_day_of_week; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_staff_availabilities_staff_id_day_of_week ON category.staff_availabilities USING btree (staff_id, day_of_week);


--
-- TOC entry 7092 (class 1259 OID 19294)
-- Name: ix_staff_availabilities_staff_id_specific_date; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_staff_availabilities_staff_id_specific_date ON category.staff_availabilities USING btree (staff_id, specific_date) WHERE (specific_date IS NOT NULL);


--
-- TOC entry 7296 (class 1259 OID 19459)
-- Name: ix_staff_before_after_staff_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_staff_before_after_staff_id ON category.staff_before_after USING btree (staff_id);


--
-- TOC entry 7297 (class 1259 OID 19460)
-- Name: ix_staff_before_after_staff_id_display_order; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_staff_before_after_staff_id_display_order ON category.staff_before_after USING btree (staff_id, display_order);


--
-- TOC entry 7289 (class 1259 OID 19424)
-- Name: ix_staff_certifications_staff_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_staff_certifications_staff_id ON category.staff_certifications USING btree (staff_id);


--
-- TOC entry 7263 (class 1259 OID 18592)
-- Name: ix_staff_credentials_staff_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_staff_credentials_staff_id ON category.staff_credentials USING btree (staff_id);


--
-- TOC entry 7285 (class 1259 OID 19408)
-- Name: ix_staff_education_staff_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_staff_education_staff_id ON category.staff_education USING btree (staff_id);


--
-- TOC entry 7286 (class 1259 OID 19409)
-- Name: ix_staff_education_staff_id_year; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_staff_education_staff_id_year ON category.staff_education USING btree (staff_id, year DESC);


--
-- TOC entry 7303 (class 1259 OID 19504)
-- Name: ix_staff_gallery_items_display_order; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_staff_gallery_items_display_order ON category.staff_gallery_items USING btree (staff_id, display_order);


--
-- TOC entry 7304 (class 1259 OID 19503)
-- Name: ix_staff_gallery_items_staff_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_staff_gallery_items_staff_id ON category.staff_gallery_items USING btree (staff_id);


--
-- TOC entry 7279 (class 1259 OID 19380)
-- Name: ix_staff_languages_staff_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_staff_languages_staff_id ON category.staff_languages USING btree (staff_id);


--
-- TOC entry 7086 (class 1259 OID 22875)
-- Name: ix_staff_name_translations_trgm; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_staff_name_translations_trgm ON category.staff USING gin (((name_translations)::text) public.gin_trgm_ops);


--
-- TOC entry 7097 (class 1259 OID 19293)
-- Name: ix_staff_services_service_definition_id_staff_id_active; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_staff_services_service_definition_id_staff_id_active ON category.staff_services USING btree (service_definition_id, staff_id) WHERE (is_active = true);


--
-- TOC entry 7098 (class 1259 OID 17153)
-- Name: ix_staff_services_staff_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_staff_services_staff_id ON category.staff_services USING btree (staff_id);


--
-- TOC entry 7099 (class 1259 OID 17154)
-- Name: ix_staff_services_staff_id_service_definition_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE UNIQUE INDEX ix_staff_services_staff_id_service_definition_id ON category.staff_services USING btree (staff_id, service_definition_id);


--
-- TOC entry 7282 (class 1259 OID 19394)
-- Name: ix_staff_specializations_staff_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_staff_specializations_staff_id ON category.staff_specializations USING btree (staff_id);


--
-- TOC entry 7275 (class 1259 OID 19361)
-- Name: ix_sufr_service_definition_id; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_sufr_service_definition_id ON category.service_upload_file_requirements USING btree (service_definition_id);


--
-- TOC entry 7276 (class 1259 OID 19362)
-- Name: ix_sufr_service_definition_id_display_order; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX ix_sufr_service_definition_id_display_order ON category.service_upload_file_requirements USING btree (service_definition_id, display_order);


--
-- TOC entry 7001 (class 1259 OID 17155)
-- Name: outbox_message_consumers_message_id_name; Type: INDEX; Schema: category; Owner: postgres
--

CREATE INDEX outbox_message_consumers_message_id_name ON category.outbox_message_consumers USING btree (message_id, name);


--
-- TOC entry 6999 (class 1259 OID 17156)
-- Name: ux_locations_city_parent_code; Type: INDEX; Schema: category; Owner: postgres
--

CREATE UNIQUE INDEX ux_locations_city_parent_code ON category.locations USING btree (parent_id, code) WHERE (location_type_id = 2);


--
-- TOC entry 7000 (class 1259 OID 17157)
-- Name: ux_locations_country_code; Type: INDEX; Schema: category; Owner: postgres
--

CREATE UNIQUE INDEX ux_locations_country_code ON category.locations USING btree (code) WHERE (location_type_id = 1);


--
-- TOC entry 7312 (class 1259 OID 19527)
-- Name: ux_provider_service_gallery_items_one_primary; Type: INDEX; Schema: category; Owner: postgres
--

CREATE UNIQUE INDEX ux_provider_service_gallery_items_one_primary ON category.provider_service_gallery_items USING btree (provider_service_id) WHERE (is_primary = true);


--
-- TOC entry 7307 (class 1259 OID 19505)
-- Name: ux_staff_gallery_items_one_primary; Type: INDEX; Schema: category; Owner: postgres
--

CREATE UNIQUE INDEX ux_staff_gallery_items_one_primary ON category.staff_gallery_items USING btree (staff_id) WHERE (is_primary = true);


--
-- TOC entry 7123 (class 1259 OID 17158)
-- Name: idx_inbox_messages_occurred_on; Type: INDEX; Schema: customer; Owner: postgres
--

CREATE INDEX idx_inbox_messages_occurred_on ON customer.inbox_messages USING btree (occurred_on_utc);


--
-- TOC entry 7124 (class 1259 OID 17159)
-- Name: idx_inbox_messages_processed_occurred; Type: INDEX; Schema: customer; Owner: postgres
--

CREATE INDEX idx_inbox_messages_processed_occurred ON customer.inbox_messages USING btree (processed_on_utc, occurred_on_utc);


--
-- TOC entry 7125 (class 1259 OID 17160)
-- Name: idx_inbox_messages_processed_on; Type: INDEX; Schema: customer; Owner: postgres
--

CREATE INDEX idx_inbox_messages_processed_on ON customer.inbox_messages USING btree (processed_on_utc);


--
-- TOC entry 7126 (class 1259 OID 17161)
-- Name: idx_inbox_messages_unprocessed; Type: INDEX; Schema: customer; Owner: postgres
--

CREATE INDEX idx_inbox_messages_unprocessed ON customer.inbox_messages USING btree (occurred_on_utc, processed_on_utc) INCLUDE (id, type, content) WHERE (processed_on_utc IS NULL);


--
-- TOC entry 7132 (class 1259 OID 17162)
-- Name: idx_internal_command_messages_occurred_on; Type: INDEX; Schema: customer; Owner: postgres
--

CREATE INDEX idx_internal_command_messages_occurred_on ON customer.internal_command_messages USING btree (occurred_on_utc);


--
-- TOC entry 7133 (class 1259 OID 17163)
-- Name: idx_internal_command_messages_processed_occurred; Type: INDEX; Schema: customer; Owner: postgres
--

CREATE INDEX idx_internal_command_messages_processed_occurred ON customer.internal_command_messages USING btree (processed_on_utc, occurred_on_utc);


--
-- TOC entry 7134 (class 1259 OID 17164)
-- Name: idx_internal_command_messages_processed_on; Type: INDEX; Schema: customer; Owner: postgres
--

CREATE INDEX idx_internal_command_messages_processed_on ON customer.internal_command_messages USING btree (processed_on_utc);


--
-- TOC entry 7135 (class 1259 OID 17165)
-- Name: idx_internal_command_messages_unprocessed; Type: INDEX; Schema: customer; Owner: postgres
--

CREATE INDEX idx_internal_command_messages_unprocessed ON customer.internal_command_messages USING btree (occurred_on_utc, processed_on_utc) INCLUDE (id, type, content) WHERE (processed_on_utc IS NULL);


--
-- TOC entry 7141 (class 1259 OID 17166)
-- Name: idx_outbox_messages_occurred_on; Type: INDEX; Schema: customer; Owner: postgres
--

CREATE INDEX idx_outbox_messages_occurred_on ON customer.outbox_messages USING btree (occurred_on_utc);


--
-- TOC entry 7142 (class 1259 OID 17167)
-- Name: idx_outbox_messages_processed_occurred; Type: INDEX; Schema: customer; Owner: postgres
--

CREATE INDEX idx_outbox_messages_processed_occurred ON customer.outbox_messages USING btree (processed_on_utc, occurred_on_utc);


--
-- TOC entry 7143 (class 1259 OID 17168)
-- Name: idx_outbox_messages_processed_on; Type: INDEX; Schema: customer; Owner: postgres
--

CREATE INDEX idx_outbox_messages_processed_on ON customer.outbox_messages USING btree (processed_on_utc);


--
-- TOC entry 7144 (class 1259 OID 17169)
-- Name: idx_outbox_messages_unprocessed; Type: INDEX; Schema: customer; Owner: postgres
--

CREATE INDEX idx_outbox_messages_unprocessed ON customer.outbox_messages USING btree (occurred_on_utc, processed_on_utc) INCLUDE (id, type, content) WHERE (processed_on_utc IS NULL);


--
-- TOC entry 7120 (class 1259 OID 17170)
-- Name: inbox_message_consumers_message_id_name; Type: INDEX; Schema: customer; Owner: postgres
--

CREATE INDEX inbox_message_consumers_message_id_name ON customer.inbox_message_consumers USING btree (message_id, name);


--
-- TOC entry 7129 (class 1259 OID 17171)
-- Name: internal_command_message_consumers_message_id_name; Type: INDEX; Schema: customer; Owner: postgres
--

CREATE INDEX internal_command_message_consumers_message_id_name ON customer.internal_command_message_consumers USING btree (message_id, name);


--
-- TOC entry 7106 (class 1259 OID 17172)
-- Name: ix_consultings_category_id; Type: INDEX; Schema: customer; Owner: postgres
--

CREATE INDEX ix_consultings_category_id ON customer.consultings USING btree (category_id);


--
-- TOC entry 7107 (class 1259 OID 17173)
-- Name: ix_consultings_customer_id; Type: INDEX; Schema: customer; Owner: postgres
--

CREATE INDEX ix_consultings_customer_id ON customer.consultings USING btree (customer_id);


--
-- TOC entry 7112 (class 1259 OID 17174)
-- Name: ix_customer_documents_customer_id; Type: INDEX; Schema: customer; Owner: postgres
--

CREATE INDEX ix_customer_documents_customer_id ON customer.customer_documents USING btree (customer_id);


--
-- TOC entry 7113 (class 1259 OID 17175)
-- Name: ix_customer_documents_document_type_id; Type: INDEX; Schema: customer; Owner: postgres
--

CREATE INDEX ix_customer_documents_document_type_id ON customer.customer_documents USING btree (document_type_id);


--
-- TOC entry 7116 (class 1259 OID 17176)
-- Name: ix_customers_email; Type: INDEX; Schema: customer; Owner: postgres
--

CREATE UNIQUE INDEX ix_customers_email ON customer.customers USING btree (email);


--
-- TOC entry 7117 (class 1259 OID 17177)
-- Name: ix_customers_phone_number_phone_number_country_code; Type: INDEX; Schema: customer; Owner: postgres
--

CREATE UNIQUE INDEX ix_customers_phone_number_phone_number_country_code ON customer.customers USING btree (phone_number, phone_number_country_code);


--
-- TOC entry 7268 (class 1259 OID 21176)
-- Name: ix_favorites_customer_created_at; Type: INDEX; Schema: customer; Owner: postgres
--

CREATE INDEX ix_favorites_customer_created_at ON customer.favorites USING btree (customer_id, created_at DESC);


--
-- TOC entry 7269 (class 1259 OID 19327)
-- Name: ix_favorites_customer_id; Type: INDEX; Schema: customer; Owner: postgres
--

CREATE INDEX ix_favorites_customer_id ON customer.favorites USING btree (customer_id);


--
-- TOC entry 7270 (class 1259 OID 19328)
-- Name: ix_favorites_customer_type; Type: INDEX; Schema: customer; Owner: postgres
--

CREATE INDEX ix_favorites_customer_type ON customer.favorites USING btree (customer_id, favorite_type);


--
-- TOC entry 7271 (class 1259 OID 21177)
-- Name: ix_favorites_customer_type_created_at; Type: INDEX; Schema: customer; Owner: postgres
--

CREATE INDEX ix_favorites_customer_type_created_at ON customer.favorites USING btree (customer_id, favorite_type, created_at DESC);


--
-- TOC entry 7272 (class 1259 OID 19329)
-- Name: ix_favorites_entity; Type: INDEX; Schema: customer; Owner: postgres
--

CREATE INDEX ix_favorites_entity ON customer.favorites USING btree (entity_id);


--
-- TOC entry 7662 (class 1259 OID 22751)
-- Name: ix_medical_profile_allergies_customer_created; Type: INDEX; Schema: customer; Owner: postgres
--

CREATE INDEX ix_medical_profile_allergies_customer_created ON customer.medical_profile_allergies USING btree (customer_id, create_date DESC);


--
-- TOC entry 7668 (class 1259 OID 22753)
-- Name: ix_medical_profile_conditions_customer_created; Type: INDEX; Schema: customer; Owner: postgres
--

CREATE INDEX ix_medical_profile_conditions_customer_created ON customer.medical_profile_conditions USING btree (customer_id, create_date DESC);


--
-- TOC entry 7671 (class 1259 OID 22754)
-- Name: ix_medical_profile_documents_customer_created; Type: INDEX; Schema: customer; Owner: postgres
--

CREATE INDEX ix_medical_profile_documents_customer_created ON customer.medical_profile_documents USING btree (customer_id, create_date DESC) WHERE (is_archived = false);


--
-- TOC entry 7665 (class 1259 OID 22752)
-- Name: ix_medical_profile_medications_customer_created; Type: INDEX; Schema: customer; Owner: postgres
--

CREATE INDEX ix_medical_profile_medications_customer_created ON customer.medical_profile_medications USING btree (customer_id, create_date DESC);


--
-- TOC entry 7659 (class 1259 OID 22750)
-- Name: ix_medical_profiles_customer; Type: INDEX; Schema: customer; Owner: postgres
--

CREATE INDEX ix_medical_profiles_customer ON customer.medical_profiles USING btree (customer_id);


--
-- TOC entry 7373 (class 1259 OID 19898)
-- Name: ix_wallet_payment_intents_booking; Type: INDEX; Schema: customer; Owner: postgres
--

CREATE INDEX ix_wallet_payment_intents_booking ON customer.wallet_payment_intents USING btree (booking_id);


--
-- TOC entry 7374 (class 1259 OID 19896)
-- Name: ix_wallet_payment_intents_user_created; Type: INDEX; Schema: customer; Owner: postgres
--

CREATE INDEX ix_wallet_payment_intents_user_created ON customer.wallet_payment_intents USING btree (user_id, create_date DESC);


--
-- TOC entry 7375 (class 1259 OID 19897)
-- Name: ix_wallet_payment_intents_wallet_status; Type: INDEX; Schema: customer; Owner: postgres
--

CREATE INDEX ix_wallet_payment_intents_wallet_status ON customer.wallet_payment_intents USING btree (wallet_account_id, status);


--
-- TOC entry 7378 (class 1259 OID 19939)
-- Name: ix_wallet_transactions_booking; Type: INDEX; Schema: customer; Owner: postgres
--

CREATE INDEX ix_wallet_transactions_booking ON customer.wallet_transactions USING btree (booking_id);


--
-- TOC entry 7379 (class 1259 OID 19940)
-- Name: ix_wallet_transactions_payment_intent; Type: INDEX; Schema: customer; Owner: postgres
--

CREATE INDEX ix_wallet_transactions_payment_intent ON customer.wallet_transactions USING btree (payment_intent_id);


--
-- TOC entry 7380 (class 1259 OID 19937)
-- Name: ix_wallet_transactions_user_occurred; Type: INDEX; Schema: customer; Owner: postgres
--

CREATE INDEX ix_wallet_transactions_user_occurred ON customer.wallet_transactions USING btree (user_id, occurred_at DESC);


--
-- TOC entry 7381 (class 1259 OID 19938)
-- Name: ix_wallet_transactions_wallet_currency; Type: INDEX; Schema: customer; Owner: postgres
--

CREATE INDEX ix_wallet_transactions_wallet_currency ON customer.wallet_transactions USING btree (wallet_account_id, currency_code);


--
-- TOC entry 7138 (class 1259 OID 17178)
-- Name: outbox_message_consumers_message_id_name; Type: INDEX; Schema: customer; Owner: postgres
--

CREATE INDEX outbox_message_consumers_message_id_name ON customer.outbox_message_consumers USING btree (message_id, name);


--
-- TOC entry 7696 (class 1259 OID 22972)
-- Name: ix_finance_exchange_rates_pair_as_of; Type: INDEX; Schema: finance; Owner: postgres
--

CREATE INDEX ix_finance_exchange_rates_pair_as_of ON finance.exchange_rates USING btree (base_currency_code, quote_currency_code, as_of DESC);


--
-- TOC entry 7706 (class 1259 OID 23042)
-- Name: ix_finance_fx_quotes_user_created; Type: INDEX; Schema: finance; Owner: postgres
--

CREATE INDEX ix_finance_fx_quotes_user_created ON finance.fx_quotes USING btree (user_id, created_at DESC);


--
-- TOC entry 7697 (class 1259 OID 22971)
-- Name: ux_finance_exchange_rates_latest; Type: INDEX; Schema: finance; Owner: postgres
--

CREATE UNIQUE INDEX ux_finance_exchange_rates_latest ON finance.exchange_rates USING btree (base_currency_code, quote_currency_code) WHERE (is_latest = true);


--
-- TOC entry 7644 (class 1259 OID 22416)
-- Name: ix_form_submissions_booking; Type: INDEX; Schema: form_builder; Owner: postgres
--

CREATE INDEX ix_form_submissions_booking ON form_builder.submissions USING btree (booking_id, create_date DESC);


--
-- TOC entry 7645 (class 1259 OID 22415)
-- Name: ix_form_submissions_booking_draft; Type: INDEX; Schema: form_builder; Owner: postgres
--

CREATE INDEX ix_form_submissions_booking_draft ON form_builder.submissions USING btree (booking_draft_id, create_date DESC);


--
-- TOC entry 7646 (class 1259 OID 22414)
-- Name: ix_form_submissions_service_definition; Type: INDEX; Schema: form_builder; Owner: postgres
--

CREATE INDEX ix_form_submissions_service_definition ON form_builder.submissions USING btree (service_definition_id, create_date DESC);


--
-- TOC entry 7626 (class 1259 OID 22249)
-- Name: ux_form_versions_active; Type: INDEX; Schema: form_builder; Owner: postgres
--

CREATE UNIQUE INDEX ux_form_versions_active ON form_builder.form_versions USING btree (form_id) WHERE (is_active = true);


--
-- TOC entry 7643 (class 1259 OID 22377)
-- Name: ux_service_definition_forms_active; Type: INDEX; Schema: form_builder; Owner: postgres
--

CREATE UNIQUE INDEX ux_service_definition_forms_active ON form_builder.service_definition_forms USING btree (service_definition_id, usage_scope) WHERE (is_active = true);


--
-- TOC entry 7170 (class 1259 OID 17179)
-- Name: EmailIndex; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE UNIQUE INDEX "EmailIndex" ON identity.asp_net_users USING btree (normalized_email);


--
-- TOC entry 7156 (class 1259 OID 17180)
-- Name: RoleNameIndex; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE UNIQUE INDEX "RoleNameIndex" ON identity.asp_net_roles USING btree (normalized_name);


--
-- TOC entry 7171 (class 1259 OID 17181)
-- Name: UserNameIndex; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE UNIQUE INDEX "UserNameIndex" ON identity.asp_net_users USING btree (normalized_user_name);


--
-- TOC entry 7181 (class 1259 OID 17182)
-- Name: idx_inbox_messages_occurred_on; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE INDEX idx_inbox_messages_occurred_on ON identity.inbox_messages USING btree (occurred_on_utc);


--
-- TOC entry 7182 (class 1259 OID 17183)
-- Name: idx_inbox_messages_processed_occurred; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE INDEX idx_inbox_messages_processed_occurred ON identity.inbox_messages USING btree (processed_on_utc, occurred_on_utc);


--
-- TOC entry 7183 (class 1259 OID 17184)
-- Name: idx_inbox_messages_processed_on; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE INDEX idx_inbox_messages_processed_on ON identity.inbox_messages USING btree (processed_on_utc);


--
-- TOC entry 7184 (class 1259 OID 17185)
-- Name: idx_inbox_messages_unprocessed; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE INDEX idx_inbox_messages_unprocessed ON identity.inbox_messages USING btree (occurred_on_utc, processed_on_utc) INCLUDE (id, type, content) WHERE (processed_on_utc IS NULL);


--
-- TOC entry 7190 (class 1259 OID 17186)
-- Name: idx_internal_command_messages_occurred_on; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE INDEX idx_internal_command_messages_occurred_on ON identity.internal_command_messages USING btree (occurred_on_utc);


--
-- TOC entry 7191 (class 1259 OID 17187)
-- Name: idx_internal_command_messages_processed_occurred; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE INDEX idx_internal_command_messages_processed_occurred ON identity.internal_command_messages USING btree (processed_on_utc, occurred_on_utc);


--
-- TOC entry 7192 (class 1259 OID 17188)
-- Name: idx_internal_command_messages_processed_on; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE INDEX idx_internal_command_messages_processed_on ON identity.internal_command_messages USING btree (processed_on_utc);


--
-- TOC entry 7193 (class 1259 OID 17189)
-- Name: idx_internal_command_messages_unprocessed; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE INDEX idx_internal_command_messages_unprocessed ON identity.internal_command_messages USING btree (occurred_on_utc, processed_on_utc) INCLUDE (id, type, content) WHERE (processed_on_utc IS NULL);


--
-- TOC entry 7199 (class 1259 OID 17190)
-- Name: idx_outbox_messages_occurred_on; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE INDEX idx_outbox_messages_occurred_on ON identity.outbox_messages USING btree (occurred_on_utc);


--
-- TOC entry 7200 (class 1259 OID 17191)
-- Name: idx_outbox_messages_processed_occurred; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE INDEX idx_outbox_messages_processed_occurred ON identity.outbox_messages USING btree (processed_on_utc, occurred_on_utc);


--
-- TOC entry 7201 (class 1259 OID 17192)
-- Name: idx_outbox_messages_processed_on; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE INDEX idx_outbox_messages_processed_on ON identity.outbox_messages USING btree (processed_on_utc);


--
-- TOC entry 7202 (class 1259 OID 17193)
-- Name: idx_outbox_messages_unprocessed; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE INDEX idx_outbox_messages_unprocessed ON identity.outbox_messages USING btree (occurred_on_utc, processed_on_utc) INCLUDE (id, type, content) WHERE (processed_on_utc IS NULL);


--
-- TOC entry 7178 (class 1259 OID 17194)
-- Name: inbox_message_consumers_message_id_name; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE INDEX inbox_message_consumers_message_id_name ON identity.inbox_message_consumers USING btree (message_id, name);


--
-- TOC entry 7187 (class 1259 OID 17195)
-- Name: internal_command_message_consumers_message_id_name; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE INDEX internal_command_message_consumers_message_id_name ON identity.internal_command_message_consumers USING btree (message_id, name);


--
-- TOC entry 7149 (class 1259 OID 17196)
-- Name: ix_access_tokens_token_user_id; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE UNIQUE INDEX ix_access_tokens_token_user_id ON identity.access_tokens USING btree (token, user_id);


--
-- TOC entry 7150 (class 1259 OID 17197)
-- Name: ix_access_tokens_user_id; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE INDEX ix_access_tokens_user_id ON identity.access_tokens USING btree (user_id);


--
-- TOC entry 7681 (class 1259 OID 22812)
-- Name: ix_account_deletion_requests_user_status; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE INDEX ix_account_deletion_requests_user_status ON identity.account_deletion_requests USING btree (user_id, status, requested_at DESC);


--
-- TOC entry 7153 (class 1259 OID 17198)
-- Name: ix_asp_net_role_claims_role_id; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE INDEX ix_asp_net_role_claims_role_id ON identity.asp_net_role_claims USING btree (role_id);


--
-- TOC entry 7159 (class 1259 OID 17199)
-- Name: ix_asp_net_user_claims_user_id; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE INDEX ix_asp_net_user_claims_user_id ON identity.asp_net_user_claims USING btree (user_id);


--
-- TOC entry 7162 (class 1259 OID 17200)
-- Name: ix_asp_net_user_logins_user_id; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE INDEX ix_asp_net_user_logins_user_id ON identity.asp_net_user_logins USING btree (user_id);


--
-- TOC entry 7165 (class 1259 OID 17201)
-- Name: ix_asp_net_user_roles_role_id; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE INDEX ix_asp_net_user_roles_role_id ON identity.asp_net_user_roles USING btree (role_id);


--
-- TOC entry 7172 (class 1259 OID 17202)
-- Name: ix_asp_net_users_email; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE UNIQUE INDEX ix_asp_net_users_email ON identity.asp_net_users USING btree (email);


--
-- TOC entry 7173 (class 1259 OID 19656)
-- Name: ix_asp_net_users_phone_number_country_code_phone_number; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE UNIQUE INDEX ix_asp_net_users_phone_number_country_code_phone_number ON identity.asp_net_users USING btree (phone_number_country_code, phone_number);


--
-- TOC entry 7207 (class 1259 OID 17204)
-- Name: ix_phone_login_codes_expires_at; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE INDEX ix_phone_login_codes_expires_at ON identity.phone_login_codes USING btree (expires_at);


--
-- TOC entry 7208 (class 1259 OID 17205)
-- Name: ix_phone_login_codes_user_id; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE INDEX ix_phone_login_codes_user_id ON identity.phone_login_codes USING btree (user_id);


--
-- TOC entry 7209 (class 1259 OID 17206)
-- Name: ix_phone_login_codes_user_id_is_invalidated_expires_at; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE INDEX ix_phone_login_codes_user_id_is_invalidated_expires_at ON identity.phone_login_codes USING btree (user_id, is_invalidated, expires_at);


--
-- TOC entry 7212 (class 1259 OID 17207)
-- Name: ix_refresh_tokens_token_user_id; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE UNIQUE INDEX ix_refresh_tokens_token_user_id ON identity.refresh_tokens USING btree (token, user_id);


--
-- TOC entry 7213 (class 1259 OID 17208)
-- Name: ix_refresh_tokens_user_id; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE INDEX ix_refresh_tokens_user_id ON identity.refresh_tokens USING btree (user_id);


--
-- TOC entry 7341 (class 1259 OID 19727)
-- Name: ix_user_preferences_selected_city_location_id; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE INDEX ix_user_preferences_selected_city_location_id ON identity.user_preferences USING btree (selected_city_location_id);


--
-- TOC entry 7342 (class 1259 OID 19726)
-- Name: ix_user_preferences_selected_country_location_id; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE INDEX ix_user_preferences_selected_country_location_id ON identity.user_preferences USING btree (selected_country_location_id);


--
-- TOC entry 7343 (class 1259 OID 19728)
-- Name: ix_user_preferences_selected_picked_location_id; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE INDEX ix_user_preferences_selected_picked_location_id ON identity.user_preferences USING btree (selected_picked_location_id);


--
-- TOC entry 7674 (class 1259 OID 22791)
-- Name: ix_user_sessions_user_active; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE INDEX ix_user_sessions_user_active ON identity.user_sessions USING btree (user_id, revoked_at, last_seen_at DESC);


--
-- TOC entry 7675 (class 1259 OID 22792)
-- Name: ix_user_sessions_user_current; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE INDEX ix_user_sessions_user_current ON identity.user_sessions USING btree (user_id, is_current, last_seen_at DESC);


--
-- TOC entry 7196 (class 1259 OID 17209)
-- Name: outbox_message_consumers_message_id_name; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE INDEX outbox_message_consumers_message_id_name ON identity.outbox_message_consumers USING btree (message_id, name);


--
-- TOC entry 7682 (class 1259 OID 22813)
-- Name: ux_account_deletion_requests_one_open_per_user; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE UNIQUE INDEX ux_account_deletion_requests_one_open_per_user ON identity.account_deletion_requests USING btree (user_id) WHERE ((status)::text = ANY ((ARRAY['requested'::character varying, 'under_review'::character varying, 'approved'::character varying])::text[]));


--
-- TOC entry 7678 (class 1259 OID 22793)
-- Name: ux_user_sessions_one_current_per_user; Type: INDEX; Schema: identity; Owner: postgres
--

CREATE UNIQUE INDEX ux_user_sessions_one_current_per_user ON identity.user_sessions USING btree (user_id) WHERE ((is_current = true) AND (revoked_at IS NULL));


--
-- TOC entry 7368 (class 1259 OID 19846)
-- Name: ix_loyalty_customer_coupons_customer; Type: INDEX; Schema: loyalty; Owner: postgres
--

CREATE INDEX ix_loyalty_customer_coupons_customer ON loyalty.customer_coupons USING btree (customer_id, status, assigned_at DESC);


--
-- TOC entry 7354 (class 1259 OID 19782)
-- Name: ix_loyalty_ledger_customer_date; Type: INDEX; Schema: loyalty; Owner: postgres
--

CREATE INDEX ix_loyalty_ledger_customer_date ON loyalty.ledger USING btree (customer_id, create_date DESC);


--
-- TOC entry 7357 (class 1259 OID 19805)
-- Name: ix_loyalty_referrals_referrer; Type: INDEX; Schema: loyalty; Owner: postgres
--

CREATE INDEX ix_loyalty_referrals_referrer ON loyalty.referrals USING btree (referrer_customer_id, create_date DESC);


--
-- TOC entry 7251 (class 1259 OID 18512)
-- Name: idx_offers_active; Type: INDEX; Schema: marketing; Owner: postgres
--

CREATE INDEX idx_offers_active ON marketing.offers USING btree (is_active, valid_until);


--
-- TOC entry 7252 (class 1259 OID 18516)
-- Name: idx_offers_provider_service; Type: INDEX; Schema: marketing; Owner: postgres
--

CREATE INDEX idx_offers_provider_service ON marketing.offers USING btree (provider_service_id);


--
-- TOC entry 7543 (class 1259 OID 21384)
-- Name: ix_referral_codes_customer_program; Type: INDEX; Schema: marketing; Owner: postgres
--

CREATE INDEX ix_referral_codes_customer_program ON marketing.referral_codes USING btree (customer_id, program_id, is_active);


--
-- TOC entry 7550 (class 1259 OID 21386)
-- Name: ix_referral_invitations_referee_customer; Type: INDEX; Schema: marketing; Owner: postgres
--

CREATE INDEX ix_referral_invitations_referee_customer ON marketing.referral_invitations USING btree (referee_customer_id);


--
-- TOC entry 7551 (class 1259 OID 21385)
-- Name: ix_referral_invitations_referrer_program; Type: INDEX; Schema: marketing; Owner: postgres
--

CREATE INDEX ix_referral_invitations_referrer_program ON marketing.referral_invitations USING btree (referrer_customer_id, program_id, invited_at DESC);


--
-- TOC entry 7540 (class 1259 OID 21383)
-- Name: ix_referral_reward_rules_program_sort; Type: INDEX; Schema: marketing; Owner: postgres
--

CREATE INDEX ix_referral_reward_rules_program_sort ON marketing.referral_reward_rules USING btree (program_id, sort_order, referral_ordinal);


--
-- TOC entry 7554 (class 1259 OID 21387)
-- Name: ix_user_discount_coupons_customer_status_queue; Type: INDEX; Schema: marketing; Owner: postgres
--

CREATE INDEX ix_user_discount_coupons_customer_status_queue ON marketing.user_discount_coupons USING btree (customer_id, status, queue_position, issued_at);


--
-- TOC entry 7555 (class 1259 OID 21388)
-- Name: ix_user_discount_coupons_program; Type: INDEX; Schema: marketing; Owner: postgres
--

CREATE INDEX ix_user_discount_coupons_program ON marketing.user_discount_coupons USING btree (program_id, issued_at DESC);


--
-- TOC entry 7560 (class 1259 OID 21389)
-- Name: ux_user_discount_coupon_one_reserved_per_customer; Type: INDEX; Schema: marketing; Owner: postgres
--

CREATE UNIQUE INDEX ux_user_discount_coupon_one_reserved_per_customer ON marketing.user_discount_coupons USING btree (customer_id) WHERE (status = 'reserved'::marketing.user_coupon_status);


--
-- TOC entry 7326 (class 1259 OID 19637)
-- Name: ix_media_library_create_date; Type: INDEX; Schema: media; Owner: postgres
--

CREATE INDEX ix_media_library_create_date ON media.media_library USING btree (create_date DESC);


--
-- TOC entry 7327 (class 1259 OID 19642)
-- Name: ix_media_library_description_translations_gin; Type: INDEX; Schema: media; Owner: postgres
--

CREATE INDEX ix_media_library_description_translations_gin ON media.media_library USING gin (description_translations jsonb_path_ops);


--
-- TOC entry 7328 (class 1259 OID 19638)
-- Name: ix_media_library_is_public; Type: INDEX; Schema: media; Owner: postgres
--

CREATE INDEX ix_media_library_is_public ON media.media_library USING btree (is_public);


--
-- TOC entry 7329 (class 1259 OID 19635)
-- Name: ix_media_library_media_type; Type: INDEX; Schema: media; Owner: postgres
--

CREATE INDEX ix_media_library_media_type ON media.media_library USING btree (media_type);


--
-- TOC entry 7330 (class 1259 OID 19636)
-- Name: ix_media_library_mime_type; Type: INDEX; Schema: media; Owner: postgres
--

CREATE INDEX ix_media_library_mime_type ON media.media_library USING btree (mime_type);


--
-- TOC entry 7331 (class 1259 OID 19639)
-- Name: ix_media_library_original_name; Type: INDEX; Schema: media; Owner: postgres
--

CREATE INDEX ix_media_library_original_name ON media.media_library USING btree (original_name);


--
-- TOC entry 7332 (class 1259 OID 19640)
-- Name: ix_media_library_stored_name; Type: INDEX; Schema: media; Owner: postgres
--

CREATE INDEX ix_media_library_stored_name ON media.media_library USING btree (stored_name);


--
-- TOC entry 7333 (class 1259 OID 19641)
-- Name: ix_media_library_title_translations_gin; Type: INDEX; Schema: media; Owner: postgres
--

CREATE INDEX ix_media_library_title_translations_gin ON media.media_library USING gin (title_translations jsonb_path_ops);


--
-- TOC entry 7336 (class 1259 OID 20092)
-- Name: ix_sponsered_slider_active_order; Type: INDEX; Schema: media; Owner: postgres
--

CREATE INDEX ix_sponsered_slider_active_order ON media.sponsered_slider USING btree (is_active, display_order);


--
-- TOC entry 7408 (class 1259 OID 20162)
-- Name: ix_notify_deliveries_channel_status; Type: INDEX; Schema: notify; Owner: postgres
--

CREATE INDEX ix_notify_deliveries_channel_status ON notify.notification_deliveries USING btree (channel, status, created_at);


--
-- TOC entry 7409 (class 1259 OID 20161)
-- Name: ix_notify_deliveries_notification; Type: INDEX; Schema: notify; Owner: postgres
--

CREATE INDEX ix_notify_deliveries_notification ON notify.notification_deliveries USING btree (notification_id);


--
-- TOC entry 7403 (class 1259 OID 20158)
-- Name: ix_notify_notifications_customer_created; Type: INDEX; Schema: notify; Owner: postgres
--

CREATE INDEX ix_notify_notifications_customer_created ON notify.notifications USING btree (customer_id, created_at DESC);


--
-- TOC entry 7404 (class 1259 OID 20159)
-- Name: ix_notify_notifications_customer_read; Type: INDEX; Schema: notify; Owner: postgres
--

CREATE INDEX ix_notify_notifications_customer_read ON notify.notifications USING btree (customer_id, read_at);


--
-- TOC entry 7405 (class 1259 OID 20160)
-- Name: ix_notify_notifications_type; Type: INDEX; Schema: notify; Owner: postgres
--

CREATE INDEX ix_notify_notifications_type ON notify.notifications USING btree (notification_type, created_at DESC);


--
-- TOC entry 7577 (class 1259 OID 21922)
-- Name: ix_form_definitions_scope; Type: INDEX; Schema: provider_portal; Owner: postgres
--

CREATE INDEX ix_form_definitions_scope ON provider_portal.form_definitions USING btree (scope, is_active, provider_type_id, code);


--
-- TOC entry 7587 (class 1259 OID 21972)
-- Name: ix_form_field_options_lookup; Type: INDEX; Schema: provider_portal; Owner: postgres
--

CREATE INDEX ix_form_field_options_lookup ON provider_portal.form_field_options USING btree (form_field_id, is_enabled, sort_order, option_value);


--
-- TOC entry 7582 (class 1259 OID 21952)
-- Name: ix_form_fields_lookup; Type: INDEX; Schema: provider_portal; Owner: postgres
--

CREATE INDEX ix_form_fields_lookup ON provider_portal.form_fields USING btree (form_definition_id, is_enabled, sort_order, field_key);


--
-- TOC entry 7594 (class 1259 OID 22052)
-- Name: ix_onboarding_applications_provider_type; Type: INDEX; Schema: provider_portal; Owner: postgres
--

CREATE INDEX ix_onboarding_applications_provider_type ON provider_portal.onboarding_applications USING btree (provider_type_id, status, last_modified_date DESC);


--
-- TOC entry 7595 (class 1259 OID 22051)
-- Name: ix_onboarding_applications_user_status; Type: INDEX; Schema: provider_portal; Owner: postgres
--

CREATE INDEX ix_onboarding_applications_user_status ON provider_portal.onboarding_applications USING btree (applicant_user_id, status, last_modified_date DESC);


--
-- TOC entry 7600 (class 1259 OID 22073)
-- Name: ix_onboarding_documents_application; Type: INDEX; Schema: provider_portal; Owner: postgres
--

CREATE INDEX ix_onboarding_documents_application ON provider_portal.onboarding_documents USING btree (application_id, document_kind);


--
-- TOC entry 7568 (class 1259 OID 21899)
-- Name: ix_portal_sections_lookup; Type: INDEX; Schema: provider_portal; Owner: postgres
--

CREATE INDEX ix_portal_sections_lookup ON provider_portal.portal_sections USING btree (provider_type_id, is_enabled, sort_order, section_key);


--
-- TOC entry 7588 (class 1259 OID 21999)
-- Name: ix_provider_members_provider; Type: INDEX; Schema: provider_portal; Owner: postgres
--

CREATE INDEX ix_provider_members_provider ON provider_portal.provider_members USING btree (service_provider_id, role);


--
-- TOC entry 7589 (class 1259 OID 21998)
-- Name: ix_provider_members_user; Type: INDEX; Schema: provider_portal; Owner: postgres
--

CREATE INDEX ix_provider_members_user ON provider_portal.provider_members USING btree (user_id, role);


--
-- TOC entry 7563 (class 1259 OID 21875)
-- Name: ix_provider_type_catalog_sort; Type: INDEX; Schema: provider_portal; Owner: postgres
--

CREATE INDEX ix_provider_type_catalog_sort ON provider_portal.provider_type_catalog USING btree (is_enabled, sort_order, code);


--
-- TOC entry 7609 (class 1259 OID 22145)
-- Name: ix_support_tickets_provider; Type: INDEX; Schema: provider_portal; Owner: postgres
--

CREATE INDEX ix_support_tickets_provider ON provider_portal.support_tickets USING btree (service_provider_id, status, last_modified_date DESC);


--
-- TOC entry 7216 (class 1259 OID 17210)
-- Name: ix_translation_audit_lookup; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_translation_audit_lookup ON public.translation_audit USING btree (table_name, column_name, row_pk, target_locale, created_at DESC);


--
-- TOC entry 7246 (class 1259 OID 18519)
-- Name: idx_search_history_category; Type: INDEX; Schema: search; Owner: postgres
--

CREATE INDEX idx_search_history_category ON search.user_search_history USING btree (category_id);


--
-- TOC entry 7247 (class 1259 OID 18518)
-- Name: idx_search_history_term; Type: INDEX; Schema: search; Owner: postgres
--

CREATE INDEX idx_search_history_term ON search.user_search_history USING btree (normalized_term);


--
-- TOC entry 7248 (class 1259 OID 18517)
-- Name: idx_search_history_user; Type: INDEX; Schema: search; Owner: postgres
--

CREATE INDEX idx_search_history_user ON search.user_search_history USING btree (user_id, created_at DESC);


--
-- TOC entry 7420 (class 1259 OID 21159)
-- Name: ix_shop_categories_parent; Type: INDEX; Schema: shop; Owner: postgres
--

CREATE INDEX ix_shop_categories_parent ON shop.categories USING btree (parent_id, is_active);


--
-- TOC entry 7462 (class 1259 OID 21162)
-- Name: ix_shop_inventory_warehouse; Type: INDEX; Schema: shop; Owner: postgres
--

CREATE INDEX ix_shop_inventory_warehouse ON shop.inventory USING btree (warehouse_id);


--
-- TOC entry 7493 (class 1259 OID 21163)
-- Name: ix_shop_orders_customer; Type: INDEX; Schema: shop; Owner: postgres
--

CREATE INDEX ix_shop_orders_customer ON shop.orders USING btree (customer_id, placed_at DESC);


--
-- TOC entry 7494 (class 1259 OID 21164)
-- Name: ix_shop_orders_status; Type: INDEX; Schema: shop; Owner: postgres
--

CREATE INDEX ix_shop_orders_status ON shop.orders USING btree (status, payment_status, fulfillment_status, placed_at DESC);


--
-- TOC entry 7432 (class 1259 OID 21160)
-- Name: ix_shop_product_media_product; Type: INDEX; Schema: shop; Owner: postgres
--

CREATE INDEX ix_shop_product_media_product ON shop.product_media USING btree (product_id, display_order);


--
-- TOC entry 7421 (class 1259 OID 21156)
-- Name: ix_shop_products_brand; Type: INDEX; Schema: shop; Owner: postgres
--

CREATE INDEX ix_shop_products_brand ON shop.products USING btree (brand_id);


--
-- TOC entry 7422 (class 1259 OID 21157)
-- Name: ix_shop_products_featured; Type: INDEX; Schema: shop; Owner: postgres
--

CREATE INDEX ix_shop_products_featured ON shop.products USING btree (is_featured, is_best_seller, is_new_arrival);


--
-- TOC entry 7423 (class 1259 OID 21158)
-- Name: ix_shop_products_search; Type: INDEX; Schema: shop; Owner: postgres
--

CREATE INDEX ix_shop_products_search ON shop.products USING gin (search_vector);


--
-- TOC entry 7424 (class 1259 OID 21155)
-- Name: ix_shop_products_status; Type: INDEX; Schema: shop; Owner: postgres
--

CREATE INDEX ix_shop_products_status ON shop.products USING btree (status, published_at DESC);


--
-- TOC entry 7525 (class 1259 OID 21165)
-- Name: ix_shop_reviews_product_status; Type: INDEX; Schema: shop; Owner: postgres
--

CREATE INDEX ix_shop_reviews_product_status ON shop.product_reviews USING btree (product_id, status, create_date DESC);


--
-- TOC entry 7445 (class 1259 OID 21161)
-- Name: ix_shop_variants_product; Type: INDEX; Schema: shop; Owner: postgres
--

CREATE INDEX ix_shop_variants_product ON shop.product_variants USING btree (product_id, is_active);


--
-- TOC entry 7431 (class 1259 OID 20430)
-- Name: ux_shop_product_categories_primary; Type: INDEX; Schema: shop; Owner: postgres
--

CREATE UNIQUE INDEX ux_shop_product_categories_primary ON shop.product_categories USING btree (product_id) WHERE (is_primary = true);


--
-- TOC entry 8020 (class 2620 OID 22610)
-- Name: booking_child_bookings trg_booking_children_lmd; Type: TRIGGER; Schema: booking; Owner: postgres
--

CREATE TRIGGER trg_booking_children_lmd BEFORE UPDATE ON booking.booking_child_bookings FOR EACH ROW EXECUTE FUNCTION booking.set_last_modified_date();


--
-- TOC entry 8019 (class 2620 OID 22609)
-- Name: booking_draft_child_bookings trg_booking_draft_children_lmd; Type: TRIGGER; Schema: booking; Owner: postgres
--

CREATE TRIGGER trg_booking_draft_children_lmd BEFORE UPDATE ON booking.booking_draft_child_bookings FOR EACH ROW EXECUTE FUNCTION booking.set_last_modified_date();


--
-- TOC entry 8008 (class 2620 OID 22608)
-- Name: booking_drafts trg_booking_drafts_lmd; Type: TRIGGER; Schema: booking; Owner: postgres
--

CREATE TRIGGER trg_booking_drafts_lmd BEFORE UPDATE ON booking.booking_drafts FOR EACH ROW EXECUTE FUNCTION booking.set_last_modified_date();


--
-- TOC entry 8025 (class 2620 OID 23104)
-- Name: country_currency_defaults trg_finance_country_currency_defaults_updated_at; Type: TRIGGER; Schema: finance; Owner: postgres
--

CREATE TRIGGER trg_finance_country_currency_defaults_updated_at BEFORE UPDATE ON finance.country_currency_defaults FOR EACH ROW EXECUTE FUNCTION finance.set_updated_at();


--
-- TOC entry 8024 (class 2620 OID 23103)
-- Name: currencies trg_finance_currencies_updated_at; Type: TRIGGER; Schema: finance; Owner: postgres
--

CREATE TRIGGER trg_finance_currencies_updated_at BEFORE UPDATE ON finance.currencies FOR EACH ROW EXECUTE FUNCTION finance.set_updated_at();


--
-- TOC entry 8026 (class 2620 OID 23107)
-- Name: exchange_rates trg_finance_exchange_rates_before_write; Type: TRIGGER; Schema: finance; Owner: postgres
--

CREATE TRIGGER trg_finance_exchange_rates_before_write BEFORE INSERT OR UPDATE ON finance.exchange_rates FOR EACH ROW EXECUTE FUNCTION finance.before_exchange_rate_write();


--
-- TOC entry 8027 (class 2620 OID 23105)
-- Name: fx_margin_profiles trg_finance_fx_margin_profiles_updated_at; Type: TRIGGER; Schema: finance; Owner: postgres
--

CREATE TRIGGER trg_finance_fx_margin_profiles_updated_at BEFORE UPDATE ON finance.fx_margin_profiles FOR EACH ROW EXECUTE FUNCTION finance.set_updated_at();


--
-- TOC entry 8028 (class 2620 OID 23106)
-- Name: fx_pair_margins trg_finance_fx_pair_margins_updated_at; Type: TRIGGER; Schema: finance; Owner: postgres
--

CREATE TRIGGER trg_finance_fx_pair_margins_updated_at BEFORE UPDATE ON finance.fx_pair_margins FOR EACH ROW EXECUTE FUNCTION finance.set_updated_at();


--
-- TOC entry 8016 (class 2620 OID 22654)
-- Name: field_conditions trg_form_builder_conditions_lmd; Type: TRIGGER; Schema: form_builder; Owner: postgres
--

CREATE TRIGGER trg_form_builder_conditions_lmd BEFORE UPDATE ON form_builder.field_conditions FOR EACH ROW EXECUTE FUNCTION form_builder.set_last_modified_date();


--
-- TOC entry 8014 (class 2620 OID 22652)
-- Name: form_fields trg_form_builder_fields_lmd; Type: TRIGGER; Schema: form_builder; Owner: postgres
--

CREATE TRIGGER trg_form_builder_fields_lmd BEFORE UPDATE ON form_builder.form_fields FOR EACH ROW EXECUTE FUNCTION form_builder.set_last_modified_date();


--
-- TOC entry 8011 (class 2620 OID 22649)
-- Name: forms trg_form_builder_forms_lmd; Type: TRIGGER; Schema: form_builder; Owner: postgres
--

CREATE TRIGGER trg_form_builder_forms_lmd BEFORE UPDATE ON form_builder.forms FOR EACH ROW EXECUTE FUNCTION form_builder.set_last_modified_date();


--
-- TOC entry 8015 (class 2620 OID 22653)
-- Name: field_options trg_form_builder_options_lmd; Type: TRIGGER; Schema: form_builder; Owner: postgres
--

CREATE TRIGGER trg_form_builder_options_lmd BEFORE UPDATE ON form_builder.field_options FOR EACH ROW EXECUTE FUNCTION form_builder.set_last_modified_date();


--
-- TOC entry 8017 (class 2620 OID 22655)
-- Name: service_definition_forms trg_form_builder_sdf_lmd; Type: TRIGGER; Schema: form_builder; Owner: postgres
--

CREATE TRIGGER trg_form_builder_sdf_lmd BEFORE UPDATE ON form_builder.service_definition_forms FOR EACH ROW EXECUTE FUNCTION form_builder.set_last_modified_date();


--
-- TOC entry 8013 (class 2620 OID 22651)
-- Name: form_sections trg_form_builder_sections_lmd; Type: TRIGGER; Schema: form_builder; Owner: postgres
--

CREATE TRIGGER trg_form_builder_sections_lmd BEFORE UPDATE ON form_builder.form_sections FOR EACH ROW EXECUTE FUNCTION form_builder.set_last_modified_date();


--
-- TOC entry 8018 (class 2620 OID 22656)
-- Name: submissions trg_form_builder_submissions_lmd; Type: TRIGGER; Schema: form_builder; Owner: postgres
--

CREATE TRIGGER trg_form_builder_submissions_lmd BEFORE UPDATE ON form_builder.submissions FOR EACH ROW EXECUTE FUNCTION form_builder.set_last_modified_date();


--
-- TOC entry 8012 (class 2620 OID 22650)
-- Name: form_versions trg_form_builder_versions_lmd; Type: TRIGGER; Schema: form_builder; Owner: postgres
--

CREATE TRIGGER trg_form_builder_versions_lmd BEFORE UPDATE ON form_builder.form_versions FOR EACH ROW EXECUTE FUNCTION form_builder.set_last_modified_date();


--
-- TOC entry 8022 (class 2620 OID 22837)
-- Name: account_deletion_requests trg_account_deletion_requests_last_modified; Type: TRIGGER; Schema: identity; Owner: postgres
--

CREATE TRIGGER trg_account_deletion_requests_last_modified BEFORE UPDATE ON identity.account_deletion_requests FOR EACH ROW EXECUTE FUNCTION identity.set_last_modified_date();


--
-- TOC entry 8023 (class 2620 OID 22835)
-- Name: user_security_settings trg_user_security_settings_last_modified; Type: TRIGGER; Schema: identity; Owner: postgres
--

CREATE TRIGGER trg_user_security_settings_last_modified BEFORE UPDATE ON identity.user_security_settings FOR EACH ROW EXECUTE FUNCTION identity.set_last_modified_date();


--
-- TOC entry 8021 (class 2620 OID 22836)
-- Name: user_sessions trg_user_sessions_last_modified; Type: TRIGGER; Schema: identity; Owner: postgres
--

CREATE TRIGGER trg_user_sessions_last_modified BEFORE UPDATE ON identity.user_sessions FOR EACH ROW EXECUTE FUNCTION identity.set_last_modified_date();


--
-- TOC entry 8007 (class 2620 OID 19644)
-- Name: media_library trg_media_library_last_modified_date; Type: TRIGGER; Schema: media; Owner: postgres
--

CREATE TRIGGER trg_media_library_last_modified_date BEFORE UPDATE ON media.media_library FOR EACH ROW EXECUTE FUNCTION media.set_last_modified_date();


--
-- TOC entry 8010 (class 2620 OID 20165)
-- Name: notification_deliveries trg_notify_notification_deliveries_updated_at; Type: TRIGGER; Schema: notify; Owner: postgres
--

CREATE TRIGGER trg_notify_notification_deliveries_updated_at BEFORE UPDATE ON notify.notification_deliveries FOR EACH ROW EXECUTE FUNCTION notify.set_updated_at();


--
-- TOC entry 8009 (class 2620 OID 20164)
-- Name: notifications trg_notify_notifications_updated_at; Type: TRIGGER; Schema: notify; Owner: postgres
--

CREATE TRIGGER trg_notify_notifications_updated_at BEFORE UPDATE ON notify.notifications FOR EACH ROW EXECUTE FUNCTION notify.set_updated_at();


--
-- TOC entry 7793 (class 2606 OID 19584)
-- Name: role_table_permissions role_table_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.role_table_permissions
    ADD CONSTRAINT role_table_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES auth.roles(id) ON DELETE CASCADE;


--
-- TOC entry 7791 (class 2606 OID 19590)
-- Name: user_roles userId; Type: FK CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.user_roles
    ADD CONSTRAINT "userId" FOREIGN KEY (user_id) REFERENCES identity.asp_net_users(id) NOT VALID;


--
-- TOC entry 7792 (class 2606 OID 19565)
-- Name: user_roles user_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.user_roles
    ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES auth.roles(id) ON DELETE CASCADE;


--
-- TOC entry 7824 (class 2606 OID 20049)
-- Name: booking_addons booking_addons_addon_id_fkey; Type: FK CONSTRAINT; Schema: booking; Owner: postgres
--

ALTER TABLE ONLY booking.booking_addons
    ADD CONSTRAINT booking_addons_addon_id_fkey FOREIGN KEY (addon_id) REFERENCES category.addons(id);


--
-- TOC entry 7825 (class 2606 OID 20044)
-- Name: booking_addons booking_addons_booking_id_fkey; Type: FK CONSTRAINT; Schema: booking; Owner: postgres
--

ALTER TABLE ONLY booking.booking_addons
    ADD CONSTRAINT booking_addons_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES booking.bookings(id) ON DELETE CASCADE;


--
-- TOC entry 7951 (class 2606 OID 22602)
-- Name: booking_child_bookings booking_child_bookings_form_submission_id_fkey; Type: FK CONSTRAINT; Schema: booking; Owner: postgres
--

ALTER TABLE ONLY booking.booking_child_bookings
    ADD CONSTRAINT booking_child_bookings_form_submission_id_fkey FOREIGN KEY (form_submission_id) REFERENCES form_builder.submissions(id) ON DELETE SET NULL;


--
-- TOC entry 7952 (class 2606 OID 22577)
-- Name: booking_child_bookings booking_child_bookings_parent_booking_id_fkey; Type: FK CONSTRAINT; Schema: booking; Owner: postgres
--

ALTER TABLE ONLY booking.booking_child_bookings
    ADD CONSTRAINT booking_child_bookings_parent_booking_id_fkey FOREIGN KEY (parent_booking_id) REFERENCES booking.bookings(id) ON DELETE CASCADE;


--
-- TOC entry 7953 (class 2606 OID 22587)
-- Name: booking_child_bookings booking_child_bookings_provider_id_fkey; Type: FK CONSTRAINT; Schema: booking; Owner: postgres
--

ALTER TABLE ONLY booking.booking_child_bookings
    ADD CONSTRAINT booking_child_bookings_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES category.service_providers(id) ON DELETE RESTRICT;


--
-- TOC entry 7954 (class 2606 OID 22582)
-- Name: booking_child_bookings booking_child_bookings_provider_type_id_fkey; Type: FK CONSTRAINT; Schema: booking; Owner: postgres
--

ALTER TABLE ONLY booking.booking_child_bookings
    ADD CONSTRAINT booking_child_bookings_provider_type_id_fkey FOREIGN KEY (provider_type_id) REFERENCES category.provider_types(id) ON DELETE RESTRICT;


--
-- TOC entry 7955 (class 2606 OID 22592)
-- Name: booking_child_bookings booking_child_bookings_service_id_fkey; Type: FK CONSTRAINT; Schema: booking; Owner: postgres
--

ALTER TABLE ONLY booking.booking_child_bookings
    ADD CONSTRAINT booking_child_bookings_service_id_fkey FOREIGN KEY (service_id) REFERENCES category.provider_services(id) ON DELETE RESTRICT;


--
-- TOC entry 7956 (class 2606 OID 22597)
-- Name: booking_child_bookings booking_child_bookings_specialist_id_fkey; Type: FK CONSTRAINT; Schema: booking; Owner: postgres
--

ALTER TABLE ONLY booking.booking_child_bookings
    ADD CONSTRAINT booking_child_bookings_specialist_id_fkey FOREIGN KEY (specialist_id) REFERENCES category.staff(id) ON DELETE RESTRICT;


--
-- TOC entry 7827 (class 2606 OID 20064)
-- Name: booking_documents booking_documents_booking_id_fkey; Type: FK CONSTRAINT; Schema: booking; Owner: postgres
--

ALTER TABLE ONLY booking.booking_documents
    ADD CONSTRAINT booking_documents_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES booking.bookings(id) ON DELETE CASCADE;


--
-- TOC entry 7820 (class 2606 OID 20012)
-- Name: booking_draft_addons booking_draft_addons_addon_id_fkey; Type: FK CONSTRAINT; Schema: booking; Owner: postgres
--

ALTER TABLE ONLY booking.booking_draft_addons
    ADD CONSTRAINT booking_draft_addons_addon_id_fkey FOREIGN KEY (addon_id) REFERENCES category.addons(id) ON DELETE CASCADE;


--
-- TOC entry 7821 (class 2606 OID 20007)
-- Name: booking_draft_addons booking_draft_addons_draft_id_fkey; Type: FK CONSTRAINT; Schema: booking; Owner: postgres
--

ALTER TABLE ONLY booking.booking_draft_addons
    ADD CONSTRAINT booking_draft_addons_draft_id_fkey FOREIGN KEY (draft_id) REFERENCES booking.booking_drafts(id) ON DELETE CASCADE;


--
-- TOC entry 7945 (class 2606 OID 22554)
-- Name: booking_draft_child_bookings booking_draft_child_bookings_form_submission_id_fkey; Type: FK CONSTRAINT; Schema: booking; Owner: postgres
--

ALTER TABLE ONLY booking.booking_draft_child_bookings
    ADD CONSTRAINT booking_draft_child_bookings_form_submission_id_fkey FOREIGN KEY (form_submission_id) REFERENCES form_builder.submissions(id) ON DELETE SET NULL;


--
-- TOC entry 7946 (class 2606 OID 22529)
-- Name: booking_draft_child_bookings booking_draft_child_bookings_parent_draft_id_fkey; Type: FK CONSTRAINT; Schema: booking; Owner: postgres
--

ALTER TABLE ONLY booking.booking_draft_child_bookings
    ADD CONSTRAINT booking_draft_child_bookings_parent_draft_id_fkey FOREIGN KEY (parent_draft_id) REFERENCES booking.booking_drafts(id) ON DELETE CASCADE;


--
-- TOC entry 7947 (class 2606 OID 22539)
-- Name: booking_draft_child_bookings booking_draft_child_bookings_provider_id_fkey; Type: FK CONSTRAINT; Schema: booking; Owner: postgres
--

ALTER TABLE ONLY booking.booking_draft_child_bookings
    ADD CONSTRAINT booking_draft_child_bookings_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES category.service_providers(id) ON DELETE RESTRICT;


--
-- TOC entry 7948 (class 2606 OID 22534)
-- Name: booking_draft_child_bookings booking_draft_child_bookings_provider_type_id_fkey; Type: FK CONSTRAINT; Schema: booking; Owner: postgres
--

ALTER TABLE ONLY booking.booking_draft_child_bookings
    ADD CONSTRAINT booking_draft_child_bookings_provider_type_id_fkey FOREIGN KEY (provider_type_id) REFERENCES category.provider_types(id) ON DELETE RESTRICT;


--
-- TOC entry 7949 (class 2606 OID 22544)
-- Name: booking_draft_child_bookings booking_draft_child_bookings_service_id_fkey; Type: FK CONSTRAINT; Schema: booking; Owner: postgres
--

ALTER TABLE ONLY booking.booking_draft_child_bookings
    ADD CONSTRAINT booking_draft_child_bookings_service_id_fkey FOREIGN KEY (service_id) REFERENCES category.provider_services(id) ON DELETE RESTRICT;


--
-- TOC entry 7950 (class 2606 OID 22549)
-- Name: booking_draft_child_bookings booking_draft_child_bookings_specialist_id_fkey; Type: FK CONSTRAINT; Schema: booking; Owner: postgres
--

ALTER TABLE ONLY booking.booking_draft_child_bookings
    ADD CONSTRAINT booking_draft_child_bookings_specialist_id_fkey FOREIGN KEY (specialist_id) REFERENCES category.staff(id) ON DELETE RESTRICT;


--
-- TOC entry 7823 (class 2606 OID 20026)
-- Name: booking_draft_documents booking_draft_documents_draft_id_fkey; Type: FK CONSTRAINT; Schema: booking; Owner: postgres
--

ALTER TABLE ONLY booking.booking_draft_documents
    ADD CONSTRAINT booking_draft_documents_draft_id_fkey FOREIGN KEY (draft_id) REFERENCES booking.booking_drafts(id) ON DELETE CASCADE;


--
-- TOC entry 7816 (class 2606 OID 19979)
-- Name: booking_drafts booking_drafts_provider_id_fkey; Type: FK CONSTRAINT; Schema: booking; Owner: postgres
--

ALTER TABLE ONLY booking.booking_drafts
    ADD CONSTRAINT booking_drafts_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES category.service_providers(id);


--
-- TOC entry 7817 (class 2606 OID 19984)
-- Name: booking_drafts booking_drafts_service_id_fkey; Type: FK CONSTRAINT; Schema: booking; Owner: postgres
--

ALTER TABLE ONLY booking.booking_drafts
    ADD CONSTRAINT booking_drafts_service_id_fkey FOREIGN KEY (service_id) REFERENCES category.provider_services(id);


--
-- TOC entry 7818 (class 2606 OID 19989)
-- Name: booking_drafts booking_drafts_specialist_id_fkey; Type: FK CONSTRAINT; Schema: booking; Owner: postgres
--

ALTER TABLE ONLY booking.booking_drafts
    ADD CONSTRAINT booking_drafts_specialist_id_fkey FOREIGN KEY (specialist_id) REFERENCES category.staff(id);


--
-- TOC entry 7767 (class 2606 OID 22453)
-- Name: bookings bookings_form_submission_id_fkey; Type: FK CONSTRAINT; Schema: booking; Owner: postgres
--

ALTER TABLE ONLY booking.bookings
    ADD CONSTRAINT bookings_form_submission_id_fkey FOREIGN KEY (form_submission_id) REFERENCES form_builder.submissions(id) ON DELETE SET NULL;


--
-- TOC entry 7826 (class 2606 OID 23073)
-- Name: booking_addons fk_booking_addons_fx_quote; Type: FK CONSTRAINT; Schema: booking; Owner: postgres
--

ALTER TABLE ONLY booking.booking_addons
    ADD CONSTRAINT fk_booking_addons_fx_quote FOREIGN KEY (fx_quote_id) REFERENCES finance.fx_quotes(id) NOT VALID;


--
-- TOC entry 7768 (class 2606 OID 19280)
-- Name: bookings fk_booking_bookings_provider_services_service_id; Type: FK CONSTRAINT; Schema: booking; Owner: postgres
--

ALTER TABLE ONLY booking.bookings
    ADD CONSTRAINT fk_booking_bookings_provider_services_service_id FOREIGN KEY (service_id) REFERENCES category.provider_services(id);


--
-- TOC entry 7769 (class 2606 OID 19275)
-- Name: bookings fk_booking_bookings_service_providers_provider_id; Type: FK CONSTRAINT; Schema: booking; Owner: postgres
--

ALTER TABLE ONLY booking.bookings
    ADD CONSTRAINT fk_booking_bookings_service_providers_provider_id FOREIGN KEY (provider_id) REFERENCES category.service_providers(id);


--
-- TOC entry 7770 (class 2606 OID 19285)
-- Name: bookings fk_booking_bookings_staff_specialist_id; Type: FK CONSTRAINT; Schema: booking; Owner: postgres
--

ALTER TABLE ONLY booking.bookings
    ADD CONSTRAINT fk_booking_bookings_staff_specialist_id FOREIGN KEY (specialist_id) REFERENCES category.staff(id);


--
-- TOC entry 7822 (class 2606 OID 23068)
-- Name: booking_draft_addons fk_booking_draft_addons_fx_quote; Type: FK CONSTRAINT; Schema: booking; Owner: postgres
--

ALTER TABLE ONLY booking.booking_draft_addons
    ADD CONSTRAINT fk_booking_draft_addons_fx_quote FOREIGN KEY (fx_quote_id) REFERENCES finance.fx_quotes(id) NOT VALID;


--
-- TOC entry 7819 (class 2606 OID 23078)
-- Name: booking_drafts fk_booking_drafts_fx_quote; Type: FK CONSTRAINT; Schema: booking; Owner: postgres
--

ALTER TABLE ONLY booking.booking_drafts
    ADD CONSTRAINT fk_booking_drafts_fx_quote FOREIGN KEY (fx_quote_id) REFERENCES finance.fx_quotes(id) NOT VALID;


--
-- TOC entry 7828 (class 2606 OID 23088)
-- Name: payments fk_booking_payments_fx_quote; Type: FK CONSTRAINT; Schema: booking; Owner: postgres
--

ALTER TABLE ONLY booking.payments
    ADD CONSTRAINT fk_booking_payments_fx_quote FOREIGN KEY (fx_quote_id) REFERENCES finance.fx_quotes(id) NOT VALID;


--
-- TOC entry 7771 (class 2606 OID 21390)
-- Name: bookings fk_bookings_applied_coupon; Type: FK CONSTRAINT; Schema: booking; Owner: postgres
--

ALTER TABLE ONLY booking.bookings
    ADD CONSTRAINT fk_bookings_applied_coupon FOREIGN KEY (applied_coupon_id) REFERENCES marketing.user_discount_coupons(id);


--
-- TOC entry 7772 (class 2606 OID 23083)
-- Name: bookings fk_bookings_fx_quote; Type: FK CONSTRAINT; Schema: booking; Owner: postgres
--

ALTER TABLE ONLY booking.bookings
    ADD CONSTRAINT fk_bookings_fx_quote FOREIGN KEY (fx_quote_id) REFERENCES finance.fx_quotes(id) NOT VALID;


--
-- TOC entry 7773 (class 2606 OID 19947)
-- Name: bookings fk_bookings_wallet_payment_intent; Type: FK CONSTRAINT; Schema: booking; Owner: postgres
--

ALTER TABLE ONLY booking.bookings
    ADD CONSTRAINT fk_bookings_wallet_payment_intent FOREIGN KEY (wallet_payment_intent_id) REFERENCES customer.wallet_payment_intents(id) ON DELETE SET NULL;


--
-- TOC entry 7829 (class 2606 OID 20083)
-- Name: payments payments_booking_id_fkey; Type: FK CONSTRAINT; Schema: booking; Owner: postgres
--

ALTER TABLE ONLY booking.payments
    ADD CONSTRAINT payments_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES booking.bookings(id) ON DELETE CASCADE;


--
-- TOC entry 7794 (class 2606 OID 19646)
-- Name: picked_locations LocationId; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.picked_locations
    ADD CONSTRAINT "LocationId" FOREIGN KEY (locationid) REFERENCES category.locations(id) NOT VALID;


--
-- TOC entry 7721 (class 2606 OID 18398)
-- Name: categories categories_group_id_fkey; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.categories
    ADD CONSTRAINT categories_group_id_fkey FOREIGN KEY (group_id) REFERENCES category.category_groups(id);


--
-- TOC entry 7776 (class 2606 OID 18551)
-- Name: addon_details fk_addon_details_addons; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.addon_details
    ADD CONSTRAINT fk_addon_details_addons FOREIGN KEY (addon_id) REFERENCES category.addons(id) ON DELETE CASCADE;


--
-- TOC entry 7722 (class 2606 OID 17211)
-- Name: categories fk_categories_categories_parent_id; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.categories
    ADD CONSTRAINT fk_categories_categories_parent_id FOREIGN KEY (parent_id) REFERENCES category.categories(id);


--
-- TOC entry 7775 (class 2606 OID 23063)
-- Name: addons fk_category_addons_currency_code; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.addons
    ADD CONSTRAINT fk_category_addons_currency_code FOREIGN KEY (currency_code) REFERENCES finance.currencies(code) NOT VALID;


--
-- TOC entry 7723 (class 2606 OID 17216)
-- Name: locations fk_locations_location_type_location_type_id; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.locations
    ADD CONSTRAINT fk_locations_location_type_location_type_id FOREIGN KEY (location_type_id) REFERENCES category."LocationType"(id) ON DELETE CASCADE;


--
-- TOC entry 7724 (class 2606 OID 17221)
-- Name: locations fk_locations_locations_parent_id; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.locations
    ADD CONSTRAINT fk_locations_locations_parent_id FOREIGN KEY (parent_id) REFERENCES category.locations(id);


--
-- TOC entry 7725 (class 2606 OID 17226)
-- Name: provider_attribute_definition_domain_options fk_provider_attribute_definition_domain_options_provider_attri; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.provider_attribute_definition_domain_options
    ADD CONSTRAINT fk_provider_attribute_definition_domain_options_provider_attri FOREIGN KEY (provider_attribute_definition_id) REFERENCES category.provider_attribute_definitions(id) ON DELETE CASCADE;


--
-- TOC entry 7726 (class 2606 OID 17231)
-- Name: provider_attribute_definitions fk_provider_attribute_definitions_attribute_types_attribute_ty; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.provider_attribute_definitions
    ADD CONSTRAINT fk_provider_attribute_definitions_attribute_types_attribute_ty FOREIGN KEY (attribute_type_id) REFERENCES category.attribute_types(id) ON DELETE CASCADE;


--
-- TOC entry 7727 (class 2606 OID 17236)
-- Name: provider_attribute_definitions fk_provider_attribute_definitions_provider_types_provider_type; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.provider_attribute_definitions
    ADD CONSTRAINT fk_provider_attribute_definitions_provider_types_provider_type FOREIGN KEY (provider_type_id) REFERENCES category.provider_types(id) ON DELETE CASCADE;


--
-- TOC entry 7728 (class 2606 OID 17241)
-- Name: provider_attributes fk_provider_attributes_service_providers_service_provider_id; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.provider_attributes
    ADD CONSTRAINT fk_provider_attributes_service_providers_service_provider_id FOREIGN KEY (service_provider_id) REFERENCES category.service_providers(id) ON DELETE CASCADE;


--
-- TOC entry 7729 (class 2606 OID 17246)
-- Name: provider_gallery_items fk_provider_gallery_items_service_providers_service_provider_id; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.provider_gallery_items
    ADD CONSTRAINT fk_provider_gallery_items_service_providers_service_provider_id FOREIGN KEY (service_provider_id) REFERENCES category.service_providers(id) ON DELETE CASCADE;


--
-- TOC entry 7788 (class 2606 OID 19476)
-- Name: provider_languages fk_provider_languages_service_provider; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.provider_languages
    ADD CONSTRAINT fk_provider_languages_service_provider FOREIGN KEY (service_provider_id) REFERENCES category.service_providers(id) ON DELETE CASCADE;


--
-- TOC entry 7730 (class 2606 OID 22861)
-- Name: provider_policies fk_provider_policies_provider_policy_type; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.provider_policies
    ADD CONSTRAINT fk_provider_policies_provider_policy_type FOREIGN KEY (provider_policy_type_id) REFERENCES category.provider_policy_types(id) ON DELETE SET NULL;


--
-- TOC entry 7731 (class 2606 OID 17251)
-- Name: provider_policies fk_provider_policies_service_providers_service_provider_id; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.provider_policies
    ADD CONSTRAINT fk_provider_policies_service_providers_service_provider_id FOREIGN KEY (service_provider_id) REFERENCES category.service_providers(id) ON DELETE CASCADE;


--
-- TOC entry 7790 (class 2606 OID 19520)
-- Name: provider_service_gallery_items fk_provider_service_gallery_items_provider_service; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.provider_service_gallery_items
    ADD CONSTRAINT fk_provider_service_gallery_items_provider_service FOREIGN KEY (provider_service_id) REFERENCES category.provider_services(id) ON DELETE CASCADE;


--
-- TOC entry 7732 (class 2606 OID 23093)
-- Name: provider_services fk_provider_services_currency_finance; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.provider_services
    ADD CONSTRAINT fk_provider_services_currency_finance FOREIGN KEY (currency) REFERENCES finance.currencies(code) NOT VALID;


--
-- TOC entry 7733 (class 2606 OID 17256)
-- Name: provider_services fk_provider_services_service_definitions_service_definition_id; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.provider_services
    ADD CONSTRAINT fk_provider_services_service_definitions_service_definition_id FOREIGN KEY (service_definition_id) REFERENCES category.service_definitions(id);


--
-- TOC entry 7734 (class 2606 OID 17261)
-- Name: provider_services fk_provider_services_service_providers_service_provider_id; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.provider_services
    ADD CONSTRAINT fk_provider_services_service_providers_service_provider_id FOREIGN KEY (service_provider_id) REFERENCES category.service_providers(id) ON DELETE CASCADE;


--
-- TOC entry 7735 (class 2606 OID 17266)
-- Name: provider_staffs fk_provider_staffs_service_providers_service_provider_id; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.provider_staffs
    ADD CONSTRAINT fk_provider_staffs_service_providers_service_provider_id FOREIGN KEY (service_provider_id) REFERENCES category.service_providers(id) ON DELETE CASCADE;


--
-- TOC entry 7736 (class 2606 OID 17271)
-- Name: provider_staffs fk_provider_staffs_staffs_staff_id; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.provider_staffs
    ADD CONSTRAINT fk_provider_staffs_staffs_staff_id FOREIGN KEY (staff_id) REFERENCES category.staff(id);


--
-- TOC entry 7777 (class 2606 OID 18568)
-- Name: provider_service_addons fk_psa_addons; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.provider_service_addons
    ADD CONSTRAINT fk_psa_addons FOREIGN KEY (addon_id) REFERENCES category.addons(id) ON DELETE CASCADE;


--
-- TOC entry 7778 (class 2606 OID 18563)
-- Name: provider_service_addons fk_psa_provider_services; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.provider_service_addons
    ADD CONSTRAINT fk_psa_provider_services FOREIGN KEY (provider_service_id) REFERENCES category.provider_services(id) ON DELETE CASCADE;


--
-- TOC entry 7766 (class 2606 OID 19461)
-- Name: review_images fk_review_images_service_provider_comments_review_id; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.review_images
    ADD CONSTRAINT fk_review_images_service_provider_comments_review_id FOREIGN KEY (review_id) REFERENCES category.service_provider_comments(id) ON DELETE CASCADE;


--
-- TOC entry 7737 (class 2606 OID 17276)
-- Name: service_attribute_definition_options fk_service_attribute_definition_options_service_attribute_defi; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.service_attribute_definition_options
    ADD CONSTRAINT fk_service_attribute_definition_options_service_attribute_defi FOREIGN KEY (service_attribute_definition_id) REFERENCES category.service_attribute_definitions(id) ON DELETE CASCADE;


--
-- TOC entry 7738 (class 2606 OID 17281)
-- Name: service_attribute_definitions fk_service_attribute_definitions_attribute_types_attribute_typ; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.service_attribute_definitions
    ADD CONSTRAINT fk_service_attribute_definitions_attribute_types_attribute_typ FOREIGN KEY (attribute_type_id) REFERENCES category.attribute_types(id) ON DELETE CASCADE;


--
-- TOC entry 7739 (class 2606 OID 17286)
-- Name: service_attribute_definitions fk_service_attribute_definitions_service_definitions_service_d; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.service_attribute_definitions
    ADD CONSTRAINT fk_service_attribute_definitions_service_definitions_service_d FOREIGN KEY (service_definition_id) REFERENCES category.service_definitions(id) ON DELETE CASCADE;


--
-- TOC entry 7740 (class 2606 OID 17291)
-- Name: service_attribute_values fk_service_attribute_values_provider_services_provider_service; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.service_attribute_values
    ADD CONSTRAINT fk_service_attribute_values_provider_services_provider_service FOREIGN KEY (provider_service_id) REFERENCES category.provider_services(id) ON DELETE CASCADE;


--
-- TOC entry 7741 (class 2606 OID 17296)
-- Name: service_definition_domain_requirements fk_service_definition_domain_requirements_service_definitions_; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.service_definition_domain_requirements
    ADD CONSTRAINT fk_service_definition_domain_requirements_service_definitions_ FOREIGN KEY (service_definition_id) REFERENCES category.service_definitions(id) ON DELETE CASCADE;


--
-- TOC entry 7742 (class 2606 OID 17301)
-- Name: service_definitions fk_service_definitions_categories_category_id; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.service_definitions
    ADD CONSTRAINT fk_service_definitions_categories_category_id FOREIGN KEY (category_id) REFERENCES category.categories(id);


--
-- TOC entry 7743 (class 2606 OID 23098)
-- Name: service_definitions fk_service_definitions_currency_finance; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.service_definitions
    ADD CONSTRAINT fk_service_definitions_currency_finance FOREIGN KEY (currency) REFERENCES finance.currencies(code) NOT VALID;


--
-- TOC entry 7744 (class 2606 OID 17306)
-- Name: service_provider_comments fk_service_provider_comments_service_providers_service_provide; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.service_provider_comments
    ADD CONSTRAINT fk_service_provider_comments_service_providers_service_provide FOREIGN KEY (service_provider_id) REFERENCES category.service_providers(id) ON DELETE CASCADE;


--
-- TOC entry 7745 (class 2606 OID 17311)
-- Name: service_provider_requests fk_service_provider_requests_service_provider_request_statuses; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.service_provider_requests
    ADD CONSTRAINT fk_service_provider_requests_service_provider_request_statuses FOREIGN KEY (request_status_id) REFERENCES category.service_provider_request_statuses(id) ON DELETE CASCADE;


--
-- TOC entry 7746 (class 2606 OID 17316)
-- Name: service_provider_requests fk_service_provider_requests_service_providers_service_provide; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.service_provider_requests
    ADD CONSTRAINT fk_service_provider_requests_service_providers_service_provide FOREIGN KEY (service_provider_id) REFERENCES category.service_providers(id) ON DELETE CASCADE;


--
-- TOC entry 7747 (class 2606 OID 17321)
-- Name: service_providers fk_service_providers_provider_types_provider_type_id; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.service_providers
    ADD CONSTRAINT fk_service_providers_provider_types_provider_type_id FOREIGN KEY (provider_type_id) REFERENCES category.provider_types(id);


--
-- TOC entry 7748 (class 2606 OID 17326)
-- Name: service_providers fk_service_providers_service_provider_grades_grade_id; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.service_providers
    ADD CONSTRAINT fk_service_providers_service_provider_grades_grade_id FOREIGN KEY (grade_id) REFERENCES category.service_provider_grades(id);


--
-- TOC entry 7781 (class 2606 OID 19356)
-- Name: service_upload_file_requirements fk_service_upload_file_requirements_service_definition; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.service_upload_file_requirements
    ADD CONSTRAINT fk_service_upload_file_requirements_service_definition FOREIGN KEY (service_definition_id) REFERENCES category.service_definitions(id) ON DELETE CASCADE;


--
-- TOC entry 7786 (class 2606 OID 19436)
-- Name: staff_achievements fk_staff_achievements_staff; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.staff_achievements
    ADD CONSTRAINT fk_staff_achievements_staff FOREIGN KEY (staff_id) REFERENCES category.staff(id) ON DELETE CASCADE;


--
-- TOC entry 7749 (class 2606 OID 17331)
-- Name: staff_availabilities fk_staff_availabilities_staff_availability_statuses_availabili; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.staff_availabilities
    ADD CONSTRAINT fk_staff_availabilities_staff_availability_statuses_availabili FOREIGN KEY (availability_status_id) REFERENCES category.staff_availability_statuses(id) ON DELETE CASCADE;


--
-- TOC entry 7750 (class 2606 OID 17336)
-- Name: staff_availabilities fk_staff_availabilities_staffs_staff_id; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.staff_availabilities
    ADD CONSTRAINT fk_staff_availabilities_staffs_staff_id FOREIGN KEY (staff_id) REFERENCES category.staff(id) ON DELETE CASCADE;


--
-- TOC entry 7787 (class 2606 OID 19454)
-- Name: staff_before_after fk_staff_before_after_staff; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.staff_before_after
    ADD CONSTRAINT fk_staff_before_after_staff FOREIGN KEY (staff_id) REFERENCES category.staff(id) ON DELETE CASCADE;


--
-- TOC entry 7785 (class 2606 OID 19419)
-- Name: staff_certifications fk_staff_certifications_staff; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.staff_certifications
    ADD CONSTRAINT fk_staff_certifications_staff FOREIGN KEY (staff_id) REFERENCES category.staff(id) ON DELETE CASCADE;


--
-- TOC entry 7779 (class 2606 OID 18587)
-- Name: staff_credentials fk_staff_credentials_staff; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.staff_credentials
    ADD CONSTRAINT fk_staff_credentials_staff FOREIGN KEY (staff_id) REFERENCES category.staff(id) ON DELETE CASCADE;


--
-- TOC entry 7784 (class 2606 OID 19403)
-- Name: staff_education fk_staff_education_staff; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.staff_education
    ADD CONSTRAINT fk_staff_education_staff FOREIGN KEY (staff_id) REFERENCES category.staff(id) ON DELETE CASCADE;


--
-- TOC entry 7789 (class 2606 OID 19498)
-- Name: staff_gallery_items fk_staff_gallery_items_staff; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.staff_gallery_items
    ADD CONSTRAINT fk_staff_gallery_items_staff FOREIGN KEY (staff_id) REFERENCES category.staff(id) ON DELETE CASCADE;


--
-- TOC entry 7782 (class 2606 OID 19375)
-- Name: staff_languages fk_staff_languages_staff; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.staff_languages
    ADD CONSTRAINT fk_staff_languages_staff FOREIGN KEY (staff_id) REFERENCES category.staff(id) ON DELETE CASCADE;


--
-- TOC entry 7751 (class 2606 OID 19250)
-- Name: staff_services fk_staff_services_service_definitions_service_definition_id; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.staff_services
    ADD CONSTRAINT fk_staff_services_service_definitions_service_definition_id FOREIGN KEY (service_definition_id) REFERENCES category.service_definitions(id) ON DELETE CASCADE;


--
-- TOC entry 7752 (class 2606 OID 17341)
-- Name: staff_services fk_staff_services_staffs_staff_id; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.staff_services
    ADD CONSTRAINT fk_staff_services_staffs_staff_id FOREIGN KEY (staff_id) REFERENCES category.staff(id) ON DELETE CASCADE;


--
-- TOC entry 7783 (class 2606 OID 19389)
-- Name: staff_specializations fk_staff_specializations_staff; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.staff_specializations
    ADD CONSTRAINT fk_staff_specializations_staff FOREIGN KEY (staff_id) REFERENCES category.staff(id) ON DELETE CASCADE;


--
-- TOC entry 7957 (class 2606 OID 22634)
-- Name: service_definition_addon_provider_types service_definition_addon_provider_ty_service_definition_id_fkey; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.service_definition_addon_provider_types
    ADD CONSTRAINT service_definition_addon_provider_ty_service_definition_id_fkey FOREIGN KEY (service_definition_id) REFERENCES category.service_definitions(id) ON DELETE CASCADE;


--
-- TOC entry 7958 (class 2606 OID 22639)
-- Name: service_definition_addon_provider_types service_definition_addon_provider_types_provider_type_id_fkey; Type: FK CONSTRAINT; Schema: category; Owner: postgres
--

ALTER TABLE ONLY category.service_definition_addon_provider_types
    ADD CONSTRAINT service_definition_addon_provider_types_provider_type_id_fkey FOREIGN KEY (provider_type_id) REFERENCES category.provider_types(id) ON DELETE CASCADE;


--
-- TOC entry 7978 (class 2606 OID 23190)
-- Name: booking_charge_lines booking_charge_lines_addon_id_fkey; Type: FK CONSTRAINT; Schema: commercial; Owner: postgres
--

ALTER TABLE ONLY commercial.booking_charge_lines
    ADD CONSTRAINT booking_charge_lines_addon_id_fkey FOREIGN KEY (addon_id) REFERENCES category.addons(id) ON DELETE SET NULL;


--
-- TOC entry 7979 (class 2606 OID 23165)
-- Name: booking_charge_lines booking_charge_lines_booking_addon_id_fkey; Type: FK CONSTRAINT; Schema: commercial; Owner: postgres
--

ALTER TABLE ONLY commercial.booking_charge_lines
    ADD CONSTRAINT booking_charge_lines_booking_addon_id_fkey FOREIGN KEY (booking_addon_id) REFERENCES booking.booking_addons(id) ON DELETE CASCADE;


--
-- TOC entry 7980 (class 2606 OID 23160)
-- Name: booking_charge_lines booking_charge_lines_booking_child_id_fkey; Type: FK CONSTRAINT; Schema: commercial; Owner: postgres
--

ALTER TABLE ONLY commercial.booking_charge_lines
    ADD CONSTRAINT booking_charge_lines_booking_child_id_fkey FOREIGN KEY (booking_child_id) REFERENCES booking.booking_child_bookings(id) ON DELETE CASCADE;


--
-- TOC entry 7981 (class 2606 OID 23155)
-- Name: booking_charge_lines booking_charge_lines_booking_id_fkey; Type: FK CONSTRAINT; Schema: commercial; Owner: postgres
--

ALTER TABLE ONLY commercial.booking_charge_lines
    ADD CONSTRAINT booking_charge_lines_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES booking.bookings(id) ON DELETE CASCADE;


--
-- TOC entry 7982 (class 2606 OID 23200)
-- Name: booking_charge_lines booking_charge_lines_fx_quote_id_fkey; Type: FK CONSTRAINT; Schema: commercial; Owner: postgres
--

ALTER TABLE ONLY commercial.booking_charge_lines
    ADD CONSTRAINT booking_charge_lines_fx_quote_id_fkey FOREIGN KEY (fx_quote_id) REFERENCES finance.fx_quotes(id) ON DELETE SET NULL;


--
-- TOC entry 7983 (class 2606 OID 23195)
-- Name: booking_charge_lines booking_charge_lines_policy_id_fkey; Type: FK CONSTRAINT; Schema: commercial; Owner: postgres
--

ALTER TABLE ONLY commercial.booking_charge_lines
    ADD CONSTRAINT booking_charge_lines_policy_id_fkey FOREIGN KEY (policy_id) REFERENCES commercial.compensation_policies(id) ON DELETE SET NULL;


--
-- TOC entry 7984 (class 2606 OID 23170)
-- Name: booking_charge_lines booking_charge_lines_provider_id_fkey; Type: FK CONSTRAINT; Schema: commercial; Owner: postgres
--

ALTER TABLE ONLY commercial.booking_charge_lines
    ADD CONSTRAINT booking_charge_lines_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES category.service_providers(id) ON DELETE SET NULL;


--
-- TOC entry 7985 (class 2606 OID 23180)
-- Name: booking_charge_lines booking_charge_lines_provider_service_id_fkey; Type: FK CONSTRAINT; Schema: commercial; Owner: postgres
--

ALTER TABLE ONLY commercial.booking_charge_lines
    ADD CONSTRAINT booking_charge_lines_provider_service_id_fkey FOREIGN KEY (provider_service_id) REFERENCES category.provider_services(id) ON DELETE SET NULL;


--
-- TOC entry 7986 (class 2606 OID 23175)
-- Name: booking_charge_lines booking_charge_lines_provider_type_id_fkey; Type: FK CONSTRAINT; Schema: commercial; Owner: postgres
--

ALTER TABLE ONLY commercial.booking_charge_lines
    ADD CONSTRAINT booking_charge_lines_provider_type_id_fkey FOREIGN KEY (provider_type_id) REFERENCES category.provider_types(id) ON DELETE SET NULL;


--
-- TOC entry 7987 (class 2606 OID 23185)
-- Name: booking_charge_lines booking_charge_lines_service_definition_id_fkey; Type: FK CONSTRAINT; Schema: commercial; Owner: postgres
--

ALTER TABLE ONLY commercial.booking_charge_lines
    ADD CONSTRAINT booking_charge_lines_service_definition_id_fkey FOREIGN KEY (service_definition_id) REFERENCES category.service_definitions(id) ON DELETE SET NULL;


--
-- TOC entry 7988 (class 2606 OID 23229)
-- Name: provider_ledgers provider_ledgers_booking_child_id_fkey; Type: FK CONSTRAINT; Schema: commercial; Owner: postgres
--

ALTER TABLE ONLY commercial.provider_ledgers
    ADD CONSTRAINT provider_ledgers_booking_child_id_fkey FOREIGN KEY (booking_child_id) REFERENCES booking.booking_child_bookings(id) ON DELETE SET NULL;


--
-- TOC entry 7989 (class 2606 OID 23224)
-- Name: provider_ledgers provider_ledgers_booking_id_fkey; Type: FK CONSTRAINT; Schema: commercial; Owner: postgres
--

ALTER TABLE ONLY commercial.provider_ledgers
    ADD CONSTRAINT provider_ledgers_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES booking.bookings(id) ON DELETE SET NULL;


--
-- TOC entry 7990 (class 2606 OID 23234)
-- Name: provider_ledgers provider_ledgers_charge_line_id_fkey; Type: FK CONSTRAINT; Schema: commercial; Owner: postgres
--

ALTER TABLE ONLY commercial.provider_ledgers
    ADD CONSTRAINT provider_ledgers_charge_line_id_fkey FOREIGN KEY (charge_line_id) REFERENCES commercial.booking_charge_lines(id) ON DELETE SET NULL;


--
-- TOC entry 7991 (class 2606 OID 23219)
-- Name: provider_ledgers provider_ledgers_provider_id_fkey; Type: FK CONSTRAINT; Schema: commercial; Owner: postgres
--

ALTER TABLE ONLY commercial.provider_ledgers
    ADD CONSTRAINT provider_ledgers_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES category.service_providers(id) ON DELETE CASCADE;


--
-- TOC entry 8002 (class 2606 OID 23355)
-- Name: provider_settlement_reversals provider_settlement_reversals_booking_child_id_fkey; Type: FK CONSTRAINT; Schema: commercial; Owner: postgres
--

ALTER TABLE ONLY commercial.provider_settlement_reversals
    ADD CONSTRAINT provider_settlement_reversals_booking_child_id_fkey FOREIGN KEY (booking_child_id) REFERENCES booking.booking_child_bookings(id) ON DELETE SET NULL;


--
-- TOC entry 8003 (class 2606 OID 23350)
-- Name: provider_settlement_reversals provider_settlement_reversals_booking_id_fkey; Type: FK CONSTRAINT; Schema: commercial; Owner: postgres
--

ALTER TABLE ONLY commercial.provider_settlement_reversals
    ADD CONSTRAINT provider_settlement_reversals_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES booking.bookings(id) ON DELETE CASCADE;


--
-- TOC entry 8004 (class 2606 OID 23345)
-- Name: provider_settlement_reversals provider_settlement_reversals_provider_id_fkey; Type: FK CONSTRAINT; Schema: commercial; Owner: postgres
--

ALTER TABLE ONLY commercial.provider_settlement_reversals
    ADD CONSTRAINT provider_settlement_reversals_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES category.service_providers(id) ON DELETE CASCADE;


--
-- TOC entry 8005 (class 2606 OID 23365)
-- Name: provider_settlement_reversals provider_settlement_reversals_provider_ledger_id_fkey; Type: FK CONSTRAINT; Schema: commercial; Owner: postgres
--

ALTER TABLE ONLY commercial.provider_settlement_reversals
    ADD CONSTRAINT provider_settlement_reversals_provider_ledger_id_fkey FOREIGN KEY (provider_ledger_id) REFERENCES commercial.provider_ledgers(id) ON DELETE SET NULL;


--
-- TOC entry 8006 (class 2606 OID 23360)
-- Name: provider_settlement_reversals provider_settlement_reversals_refund_line_id_fkey; Type: FK CONSTRAINT; Schema: commercial; Owner: postgres
--

ALTER TABLE ONLY commercial.provider_settlement_reversals
    ADD CONSTRAINT provider_settlement_reversals_refund_line_id_fkey FOREIGN KEY (refund_line_id) REFERENCES commercial.refund_lines(id) ON DELETE CASCADE;


--
-- TOC entry 7994 (class 2606 OID 23295)
-- Name: refund_lines refund_lines_booking_addon_id_fkey; Type: FK CONSTRAINT; Schema: commercial; Owner: postgres
--

ALTER TABLE ONLY commercial.refund_lines
    ADD CONSTRAINT refund_lines_booking_addon_id_fkey FOREIGN KEY (booking_addon_id) REFERENCES booking.booking_addons(id) ON DELETE CASCADE;


--
-- TOC entry 7995 (class 2606 OID 23290)
-- Name: refund_lines refund_lines_booking_child_id_fkey; Type: FK CONSTRAINT; Schema: commercial; Owner: postgres
--

ALTER TABLE ONLY commercial.refund_lines
    ADD CONSTRAINT refund_lines_booking_child_id_fkey FOREIGN KEY (booking_child_id) REFERENCES booking.booking_child_bookings(id) ON DELETE CASCADE;


--
-- TOC entry 7996 (class 2606 OID 23285)
-- Name: refund_lines refund_lines_booking_id_fkey; Type: FK CONSTRAINT; Schema: commercial; Owner: postgres
--

ALTER TABLE ONLY commercial.refund_lines
    ADD CONSTRAINT refund_lines_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES booking.bookings(id) ON DELETE CASCADE;


--
-- TOC entry 7997 (class 2606 OID 23300)
-- Name: refund_lines refund_lines_charge_line_id_fkey; Type: FK CONSTRAINT; Schema: commercial; Owner: postgres
--

ALTER TABLE ONLY commercial.refund_lines
    ADD CONSTRAINT refund_lines_charge_line_id_fkey FOREIGN KEY (charge_line_id) REFERENCES commercial.booking_charge_lines(id) ON DELETE SET NULL;


--
-- TOC entry 7998 (class 2606 OID 23305)
-- Name: refund_lines refund_lines_fx_quote_id_fkey; Type: FK CONSTRAINT; Schema: commercial; Owner: postgres
--

ALTER TABLE ONLY commercial.refund_lines
    ADD CONSTRAINT refund_lines_fx_quote_id_fkey FOREIGN KEY (fx_quote_id) REFERENCES finance.fx_quotes(id) ON DELETE SET NULL;


--
-- TOC entry 7999 (class 2606 OID 23280)
-- Name: refund_lines refund_lines_refund_request_id_fkey; Type: FK CONSTRAINT; Schema: commercial; Owner: postgres
--

ALTER TABLE ONLY commercial.refund_lines
    ADD CONSTRAINT refund_lines_refund_request_id_fkey FOREIGN KEY (refund_request_id) REFERENCES commercial.refund_requests(id) ON DELETE CASCADE;


--
-- TOC entry 7992 (class 2606 OID 23253)
-- Name: refund_requests refund_requests_booking_id_fkey; Type: FK CONSTRAINT; Schema: commercial; Owner: postgres
--

ALTER TABLE ONLY commercial.refund_requests
    ADD CONSTRAINT refund_requests_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES booking.bookings(id) ON DELETE CASCADE;


--
-- TOC entry 7993 (class 2606 OID 23258)
-- Name: refund_requests refund_requests_payment_id_fkey; Type: FK CONSTRAINT; Schema: commercial; Owner: postgres
--

ALTER TABLE ONLY commercial.refund_requests
    ADD CONSTRAINT refund_requests_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES booking.payments(id) ON DELETE SET NULL;


--
-- TOC entry 8000 (class 2606 OID 23328)
-- Name: refunds refunds_payment_id_fkey; Type: FK CONSTRAINT; Schema: commercial; Owner: postgres
--

ALTER TABLE ONLY commercial.refunds
    ADD CONSTRAINT refunds_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES booking.payments(id) ON DELETE SET NULL;


--
-- TOC entry 8001 (class 2606 OID 23323)
-- Name: refunds refunds_refund_request_id_fkey; Type: FK CONSTRAINT; Schema: commercial; Owner: postgres
--

ALTER TABLE ONLY commercial.refunds
    ADD CONSTRAINT refunds_refund_request_id_fkey FOREIGN KEY (refund_request_id) REFERENCES commercial.refund_requests(id) ON DELETE CASCADE;


--
-- TOC entry 7753 (class 2606 OID 17346)
-- Name: consulting_selected_document_references fk_consulting_selected_document_references_consultings_consult; Type: FK CONSTRAINT; Schema: customer; Owner: postgres
--

ALTER TABLE ONLY customer.consulting_selected_document_references
    ADD CONSTRAINT fk_consulting_selected_document_references_consultings_consult FOREIGN KEY (consulting_id) REFERENCES customer.consultings(id) ON DELETE CASCADE;


--
-- TOC entry 7754 (class 2606 OID 17351)
-- Name: consultings fk_consultings_customers_customer_id; Type: FK CONSTRAINT; Schema: customer; Owner: postgres
--

ALTER TABLE ONLY customer.consultings
    ADD CONSTRAINT fk_consultings_customers_customer_id FOREIGN KEY (customer_id) REFERENCES customer.customers(id) ON DELETE RESTRICT;


--
-- TOC entry 7755 (class 2606 OID 17356)
-- Name: customer_documents fk_customer_documents_customer_document_types_document_type_id; Type: FK CONSTRAINT; Schema: customer; Owner: postgres
--

ALTER TABLE ONLY customer.customer_documents
    ADD CONSTRAINT fk_customer_documents_customer_document_types_document_type_id FOREIGN KEY (document_type_id) REFERENCES customer.customer_document_types(id) ON DELETE CASCADE;


--
-- TOC entry 7756 (class 2606 OID 17361)
-- Name: customer_documents fk_customer_documents_customers_customer_id; Type: FK CONSTRAINT; Schema: customer; Owner: postgres
--

ALTER TABLE ONLY customer.customer_documents
    ADD CONSTRAINT fk_customer_documents_customers_customer_id FOREIGN KEY (customer_id) REFERENCES customer.customers(id) ON DELETE CASCADE;


--
-- TOC entry 7780 (class 2606 OID 19322)
-- Name: favorites fk_favorites_customer; Type: FK CONSTRAINT; Schema: customer; Owner: postgres
--

ALTER TABLE ONLY customer.favorites
    ADD CONSTRAINT fk_favorites_customer FOREIGN KEY (customer_id) REFERENCES customer.customers(id) ON DELETE CASCADE;


--
-- TOC entry 7960 (class 2606 OID 22684)
-- Name: medical_profile_allergies fk_medical_profile_allergies_customer; Type: FK CONSTRAINT; Schema: customer; Owner: postgres
--

ALTER TABLE ONLY customer.medical_profile_allergies
    ADD CONSTRAINT fk_medical_profile_allergies_customer FOREIGN KEY (customer_id) REFERENCES customer.customers(id) ON DELETE CASCADE;


--
-- TOC entry 7962 (class 2606 OID 22714)
-- Name: medical_profile_conditions fk_medical_profile_conditions_customer; Type: FK CONSTRAINT; Schema: customer; Owner: postgres
--

ALTER TABLE ONLY customer.medical_profile_conditions
    ADD CONSTRAINT fk_medical_profile_conditions_customer FOREIGN KEY (customer_id) REFERENCES customer.customers(id) ON DELETE CASCADE;


--
-- TOC entry 7963 (class 2606 OID 22745)
-- Name: medical_profile_documents fk_medical_profile_documents_created_by; Type: FK CONSTRAINT; Schema: customer; Owner: postgres
--

ALTER TABLE ONLY customer.medical_profile_documents
    ADD CONSTRAINT fk_medical_profile_documents_created_by FOREIGN KEY (created_by) REFERENCES identity.asp_net_users(id) ON DELETE SET NULL;


--
-- TOC entry 7964 (class 2606 OID 22730)
-- Name: medical_profile_documents fk_medical_profile_documents_customer; Type: FK CONSTRAINT; Schema: customer; Owner: postgres
--

ALTER TABLE ONLY customer.medical_profile_documents
    ADD CONSTRAINT fk_medical_profile_documents_customer FOREIGN KEY (customer_id) REFERENCES customer.customers(id) ON DELETE CASCADE;


--
-- TOC entry 7965 (class 2606 OID 22735)
-- Name: medical_profile_documents fk_medical_profile_documents_document_type; Type: FK CONSTRAINT; Schema: customer; Owner: postgres
--

ALTER TABLE ONLY customer.medical_profile_documents
    ADD CONSTRAINT fk_medical_profile_documents_document_type FOREIGN KEY (document_type_id) REFERENCES customer.customer_document_types(id) ON DELETE SET NULL;


--
-- TOC entry 7966 (class 2606 OID 22740)
-- Name: medical_profile_documents fk_medical_profile_documents_media; Type: FK CONSTRAINT; Schema: customer; Owner: postgres
--

ALTER TABLE ONLY customer.medical_profile_documents
    ADD CONSTRAINT fk_medical_profile_documents_media FOREIGN KEY (media_id) REFERENCES media.media_library(id) ON DELETE SET NULL;


--
-- TOC entry 7961 (class 2606 OID 22699)
-- Name: medical_profile_medications fk_medical_profile_medications_customer; Type: FK CONSTRAINT; Schema: customer; Owner: postgres
--

ALTER TABLE ONLY customer.medical_profile_medications
    ADD CONSTRAINT fk_medical_profile_medications_customer FOREIGN KEY (customer_id) REFERENCES customer.customers(id) ON DELETE CASCADE;


--
-- TOC entry 7959 (class 2606 OID 22667)
-- Name: medical_profiles fk_medical_profiles_customer; Type: FK CONSTRAINT; Schema: customer; Owner: postgres
--

ALTER TABLE ONLY customer.medical_profiles
    ADD CONSTRAINT fk_medical_profiles_customer FOREIGN KEY (customer_id) REFERENCES customer.customers(id) ON DELETE CASCADE;


--
-- TOC entry 7808 (class 2606 OID 19860)
-- Name: wallet_accounts fk_wallet_accounts_user; Type: FK CONSTRAINT; Schema: customer; Owner: postgres
--

ALTER TABLE ONLY customer.wallet_accounts
    ADD CONSTRAINT fk_wallet_accounts_user FOREIGN KEY (user_id) REFERENCES identity.asp_net_users(id) ON DELETE CASCADE;


--
-- TOC entry 7809 (class 2606 OID 19891)
-- Name: wallet_payment_intents fk_wallet_payment_intents_booking; Type: FK CONSTRAINT; Schema: customer; Owner: postgres
--

ALTER TABLE ONLY customer.wallet_payment_intents
    ADD CONSTRAINT fk_wallet_payment_intents_booking FOREIGN KEY (booking_id) REFERENCES booking.bookings(id) ON DELETE SET NULL;


--
-- TOC entry 7810 (class 2606 OID 19886)
-- Name: wallet_payment_intents fk_wallet_payment_intents_user; Type: FK CONSTRAINT; Schema: customer; Owner: postgres
--

ALTER TABLE ONLY customer.wallet_payment_intents
    ADD CONSTRAINT fk_wallet_payment_intents_user FOREIGN KEY (user_id) REFERENCES identity.asp_net_users(id) ON DELETE CASCADE;


--
-- TOC entry 7811 (class 2606 OID 19881)
-- Name: wallet_payment_intents fk_wallet_payment_intents_wallet_account; Type: FK CONSTRAINT; Schema: customer; Owner: postgres
--

ALTER TABLE ONLY customer.wallet_payment_intents
    ADD CONSTRAINT fk_wallet_payment_intents_wallet_account FOREIGN KEY (wallet_account_id) REFERENCES customer.wallet_accounts(id) ON DELETE CASCADE;


--
-- TOC entry 7812 (class 2606 OID 19927)
-- Name: wallet_transactions fk_wallet_transactions_booking; Type: FK CONSTRAINT; Schema: customer; Owner: postgres
--

ALTER TABLE ONLY customer.wallet_transactions
    ADD CONSTRAINT fk_wallet_transactions_booking FOREIGN KEY (booking_id) REFERENCES booking.bookings(id) ON DELETE SET NULL;


--
-- TOC entry 7813 (class 2606 OID 19932)
-- Name: wallet_transactions fk_wallet_transactions_payment_intent; Type: FK CONSTRAINT; Schema: customer; Owner: postgres
--

ALTER TABLE ONLY customer.wallet_transactions
    ADD CONSTRAINT fk_wallet_transactions_payment_intent FOREIGN KEY (payment_intent_id) REFERENCES customer.wallet_payment_intents(id) ON DELETE SET NULL;


--
-- TOC entry 7814 (class 2606 OID 19922)
-- Name: wallet_transactions fk_wallet_transactions_user; Type: FK CONSTRAINT; Schema: customer; Owner: postgres
--

ALTER TABLE ONLY customer.wallet_transactions
    ADD CONSTRAINT fk_wallet_transactions_user FOREIGN KEY (user_id) REFERENCES identity.asp_net_users(id) ON DELETE CASCADE;


--
-- TOC entry 7815 (class 2606 OID 19917)
-- Name: wallet_transactions fk_wallet_transactions_wallet_account; Type: FK CONSTRAINT; Schema: customer; Owner: postgres
--

ALTER TABLE ONLY customer.wallet_transactions
    ADD CONSTRAINT fk_wallet_transactions_wallet_account FOREIGN KEY (wallet_account_id) REFERENCES customer.wallet_accounts(id) ON DELETE CASCADE;


--
-- TOC entry 7970 (class 2606 OID 22941)
-- Name: country_currency_defaults country_currency_defaults_currency_code_fkey; Type: FK CONSTRAINT; Schema: finance; Owner: postgres
--

ALTER TABLE ONLY finance.country_currency_defaults
    ADD CONSTRAINT country_currency_defaults_currency_code_fkey FOREIGN KEY (currency_code) REFERENCES finance.currencies(code);


--
-- TOC entry 7971 (class 2606 OID 22961)
-- Name: exchange_rates exchange_rates_base_currency_code_fkey; Type: FK CONSTRAINT; Schema: finance; Owner: postgres
--

ALTER TABLE ONLY finance.exchange_rates
    ADD CONSTRAINT exchange_rates_base_currency_code_fkey FOREIGN KEY (base_currency_code) REFERENCES finance.currencies(code);


--
-- TOC entry 7972 (class 2606 OID 22966)
-- Name: exchange_rates exchange_rates_quote_currency_code_fkey; Type: FK CONSTRAINT; Schema: finance; Owner: postgres
--

ALTER TABLE ONLY finance.exchange_rates
    ADD CONSTRAINT exchange_rates_quote_currency_code_fkey FOREIGN KEY (quote_currency_code) REFERENCES finance.currencies(code);


--
-- TOC entry 7973 (class 2606 OID 23005)
-- Name: fx_pair_margins fx_pair_margins_base_currency_code_fkey; Type: FK CONSTRAINT; Schema: finance; Owner: postgres
--

ALTER TABLE ONLY finance.fx_pair_margins
    ADD CONSTRAINT fx_pair_margins_base_currency_code_fkey FOREIGN KEY (base_currency_code) REFERENCES finance.currencies(code);


--
-- TOC entry 7974 (class 2606 OID 23000)
-- Name: fx_pair_margins fx_pair_margins_profile_code_fkey; Type: FK CONSTRAINT; Schema: finance; Owner: postgres
--

ALTER TABLE ONLY finance.fx_pair_margins
    ADD CONSTRAINT fx_pair_margins_profile_code_fkey FOREIGN KEY (profile_code) REFERENCES finance.fx_margin_profiles(code) ON DELETE CASCADE;


--
-- TOC entry 7975 (class 2606 OID 23010)
-- Name: fx_pair_margins fx_pair_margins_quote_currency_code_fkey; Type: FK CONSTRAINT; Schema: finance; Owner: postgres
--

ALTER TABLE ONLY finance.fx_pair_margins
    ADD CONSTRAINT fx_pair_margins_quote_currency_code_fkey FOREIGN KEY (quote_currency_code) REFERENCES finance.currencies(code);


--
-- TOC entry 7976 (class 2606 OID 23032)
-- Name: fx_quotes fx_quotes_source_currency_code_fkey; Type: FK CONSTRAINT; Schema: finance; Owner: postgres
--

ALTER TABLE ONLY finance.fx_quotes
    ADD CONSTRAINT fx_quotes_source_currency_code_fkey FOREIGN KEY (source_currency_code) REFERENCES finance.currencies(code);


--
-- TOC entry 7977 (class 2606 OID 23037)
-- Name: fx_quotes fx_quotes_target_currency_code_fkey; Type: FK CONSTRAINT; Schema: finance; Owner: postgres
--

ALTER TABLE ONLY finance.fx_quotes
    ADD CONSTRAINT fx_quotes_target_currency_code_fkey FOREIGN KEY (target_currency_code) REFERENCES finance.currencies(code);


--
-- TOC entry 7937 (class 2606 OID 22348)
-- Name: field_conditions field_conditions_depends_on_field_id_fkey; Type: FK CONSTRAINT; Schema: form_builder; Owner: postgres
--

ALTER TABLE ONLY form_builder.field_conditions
    ADD CONSTRAINT field_conditions_depends_on_field_id_fkey FOREIGN KEY (depends_on_field_id) REFERENCES form_builder.form_fields(id) ON DELETE CASCADE;


--
-- TOC entry 7938 (class 2606 OID 22343)
-- Name: field_conditions field_conditions_field_id_fkey; Type: FK CONSTRAINT; Schema: form_builder; Owner: postgres
--

ALTER TABLE ONLY form_builder.field_conditions
    ADD CONSTRAINT field_conditions_field_id_fkey FOREIGN KEY (field_id) REFERENCES form_builder.form_fields(id) ON DELETE CASCADE;


--
-- TOC entry 7936 (class 2606 OID 22324)
-- Name: field_options field_options_field_id_fkey; Type: FK CONSTRAINT; Schema: form_builder; Owner: postgres
--

ALTER TABLE ONLY form_builder.field_options
    ADD CONSTRAINT field_options_field_id_fkey FOREIGN KEY (field_id) REFERENCES form_builder.form_fields(id) ON DELETE CASCADE;


--
-- TOC entry 7932 (class 2606 OID 22304)
-- Name: form_fields form_fields_field_type_code_fkey; Type: FK CONSTRAINT; Schema: form_builder; Owner: postgres
--

ALTER TABLE ONLY form_builder.form_fields
    ADD CONSTRAINT form_fields_field_type_code_fkey FOREIGN KEY (field_type_code) REFERENCES form_builder.field_types(code);


--
-- TOC entry 7933 (class 2606 OID 22289)
-- Name: form_fields form_fields_form_version_id_fkey; Type: FK CONSTRAINT; Schema: form_builder; Owner: postgres
--

ALTER TABLE ONLY form_builder.form_fields
    ADD CONSTRAINT form_fields_form_version_id_fkey FOREIGN KEY (form_version_id) REFERENCES form_builder.form_versions(id) ON DELETE CASCADE;


--
-- TOC entry 7934 (class 2606 OID 22299)
-- Name: form_fields form_fields_parent_field_id_fkey; Type: FK CONSTRAINT; Schema: form_builder; Owner: postgres
--

ALTER TABLE ONLY form_builder.form_fields
    ADD CONSTRAINT form_fields_parent_field_id_fkey FOREIGN KEY (parent_field_id) REFERENCES form_builder.form_fields(id) ON DELETE CASCADE;


--
-- TOC entry 7935 (class 2606 OID 22294)
-- Name: form_fields form_fields_section_id_fkey; Type: FK CONSTRAINT; Schema: form_builder; Owner: postgres
--

ALTER TABLE ONLY form_builder.form_fields
    ADD CONSTRAINT form_fields_section_id_fkey FOREIGN KEY (section_id) REFERENCES form_builder.form_sections(id) ON DELETE CASCADE;


--
-- TOC entry 7931 (class 2606 OID 22264)
-- Name: form_sections form_sections_form_version_id_fkey; Type: FK CONSTRAINT; Schema: form_builder; Owner: postgres
--

ALTER TABLE ONLY form_builder.form_sections
    ADD CONSTRAINT form_sections_form_version_id_fkey FOREIGN KEY (form_version_id) REFERENCES form_builder.form_versions(id) ON DELETE CASCADE;


--
-- TOC entry 7930 (class 2606 OID 22244)
-- Name: form_versions form_versions_form_id_fkey; Type: FK CONSTRAINT; Schema: form_builder; Owner: postgres
--

ALTER TABLE ONLY form_builder.form_versions
    ADD CONSTRAINT form_versions_form_id_fkey FOREIGN KEY (form_id) REFERENCES form_builder.forms(id) ON DELETE CASCADE;


--
-- TOC entry 7939 (class 2606 OID 22372)
-- Name: service_definition_forms service_definition_forms_form_id_fkey; Type: FK CONSTRAINT; Schema: form_builder; Owner: postgres
--

ALTER TABLE ONLY form_builder.service_definition_forms
    ADD CONSTRAINT service_definition_forms_form_id_fkey FOREIGN KEY (form_id) REFERENCES form_builder.forms(id) ON DELETE CASCADE;


--
-- TOC entry 7940 (class 2606 OID 22367)
-- Name: service_definition_forms service_definition_forms_service_definition_id_fkey; Type: FK CONSTRAINT; Schema: form_builder; Owner: postgres
--

ALTER TABLE ONLY form_builder.service_definition_forms
    ADD CONSTRAINT service_definition_forms_service_definition_id_fkey FOREIGN KEY (service_definition_id) REFERENCES category.service_definitions(id) ON DELETE CASCADE;


--
-- TOC entry 7941 (class 2606 OID 22404)
-- Name: submissions submissions_booking_draft_id_fkey; Type: FK CONSTRAINT; Schema: form_builder; Owner: postgres
--

ALTER TABLE ONLY form_builder.submissions
    ADD CONSTRAINT submissions_booking_draft_id_fkey FOREIGN KEY (booking_draft_id) REFERENCES booking.booking_drafts(id) ON DELETE SET NULL;


--
-- TOC entry 7942 (class 2606 OID 22409)
-- Name: submissions submissions_booking_id_fkey; Type: FK CONSTRAINT; Schema: form_builder; Owner: postgres
--

ALTER TABLE ONLY form_builder.submissions
    ADD CONSTRAINT submissions_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES booking.bookings(id) ON DELETE SET NULL;


--
-- TOC entry 7943 (class 2606 OID 22394)
-- Name: submissions submissions_form_version_id_fkey; Type: FK CONSTRAINT; Schema: form_builder; Owner: postgres
--

ALTER TABLE ONLY form_builder.submissions
    ADD CONSTRAINT submissions_form_version_id_fkey FOREIGN KEY (form_version_id) REFERENCES form_builder.form_versions(id);


--
-- TOC entry 7944 (class 2606 OID 22399)
-- Name: submissions submissions_service_definition_id_fkey; Type: FK CONSTRAINT; Schema: form_builder; Owner: postgres
--

ALTER TABLE ONLY form_builder.submissions
    ADD CONSTRAINT submissions_service_definition_id_fkey FOREIGN KEY (service_definition_id) REFERENCES category.service_definitions(id) ON DELETE SET NULL;


--
-- TOC entry 7968 (class 2606 OID 22807)
-- Name: account_deletion_requests account_deletion_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: identity; Owner: postgres
--

ALTER TABLE ONLY identity.account_deletion_requests
    ADD CONSTRAINT account_deletion_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES identity.asp_net_users(id) ON DELETE CASCADE;


--
-- TOC entry 7757 (class 2606 OID 17366)
-- Name: access_tokens fk_access_tokens_asp_net_users_user_id; Type: FK CONSTRAINT; Schema: identity; Owner: postgres
--

ALTER TABLE ONLY identity.access_tokens
    ADD CONSTRAINT fk_access_tokens_asp_net_users_user_id FOREIGN KEY (user_id) REFERENCES identity.asp_net_users(id) ON DELETE CASCADE;


--
-- TOC entry 7758 (class 2606 OID 17371)
-- Name: asp_net_role_claims fk_asp_net_role_claims_asp_net_roles_role_id; Type: FK CONSTRAINT; Schema: identity; Owner: postgres
--

ALTER TABLE ONLY identity.asp_net_role_claims
    ADD CONSTRAINT fk_asp_net_role_claims_asp_net_roles_role_id FOREIGN KEY (role_id) REFERENCES identity.asp_net_roles(id) ON DELETE CASCADE;


--
-- TOC entry 7759 (class 2606 OID 17376)
-- Name: asp_net_user_claims fk_asp_net_user_claims_asp_net_users_user_id; Type: FK CONSTRAINT; Schema: identity; Owner: postgres
--

ALTER TABLE ONLY identity.asp_net_user_claims
    ADD CONSTRAINT fk_asp_net_user_claims_asp_net_users_user_id FOREIGN KEY (user_id) REFERENCES identity.asp_net_users(id) ON DELETE CASCADE;


--
-- TOC entry 7760 (class 2606 OID 17381)
-- Name: asp_net_user_logins fk_asp_net_user_logins_asp_net_users_user_id; Type: FK CONSTRAINT; Schema: identity; Owner: postgres
--

ALTER TABLE ONLY identity.asp_net_user_logins
    ADD CONSTRAINT fk_asp_net_user_logins_asp_net_users_user_id FOREIGN KEY (user_id) REFERENCES identity.asp_net_users(id) ON DELETE CASCADE;


--
-- TOC entry 7761 (class 2606 OID 17386)
-- Name: asp_net_user_roles fk_asp_net_user_roles_asp_net_roles_role_id; Type: FK CONSTRAINT; Schema: identity; Owner: postgres
--

ALTER TABLE ONLY identity.asp_net_user_roles
    ADD CONSTRAINT fk_asp_net_user_roles_asp_net_roles_role_id FOREIGN KEY (role_id) REFERENCES identity.asp_net_roles(id) ON DELETE CASCADE;


--
-- TOC entry 7762 (class 2606 OID 17391)
-- Name: asp_net_user_roles fk_asp_net_user_roles_asp_net_users_user_id; Type: FK CONSTRAINT; Schema: identity; Owner: postgres
--

ALTER TABLE ONLY identity.asp_net_user_roles
    ADD CONSTRAINT fk_asp_net_user_roles_asp_net_users_user_id FOREIGN KEY (user_id) REFERENCES identity.asp_net_users(id) ON DELETE CASCADE;


--
-- TOC entry 7763 (class 2606 OID 17396)
-- Name: asp_net_user_tokens fk_asp_net_user_tokens_asp_net_users_user_id; Type: FK CONSTRAINT; Schema: identity; Owner: postgres
--

ALTER TABLE ONLY identity.asp_net_user_tokens
    ADD CONSTRAINT fk_asp_net_user_tokens_asp_net_users_user_id FOREIGN KEY (user_id) REFERENCES identity.asp_net_users(id) ON DELETE CASCADE;


--
-- TOC entry 7764 (class 2606 OID 17401)
-- Name: phone_login_codes fk_phone_login_codes_asp_net_users_user_id; Type: FK CONSTRAINT; Schema: identity; Owner: postgres
--

ALTER TABLE ONLY identity.phone_login_codes
    ADD CONSTRAINT fk_phone_login_codes_asp_net_users_user_id FOREIGN KEY (user_id) REFERENCES identity.asp_net_users(id) ON DELETE CASCADE;


--
-- TOC entry 7765 (class 2606 OID 17406)
-- Name: refresh_tokens fk_refresh_tokens_asp_net_users_user_id; Type: FK CONSTRAINT; Schema: identity; Owner: postgres
--

ALTER TABLE ONLY identity.refresh_tokens
    ADD CONSTRAINT fk_refresh_tokens_asp_net_users_user_id FOREIGN KEY (user_id) REFERENCES identity.asp_net_users(id) ON DELETE CASCADE;


--
-- TOC entry 7796 (class 2606 OID 19716)
-- Name: user_preferences fk_user_preferences_city_location; Type: FK CONSTRAINT; Schema: identity; Owner: postgres
--

ALTER TABLE ONLY identity.user_preferences
    ADD CONSTRAINT fk_user_preferences_city_location FOREIGN KEY (selected_city_location_id) REFERENCES category.locations(id) ON DELETE SET NULL;


--
-- TOC entry 7797 (class 2606 OID 19711)
-- Name: user_preferences fk_user_preferences_country_location; Type: FK CONSTRAINT; Schema: identity; Owner: postgres
--

ALTER TABLE ONLY identity.user_preferences
    ADD CONSTRAINT fk_user_preferences_country_location FOREIGN KEY (selected_country_location_id) REFERENCES category.locations(id) ON DELETE SET NULL;


--
-- TOC entry 7798 (class 2606 OID 19721)
-- Name: user_preferences fk_user_preferences_picked_location; Type: FK CONSTRAINT; Schema: identity; Owner: postgres
--

ALTER TABLE ONLY identity.user_preferences
    ADD CONSTRAINT fk_user_preferences_picked_location FOREIGN KEY (selected_picked_location_id) REFERENCES category.picked_locations(id) ON DELETE SET NULL;


--
-- TOC entry 7799 (class 2606 OID 19706)
-- Name: user_preferences fk_user_preferences_user; Type: FK CONSTRAINT; Schema: identity; Owner: postgres
--

ALTER TABLE ONLY identity.user_preferences
    ADD CONSTRAINT fk_user_preferences_user FOREIGN KEY (user_id) REFERENCES identity.asp_net_users(id) ON DELETE CASCADE;


--
-- TOC entry 7969 (class 2606 OID 22830)
-- Name: user_security_settings user_security_settings_user_id_fkey; Type: FK CONSTRAINT; Schema: identity; Owner: postgres
--

ALTER TABLE ONLY identity.user_security_settings
    ADD CONSTRAINT user_security_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES identity.asp_net_users(id) ON DELETE CASCADE;


--
-- TOC entry 7967 (class 2606 OID 22786)
-- Name: user_sessions user_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: identity; Owner: postgres
--

ALTER TABLE ONLY identity.user_sessions
    ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES identity.asp_net_users(id) ON DELETE CASCADE;


--
-- TOC entry 7800 (class 2606 OID 19762)
-- Name: accounts accounts_current_tier_id_fkey; Type: FK CONSTRAINT; Schema: loyalty; Owner: postgres
--

ALTER TABLE ONLY loyalty.accounts
    ADD CONSTRAINT accounts_current_tier_id_fkey FOREIGN KEY (current_tier_id) REFERENCES loyalty.tiers(id);


--
-- TOC entry 7801 (class 2606 OID 19757)
-- Name: accounts accounts_customer_id_fkey; Type: FK CONSTRAINT; Schema: loyalty; Owner: postgres
--

ALTER TABLE ONLY loyalty.accounts
    ADD CONSTRAINT accounts_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customer.customers(id) ON DELETE CASCADE;


--
-- TOC entry 7805 (class 2606 OID 19819)
-- Name: coupons coupons_provider_service_id_fkey; Type: FK CONSTRAINT; Schema: loyalty; Owner: postgres
--

ALTER TABLE ONLY loyalty.coupons
    ADD CONSTRAINT coupons_provider_service_id_fkey FOREIGN KEY (provider_service_id) REFERENCES category.provider_services(id);


--
-- TOC entry 7806 (class 2606 OID 19841)
-- Name: customer_coupons customer_coupons_coupon_id_fkey; Type: FK CONSTRAINT; Schema: loyalty; Owner: postgres
--

ALTER TABLE ONLY loyalty.customer_coupons
    ADD CONSTRAINT customer_coupons_coupon_id_fkey FOREIGN KEY (coupon_id) REFERENCES loyalty.coupons(id) ON DELETE CASCADE;


--
-- TOC entry 7807 (class 2606 OID 19836)
-- Name: customer_coupons customer_coupons_customer_id_fkey; Type: FK CONSTRAINT; Schema: loyalty; Owner: postgres
--

ALTER TABLE ONLY loyalty.customer_coupons
    ADD CONSTRAINT customer_coupons_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customer.customers(id) ON DELETE CASCADE;


--
-- TOC entry 7802 (class 2606 OID 19777)
-- Name: ledger ledger_customer_id_fkey; Type: FK CONSTRAINT; Schema: loyalty; Owner: postgres
--

ALTER TABLE ONLY loyalty.ledger
    ADD CONSTRAINT ledger_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customer.customers(id) ON DELETE CASCADE;


--
-- TOC entry 7803 (class 2606 OID 19800)
-- Name: referrals referrals_referred_customer_id_fkey; Type: FK CONSTRAINT; Schema: loyalty; Owner: postgres
--

ALTER TABLE ONLY loyalty.referrals
    ADD CONSTRAINT referrals_referred_customer_id_fkey FOREIGN KEY (referred_customer_id) REFERENCES customer.customers(id) ON DELETE SET NULL;


--
-- TOC entry 7804 (class 2606 OID 19795)
-- Name: referrals referrals_referrer_customer_id_fkey; Type: FK CONSTRAINT; Schema: loyalty; Owner: postgres
--

ALTER TABLE ONLY loyalty.referrals
    ADD CONSTRAINT referrals_referrer_customer_id_fkey FOREIGN KEY (referrer_customer_id) REFERENCES customer.customers(id) ON DELETE CASCADE;


--
-- TOC entry 7774 (class 2606 OID 18507)
-- Name: offers offers_provider_service_id_fkey; Type: FK CONSTRAINT; Schema: marketing; Owner: postgres
--

ALTER TABLE ONLY marketing.offers
    ADD CONSTRAINT offers_provider_service_id_fkey FOREIGN KEY (provider_service_id) REFERENCES category.provider_services(id);


--
-- TOC entry 7894 (class 2606 OID 21288)
-- Name: referral_codes referral_codes_customer_id_fkey; Type: FK CONSTRAINT; Schema: marketing; Owner: postgres
--

ALTER TABLE ONLY marketing.referral_codes
    ADD CONSTRAINT referral_codes_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customer.customers(id) ON DELETE CASCADE;


--
-- TOC entry 7895 (class 2606 OID 21283)
-- Name: referral_codes referral_codes_program_id_fkey; Type: FK CONSTRAINT; Schema: marketing; Owner: postgres
--

ALTER TABLE ONLY marketing.referral_codes
    ADD CONSTRAINT referral_codes_program_id_fkey FOREIGN KEY (program_id) REFERENCES marketing.referral_programs(id) ON DELETE CASCADE;


--
-- TOC entry 7896 (class 2606 OID 21304)
-- Name: referral_invitations referral_invitations_program_id_fkey; Type: FK CONSTRAINT; Schema: marketing; Owner: postgres
--

ALTER TABLE ONLY marketing.referral_invitations
    ADD CONSTRAINT referral_invitations_program_id_fkey FOREIGN KEY (program_id) REFERENCES marketing.referral_programs(id) ON DELETE CASCADE;


--
-- TOC entry 7897 (class 2606 OID 21319)
-- Name: referral_invitations referral_invitations_referee_customer_id_fkey; Type: FK CONSTRAINT; Schema: marketing; Owner: postgres
--

ALTER TABLE ONLY marketing.referral_invitations
    ADD CONSTRAINT referral_invitations_referee_customer_id_fkey FOREIGN KEY (referee_customer_id) REFERENCES customer.customers(id) ON DELETE SET NULL;


--
-- TOC entry 7898 (class 2606 OID 21309)
-- Name: referral_invitations referral_invitations_referral_code_id_fkey; Type: FK CONSTRAINT; Schema: marketing; Owner: postgres
--

ALTER TABLE ONLY marketing.referral_invitations
    ADD CONSTRAINT referral_invitations_referral_code_id_fkey FOREIGN KEY (referral_code_id) REFERENCES marketing.referral_codes(id) ON DELETE CASCADE;


--
-- TOC entry 7899 (class 2606 OID 21314)
-- Name: referral_invitations referral_invitations_referrer_customer_id_fkey; Type: FK CONSTRAINT; Schema: marketing; Owner: postgres
--

ALTER TABLE ONLY marketing.referral_invitations
    ADD CONSTRAINT referral_invitations_referrer_customer_id_fkey FOREIGN KEY (referrer_customer_id) REFERENCES customer.customers(id) ON DELETE CASCADE;


--
-- TOC entry 7893 (class 2606 OID 21266)
-- Name: referral_reward_rules referral_reward_rules_program_id_fkey; Type: FK CONSTRAINT; Schema: marketing; Owner: postgres
--

ALTER TABLE ONLY marketing.referral_reward_rules
    ADD CONSTRAINT referral_reward_rules_program_id_fkey FOREIGN KEY (program_id) REFERENCES marketing.referral_programs(id) ON DELETE CASCADE;


--
-- TOC entry 7904 (class 2606 OID 21378)
-- Name: referral_share_events referral_share_events_customer_id_fkey; Type: FK CONSTRAINT; Schema: marketing; Owner: postgres
--

ALTER TABLE ONLY marketing.referral_share_events
    ADD CONSTRAINT referral_share_events_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customer.customers(id) ON DELETE CASCADE;


--
-- TOC entry 7905 (class 2606 OID 21373)
-- Name: referral_share_events referral_share_events_referral_code_id_fkey; Type: FK CONSTRAINT; Schema: marketing; Owner: postgres
--

ALTER TABLE ONLY marketing.referral_share_events
    ADD CONSTRAINT referral_share_events_referral_code_id_fkey FOREIGN KEY (referral_code_id) REFERENCES marketing.referral_codes(id) ON DELETE CASCADE;


--
-- TOC entry 7900 (class 2606 OID 21343)
-- Name: user_discount_coupons user_discount_coupons_customer_id_fkey; Type: FK CONSTRAINT; Schema: marketing; Owner: postgres
--

ALTER TABLE ONLY marketing.user_discount_coupons
    ADD CONSTRAINT user_discount_coupons_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customer.customers(id) ON DELETE CASCADE;


--
-- TOC entry 7901 (class 2606 OID 21348)
-- Name: user_discount_coupons user_discount_coupons_program_id_fkey; Type: FK CONSTRAINT; Schema: marketing; Owner: postgres
--

ALTER TABLE ONLY marketing.user_discount_coupons
    ADD CONSTRAINT user_discount_coupons_program_id_fkey FOREIGN KEY (program_id) REFERENCES marketing.referral_programs(id) ON DELETE CASCADE;


--
-- TOC entry 7902 (class 2606 OID 21358)
-- Name: user_discount_coupons user_discount_coupons_referral_invitation_id_fkey; Type: FK CONSTRAINT; Schema: marketing; Owner: postgres
--

ALTER TABLE ONLY marketing.user_discount_coupons
    ADD CONSTRAINT user_discount_coupons_referral_invitation_id_fkey FOREIGN KEY (referral_invitation_id) REFERENCES marketing.referral_invitations(id) ON DELETE SET NULL;


--
-- TOC entry 7903 (class 2606 OID 21353)
-- Name: user_discount_coupons user_discount_coupons_reward_rule_id_fkey; Type: FK CONSTRAINT; Schema: marketing; Owner: postgres
--

ALTER TABLE ONLY marketing.user_discount_coupons
    ADD CONSTRAINT user_discount_coupons_reward_rule_id_fkey FOREIGN KEY (reward_rule_id) REFERENCES marketing.referral_reward_rules(id) ON DELETE SET NULL;


--
-- TOC entry 7795 (class 2606 OID 19678)
-- Name: sponsered_slider fk_media_type; Type: FK CONSTRAINT; Schema: media; Owner: postgres
--

ALTER TABLE ONLY media.sponsered_slider
    ADD CONSTRAINT fk_media_type FOREIGN KEY (media_type_id) REFERENCES media.media_type(id) NOT VALID;


--
-- TOC entry 7831 (class 2606 OID 20153)
-- Name: notification_deliveries notification_deliveries_notification_id_fkey; Type: FK CONSTRAINT; Schema: notify; Owner: postgres
--

ALTER TABLE ONLY notify.notification_deliveries
    ADD CONSTRAINT notification_deliveries_notification_id_fkey FOREIGN KEY (notification_id) REFERENCES notify.notifications(id) ON DELETE CASCADE;


--
-- TOC entry 7830 (class 2606 OID 20137)
-- Name: notifications notifications_customer_id_fkey; Type: FK CONSTRAINT; Schema: notify; Owner: postgres
--

ALTER TABLE ONLY notify.notifications
    ADD CONSTRAINT notifications_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customer.customers(id) ON DELETE CASCADE;


--
-- TOC entry 7908 (class 2606 OID 21917)
-- Name: form_definitions form_definitions_provider_type_id_fkey; Type: FK CONSTRAINT; Schema: provider_portal; Owner: postgres
--

ALTER TABLE ONLY provider_portal.form_definitions
    ADD CONSTRAINT form_definitions_provider_type_id_fkey FOREIGN KEY (provider_type_id) REFERENCES category.provider_types(id) ON DELETE CASCADE;


--
-- TOC entry 7910 (class 2606 OID 21967)
-- Name: form_field_options form_field_options_form_field_id_fkey; Type: FK CONSTRAINT; Schema: provider_portal; Owner: postgres
--

ALTER TABLE ONLY provider_portal.form_field_options
    ADD CONSTRAINT form_field_options_form_field_id_fkey FOREIGN KEY (form_field_id) REFERENCES provider_portal.form_fields(id) ON DELETE CASCADE;


--
-- TOC entry 7909 (class 2606 OID 21947)
-- Name: form_fields form_fields_form_definition_id_fkey; Type: FK CONSTRAINT; Schema: provider_portal; Owner: postgres
--

ALTER TABLE ONLY provider_portal.form_fields
    ADD CONSTRAINT form_fields_form_definition_id_fkey FOREIGN KEY (form_definition_id) REFERENCES provider_portal.form_definitions(id) ON DELETE CASCADE;


--
-- TOC entry 7913 (class 2606 OID 22016)
-- Name: onboarding_applications onboarding_applications_applicant_user_id_fkey; Type: FK CONSTRAINT; Schema: provider_portal; Owner: postgres
--

ALTER TABLE ONLY provider_portal.onboarding_applications
    ADD CONSTRAINT onboarding_applications_applicant_user_id_fkey FOREIGN KEY (applicant_user_id) REFERENCES identity.asp_net_users(id) ON DELETE CASCADE;


--
-- TOC entry 7914 (class 2606 OID 22041)
-- Name: onboarding_applications onboarding_applications_city_location_id_fkey; Type: FK CONSTRAINT; Schema: provider_portal; Owner: postgres
--

ALTER TABLE ONLY provider_portal.onboarding_applications
    ADD CONSTRAINT onboarding_applications_city_location_id_fkey FOREIGN KEY (city_location_id) REFERENCES category.locations(id) ON DELETE SET NULL;


--
-- TOC entry 7915 (class 2606 OID 22036)
-- Name: onboarding_applications onboarding_applications_country_location_id_fkey; Type: FK CONSTRAINT; Schema: provider_portal; Owner: postgres
--

ALTER TABLE ONLY provider_portal.onboarding_applications
    ADD CONSTRAINT onboarding_applications_country_location_id_fkey FOREIGN KEY (country_location_id) REFERENCES category.locations(id) ON DELETE SET NULL;


--
-- TOC entry 7916 (class 2606 OID 22031)
-- Name: onboarding_applications onboarding_applications_current_form_definition_id_fkey; Type: FK CONSTRAINT; Schema: provider_portal; Owner: postgres
--

ALTER TABLE ONLY provider_portal.onboarding_applications
    ADD CONSTRAINT onboarding_applications_current_form_definition_id_fkey FOREIGN KEY (current_form_definition_id) REFERENCES provider_portal.form_definitions(id) ON DELETE SET NULL;


--
-- TOC entry 7917 (class 2606 OID 22021)
-- Name: onboarding_applications onboarding_applications_provider_type_id_fkey; Type: FK CONSTRAINT; Schema: provider_portal; Owner: postgres
--

ALTER TABLE ONLY provider_portal.onboarding_applications
    ADD CONSTRAINT onboarding_applications_provider_type_id_fkey FOREIGN KEY (provider_type_id) REFERENCES category.provider_types(id);


--
-- TOC entry 7918 (class 2606 OID 22046)
-- Name: onboarding_applications onboarding_applications_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: provider_portal; Owner: postgres
--

ALTER TABLE ONLY provider_portal.onboarding_applications
    ADD CONSTRAINT onboarding_applications_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES identity.asp_net_users(id) ON DELETE SET NULL;


--
-- TOC entry 7919 (class 2606 OID 22026)
-- Name: onboarding_applications onboarding_applications_service_provider_id_fkey; Type: FK CONSTRAINT; Schema: provider_portal; Owner: postgres
--

ALTER TABLE ONLY provider_portal.onboarding_applications
    ADD CONSTRAINT onboarding_applications_service_provider_id_fkey FOREIGN KEY (service_provider_id) REFERENCES category.service_providers(id) ON DELETE SET NULL;


--
-- TOC entry 7920 (class 2606 OID 22063)
-- Name: onboarding_documents onboarding_documents_application_id_fkey; Type: FK CONSTRAINT; Schema: provider_portal; Owner: postgres
--

ALTER TABLE ONLY provider_portal.onboarding_documents
    ADD CONSTRAINT onboarding_documents_application_id_fkey FOREIGN KEY (application_id) REFERENCES provider_portal.onboarding_applications(id) ON DELETE CASCADE;


--
-- TOC entry 7921 (class 2606 OID 22068)
-- Name: onboarding_documents onboarding_documents_media_id_fkey; Type: FK CONSTRAINT; Schema: provider_portal; Owner: postgres
--

ALTER TABLE ONLY provider_portal.onboarding_documents
    ADD CONSTRAINT onboarding_documents_media_id_fkey FOREIGN KEY (media_id) REFERENCES media.media_library(id) ON DELETE SET NULL;


--
-- TOC entry 7928 (class 2606 OID 22159)
-- Name: payout_accounts payout_accounts_service_provider_id_fkey; Type: FK CONSTRAINT; Schema: provider_portal; Owner: postgres
--

ALTER TABLE ONLY provider_portal.payout_accounts
    ADD CONSTRAINT payout_accounts_service_provider_id_fkey FOREIGN KEY (service_provider_id) REFERENCES category.service_providers(id) ON DELETE CASCADE;


--
-- TOC entry 7929 (class 2606 OID 22180)
-- Name: portal_invoices portal_invoices_service_provider_id_fkey; Type: FK CONSTRAINT; Schema: provider_portal; Owner: postgres
--

ALTER TABLE ONLY provider_portal.portal_invoices
    ADD CONSTRAINT portal_invoices_service_provider_id_fkey FOREIGN KEY (service_provider_id) REFERENCES category.service_providers(id) ON DELETE CASCADE;


--
-- TOC entry 7907 (class 2606 OID 21894)
-- Name: portal_sections portal_sections_provider_type_id_fkey; Type: FK CONSTRAINT; Schema: provider_portal; Owner: postgres
--

ALTER TABLE ONLY provider_portal.portal_sections
    ADD CONSTRAINT portal_sections_provider_type_id_fkey FOREIGN KEY (provider_type_id) REFERENCES category.provider_types(id) ON DELETE CASCADE;


--
-- TOC entry 7911 (class 2606 OID 21988)
-- Name: provider_members provider_members_service_provider_id_fkey; Type: FK CONSTRAINT; Schema: provider_portal; Owner: postgres
--

ALTER TABLE ONLY provider_portal.provider_members
    ADD CONSTRAINT provider_members_service_provider_id_fkey FOREIGN KEY (service_provider_id) REFERENCES category.service_providers(id) ON DELETE CASCADE;


--
-- TOC entry 7912 (class 2606 OID 21993)
-- Name: provider_members provider_members_user_id_fkey; Type: FK CONSTRAINT; Schema: provider_portal; Owner: postgres
--

ALTER TABLE ONLY provider_portal.provider_members
    ADD CONSTRAINT provider_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES identity.asp_net_users(id) ON DELETE CASCADE;


--
-- TOC entry 7922 (class 2606 OID 22091)
-- Name: provider_operating_hours provider_operating_hours_service_provider_id_fkey; Type: FK CONSTRAINT; Schema: provider_portal; Owner: postgres
--

ALTER TABLE ONLY provider_portal.provider_operating_hours
    ADD CONSTRAINT provider_operating_hours_service_provider_id_fkey FOREIGN KEY (service_provider_id) REFERENCES category.service_providers(id) ON DELETE CASCADE;


--
-- TOC entry 7923 (class 2606 OID 22112)
-- Name: provider_service_addon_settings provider_service_addon_settings_addon_id_fkey; Type: FK CONSTRAINT; Schema: provider_portal; Owner: postgres
--

ALTER TABLE ONLY provider_portal.provider_service_addon_settings
    ADD CONSTRAINT provider_service_addon_settings_addon_id_fkey FOREIGN KEY (addon_id) REFERENCES category.addons(id) ON DELETE CASCADE;


--
-- TOC entry 7924 (class 2606 OID 22107)
-- Name: provider_service_addon_settings provider_service_addon_settings_provider_service_id_fkey; Type: FK CONSTRAINT; Schema: provider_portal; Owner: postgres
--

ALTER TABLE ONLY provider_portal.provider_service_addon_settings
    ADD CONSTRAINT provider_service_addon_settings_provider_service_id_fkey FOREIGN KEY (provider_service_id) REFERENCES category.provider_services(id) ON DELETE CASCADE;


--
-- TOC entry 7906 (class 2606 OID 21870)
-- Name: provider_type_catalog provider_type_catalog_provider_type_id_fkey; Type: FK CONSTRAINT; Schema: provider_portal; Owner: postgres
--

ALTER TABLE ONLY provider_portal.provider_type_catalog
    ADD CONSTRAINT provider_type_catalog_provider_type_id_fkey FOREIGN KEY (provider_type_id) REFERENCES category.provider_types(id) ON DELETE CASCADE;


--
-- TOC entry 7925 (class 2606 OID 22140)
-- Name: support_tickets support_tickets_assigned_to_user_id_fkey; Type: FK CONSTRAINT; Schema: provider_portal; Owner: postgres
--

ALTER TABLE ONLY provider_portal.support_tickets
    ADD CONSTRAINT support_tickets_assigned_to_user_id_fkey FOREIGN KEY (assigned_to_user_id) REFERENCES identity.asp_net_users(id) ON DELETE SET NULL;


--
-- TOC entry 7926 (class 2606 OID 22135)
-- Name: support_tickets support_tickets_created_by_user_id_fkey; Type: FK CONSTRAINT; Schema: provider_portal; Owner: postgres
--

ALTER TABLE ONLY provider_portal.support_tickets
    ADD CONSTRAINT support_tickets_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES identity.asp_net_users(id) ON DELETE SET NULL;


--
-- TOC entry 7927 (class 2606 OID 22130)
-- Name: support_tickets support_tickets_service_provider_id_fkey; Type: FK CONSTRAINT; Schema: provider_portal; Owner: postgres
--

ALTER TABLE ONLY provider_portal.support_tickets
    ADD CONSTRAINT support_tickets_service_provider_id_fkey FOREIGN KEY (service_provider_id) REFERENCES category.service_providers(id) ON DELETE CASCADE;


--
-- TOC entry 7854 (class 2606 OID 20719)
-- Name: abandoned_carts abandoned_carts_cart_id_fkey; Type: FK CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.abandoned_carts
    ADD CONSTRAINT abandoned_carts_cart_id_fkey FOREIGN KEY (cart_id) REFERENCES shop.carts(id) ON DELETE CASCADE;


--
-- TOC entry 7855 (class 2606 OID 20724)
-- Name: abandoned_carts abandoned_carts_customer_id_fkey; Type: FK CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.abandoned_carts
    ADD CONSTRAINT abandoned_carts_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customer.customers(id) ON DELETE SET NULL;


--
-- TOC entry 7838 (class 2606 OID 20476)
-- Name: attribute_values attribute_values_attribute_id_fkey; Type: FK CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.attribute_values
    ADD CONSTRAINT attribute_values_attribute_id_fkey FOREIGN KEY (attribute_id) REFERENCES shop.attributes(id) ON DELETE CASCADE;


--
-- TOC entry 7851 (class 2606 OID 20690)
-- Name: cart_items cart_items_cart_id_fkey; Type: FK CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.cart_items
    ADD CONSTRAINT cart_items_cart_id_fkey FOREIGN KEY (cart_id) REFERENCES shop.carts(id) ON DELETE CASCADE;


--
-- TOC entry 7852 (class 2606 OID 20695)
-- Name: cart_items cart_items_product_id_fkey; Type: FK CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.cart_items
    ADD CONSTRAINT cart_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES shop.products(id) ON DELETE CASCADE;


--
-- TOC entry 7853 (class 2606 OID 20700)
-- Name: cart_items cart_items_variant_id_fkey; Type: FK CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.cart_items
    ADD CONSTRAINT cart_items_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES shop.product_variants(id) ON DELETE CASCADE;


--
-- TOC entry 7850 (class 2606 OID 20671)
-- Name: carts carts_customer_id_fkey; Type: FK CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.carts
    ADD CONSTRAINT carts_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customer.customers(id) ON DELETE SET NULL;


--
-- TOC entry 7832 (class 2606 OID 20370)
-- Name: categories categories_parent_id_fkey; Type: FK CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.categories
    ADD CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES shop.categories(id) ON DELETE SET NULL;


--
-- TOC entry 7891 (class 2606 OID 21145)
-- Name: compare_list_items compare_list_items_compare_list_id_fkey; Type: FK CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.compare_list_items
    ADD CONSTRAINT compare_list_items_compare_list_id_fkey FOREIGN KEY (compare_list_id) REFERENCES shop.compare_lists(id) ON DELETE CASCADE;


--
-- TOC entry 7892 (class 2606 OID 21150)
-- Name: compare_list_items compare_list_items_product_id_fkey; Type: FK CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.compare_list_items
    ADD CONSTRAINT compare_list_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES shop.products(id) ON DELETE CASCADE;


--
-- TOC entry 7890 (class 2606 OID 21132)
-- Name: compare_lists compare_lists_customer_id_fkey; Type: FK CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.compare_lists
    ADD CONSTRAINT compare_lists_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customer.customers(id) ON DELETE CASCADE;


--
-- TOC entry 7856 (class 2606 OID 20768)
-- Name: coupon_redemptions coupon_redemptions_cart_id_fkey; Type: FK CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.coupon_redemptions
    ADD CONSTRAINT coupon_redemptions_cart_id_fkey FOREIGN KEY (cart_id) REFERENCES shop.carts(id) ON DELETE SET NULL;


--
-- TOC entry 7857 (class 2606 OID 20758)
-- Name: coupon_redemptions coupon_redemptions_coupon_id_fkey; Type: FK CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.coupon_redemptions
    ADD CONSTRAINT coupon_redemptions_coupon_id_fkey FOREIGN KEY (coupon_id) REFERENCES shop.coupons(id) ON DELETE CASCADE;


--
-- TOC entry 7858 (class 2606 OID 20763)
-- Name: coupon_redemptions coupon_redemptions_customer_id_fkey; Type: FK CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.coupon_redemptions
    ADD CONSTRAINT coupon_redemptions_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customer.customers(id) ON DELETE SET NULL;


--
-- TOC entry 7849 (class 2606 OID 20614)
-- Name: customer_addresses customer_addresses_customer_id_fkey; Type: FK CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.customer_addresses
    ADD CONSTRAINT customer_addresses_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customer.customers(id) ON DELETE CASCADE;


--
-- TOC entry 7848 (class 2606 OID 20597)
-- Name: inventory_movements inventory_movements_inventory_id_fkey; Type: FK CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.inventory_movements
    ADD CONSTRAINT inventory_movements_inventory_id_fkey FOREIGN KEY (inventory_id) REFERENCES shop.inventory(id) ON DELETE CASCADE;


--
-- TOC entry 7845 (class 2606 OID 20573)
-- Name: inventory inventory_product_id_fkey; Type: FK CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.inventory
    ADD CONSTRAINT inventory_product_id_fkey FOREIGN KEY (product_id) REFERENCES shop.products(id) ON DELETE CASCADE;


--
-- TOC entry 7846 (class 2606 OID 20578)
-- Name: inventory inventory_variant_id_fkey; Type: FK CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.inventory
    ADD CONSTRAINT inventory_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES shop.product_variants(id) ON DELETE CASCADE;


--
-- TOC entry 7847 (class 2606 OID 20583)
-- Name: inventory inventory_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.inventory
    ADD CONSTRAINT inventory_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES shop.warehouses(id) ON DELETE CASCADE;


--
-- TOC entry 7861 (class 2606 OID 20830)
-- Name: order_addresses order_addresses_order_id_fkey; Type: FK CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.order_addresses
    ADD CONSTRAINT order_addresses_order_id_fkey FOREIGN KEY (order_id) REFERENCES shop.orders(id) ON DELETE CASCADE;


--
-- TOC entry 7862 (class 2606 OID 20852)
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES shop.orders(id) ON DELETE CASCADE;


--
-- TOC entry 7863 (class 2606 OID 20857)
-- Name: order_items order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES shop.products(id) ON DELETE SET NULL;


--
-- TOC entry 7864 (class 2606 OID 20862)
-- Name: order_items order_items_variant_id_fkey; Type: FK CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.order_items
    ADD CONSTRAINT order_items_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES shop.product_variants(id) ON DELETE SET NULL;


--
-- TOC entry 7865 (class 2606 OID 20876)
-- Name: order_status_history order_status_history_order_id_fkey; Type: FK CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.order_status_history
    ADD CONSTRAINT order_status_history_order_id_fkey FOREIGN KEY (order_id) REFERENCES shop.orders(id) ON DELETE CASCADE;


--
-- TOC entry 7859 (class 2606 OID 20816)
-- Name: orders orders_cart_id_fkey; Type: FK CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.orders
    ADD CONSTRAINT orders_cart_id_fkey FOREIGN KEY (cart_id) REFERENCES shop.carts(id) ON DELETE SET NULL;


--
-- TOC entry 7860 (class 2606 OID 20811)
-- Name: orders orders_customer_id_fkey; Type: FK CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.orders
    ADD CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customer.customers(id) ON DELETE SET NULL;


--
-- TOC entry 7866 (class 2606 OID 20896)
-- Name: payment_transactions payment_transactions_order_id_fkey; Type: FK CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.payment_transactions
    ADD CONSTRAINT payment_transactions_order_id_fkey FOREIGN KEY (order_id) REFERENCES shop.orders(id) ON DELETE CASCADE;


--
-- TOC entry 7867 (class 2606 OID 20901)
-- Name: payment_transactions payment_transactions_payment_method_id_fkey; Type: FK CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.payment_transactions
    ADD CONSTRAINT payment_transactions_payment_method_id_fkey FOREIGN KEY (payment_method_id) REFERENCES shop.payment_methods(id) ON DELETE SET NULL;


--
-- TOC entry 7839 (class 2606 OID 20493)
-- Name: product_attributes product_attributes_attribute_id_fkey; Type: FK CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.product_attributes
    ADD CONSTRAINT product_attributes_attribute_id_fkey FOREIGN KEY (attribute_id) REFERENCES shop.attributes(id) ON DELETE CASCADE;


--
-- TOC entry 7840 (class 2606 OID 20488)
-- Name: product_attributes product_attributes_product_id_fkey; Type: FK CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.product_attributes
    ADD CONSTRAINT product_attributes_product_id_fkey FOREIGN KEY (product_id) REFERENCES shop.products(id) ON DELETE CASCADE;


--
-- TOC entry 7835 (class 2606 OID 20425)
-- Name: product_categories product_categories_category_id_fkey; Type: FK CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.product_categories
    ADD CONSTRAINT product_categories_category_id_fkey FOREIGN KEY (category_id) REFERENCES shop.categories(id) ON DELETE CASCADE;


--
-- TOC entry 7836 (class 2606 OID 20420)
-- Name: product_categories product_categories_product_id_fkey; Type: FK CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.product_categories
    ADD CONSTRAINT product_categories_product_id_fkey FOREIGN KEY (product_id) REFERENCES shop.products(id) ON DELETE CASCADE;


--
-- TOC entry 7837 (class 2606 OID 20444)
-- Name: product_media product_media_product_id_fkey; Type: FK CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.product_media
    ADD CONSTRAINT product_media_product_id_fkey FOREIGN KEY (product_id) REFERENCES shop.products(id) ON DELETE CASCADE;


--
-- TOC entry 7886 (class 2606 OID 21098)
-- Name: product_questions product_questions_customer_id_fkey; Type: FK CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.product_questions
    ADD CONSTRAINT product_questions_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customer.customers(id) ON DELETE SET NULL;


--
-- TOC entry 7887 (class 2606 OID 21093)
-- Name: product_questions product_questions_product_id_fkey; Type: FK CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.product_questions
    ADD CONSTRAINT product_questions_product_id_fkey FOREIGN KEY (product_id) REFERENCES shop.products(id) ON DELETE CASCADE;


--
-- TOC entry 7883 (class 2606 OID 21077)
-- Name: product_reviews product_reviews_customer_id_fkey; Type: FK CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.product_reviews
    ADD CONSTRAINT product_reviews_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customer.customers(id) ON DELETE SET NULL;


--
-- TOC entry 7884 (class 2606 OID 21072)
-- Name: product_reviews product_reviews_order_item_id_fkey; Type: FK CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.product_reviews
    ADD CONSTRAINT product_reviews_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES shop.order_items(id) ON DELETE SET NULL;


--
-- TOC entry 7885 (class 2606 OID 21067)
-- Name: product_reviews product_reviews_product_id_fkey; Type: FK CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.product_reviews
    ADD CONSTRAINT product_reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES shop.products(id) ON DELETE CASCADE;


--
-- TOC entry 7841 (class 2606 OID 20520)
-- Name: product_variants product_variants_product_id_fkey; Type: FK CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.product_variants
    ADD CONSTRAINT product_variants_product_id_fkey FOREIGN KEY (product_id) REFERENCES shop.products(id) ON DELETE CASCADE;


--
-- TOC entry 7833 (class 2606 OID 20403)
-- Name: products products_brand_id_fkey; Type: FK CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.products
    ADD CONSTRAINT products_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES shop.brands(id) ON DELETE SET NULL;


--
-- TOC entry 7834 (class 2606 OID 20408)
-- Name: products products_primary_category_id_fkey; Type: FK CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.products
    ADD CONSTRAINT products_primary_category_id_fkey FOREIGN KEY (primary_category_id) REFERENCES shop.categories(id) ON DELETE SET NULL;


--
-- TOC entry 7888 (class 2606 OID 21112)
-- Name: recently_viewed_products recently_viewed_products_customer_id_fkey; Type: FK CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.recently_viewed_products
    ADD CONSTRAINT recently_viewed_products_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customer.customers(id) ON DELETE CASCADE;


--
-- TOC entry 7889 (class 2606 OID 21117)
-- Name: recently_viewed_products recently_viewed_products_product_id_fkey; Type: FK CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.recently_viewed_products
    ADD CONSTRAINT recently_viewed_products_product_id_fkey FOREIGN KEY (product_id) REFERENCES shop.products(id) ON DELETE CASCADE;


--
-- TOC entry 7877 (class 2606 OID 21004)
-- Name: refunds refunds_order_id_fkey; Type: FK CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.refunds
    ADD CONSTRAINT refunds_order_id_fkey FOREIGN KEY (order_id) REFERENCES shop.orders(id) ON DELETE CASCADE;


--
-- TOC entry 7878 (class 2606 OID 21009)
-- Name: refunds refunds_payment_transaction_id_fkey; Type: FK CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.refunds
    ADD CONSTRAINT refunds_payment_transaction_id_fkey FOREIGN KEY (payment_transaction_id) REFERENCES shop.payment_transactions(id) ON DELETE SET NULL;


--
-- TOC entry 7875 (class 2606 OID 20987)
-- Name: return_items return_items_order_item_id_fkey; Type: FK CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.return_items
    ADD CONSTRAINT return_items_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES shop.order_items(id) ON DELETE CASCADE;


--
-- TOC entry 7876 (class 2606 OID 20982)
-- Name: return_items return_items_return_request_id_fkey; Type: FK CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.return_items
    ADD CONSTRAINT return_items_return_request_id_fkey FOREIGN KEY (return_request_id) REFERENCES shop.return_requests(id) ON DELETE CASCADE;


--
-- TOC entry 7873 (class 2606 OID 20968)
-- Name: return_requests return_requests_customer_id_fkey; Type: FK CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.return_requests
    ADD CONSTRAINT return_requests_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customer.customers(id) ON DELETE SET NULL;


--
-- TOC entry 7874 (class 2606 OID 20963)
-- Name: return_requests return_requests_order_id_fkey; Type: FK CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.return_requests
    ADD CONSTRAINT return_requests_order_id_fkey FOREIGN KEY (order_id) REFERENCES shop.orders(id) ON DELETE CASCADE;


--
-- TOC entry 7871 (class 2606 OID 20946)
-- Name: shipment_items shipment_items_order_item_id_fkey; Type: FK CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.shipment_items
    ADD CONSTRAINT shipment_items_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES shop.order_items(id) ON DELETE CASCADE;


--
-- TOC entry 7872 (class 2606 OID 20941)
-- Name: shipment_items shipment_items_shipment_id_fkey; Type: FK CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.shipment_items
    ADD CONSTRAINT shipment_items_shipment_id_fkey FOREIGN KEY (shipment_id) REFERENCES shop.shipments(id) ON DELETE CASCADE;


--
-- TOC entry 7868 (class 2606 OID 20924)
-- Name: shipments shipments_delivery_method_id_fkey; Type: FK CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.shipments
    ADD CONSTRAINT shipments_delivery_method_id_fkey FOREIGN KEY (delivery_method_id) REFERENCES shop.delivery_methods(id) ON DELETE SET NULL;


--
-- TOC entry 7869 (class 2606 OID 20919)
-- Name: shipments shipments_order_id_fkey; Type: FK CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.shipments
    ADD CONSTRAINT shipments_order_id_fkey FOREIGN KEY (order_id) REFERENCES shop.orders(id) ON DELETE CASCADE;


--
-- TOC entry 7870 (class 2606 OID 20929)
-- Name: shipments shipments_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.shipments
    ADD CONSTRAINT shipments_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES shop.warehouses(id) ON DELETE SET NULL;


--
-- TOC entry 7842 (class 2606 OID 20535)
-- Name: variant_attribute_values variant_attribute_values_attribute_id_fkey; Type: FK CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.variant_attribute_values
    ADD CONSTRAINT variant_attribute_values_attribute_id_fkey FOREIGN KEY (attribute_id) REFERENCES shop.attributes(id) ON DELETE CASCADE;


--
-- TOC entry 7843 (class 2606 OID 20540)
-- Name: variant_attribute_values variant_attribute_values_attribute_value_id_fkey; Type: FK CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.variant_attribute_values
    ADD CONSTRAINT variant_attribute_values_attribute_value_id_fkey FOREIGN KEY (attribute_value_id) REFERENCES shop.attribute_values(id) ON DELETE CASCADE;


--
-- TOC entry 7844 (class 2606 OID 20530)
-- Name: variant_attribute_values variant_attribute_values_variant_id_fkey; Type: FK CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.variant_attribute_values
    ADD CONSTRAINT variant_attribute_values_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES shop.product_variants(id) ON DELETE CASCADE;


--
-- TOC entry 7880 (class 2606 OID 21044)
-- Name: wishlist_items wishlist_items_product_id_fkey; Type: FK CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.wishlist_items
    ADD CONSTRAINT wishlist_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES shop.products(id) ON DELETE CASCADE;


--
-- TOC entry 7881 (class 2606 OID 21049)
-- Name: wishlist_items wishlist_items_variant_id_fkey; Type: FK CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.wishlist_items
    ADD CONSTRAINT wishlist_items_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES shop.product_variants(id) ON DELETE CASCADE;


--
-- TOC entry 7882 (class 2606 OID 21039)
-- Name: wishlist_items wishlist_items_wishlist_id_fkey; Type: FK CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.wishlist_items
    ADD CONSTRAINT wishlist_items_wishlist_id_fkey FOREIGN KEY (wishlist_id) REFERENCES shop.wishlists(id) ON DELETE CASCADE;


--
-- TOC entry 7879 (class 2606 OID 21027)
-- Name: wishlists wishlists_customer_id_fkey; Type: FK CONSTRAINT; Schema: shop; Owner: postgres
--

ALTER TABLE ONLY shop.wishlists
    ADD CONSTRAINT wishlists_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customer.customers(id) ON DELETE CASCADE;


-- Completed on 2026-04-27 00:47:28

--
-- PostgreSQL database dump complete
--

