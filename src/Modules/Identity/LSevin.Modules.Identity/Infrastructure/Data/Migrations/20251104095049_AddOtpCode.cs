using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LSevin.Modules.Identity.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddOtpCode : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "phone_login_codes",
                schema: "identity",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    code = table.Column<string>(type: "character(6)", fixedLength: true, maxLength: 6, nullable: false),
                    sent_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    used_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    expires_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    attempt_count = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    is_invalidated = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    phone_number_country_code = table.Column<string>(
                        type: "character varying(3)",
                        maxLength: 3,
                        nullable: false
                    ),
                    phone_number = table.Column<string>(type: "character varying(15)", maxLength: 15, nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_phone_login_codes", x => x.id);
                    table.ForeignKey(
                        name: "fk_phone_login_codes_asp_net_users_user_id",
                        column: x => x.user_id,
                        principalSchema: "identity",
                        principalTable: "asp_net_users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateIndex(
                name: "ix_phone_login_codes_expires_at",
                schema: "identity",
                table: "phone_login_codes",
                column: "expires_at"
            );

            migrationBuilder.CreateIndex(
                name: "ix_phone_login_codes_user_id",
                schema: "identity",
                table: "phone_login_codes",
                column: "user_id"
            );

            migrationBuilder.CreateIndex(
                name: "ix_phone_login_codes_user_id_is_invalidated_expires_at",
                schema: "identity",
                table: "phone_login_codes",
                columns: new[] { "user_id", "is_invalidated", "expires_at" }
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "phone_login_codes", schema: "identity");
        }
    }
}
