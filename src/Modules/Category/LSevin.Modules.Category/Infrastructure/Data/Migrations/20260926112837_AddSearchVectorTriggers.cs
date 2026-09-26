using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LSevin.Modules.Category.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddSearchVectorTriggers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
-- Ensure the columns exist (safe if AddSearchOptimization.sql already ran)
ALTER TABLE category.provider_services
    ADD COLUMN IF NOT EXISTS search_text text,
    ADD COLUMN IF NOT EXISTS search_vector tsvector;

ALTER TABLE category.service_providers
    ADD COLUMN IF NOT EXISTS search_text text,
    ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- description_translations->>'<locale>' holds a Lexical rich-text editor
-- document, stored as a JSON *string* (double-encoded), not a nested jsonb
-- object. This parses that string and walks its actual 'children' tree
-- (rather than the buggy '$.**' jsonpath wildcard, which returns some
-- leaves more than once) to collect every 'text' node exactly once.
-- Falls back to the raw string if it isn't valid JSON, and to NULL if the
-- input is null or empty.
CREATE OR REPLACE FUNCTION category.extract_lexical_text(doc text) RETURNS text AS $$
DECLARE
    parsed jsonb;
BEGIN
    IF doc IS NULL OR doc = '' THEN
        RETURN NULL;
    END IF;

    BEGIN
        parsed := doc::jsonb;
    EXCEPTION WHEN OTHERS THEN
        RETURN doc;
    END;

    RETURN (
        WITH RECURSIVE nodes AS (
            SELECT COALESCE(parsed->'root', parsed) AS node
            UNION ALL
            SELECT child
            FROM nodes
            CROSS JOIN LATERAL jsonb_array_elements(nodes.node->'children') AS child
            WHERE jsonb_typeof(nodes.node->'children') = 'array'
        )
        SELECT string_agg(node->>'text', ' ')
        FROM nodes
        WHERE node->>'type' = 'text'
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION category.provider_services_search_sync() RETURNS trigger AS $$
BEGIN
    NEW.search_text := lower(concat_ws(' ',
        NEW.display_name_translations->>'en-US',
        category.extract_lexical_text(NEW.description_translations->>'en-US')
    ));
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.display_name_translations->>'en-US', '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(category.extract_lexical_text(NEW.description_translations->>'en-US'), '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_provider_services_search_sync ON category.provider_services;
CREATE TRIGGER trg_provider_services_search_sync
    BEFORE INSERT OR UPDATE OF display_name_translations, description_translations
    ON category.provider_services
    FOR EACH ROW EXECUTE FUNCTION category.provider_services_search_sync();

CREATE OR REPLACE FUNCTION category.service_providers_search_sync() RETURNS trigger AS $$
BEGIN
    NEW.search_text := lower(concat_ws(' ',
        NEW.name_translations->>'en-US',
        category.extract_lexical_text(NEW.description_translations->>'en-US')
    ));
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.name_translations->>'en-US', '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(category.extract_lexical_text(NEW.description_translations->>'en-US'), '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_service_providers_search_sync ON category.service_providers;
CREATE TRIGGER trg_service_providers_search_sync
    BEFORE INSERT OR UPDATE OF name_translations, description_translations
    ON category.service_providers
    FOR EACH ROW EXECUTE FUNCTION category.service_providers_search_sync();

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_provider_services_search_text_trgm
    ON category.provider_services USING gin (search_text gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_service_providers_search_text_trgm
    ON category.service_providers USING gin (search_text gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_provider_services_search
    ON category.provider_services USING gin (search_vector);

CREATE INDEX IF NOT EXISTS idx_providers_search
    ON category.service_providers USING gin (search_vector);

-- Backfill existing rows
UPDATE category.provider_services SET
    search_text = lower(concat_ws(' ',
        display_name_translations->>'en-US',
        category.extract_lexical_text(description_translations->>'en-US')
    )),
    search_vector = setweight(to_tsvector('english', COALESCE(display_name_translations->>'en-US','')), 'A')
                 || setweight(to_tsvector('english', COALESCE(category.extract_lexical_text(description_translations->>'en-US'), '')), 'B');

UPDATE category.service_providers SET
    search_text = lower(concat_ws(' ',
        name_translations->>'en-US',
        category.extract_lexical_text(description_translations->>'en-US')
    )),
    search_vector = setweight(to_tsvector('english', COALESCE(name_translations->>'en-US','')), 'A')
                 || setweight(to_tsvector('english', COALESCE(category.extract_lexical_text(description_translations->>'en-US'), '')), 'B');

CREATE INDEX IF NOT EXISTS ix_user_search_history_user_created
    ON search.user_search_history (user_id, created_at DESC);
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
DROP TRIGGER IF EXISTS trg_provider_services_search_sync ON category.provider_services;
DROP FUNCTION IF EXISTS category.provider_services_search_sync;
DROP TRIGGER IF EXISTS trg_service_providers_search_sync ON category.service_providers;
DROP FUNCTION IF EXISTS category.service_providers_search_sync;
DROP FUNCTION IF EXISTS category.extract_lexical_text(text);
DROP INDEX IF EXISTS category.idx_provider_services_search;
DROP INDEX IF EXISTS category.idx_providers_search;
DROP INDEX IF EXISTS category.idx_provider_services_search_text_trgm;
DROP INDEX IF EXISTS category.idx_service_providers_search_text_trgm;
DROP INDEX IF EXISTS search.ix_user_search_history_user_created;
");
        }
    }
}
