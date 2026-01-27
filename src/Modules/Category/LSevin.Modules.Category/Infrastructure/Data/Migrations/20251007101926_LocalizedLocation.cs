using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LSevin.Modules.Category.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class LocalizedLocation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "value",
                schema: "category",
                table: "locations",
                newName: "value_translations"
            );

            // Convert existing string data to JSONB format
            migrationBuilder.Sql(
                """
                ALTER TABLE category.locations
                ALTER COLUMN value_translations
                TYPE jsonb
                USING jsonb_build_object('en-US', value_translations);
                """
            );

            migrationBuilder.AlterColumn<string>(
                name: "value_translations",
                schema: "category",
                table: "locations",
                type: "jsonb",
                maxLength: 4000,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "value_translations",
                schema: "category",
                table: "locations",
                newName: "value"
            );

            // Convert JSONB data back to string format (extract 'en-US' key)
            migrationBuilder.Sql(
                """
                ALTER TABLE category.locations
                ALTER COLUMN value
                TYPE character varying(100)
                USING COALESCE(value ->> 'en-US', '');
                """
            );

            migrationBuilder.AlterColumn<string>(
                name: "value",
                schema: "category",
                table: "locations",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "jsonb",
                oldMaxLength: 4000
            );
        }
    }
}
