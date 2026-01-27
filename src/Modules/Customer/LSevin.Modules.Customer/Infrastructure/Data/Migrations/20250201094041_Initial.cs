using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LSevin.Modules.Customer.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class Initial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(name: "customer");

            migrationBuilder.AlterDatabase().Annotation("Npgsql:PostgresExtension:uuid-ossp", ",,");

            migrationBuilder.CreateTable(
                name: "customers",
                schema: "customer",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    phone_number = table.Column<string>(type: "character varying(15)", maxLength: 15, nullable: false),
                    phone_number_country_code = table.Column<string>(
                        type: "character varying(3)",
                        maxLength: 3,
                        nullable: false
                    ),
                    email = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    birth_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    street = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    city = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    state = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    country = table.Column<string>(type: "character varying(25)", maxLength: 25, nullable: true),
                    detail = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                    zip_code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    first_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    last_name = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
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
                    table.PrimaryKey("pk_customers", x => x.id);
                }
            );

            migrationBuilder.CreateTable(
                name: "inbox_message_consumers",
                schema: "customer",
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
                schema: "customer",
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
                schema: "customer",
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
                schema: "customer",
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
                schema: "customer",
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
                schema: "customer",
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

            migrationBuilder.CreateIndex(
                name: "ix_customers_email",
                schema: "customer",
                table: "customers",
                column: "email",
                unique: true
            );

            migrationBuilder.CreateIndex(
                name: "ix_customers_id",
                schema: "customer",
                table: "customers",
                column: "id",
                unique: true
            );

            migrationBuilder.CreateIndex(
                name: "ix_customers_phone_number_phone_number_country_code",
                schema: "customer",
                table: "customers",
                columns: new[] { "phone_number", "phone_number_country_code" },
                unique: true
            );

            migrationBuilder.CreateIndex(
                name: "inbox_message_consumers_message_id_name",
                schema: "customer",
                table: "inbox_message_consumers",
                columns: new[] { "message_id", "name" }
            );

            migrationBuilder.CreateIndex(
                name: "idx_inbox_messages_occurred_on",
                schema: "customer",
                table: "inbox_messages",
                column: "occurred_on_utc"
            );

            migrationBuilder.CreateIndex(
                name: "idx_inbox_messages_processed_occurred",
                schema: "customer",
                table: "inbox_messages",
                columns: new[] { "processed_on_utc", "occurred_on_utc" }
            );

            migrationBuilder.CreateIndex(
                name: "idx_inbox_messages_processed_on",
                schema: "customer",
                table: "inbox_messages",
                column: "processed_on_utc"
            );

            migrationBuilder
                .CreateIndex(
                    name: "idx_inbox_messages_unprocessed",
                    schema: "customer",
                    table: "inbox_messages",
                    columns: new[] { "occurred_on_utc", "processed_on_utc" },
                    filter: "processed_on_utc IS NULL"
                )
                .Annotation("Npgsql:IndexInclude", new[] { "id", "type", "content" });

            migrationBuilder.CreateIndex(
                name: "internal_command_message_consumers_message_id_name",
                schema: "customer",
                table: "internal_command_message_consumers",
                columns: new[] { "message_id", "name" }
            );

            migrationBuilder.CreateIndex(
                name: "idx_internal_command_messages_occurred_on",
                schema: "customer",
                table: "internal_command_messages",
                column: "occurred_on_utc"
            );

            migrationBuilder.CreateIndex(
                name: "idx_internal_command_messages_processed_occurred",
                schema: "customer",
                table: "internal_command_messages",
                columns: new[] { "processed_on_utc", "occurred_on_utc" }
            );

            migrationBuilder.CreateIndex(
                name: "idx_internal_command_messages_processed_on",
                schema: "customer",
                table: "internal_command_messages",
                column: "processed_on_utc"
            );

            migrationBuilder
                .CreateIndex(
                    name: "idx_internal_command_messages_unprocessed",
                    schema: "customer",
                    table: "internal_command_messages",
                    columns: new[] { "occurred_on_utc", "processed_on_utc" },
                    filter: "processed_on_utc IS NULL"
                )
                .Annotation("Npgsql:IndexInclude", new[] { "id", "type", "content" });

            migrationBuilder.CreateIndex(
                name: "outbox_message_consumers_message_id_name",
                schema: "customer",
                table: "outbox_message_consumers",
                columns: new[] { "message_id", "name" }
            );

            migrationBuilder.CreateIndex(
                name: "idx_outbox_messages_occurred_on",
                schema: "customer",
                table: "outbox_messages",
                column: "occurred_on_utc"
            );

            migrationBuilder.CreateIndex(
                name: "idx_outbox_messages_processed_occurred",
                schema: "customer",
                table: "outbox_messages",
                columns: new[] { "processed_on_utc", "occurred_on_utc" }
            );

            migrationBuilder.CreateIndex(
                name: "idx_outbox_messages_processed_on",
                schema: "customer",
                table: "outbox_messages",
                column: "processed_on_utc"
            );

            migrationBuilder
                .CreateIndex(
                    name: "idx_outbox_messages_unprocessed",
                    schema: "customer",
                    table: "outbox_messages",
                    columns: new[] { "occurred_on_utc", "processed_on_utc" },
                    filter: "processed_on_utc IS NULL"
                )
                .Annotation("Npgsql:IndexInclude", new[] { "id", "type", "content" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "customers", schema: "customer");

            migrationBuilder.DropTable(name: "inbox_message_consumers", schema: "customer");

            migrationBuilder.DropTable(name: "inbox_messages", schema: "customer");

            migrationBuilder.DropTable(name: "internal_command_message_consumers", schema: "customer");

            migrationBuilder.DropTable(name: "internal_command_messages", schema: "customer");

            migrationBuilder.DropTable(name: "outbox_message_consumers", schema: "customer");

            migrationBuilder.DropTable(name: "outbox_messages", schema: "customer");
        }
    }
}
