using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LSevin.Modules.Customer.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class LocalizeAddress : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "street",
                schema: "customer",
                table: "customers",
                newName: "street_translations"
            );

            migrationBuilder.RenameColumn(
                name: "detail",
                schema: "customer",
                table: "customers",
                newName: "detail_translations"
            );

            // Convert existing string data to JSONB format
            migrationBuilder.Sql(
                """
                ALTER TABLE customer.customers
                ALTER COLUMN street_translations
                TYPE jsonb
                USING jsonb_build_object('en-US', street_translations);
                """
            );

            migrationBuilder.Sql(
                """
                ALTER TABLE customer.customers
                ALTER COLUMN detail_translations
                TYPE jsonb
                USING jsonb_build_object('en-US', detail_translations);
                """
            );

            migrationBuilder.AlterColumn<string>(
                name: "street_translations",
                schema: "customer",
                table: "customers",
                type: "jsonb",
                maxLength: 1000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100,
                oldNullable: true
            );

            migrationBuilder.AlterColumn<string>(
                name: "detail_translations",
                schema: "customer",
                table: "customers",
                type: "jsonb",
                maxLength: 5000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(500)",
                oldMaxLength: 500,
                oldNullable: true
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "street_translations",
                schema: "customer",
                table: "customers",
                newName: "street"
            );

            migrationBuilder.RenameColumn(
                name: "detail_translations",
                schema: "customer",
                table: "customers",
                newName: "detail"
            );

            // Convert JSONB data back to string format (extract 'en-US' key)
            migrationBuilder.Sql(
                """
                ALTER TABLE customer.customers
                ALTER COLUMN street
                TYPE character varying(100)
                USING COALESCE(street ->> 'en-US', '');
                """
            );

            migrationBuilder.Sql(
                """
                ALTER TABLE customer.customers
                ALTER COLUMN detail
                TYPE character varying(500)
                USING COALESCE(detail ->> 'en-US', '');
                """
            );

            migrationBuilder.AlterColumn<string>(
                name: "street",
                schema: "customer",
                table: "customers",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "jsonb",
                oldMaxLength: 1000,
                oldNullable: true
            );

            migrationBuilder.AlterColumn<string>(
                name: "detail",
                schema: "customer",
                table: "customers",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "jsonb",
                oldMaxLength: 5000,
                oldNullable: true
            );
        }
    }
}
