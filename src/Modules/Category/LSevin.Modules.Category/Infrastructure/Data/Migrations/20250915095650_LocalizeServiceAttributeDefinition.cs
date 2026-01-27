using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LSevin.Modules.Category.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class LocalizeServiceAttributeDefinition : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "name",
                schema: "category",
                table: "service_attribute_definitions",
                newName: "name_translations"
            );

            migrationBuilder.RenameColumn(
                name: "description",
                schema: "category",
                table: "service_attribute_definitions",
                newName: "description_translations"
            );

            // Convert existing string data to JSONB format
            migrationBuilder.Sql(
                """
                ALTER TABLE category.service_attribute_definitions 
                ALTER COLUMN name_translations 
                TYPE jsonb 
                USING jsonb_build_object('en-US', name_translations);
                """
            );

            migrationBuilder.Sql(
                """
                ALTER TABLE category.service_attribute_definitions 
                ALTER COLUMN description_translations 
                TYPE jsonb 
                USING jsonb_build_object('en-US', description_translations);
                """
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "name_translations",
                schema: "category",
                table: "service_attribute_definitions",
                newName: "name"
            );

            migrationBuilder.RenameColumn(
                name: "description_translations",
                schema: "category",
                table: "service_attribute_definitions",
                newName: "description"
            );

            // Convert JSONB data back to string format (extract 'en-US' key)
            migrationBuilder.Sql(
                """
                ALTER TABLE category.service_attribute_definitions 
                ALTER COLUMN name 
                TYPE character varying(100) 
                USING COALESCE(name ->> 'en-US', '');
                """
            );

            migrationBuilder.Sql(
                """
                ALTER TABLE category.service_attribute_definitions 
                ALTER COLUMN description 
                TYPE character varying(2000) 
                USING COALESCE(description ->> 'en-US', '');
                """
            );
        }
    }
}
