using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace LSevin.Modules.Category.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddLocation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "LocationType",
                schema: "category",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false),
                    name = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_location_type", x => x.id);
                }
            );

            migrationBuilder.CreateTable(
                name: "locations",
                schema: "category",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    code = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    value = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    location_type_id = table.Column<int>(type: "integer", nullable: false),
                    parent_id = table.Column<Guid>(type: "uuid", nullable: true),
                    create_date = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false,
                        defaultValueSql: "now()"
                    ),
                    last_modified_date = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: true,
                        defaultValueSql: "now()"
                    ),
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_locations", x => x.id);
                    table.ForeignKey(
                        name: "fk_locations_location_type_location_type_id",
                        column: x => x.location_type_id,
                        principalSchema: "category",
                        principalTable: "LocationType",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade
                    );
                    table.ForeignKey(
                        name: "fk_locations_locations_parent_id",
                        column: x => x.parent_id,
                        principalSchema: "category",
                        principalTable: "locations",
                        principalColumn: "id"
                    );
                }
            );

            migrationBuilder.InsertData(
                schema: "category",
                table: "LocationType",
                columns: new[] { "id", "name" },
                values: new object[,]
                {
                    { 1, "Country" },
                    { 2, "City" },
                }
            );

            migrationBuilder.CreateIndex(
                name: "ix_locations_code",
                schema: "category",
                table: "locations",
                column: "code"
            );

            migrationBuilder.CreateIndex(
                name: "ix_locations_location_type_id",
                schema: "category",
                table: "locations",
                column: "location_type_id"
            );

            migrationBuilder.CreateIndex(
                name: "ix_locations_parent_id",
                schema: "category",
                table: "locations",
                column: "parent_id"
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "locations", schema: "category");

            migrationBuilder.DropTable(name: "LocationType", schema: "category");
        }
    }
}
