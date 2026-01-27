using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LSevin.Modules.Category.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class LocalizedStaff : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "notes",
                schema: "category",
                table: "staff_services",
                newName: "notes_translations"
            );

            migrationBuilder.RenameColumn(
                name: "title",
                schema: "category",
                table: "staff",
                newName: "title_translations"
            );

            migrationBuilder.RenameColumn(
                name: "name",
                schema: "category",
                table: "staff",
                newName: "name_translations"
            );

            migrationBuilder.RenameColumn(
                name: "biography",
                schema: "category",
                table: "staff",
                newName: "biography_translations"
            );

            // Convert existing string data to JSONB format
            migrationBuilder.Sql(
                """
                ALTER TABLE category.staff_services
                ALTER COLUMN notes_translations
                TYPE jsonb
                USING jsonb_build_object('en-US', notes_translations);
                """
            );

            migrationBuilder.Sql(
                """
                ALTER TABLE category.staff
                ALTER COLUMN title_translations
                TYPE jsonb
                USING jsonb_build_object('en-US', title_translations);
                """
            );

            migrationBuilder.Sql(
                """
                ALTER TABLE category.staff
                ALTER COLUMN name_translations
                TYPE jsonb
                USING jsonb_build_object('en-US', name_translations);
                """
            );

            migrationBuilder.Sql(
                """
                ALTER TABLE category.staff
                ALTER COLUMN biography_translations
                TYPE jsonb
                USING jsonb_build_object('en-US', biography_translations);
                """
            );

            migrationBuilder.AlterColumn<string>(
                name: "notes_translations",
                schema: "category",
                table: "staff_services",
                type: "jsonb",
                maxLength: 20000,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(250)",
                oldMaxLength: 250
            );

            migrationBuilder.AlterColumn<string>(
                name: "title_translations",
                schema: "category",
                table: "staff",
                type: "jsonb",
                maxLength: 1000,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100
            );

            migrationBuilder.AlterColumn<string>(
                name: "name_translations",
                schema: "category",
                table: "staff",
                type: "jsonb",
                maxLength: 1000,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100
            );

            migrationBuilder.AlterColumn<string>(
                name: "biography_translations",
                schema: "category",
                table: "staff",
                type: "jsonb",
                maxLength: 20000,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(2000)",
                oldMaxLength: 2000
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "notes_translations",
                schema: "category",
                table: "staff_services",
                newName: "notes"
            );

            migrationBuilder.RenameColumn(
                name: "title_translations",
                schema: "category",
                table: "staff",
                newName: "title"
            );

            migrationBuilder.RenameColumn(
                name: "name_translations",
                schema: "category",
                table: "staff",
                newName: "name"
            );

            migrationBuilder.RenameColumn(
                name: "biography_translations",
                schema: "category",
                table: "staff",
                newName: "biography"
            );

            // Convert JSONB data back to string format (extract 'en-US' key)
            migrationBuilder.Sql(
                """
                ALTER TABLE category.staff_services
                ALTER COLUMN notes
                TYPE character varying(250)
                USING COALESCE(notes ->> 'en-US', '');
                """
            );

            migrationBuilder.Sql(
                """
                ALTER TABLE category.staff
                ALTER COLUMN title
                TYPE character varying(100)
                USING COALESCE(title ->> 'en-US', '');
                """
            );

            migrationBuilder.Sql(
                """
                ALTER TABLE category.staff
                ALTER COLUMN name
                TYPE character varying(100)
                USING COALESCE(name ->> 'en-US', '');
                """
            );

            migrationBuilder.Sql(
                """
                ALTER TABLE category.staff
                ALTER COLUMN biography
                TYPE character varying(2000)
                USING COALESCE(biography ->> 'en-US', '');
                """
            );

            migrationBuilder.AlterColumn<string>(
                name: "notes",
                schema: "category",
                table: "staff_services",
                type: "character varying(250)",
                maxLength: 250,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "jsonb",
                oldMaxLength: 20000
            );

            migrationBuilder.AlterColumn<string>(
                name: "title",
                schema: "category",
                table: "staff",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "jsonb",
                oldMaxLength: 1000
            );

            migrationBuilder.AlterColumn<string>(
                name: "name",
                schema: "category",
                table: "staff",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "jsonb",
                oldMaxLength: 1000
            );

            migrationBuilder.AlterColumn<string>(
                name: "biography",
                schema: "category",
                table: "staff",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "jsonb",
                oldMaxLength: 20000
            );
        }
    }
}
