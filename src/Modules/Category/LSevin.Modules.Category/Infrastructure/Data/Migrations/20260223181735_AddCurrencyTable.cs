using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LSevin.Modules.Category.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCurrencyTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "common");

            migrationBuilder.CreateTable(
                name: "currencies",
                schema: "common",
                columns: table => new
                {
                    symbol = table.Column<string>(type: "character varying(15)", maxLength: 15, nullable: false),
                    name = table.Column<string>(type: "character varying(25)", maxLength: 25, nullable: true),
                    rate = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    title = table.Column<string>(type: "character varying(25)", maxLength: 25, nullable: true),
                    create_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                    last_modified_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "now()"),
                    id = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_currencies", x => x.symbol);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "currencies",
                schema: "common");
        }
    }
}
