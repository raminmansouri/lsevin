using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LSevin.Modules.Category.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddServiceProviderRequest : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
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

            migrationBuilder.CreateTable(
                name: "service_provider_requests",
                schema: "category",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    service_provider_id = table.Column<Guid>(type: "uuid", nullable: false),
                    customer_id = table.Column<Guid>(type: "uuid", nullable: false),
                    customer_email = table.Column<string>(
                        type: "character varying(256)",
                        maxLength: 256,
                        nullable: false
                    ),
                    customer_full_name = table.Column<string>(
                        type: "character varying(256)",
                        maxLength: 256,
                        nullable: false
                    ),
                    message = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    request_status_id = table.Column<int>(type: "integer", nullable: false),
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
                    table.PrimaryKey("pk_service_provider_requests", x => x.id);
                    table.ForeignKey(
                        name: "fk_service_provider_requests_request_statuses_request_status_id",
                        column: x => x.request_status_id,
                        principalSchema: "category",
                        principalTable: "request_statuses",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade
                    );
                    table.ForeignKey(
                        name: "fk_service_provider_requests_service_providers_service_provide",
                        column: x => x.service_provider_id,
                        principalSchema: "category",
                        principalTable: "service_providers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateIndex(
                name: "ix_service_provider_requests_customer_id",
                schema: "category",
                table: "service_provider_requests",
                column: "customer_id"
            );

            migrationBuilder.CreateIndex(
                name: "ix_service_provider_requests_request_status_id",
                schema: "category",
                table: "service_provider_requests",
                column: "request_status_id"
            );

            migrationBuilder.CreateIndex(
                name: "ix_service_provider_requests_service_provider_id",
                schema: "category",
                table: "service_provider_requests",
                column: "service_provider_id"
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "service_provider_requests", schema: "category");

            migrationBuilder.DropTable(name: "request_statuses", schema: "category");
        }
    }
}
