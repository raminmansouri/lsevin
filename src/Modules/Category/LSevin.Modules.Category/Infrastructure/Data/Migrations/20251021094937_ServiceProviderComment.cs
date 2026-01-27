using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LSevin.Modules.Category.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class ServiceProviderComment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "service_provider_comments",
                schema: "category",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    service_provider_id = table.Column<Guid>(type: "uuid", nullable: false),
                    customer_id = table.Column<Guid>(type: "uuid", nullable: false),
                    customer_name = table.Column<string>(
                        type: "character varying(150)",
                        maxLength: 150,
                        nullable: false
                    ),
                    comment_text = table.Column<string>(
                        type: "character varying(2000)",
                        maxLength: 2000,
                        nullable: false
                    ),
                    rating = table.Column<int>(type: "integer", nullable: true),
                    is_public = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    create_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    last_modified_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_service_provider_comments", x => x.id);
                    table.ForeignKey(
                        name: "fk_service_provider_comments_service_providers_service_provide",
                        column: x => x.service_provider_id,
                        principalSchema: "category",
                        principalTable: "service_providers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateIndex(
                name: "ix_service_provider_comments_create_date",
                schema: "category",
                table: "service_provider_comments",
                column: "create_date"
            );

            migrationBuilder.CreateIndex(
                name: "ix_service_provider_comments_customer_id",
                schema: "category",
                table: "service_provider_comments",
                column: "customer_id"
            );

            migrationBuilder.CreateIndex(
                name: "ix_service_provider_comments_service_provider_id",
                schema: "category",
                table: "service_provider_comments",
                column: "service_provider_id"
            );

            migrationBuilder.CreateIndex(
                name: "ix_service_provider_comments_service_provider_id_is_public",
                schema: "category",
                table: "service_provider_comments",
                columns: new[] { "service_provider_id", "is_public" }
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "service_provider_comments", schema: "category");
        }
    }
}
