using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace LSevin.Modules.Category.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class Initial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(name: "category");

            migrationBuilder.AlterDatabase().Annotation("Npgsql:PostgresExtension:uuid-ossp", ",,");

            migrationBuilder.CreateTable(
                name: "categories",
                schema: "category",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    description = table.Column<string>(
                        type: "character varying(2000)",
                        maxLength: 2000,
                        nullable: false
                    ),
                    ParentId = table.Column<Guid>(type: "uuid", nullable: true),
                    display_order = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    icon_url = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
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
                    table.PrimaryKey("pk_categories", x => x.id);
                    table.ForeignKey(
                        name: "fk_categories_categories_parent_id",
                        column: x => x.ParentId,
                        principalSchema: "category",
                        principalTable: "categories",
                        principalColumn: "id"
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "inbox_message_consumers",
                schema: "category",
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
                schema: "category",
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
                schema: "category",
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
                schema: "category",
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
                schema: "category",
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
                schema: "category",
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
                name: "service_attribute_types",
                schema: "category",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false),
                    name = table.Column<string>(type: "character varying(25)", maxLength: 25, nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_service_attribute_types", x => x.id);
                }
            );

            migrationBuilder.CreateTable(
                name: "service_definitions",
                schema: "category",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(
                        type: "character varying(2000)",
                        maxLength: 2000,
                        nullable: false
                    ),
                    category_id = table.Column<Guid>(type: "uuid", nullable: false),
                    duration_minutes = table.Column<int>(type: "integer", nullable: false),
                    pricing_model = table.Column<string>(
                        type: "character varying(100)",
                        maxLength: 100,
                        nullable: false
                    ),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    currency = table.Column<string>(type: "character varying(15)", maxLength: 15, nullable: false),
                    value = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
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
                    table.PrimaryKey("pk_service_definitions", x => x.id);
                    table.ForeignKey(
                        name: "fk_service_definitions_categories_category_id",
                        column: x => x.category_id,
                        principalSchema: "category",
                        principalTable: "categories",
                        principalColumn: "id"
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "service_attribute_definitions",
                schema: "category",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(
                        type: "character varying(2000)",
                        maxLength: 2000,
                        nullable: false
                    ),
                    _attribute_type_id = table.Column<int>(type: "integer", nullable: false),
                    is_required = table.Column<bool>(type: "boolean", nullable: false),
                    affects_pricing = table.Column<bool>(type: "boolean", nullable: false),
                    display_order = table.Column<int>(type: "integer", nullable: false),
                    service_definition_id = table.Column<Guid>(type: "uuid", nullable: true),
                    create_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    last_modified_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_service_attribute_definitions", x => x.id);
                    table.ForeignKey(
                        name: "fk_service_attribute_definitions_service_attribute_types__attr",
                        column: x => x._attribute_type_id,
                        principalSchema: "category",
                        principalTable: "service_attribute_types",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade
                    );
                    table.ForeignKey(
                        name: "fk_service_attribute_definitions_service_definitions_service_d",
                        column: x => x.service_definition_id,
                        principalSchema: "category",
                        principalTable: "service_definitions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "service_definition_requirements",
                schema: "category",
                columns: table => new
                {
                    service_definition_id = table.Column<Guid>(type: "uuid", nullable: false),
                    id = table
                        .Column<int>(type: "integer", nullable: false)
                        .Annotation(
                            "Npgsql:ValueGenerationStrategy",
                            NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                        ),
                    description = table.Column<string>(
                        type: "character varying(2000)",
                        maxLength: 2000,
                        nullable: false
                    ),
                    is_mandatory = table.Column<bool>(type: "boolean", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_service_definition_requirements", x => new { x.service_definition_id, x.id });
                    table.ForeignKey(
                        name: "fk_service_definition_requirements_service_definitions_service",
                        column: x => x.service_definition_id,
                        principalSchema: "category",
                        principalTable: "service_definitions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "service_attribute_definition_options",
                schema: "category",
                columns: table => new
                {
                    service_attribute_definition_id = table.Column<Guid>(type: "uuid", nullable: false),
                    id = table
                        .Column<int>(type: "integer", nullable: false)
                        .Annotation(
                            "Npgsql:ValueGenerationStrategy",
                            NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                        ),
                    display_name = table.Column<string>(
                        type: "character varying(100)",
                        maxLength: 100,
                        nullable: false
                    ),
                    value = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    additional_price = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                },
                constraints: table =>
                {
                    table.PrimaryKey(
                        "pk_service_attribute_definition_options",
                        x => new { x.service_attribute_definition_id, x.id }
                    );
                    table.ForeignKey(
                        name: "fk_service_attribute_definition_options_service_attribute_defi",
                        column: x => x.service_attribute_definition_id,
                        principalSchema: "category",
                        principalTable: "service_attribute_definitions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateIndex(
                name: "ix_categories_parent_id",
                schema: "category",
                table: "categories",
                column: "ParentId"
            );

            migrationBuilder.CreateIndex(
                name: "inbox_message_consumers_message_id_name",
                schema: "category",
                table: "inbox_message_consumers",
                columns: new[] { "message_id", "name" }
            );

            migrationBuilder.CreateIndex(
                name: "idx_inbox_messages_occurred_on",
                schema: "category",
                table: "inbox_messages",
                column: "occurred_on_utc"
            );

            migrationBuilder.CreateIndex(
                name: "idx_inbox_messages_processed_occurred",
                schema: "category",
                table: "inbox_messages",
                columns: new[] { "processed_on_utc", "occurred_on_utc" }
            );

            migrationBuilder.CreateIndex(
                name: "idx_inbox_messages_processed_on",
                schema: "category",
                table: "inbox_messages",
                column: "processed_on_utc"
            );

            migrationBuilder
                .CreateIndex(
                    name: "idx_inbox_messages_unprocessed",
                    schema: "category",
                    table: "inbox_messages",
                    columns: new[] { "occurred_on_utc", "processed_on_utc" },
                    filter: "processed_on_utc IS NULL"
                )
                .Annotation("Npgsql:IndexInclude", new[] { "id", "type", "content" });

            migrationBuilder.CreateIndex(
                name: "internal_command_message_consumers_message_id_name",
                schema: "category",
                table: "internal_command_message_consumers",
                columns: new[] { "message_id", "name" }
            );

            migrationBuilder.CreateIndex(
                name: "idx_internal_command_messages_occurred_on",
                schema: "category",
                table: "internal_command_messages",
                column: "occurred_on_utc"
            );

            migrationBuilder.CreateIndex(
                name: "idx_internal_command_messages_processed_occurred",
                schema: "category",
                table: "internal_command_messages",
                columns: new[] { "processed_on_utc", "occurred_on_utc" }
            );

            migrationBuilder.CreateIndex(
                name: "idx_internal_command_messages_processed_on",
                schema: "category",
                table: "internal_command_messages",
                column: "processed_on_utc"
            );

            migrationBuilder
                .CreateIndex(
                    name: "idx_internal_command_messages_unprocessed",
                    schema: "category",
                    table: "internal_command_messages",
                    columns: new[] { "occurred_on_utc", "processed_on_utc" },
                    filter: "processed_on_utc IS NULL"
                )
                .Annotation("Npgsql:IndexInclude", new[] { "id", "type", "content" });

            migrationBuilder.CreateIndex(
                name: "outbox_message_consumers_message_id_name",
                schema: "category",
                table: "outbox_message_consumers",
                columns: new[] { "message_id", "name" }
            );

            migrationBuilder.CreateIndex(
                name: "idx_outbox_messages_occurred_on",
                schema: "category",
                table: "outbox_messages",
                column: "occurred_on_utc"
            );

            migrationBuilder.CreateIndex(
                name: "idx_outbox_messages_processed_occurred",
                schema: "category",
                table: "outbox_messages",
                columns: new[] { "processed_on_utc", "occurred_on_utc" }
            );

            migrationBuilder.CreateIndex(
                name: "idx_outbox_messages_processed_on",
                schema: "category",
                table: "outbox_messages",
                column: "processed_on_utc"
            );

            migrationBuilder
                .CreateIndex(
                    name: "idx_outbox_messages_unprocessed",
                    schema: "category",
                    table: "outbox_messages",
                    columns: new[] { "occurred_on_utc", "processed_on_utc" },
                    filter: "processed_on_utc IS NULL"
                )
                .Annotation("Npgsql:IndexInclude", new[] { "id", "type", "content" });

            migrationBuilder.CreateIndex(
                name: "ix_service_attribute_definitions__attribute_type_id",
                schema: "category",
                table: "service_attribute_definitions",
                column: "_attribute_type_id"
            );

            migrationBuilder.CreateIndex(
                name: "ix_service_attribute_definitions_service_definition_id",
                schema: "category",
                table: "service_attribute_definitions",
                column: "service_definition_id"
            );

            migrationBuilder.CreateIndex(
                name: "ix_service_definitions_category_id",
                schema: "category",
                table: "service_definitions",
                column: "category_id"
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "inbox_message_consumers", schema: "category");

            migrationBuilder.DropTable(name: "inbox_messages", schema: "category");

            migrationBuilder.DropTable(name: "internal_command_message_consumers", schema: "category");

            migrationBuilder.DropTable(name: "internal_command_messages", schema: "category");

            migrationBuilder.DropTable(name: "outbox_message_consumers", schema: "category");

            migrationBuilder.DropTable(name: "outbox_messages", schema: "category");

            migrationBuilder.DropTable(name: "service_attribute_definition_options", schema: "category");

            migrationBuilder.DropTable(name: "service_definition_requirements", schema: "category");

            migrationBuilder.DropTable(name: "service_attribute_definitions", schema: "category");

            migrationBuilder.DropTable(name: "service_attribute_types", schema: "category");

            migrationBuilder.DropTable(name: "service_definitions", schema: "category");

            migrationBuilder.DropTable(name: "categories", schema: "category");
        }
    }
}
