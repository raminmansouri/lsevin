using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace LSevin.Modules.Identity.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class Initial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(name: "identity");

            migrationBuilder.CreateTable(
                name: "asp_net_roles",
                schema: "identity",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    normalized_name = table.Column<string>(
                        type: "character varying(256)",
                        maxLength: 256,
                        nullable: true
                    ),
                    concurrency_stamp = table.Column<string>(type: "text", nullable: true),
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_asp_net_roles", x => x.id);
                }
            );

            migrationBuilder.CreateTable(
                name: "asp_net_users",
                schema: "identity",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    first_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    last_name = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    phone_number_country_code = table.Column<string>(
                        type: "character varying(3)",
                        maxLength: 3,
                        nullable: false
                    ),
                    last_logged_in_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    user_state = table.Column<string>(type: "text", nullable: false, defaultValue: "Active"),
                    created_at = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false,
                        defaultValueSql: "now()"
                    ),
                    user_name = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    normalized_user_name = table.Column<string>(
                        type: "character varying(50)",
                        maxLength: 50,
                        nullable: false
                    ),
                    email = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    normalized_email = table.Column<string>(
                        type: "character varying(250)",
                        maxLength: 250,
                        nullable: false
                    ),
                    email_confirmed = table.Column<bool>(type: "boolean", nullable: false),
                    password_hash = table.Column<string>(type: "text", nullable: true),
                    security_stamp = table.Column<string>(type: "text", nullable: true),
                    concurrency_stamp = table.Column<string>(type: "text", nullable: true),
                    phone_number = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    phone_number_confirmed = table.Column<bool>(type: "boolean", nullable: false),
                    two_factor_enabled = table.Column<bool>(type: "boolean", nullable: false),
                    lockout_end = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    lockout_enabled = table.Column<bool>(type: "boolean", nullable: false),
                    access_failed_count = table.Column<int>(type: "integer", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_asp_net_users", x => x.id);
                }
            );

            migrationBuilder.CreateTable(
                name: "email_verification_codes",
                schema: "identity",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    email = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    code = table.Column<string>(type: "character(6)", fixedLength: true, maxLength: 6, nullable: false),
                    sent_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    used_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_email_verification_codes", x => x.id);
                }
            );

            migrationBuilder.CreateTable(
                name: "inbox_message_consumers",
                schema: "identity",
                columns: table => new
                {
                    message_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_inbox_message_consumers", x => new { x.message_id, x.name });
                }
            );

            migrationBuilder.CreateTable(
                name: "inbox_messages",
                schema: "identity",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    type = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    content = table.Column<string>(type: "jsonb", maxLength: 2000, nullable: false),
                    occurred_on_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    processed_on_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    error = table.Column<string>(type: "text", nullable: true),
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_inbox_messages", x => x.id);
                }
            );

            migrationBuilder.CreateTable(
                name: "internal_command_message_consumers",
                schema: "identity",
                columns: table => new
                {
                    message_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_internal_command_message_consumers", x => new { x.message_id, x.name });
                }
            );

            migrationBuilder.CreateTable(
                name: "internal_command_messages",
                schema: "identity",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    type = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    content = table.Column<string>(type: "jsonb", maxLength: 2000, nullable: false),
                    occurred_on_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    processed_on_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    error = table.Column<string>(type: "text", nullable: true),
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_internal_command_messages", x => x.id);
                }
            );

            migrationBuilder.CreateTable(
                name: "outbox_message_consumers",
                schema: "identity",
                columns: table => new
                {
                    message_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_outbox_message_consumers", x => new { x.message_id, x.name });
                }
            );

            migrationBuilder.CreateTable(
                name: "outbox_messages",
                schema: "identity",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    type = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    content = table.Column<string>(type: "jsonb", maxLength: 2000, nullable: false),
                    occurred_on_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    processed_on_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    error = table.Column<string>(type: "text", nullable: true),
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_outbox_messages", x => x.id);
                }
            );

            migrationBuilder.CreateTable(
                name: "password_reset_codes",
                schema: "identity",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    email = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    code = table.Column<string>(type: "character varying(6)", maxLength: 6, nullable: false),
                    sent_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    used_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_password_reset_codes", x => x.id);
                }
            );

            migrationBuilder.CreateTable(
                name: "asp_net_role_claims",
                schema: "identity",
                columns: table => new
                {
                    id = table
                        .Column<int>(type: "integer", nullable: false)
                        .Annotation(
                            "Npgsql:ValueGenerationStrategy",
                            NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                        ),
                    role_id = table.Column<Guid>(type: "uuid", nullable: false),
                    claim_type = table.Column<string>(type: "text", nullable: true),
                    claim_value = table.Column<string>(type: "text", nullable: true),
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_asp_net_role_claims", x => x.id);
                    table.ForeignKey(
                        name: "fk_asp_net_role_claims_asp_net_roles_role_id",
                        column: x => x.role_id,
                        principalSchema: "identity",
                        principalTable: "asp_net_roles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "access_tokens",
                schema: "identity",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    token = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    expired_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by_ip = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_access_tokens", x => x.id);
                    table.ForeignKey(
                        name: "fk_access_tokens_asp_net_users_user_id",
                        column: x => x.user_id,
                        principalSchema: "identity",
                        principalTable: "asp_net_users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "asp_net_user_claims",
                schema: "identity",
                columns: table => new
                {
                    id = table
                        .Column<int>(type: "integer", nullable: false)
                        .Annotation(
                            "Npgsql:ValueGenerationStrategy",
                            NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                        ),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    claim_type = table.Column<string>(type: "text", nullable: true),
                    claim_value = table.Column<string>(type: "text", nullable: true),
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_asp_net_user_claims", x => x.id);
                    table.ForeignKey(
                        name: "fk_asp_net_user_claims_asp_net_users_user_id",
                        column: x => x.user_id,
                        principalSchema: "identity",
                        principalTable: "asp_net_users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "asp_net_user_logins",
                schema: "identity",
                columns: table => new
                {
                    login_provider = table.Column<string>(type: "text", nullable: false),
                    provider_key = table.Column<string>(type: "text", nullable: false),
                    provider_display_name = table.Column<string>(type: "text", nullable: true),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_asp_net_user_logins", x => new { x.login_provider, x.provider_key });
                    table.ForeignKey(
                        name: "fk_asp_net_user_logins_asp_net_users_user_id",
                        column: x => x.user_id,
                        principalSchema: "identity",
                        principalTable: "asp_net_users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "asp_net_user_roles",
                schema: "identity",
                columns: table => new
                {
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    role_id = table.Column<Guid>(type: "uuid", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_asp_net_user_roles", x => new { x.user_id, x.role_id });
                    table.ForeignKey(
                        name: "fk_asp_net_user_roles_asp_net_roles_role_id",
                        column: x => x.role_id,
                        principalSchema: "identity",
                        principalTable: "asp_net_roles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade
                    );
                    table.ForeignKey(
                        name: "fk_asp_net_user_roles_asp_net_users_user_id",
                        column: x => x.user_id,
                        principalSchema: "identity",
                        principalTable: "asp_net_users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "asp_net_user_tokens",
                schema: "identity",
                columns: table => new
                {
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    login_provider = table.Column<string>(type: "text", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    value = table.Column<string>(type: "text", nullable: true),
                },
                constraints: table =>
                {
                    table.PrimaryKey(
                        "pk_asp_net_user_tokens",
                        x => new
                        {
                            x.user_id,
                            x.login_provider,
                            x.name,
                        }
                    );
                    table.ForeignKey(
                        name: "fk_asp_net_user_tokens_asp_net_users_user_id",
                        column: x => x.user_id,
                        principalSchema: "identity",
                        principalTable: "asp_net_users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "refresh_tokens",
                schema: "identity",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    token = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    expired_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by_ip = table.Column<string>(type: "text", nullable: false),
                    revoked_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_refresh_tokens", x => x.id);
                    table.ForeignKey(
                        name: "fk_refresh_tokens_asp_net_users_user_id",
                        column: x => x.user_id,
                        principalSchema: "identity",
                        principalTable: "asp_net_users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateIndex(
                name: "ix_access_tokens_token_user_id",
                schema: "identity",
                table: "access_tokens",
                columns: new[] { "token", "user_id" },
                unique: true
            );

            migrationBuilder.CreateIndex(
                name: "ix_access_tokens_user_id",
                schema: "identity",
                table: "access_tokens",
                column: "user_id"
            );

            migrationBuilder.CreateIndex(
                name: "ix_asp_net_role_claims_role_id",
                schema: "identity",
                table: "asp_net_role_claims",
                column: "role_id"
            );

            migrationBuilder.CreateIndex(
                name: "RoleNameIndex",
                schema: "identity",
                table: "asp_net_roles",
                column: "normalized_name",
                unique: true
            );

            migrationBuilder.CreateIndex(
                name: "ix_asp_net_user_claims_user_id",
                schema: "identity",
                table: "asp_net_user_claims",
                column: "user_id"
            );

            migrationBuilder.CreateIndex(
                name: "ix_asp_net_user_logins_user_id",
                schema: "identity",
                table: "asp_net_user_logins",
                column: "user_id"
            );

            migrationBuilder.CreateIndex(
                name: "ix_asp_net_user_roles_role_id",
                schema: "identity",
                table: "asp_net_user_roles",
                column: "role_id"
            );

            migrationBuilder.CreateIndex(
                name: "EmailIndex",
                schema: "identity",
                table: "asp_net_users",
                column: "normalized_email",
                unique: true
            );

            migrationBuilder.CreateIndex(
                name: "ix_asp_net_users_email",
                schema: "identity",
                table: "asp_net_users",
                column: "email",
                unique: true
            );

            migrationBuilder.CreateIndex(
                name: "ix_asp_net_users_phone_number_country_code_phone_number",
                schema: "identity",
                table: "asp_net_users",
                columns: new[] { "phone_number_country_code", "phone_number" },
                unique: true
            );

            migrationBuilder.CreateIndex(
                name: "UserNameIndex",
                schema: "identity",
                table: "asp_net_users",
                column: "normalized_user_name",
                unique: true
            );

            migrationBuilder.CreateIndex(
                name: "inbox_message_consumers_message_id_name",
                schema: "identity",
                table: "inbox_message_consumers",
                columns: new[] { "message_id", "name" }
            );

            migrationBuilder.CreateIndex(
                name: "idx_inbox_messages_occurred_on",
                schema: "identity",
                table: "inbox_messages",
                column: "occurred_on_utc"
            );

            migrationBuilder.CreateIndex(
                name: "idx_inbox_messages_processed_occurred",
                schema: "identity",
                table: "inbox_messages",
                columns: new[] { "processed_on_utc", "occurred_on_utc" }
            );

            migrationBuilder.CreateIndex(
                name: "idx_inbox_messages_processed_on",
                schema: "identity",
                table: "inbox_messages",
                column: "processed_on_utc"
            );

            migrationBuilder
                .CreateIndex(
                    name: "idx_inbox_messages_unprocessed",
                    schema: "identity",
                    table: "inbox_messages",
                    columns: new[] { "occurred_on_utc", "processed_on_utc" },
                    filter: "processed_on_utc IS NULL"
                )
                .Annotation("Npgsql:IndexInclude", new[] { "id", "type", "content" });

            migrationBuilder.CreateIndex(
                name: "internal_command_message_consumers_message_id_name",
                schema: "identity",
                table: "internal_command_message_consumers",
                columns: new[] { "message_id", "name" }
            );

            migrationBuilder.CreateIndex(
                name: "idx_internal_command_messages_occurred_on",
                schema: "identity",
                table: "internal_command_messages",
                column: "occurred_on_utc"
            );

            migrationBuilder.CreateIndex(
                name: "idx_internal_command_messages_processed_occurred",
                schema: "identity",
                table: "internal_command_messages",
                columns: new[] { "processed_on_utc", "occurred_on_utc" }
            );

            migrationBuilder.CreateIndex(
                name: "idx_internal_command_messages_processed_on",
                schema: "identity",
                table: "internal_command_messages",
                column: "processed_on_utc"
            );

            migrationBuilder
                .CreateIndex(
                    name: "idx_internal_command_messages_unprocessed",
                    schema: "identity",
                    table: "internal_command_messages",
                    columns: new[] { "occurred_on_utc", "processed_on_utc" },
                    filter: "processed_on_utc IS NULL"
                )
                .Annotation("Npgsql:IndexInclude", new[] { "id", "type", "content" });

            migrationBuilder.CreateIndex(
                name: "outbox_message_consumers_message_id_name",
                schema: "identity",
                table: "outbox_message_consumers",
                columns: new[] { "message_id", "name" }
            );

            migrationBuilder.CreateIndex(
                name: "idx_outbox_messages_occurred_on",
                schema: "identity",
                table: "outbox_messages",
                column: "occurred_on_utc"
            );

            migrationBuilder.CreateIndex(
                name: "idx_outbox_messages_processed_occurred",
                schema: "identity",
                table: "outbox_messages",
                columns: new[] { "processed_on_utc", "occurred_on_utc" }
            );

            migrationBuilder.CreateIndex(
                name: "idx_outbox_messages_processed_on",
                schema: "identity",
                table: "outbox_messages",
                column: "processed_on_utc"
            );

            migrationBuilder
                .CreateIndex(
                    name: "idx_outbox_messages_unprocessed",
                    schema: "identity",
                    table: "outbox_messages",
                    columns: new[] { "occurred_on_utc", "processed_on_utc" },
                    filter: "processed_on_utc IS NULL"
                )
                .Annotation("Npgsql:IndexInclude", new[] { "id", "type", "content" });

            migrationBuilder.CreateIndex(
                name: "ix_refresh_tokens_token_user_id",
                schema: "identity",
                table: "refresh_tokens",
                columns: new[] { "token", "user_id" },
                unique: true
            );

            migrationBuilder.CreateIndex(
                name: "ix_refresh_tokens_user_id",
                schema: "identity",
                table: "refresh_tokens",
                column: "user_id"
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "access_tokens", schema: "identity");

            migrationBuilder.DropTable(name: "asp_net_role_claims", schema: "identity");

            migrationBuilder.DropTable(name: "asp_net_user_claims", schema: "identity");

            migrationBuilder.DropTable(name: "asp_net_user_logins", schema: "identity");

            migrationBuilder.DropTable(name: "asp_net_user_roles", schema: "identity");

            migrationBuilder.DropTable(name: "asp_net_user_tokens", schema: "identity");

            migrationBuilder.DropTable(name: "email_verification_codes", schema: "identity");

            migrationBuilder.DropTable(name: "inbox_message_consumers", schema: "identity");

            migrationBuilder.DropTable(name: "inbox_messages", schema: "identity");

            migrationBuilder.DropTable(name: "internal_command_message_consumers", schema: "identity");

            migrationBuilder.DropTable(name: "internal_command_messages", schema: "identity");

            migrationBuilder.DropTable(name: "outbox_message_consumers", schema: "identity");

            migrationBuilder.DropTable(name: "outbox_messages", schema: "identity");

            migrationBuilder.DropTable(name: "password_reset_codes", schema: "identity");

            migrationBuilder.DropTable(name: "refresh_tokens", schema: "identity");

            migrationBuilder.DropTable(name: "asp_net_roles", schema: "identity");

            migrationBuilder.DropTable(name: "asp_net_users", schema: "identity");
        }
    }
}
