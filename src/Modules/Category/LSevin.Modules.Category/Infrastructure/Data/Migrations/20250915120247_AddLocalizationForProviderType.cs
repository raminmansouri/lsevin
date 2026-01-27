using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LSevin.Modules.Category.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddLocalizationForProviderType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "name",
                schema: "category",
                table: "provider_types",
                newName: "name_translations"
            );

            migrationBuilder.RenameColumn(
                name: "description",
                schema: "category",
                table: "provider_types",
                newName: "description_translations"
            );

            migrationBuilder.RenameColumn(
                name: "name",
                schema: "category",
                table: "provider_attribute_definitions",
                newName: "name_translations"
            );

            migrationBuilder.RenameColumn(
                name: "description",
                schema: "category",
                table: "provider_attribute_definitions",
                newName: "description_translations"
            );

            migrationBuilder.RenameColumn(
                name: "value",
                schema: "category",
                table: "provider_attribute_definition_domain_options",
                newName: "value_translations"
            );

            migrationBuilder.RenameColumn(
                name: "display_name",
                schema: "category",
                table: "provider_attribute_definition_domain_options",
                newName: "display_name_translations"
            );

            // Convert existing string data to JSONB format
            migrationBuilder.Sql(
                """
                ALTER TABLE category.provider_types 
                ALTER COLUMN name_translations 
                TYPE jsonb 
                USING jsonb_build_object('en-US', name_translations);
                """
            );

            migrationBuilder.Sql(
                """
                ALTER TABLE category.provider_types 
                ALTER COLUMN description_translations 
                TYPE jsonb 
                USING jsonb_build_object('en-US', description_translations);
                """
            );

            migrationBuilder.Sql(
                """
                ALTER TABLE category.provider_attribute_definitions 
                ALTER COLUMN name_translations 
                TYPE jsonb 
                USING jsonb_build_object('en-US', name_translations);
                """
            );

            migrationBuilder.Sql(
                """
                ALTER TABLE category.provider_attribute_definitions 
                ALTER COLUMN description_translations 
                TYPE jsonb 
                USING jsonb_build_object('en-US', description_translations);
                """
            );

            migrationBuilder.Sql(
                """
                ALTER TABLE category.provider_attribute_definition_domain_options 
                ALTER COLUMN value_translations 
                TYPE jsonb 
                USING jsonb_build_object('en-US', value_translations);
                """
            );

            migrationBuilder.Sql(
                """
                ALTER TABLE category.provider_attribute_definition_domain_options 
                ALTER COLUMN display_name_translations 
                TYPE jsonb 
                USING jsonb_build_object('en-US', display_name_translations);
                """
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "name_translations",
                schema: "category",
                table: "provider_types",
                newName: "name"
            );

            migrationBuilder.RenameColumn(
                name: "description_translations",
                schema: "category",
                table: "provider_types",
                newName: "description"
            );

            migrationBuilder.RenameColumn(
                name: "name_translations",
                schema: "category",
                table: "provider_attribute_definitions",
                newName: "name"
            );

            migrationBuilder.RenameColumn(
                name: "description_translations",
                schema: "category",
                table: "provider_attribute_definitions",
                newName: "description"
            );

            migrationBuilder.RenameColumn(
                name: "value_translations",
                schema: "category",
                table: "provider_attribute_definition_domain_options",
                newName: "value"
            );

            migrationBuilder.RenameColumn(
                name: "display_name_translations",
                schema: "category",
                table: "provider_attribute_definition_domain_options",
                newName: "display_name"
            );

            // Convert JSONB data back to string format (extract 'en-US' key)
            migrationBuilder.Sql(
                """
                ALTER TABLE category.provider_types 
                ALTER COLUMN name 
                TYPE character varying(100) 
                USING COALESCE(name ->> 'en-US', '');
                """
            );

            migrationBuilder.Sql(
                """
                ALTER TABLE category.provider_types 
                ALTER COLUMN description 
                TYPE character varying(2000) 
                USING COALESCE(description ->> 'en-US', '');
                """
            );

            migrationBuilder.Sql(
                """
                ALTER TABLE category.provider_attribute_definitions 
                ALTER COLUMN name 
                TYPE character varying(100) 
                USING COALESCE(name ->> 'en-US', '');
                """
            );

            migrationBuilder.Sql(
                """
                ALTER TABLE category.provider_attribute_definitions 
                ALTER COLUMN description 
                TYPE character varying(2000) 
                USING COALESCE(description ->> 'en-US', '');
                """
            );

            migrationBuilder.Sql(
                """
                ALTER TABLE category.provider_attribute_definition_domain_options 
                ALTER COLUMN value 
                TYPE character varying(100) 
                USING COALESCE(value ->> 'en-US', '');
                """
            );

            migrationBuilder.Sql(
                """
                ALTER TABLE category.provider_attribute_definition_domain_options 
                ALTER COLUMN display_name 
                TYPE character varying(100) 
                USING COALESCE(display_name ->> 'en-US', '');
                """
            );
        }
    }
}
