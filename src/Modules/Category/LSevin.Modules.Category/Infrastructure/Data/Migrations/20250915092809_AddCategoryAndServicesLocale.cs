using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LSevin.Modules.Category.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCategoryAndServicesLocale : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "name",
                schema: "category",
                table: "service_definitions",
                newName: "name_translations"
            );

            migrationBuilder.RenameColumn(
                name: "description",
                schema: "category",
                table: "service_definitions",
                newName: "description_translations"
            );

            migrationBuilder.RenameColumn(
                name: "description",
                schema: "category",
                table: "service_definition_domain_requirements",
                newName: "description_translations"
            );

            migrationBuilder.RenameColumn(
                name: "value",
                schema: "category",
                table: "service_attribute_definition_options",
                newName: "value_translations"
            );

            migrationBuilder.RenameColumn(
                name: "display_name",
                schema: "category",
                table: "service_attribute_definition_options",
                newName: "display_name_translations"
            );

            migrationBuilder.RenameColumn(
                name: "name",
                schema: "category",
                table: "categories",
                newName: "name_translations"
            );

            migrationBuilder.RenameColumn(
                name: "description",
                schema: "category",
                table: "categories",
                newName: "description_translations"
            );

            // Convert existing string data to JSONB format
            migrationBuilder.Sql(
                """
                ALTER TABLE category.service_definitions 
                ALTER COLUMN name_translations 
                TYPE jsonb 
                USING jsonb_build_object('en', name_translations);
                """
            );

            migrationBuilder.Sql(
                """
                ALTER TABLE category.service_definitions 
                ALTER COLUMN description_translations 
                TYPE jsonb 
                USING jsonb_build_object('en', description_translations);
                """
            );

            migrationBuilder.Sql(
                """
                ALTER TABLE category.service_definition_domain_requirements 
                ALTER COLUMN description_translations 
                TYPE jsonb 
                USING jsonb_build_object('en', description_translations);
                """
            );

            migrationBuilder.Sql(
                """
                ALTER TABLE category.service_attribute_definition_options 
                ALTER COLUMN value_translations 
                TYPE jsonb 
                USING jsonb_build_object('en', value_translations);
                """
            );

            migrationBuilder.Sql(
                """
                ALTER TABLE category.service_attribute_definition_options 
                ALTER COLUMN display_name_translations 
                TYPE jsonb 
                USING jsonb_build_object('en', display_name_translations);
                """
            );

            migrationBuilder.Sql(
                """
                ALTER TABLE category.categories 
                ALTER COLUMN name_translations 
                TYPE jsonb 
                USING jsonb_build_object('en', name_translations);
                """
            );

            migrationBuilder.Sql(
                """
                ALTER TABLE category.categories 
                ALTER COLUMN description_translations 
                TYPE jsonb 
                USING jsonb_build_object('en', description_translations);
                """
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "name_translations",
                schema: "category",
                table: "service_definitions",
                newName: "name"
            );

            migrationBuilder.RenameColumn(
                name: "description_translations",
                schema: "category",
                table: "service_definitions",
                newName: "description"
            );

            migrationBuilder.RenameColumn(
                name: "description_translations",
                schema: "category",
                table: "service_definition_domain_requirements",
                newName: "description"
            );

            migrationBuilder.RenameColumn(
                name: "value_translations",
                schema: "category",
                table: "service_attribute_definition_options",
                newName: "value"
            );

            migrationBuilder.RenameColumn(
                name: "display_name_translations",
                schema: "category",
                table: "service_attribute_definition_options",
                newName: "display_name"
            );

            migrationBuilder.RenameColumn(
                name: "name_translations",
                schema: "category",
                table: "categories",
                newName: "name"
            );

            migrationBuilder.RenameColumn(
                name: "description_translations",
                schema: "category",
                table: "categories",
                newName: "description"
            );

            // Convert JSONB data back to string format (extract 'en' key)
            migrationBuilder.Sql(
                """
                ALTER TABLE category.service_definitions 
                ALTER COLUMN name 
                TYPE character varying(100) 
                USING COALESCE(name ->> 'en', '');
                """
            );

            migrationBuilder.Sql(
                """
                ALTER TABLE category.service_definitions 
                ALTER COLUMN description 
                TYPE character varying(2000) 
                USING COALESCE(description ->> 'en', '');
                """
            );

            migrationBuilder.Sql(
                """
                ALTER TABLE category.service_definition_domain_requirements 
                ALTER COLUMN description 
                TYPE character varying(2000) 
                USING COALESCE(description ->> 'en', '');
                """
            );

            migrationBuilder.Sql(
                """
                ALTER TABLE category.service_attribute_definition_options 
                ALTER COLUMN value 
                TYPE character varying(100) 
                USING COALESCE(value ->> 'en', '');
                """
            );

            migrationBuilder.Sql(
                """
                ALTER TABLE category.service_attribute_definition_options 
                ALTER COLUMN display_name 
                TYPE character varying(100) 
                USING COALESCE(display_name ->> 'en', '');
                """
            );

            migrationBuilder.Sql(
                """
                ALTER TABLE category.categories 
                ALTER COLUMN name 
                TYPE character varying(250) 
                USING COALESCE(name ->> 'en', '');
                """
            );

            migrationBuilder.Sql(
                """
                ALTER TABLE category.categories 
                ALTER COLUMN description 
                TYPE character varying(2000) 
                USING COALESCE(description ->> 'en', '');
                """
            );
        }
    }
}
