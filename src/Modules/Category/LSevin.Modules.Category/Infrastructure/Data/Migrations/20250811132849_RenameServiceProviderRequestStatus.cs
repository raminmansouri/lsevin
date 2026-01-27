using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LSevin.Modules.Category.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class RenameServiceProviderRequestStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_service_provider_requests_request_statuses_request_status_id",
                schema: "category",
                table: "service_provider_requests"
            );

            migrationBuilder.DropTable(name: "request_statuses", schema: "category");

            migrationBuilder.CreateTable(
                name: "service_provider_request_statuses",
                schema: "category",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false),
                    name = table.Column<string>(type: "character varying(25)", maxLength: 25, nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_service_provider_request_statuses", x => x.id);
                }
            );

            migrationBuilder.AddForeignKey(
                name: "fk_service_provider_requests_service_provider_request_statuses",
                schema: "category",
                table: "service_provider_requests",
                column: "request_status_id",
                principalSchema: "category",
                principalTable: "service_provider_request_statuses",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_service_provider_requests_service_provider_request_statuses",
                schema: "category",
                table: "service_provider_requests"
            );

            migrationBuilder.DropTable(name: "service_provider_request_statuses", schema: "category");

            migrationBuilder.CreateTable(
                name: "request_statuses",
                schema: "category",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false),
                    name = table.Column<string>(type: "character varying(25)", maxLength: 25, nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_request_statuses", x => x.id);
                }
            );

            migrationBuilder.AddForeignKey(
                name: "fk_service_provider_requests_request_statuses_request_status_id",
                schema: "category",
                table: "service_provider_requests",
                column: "request_status_id",
                principalSchema: "category",
                principalTable: "request_statuses",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade
            );
        }
    }
}
