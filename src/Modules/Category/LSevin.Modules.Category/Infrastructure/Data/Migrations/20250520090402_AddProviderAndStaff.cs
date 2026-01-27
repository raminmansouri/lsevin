using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace LSevin.Modules.Category.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddProviderAndStaff : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_service_attribute_definitions_service_attribute_types__attr",
                schema: "category",
                table: "service_attribute_definitions"
            );

            migrationBuilder.DropTable(name: "service_attribute_types", schema: "category");

            migrationBuilder.DropTable(name: "service_definition_requirements", schema: "category");

            migrationBuilder.CreateTable(
                name: "attribute_types",
                schema: "category",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false),
                    name = table.Column<string>(type: "character varying(25)", maxLength: 25, nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_attribute_types", x => x.id);
                }
            );

            migrationBuilder.CreateTable(
                name: "provider_types",
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
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
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
                    table.PrimaryKey("pk_provider_types", x => x.id);
                }
            );

            migrationBuilder.CreateTable(
                name: "service_definition_domain_requirements",
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
                    table.PrimaryKey(
                        "pk_service_definition_domain_requirements",
                        x => new { x.service_definition_id, x.id }
                    );
                    table.ForeignKey(
                        name: "fk_service_definition_domain_requirements_service_definitions_",
                        column: x => x.service_definition_id,
                        principalSchema: "category",
                        principalTable: "service_definitions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "staff",
                schema: "category",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    biography = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    title = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    profile_image_url = table.Column<string>(
                        type: "character varying(250)",
                        maxLength: 250,
                        nullable: true
                    ),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
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
                    table.PrimaryKey("pk_staff", x => x.id);
                }
            );

            migrationBuilder.CreateTable(
                name: "staff_availability_statuses",
                schema: "category",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false),
                    name = table.Column<string>(type: "character varying(25)", maxLength: 25, nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_staff_availability_statuses", x => x.id);
                }
            );

            migrationBuilder.CreateTable(
                name: "provider_attribute_definitions",
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
                    validation_rules = table.Column<string>(
                        type: "character varying(250)",
                        maxLength: 250,
                        nullable: false
                    ),
                    provider_type_id = table.Column<Guid>(type: "uuid", nullable: false),
                    create_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    last_modified_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_provider_attribute_definitions", x => x.id);
                    table.ForeignKey(
                        name: "fk_provider_attribute_definitions_attribute_types__attribute_t",
                        column: x => x._attribute_type_id,
                        principalSchema: "category",
                        principalTable: "attribute_types",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade
                    );
                    table.ForeignKey(
                        name: "fk_provider_attribute_definitions_provider_types_provider_type",
                        column: x => x.provider_type_id,
                        principalSchema: "category",
                        principalTable: "provider_types",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "service_providers",
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
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    provider_type_id = table.Column<Guid>(type: "uuid", nullable: false),
                    city = table.Column<string>(type: "character varying(15)", maxLength: 15, nullable: false),
                    country = table.Column<string>(type: "character varying(15)", maxLength: 15, nullable: false),
                    detail = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    street = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    zip_code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    email = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    phone_number_country_code = table.Column<string>(
                        type: "character varying(3)",
                        maxLength: 3,
                        nullable: false
                    ),
                    phone_number = table.Column<string>(type: "character varying(15)", maxLength: 15, nullable: false),
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
                    table.PrimaryKey("pk_service_providers", x => x.id);
                    table.ForeignKey(
                        name: "fk_service_providers_provider_types_provider_type_id",
                        column: x => x.provider_type_id,
                        principalSchema: "category",
                        principalTable: "provider_types",
                        principalColumn: "id"
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "staff_services",
                schema: "category",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    service_definition_id = table.Column<Guid>(type: "uuid", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    notes = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    staff_id = table.Column<Guid>(type: "uuid", nullable: false),
                    create_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    last_modified_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_staff_services", x => x.id);
                    table.ForeignKey(
                        name: "fk_staff_services_staffs_staff_id",
                        column: x => x.staff_id,
                        principalSchema: "category",
                        principalTable: "staff",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "staff_availabilities",
                schema: "category",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    day_of_week = table.Column<int>(type: "integer", nullable: false),
                    is_recurring = table.Column<bool>(type: "boolean", nullable: false),
                    _availability_status_id = table.Column<int>(type: "integer", nullable: false),
                    specific_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    staff_id = table.Column<Guid>(type: "uuid", nullable: false),
                    end_time = table.Column<TimeSpan>(type: "interval", nullable: false),
                    start_time = table.Column<TimeSpan>(type: "interval", nullable: false),
                    create_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    last_modified_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_staff_availabilities", x => x.id);
                    table.ForeignKey(
                        name: "fk_staff_availabilities_staff_availability_statuses__availabil",
                        column: x => x._availability_status_id,
                        principalSchema: "category",
                        principalTable: "staff_availability_statuses",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade
                    );
                    table.ForeignKey(
                        name: "fk_staff_availabilities_staffs_staff_id",
                        column: x => x.staff_id,
                        principalSchema: "category",
                        principalTable: "staff",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "provider_attribute_definition_domain_options",
                schema: "category",
                columns: table => new
                {
                    provider_attribute_definition_id = table.Column<Guid>(type: "uuid", nullable: false),
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
                },
                constraints: table =>
                {
                    table.PrimaryKey(
                        "pk_provider_attribute_definition_domain_options",
                        x => new { x.provider_attribute_definition_id, x.id }
                    );
                    table.ForeignKey(
                        name: "fk_provider_attribute_definition_domain_options_provider_attri",
                        column: x => x.provider_attribute_definition_id,
                        principalSchema: "category",
                        principalTable: "provider_attribute_definitions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "provider_attributes",
                schema: "category",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    attribute_definition_id = table.Column<Guid>(type: "uuid", nullable: false),
                    value = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    service_provider_id = table.Column<Guid>(type: "uuid", nullable: false),
                    create_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    last_modified_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_provider_attributes", x => x.id);
                    table.ForeignKey(
                        name: "fk_provider_attributes_service_providers_service_provider_id",
                        column: x => x.service_provider_id,
                        principalSchema: "category",
                        principalTable: "service_providers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "provider_gallery_items",
                schema: "category",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    title = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(
                        type: "character varying(2000)",
                        maxLength: 2000,
                        nullable: false
                    ),
                    url = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    media_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    display_order = table.Column<int>(type: "integer", nullable: false),
                    service_provider_id = table.Column<Guid>(type: "uuid", nullable: false),
                    create_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    last_modified_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_provider_gallery_items", x => x.id);
                    table.ForeignKey(
                        name: "fk_provider_gallery_items_service_providers_service_provider_id",
                        column: x => x.service_provider_id,
                        principalSchema: "category",
                        principalTable: "service_providers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "provider_policies",
                schema: "category",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    description = table.Column<string>(
                        type: "character varying(2000)",
                        maxLength: 2000,
                        nullable: false
                    ),
                    service_provider_id = table.Column<Guid>(type: "uuid", nullable: false),
                    create_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    last_modified_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_provider_policies", x => x.id);
                    table.ForeignKey(
                        name: "fk_provider_policies_service_providers_service_provider_id",
                        column: x => x.service_provider_id,
                        principalSchema: "category",
                        principalTable: "service_providers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "provider_services",
                schema: "category",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    service_definition_id = table.Column<Guid>(type: "uuid", nullable: false),
                    display_name = table.Column<string>(
                        type: "character varying(100)",
                        maxLength: 100,
                        nullable: false
                    ),
                    description = table.Column<string>(
                        type: "character varying(2000)",
                        maxLength: 2000,
                        nullable: false
                    ),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    service_provider_id = table.Column<Guid>(type: "uuid", nullable: false),
                    currency = table.Column<string>(type: "character varying(15)", maxLength: 15, nullable: false),
                    value = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    create_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    last_modified_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_provider_services", x => x.id);
                    table.ForeignKey(
                        name: "fk_provider_services_service_definitions_service_definition_id",
                        column: x => x.service_definition_id,
                        principalSchema: "category",
                        principalTable: "service_definitions",
                        principalColumn: "id"
                    );
                    table.ForeignKey(
                        name: "fk_provider_services_service_providers_service_provider_id",
                        column: x => x.service_provider_id,
                        principalSchema: "category",
                        principalTable: "service_providers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "provider_staffs",
                schema: "category",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    staff_id = table.Column<Guid>(type: "uuid", nullable: false),
                    notes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    service_provider_id = table.Column<Guid>(type: "uuid", nullable: false),
                    create_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    last_modified_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_provider_staffs", x => x.id);
                    table.ForeignKey(
                        name: "fk_provider_staffs_service_providers_service_provider_id",
                        column: x => x.service_provider_id,
                        principalSchema: "category",
                        principalTable: "service_providers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade
                    );
                    table.ForeignKey(
                        name: "fk_provider_staffs_staffs_staff_id",
                        column: x => x.staff_id,
                        principalSchema: "category",
                        principalTable: "staff",
                        principalColumn: "id"
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "service_attribute_values",
                schema: "category",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    attribute_definition_id = table.Column<Guid>(type: "uuid", nullable: false),
                    value = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    provider_service_id = table.Column<Guid>(type: "uuid", nullable: false),
                    create_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    last_modified_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_service_attribute_values", x => x.id);
                    table.ForeignKey(
                        name: "fk_service_attribute_values_provider_services_provider_service",
                        column: x => x.provider_service_id,
                        principalSchema: "category",
                        principalTable: "provider_services",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateIndex(
                name: "ix_provider_attribute_definitions__attribute_type_id",
                schema: "category",
                table: "provider_attribute_definitions",
                column: "_attribute_type_id"
            );

            migrationBuilder.CreateIndex(
                name: "ix_provider_attribute_definitions_provider_type_id",
                schema: "category",
                table: "provider_attribute_definitions",
                column: "provider_type_id"
            );

            migrationBuilder.CreateIndex(
                name: "ix_provider_attributes_attribute_definition_id",
                schema: "category",
                table: "provider_attributes",
                column: "attribute_definition_id"
            );

            migrationBuilder.CreateIndex(
                name: "ix_provider_attributes_service_provider_id_attribute_definitio",
                schema: "category",
                table: "provider_attributes",
                columns: new[] { "service_provider_id", "attribute_definition_id" },
                unique: true
            );

            migrationBuilder.CreateIndex(
                name: "ix_provider_gallery_items_display_order",
                schema: "category",
                table: "provider_gallery_items",
                column: "display_order"
            );

            migrationBuilder.CreateIndex(
                name: "ix_provider_gallery_items_service_provider_id",
                schema: "category",
                table: "provider_gallery_items",
                column: "service_provider_id"
            );

            migrationBuilder.CreateIndex(
                name: "ix_provider_policies_service_provider_id_type",
                schema: "category",
                table: "provider_policies",
                columns: new[] { "service_provider_id", "type" },
                unique: true
            );

            migrationBuilder.CreateIndex(
                name: "ix_provider_policies_type",
                schema: "category",
                table: "provider_policies",
                column: "type"
            );

            migrationBuilder.CreateIndex(
                name: "ix_provider_services_is_active",
                schema: "category",
                table: "provider_services",
                column: "is_active"
            );

            migrationBuilder.CreateIndex(
                name: "ix_provider_services_service_definition_id",
                schema: "category",
                table: "provider_services",
                column: "service_definition_id"
            );

            migrationBuilder.CreateIndex(
                name: "ix_provider_services_service_provider_id_service_definition_id",
                schema: "category",
                table: "provider_services",
                columns: new[] { "service_provider_id", "service_definition_id" },
                unique: true
            );

            migrationBuilder.CreateIndex(
                name: "ix_provider_staffs_is_active",
                schema: "category",
                table: "provider_staffs",
                column: "is_active"
            );

            migrationBuilder.CreateIndex(
                name: "ix_provider_staffs_service_provider_id_staff_id",
                schema: "category",
                table: "provider_staffs",
                columns: new[] { "service_provider_id", "staff_id" },
                unique: true
            );

            migrationBuilder.CreateIndex(
                name: "ix_provider_staffs_staff_id",
                schema: "category",
                table: "provider_staffs",
                column: "staff_id"
            );

            migrationBuilder.CreateIndex(
                name: "ix_service_attribute_values_attribute_definition_id",
                schema: "category",
                table: "service_attribute_values",
                column: "attribute_definition_id"
            );

            migrationBuilder.CreateIndex(
                name: "ix_service_attribute_values_provider_service_id_attribute_defi",
                schema: "category",
                table: "service_attribute_values",
                columns: new[] { "provider_service_id", "attribute_definition_id" },
                unique: true
            );

            migrationBuilder.CreateIndex(
                name: "ix_service_providers_is_active",
                schema: "category",
                table: "service_providers",
                column: "is_active"
            );

            migrationBuilder.CreateIndex(
                name: "ix_service_providers_name",
                schema: "category",
                table: "service_providers",
                column: "name"
            );

            migrationBuilder.CreateIndex(
                name: "ix_service_providers_provider_type_id",
                schema: "category",
                table: "service_providers",
                column: "provider_type_id"
            );

            migrationBuilder.CreateIndex(
                name: "ix_staff_availabilities__availability_status_id",
                schema: "category",
                table: "staff_availabilities",
                column: "_availability_status_id"
            );

            migrationBuilder.CreateIndex(
                name: "ix_staff_availabilities_staff_id",
                schema: "category",
                table: "staff_availabilities",
                column: "staff_id"
            );

            migrationBuilder.CreateIndex(
                name: "ix_staff_availabilities_staff_id_day_of_week",
                schema: "category",
                table: "staff_availabilities",
                columns: new[] { "staff_id", "day_of_week" }
            );

            migrationBuilder.CreateIndex(
                name: "ix_staff_services_staff_id",
                schema: "category",
                table: "staff_services",
                column: "staff_id"
            );

            migrationBuilder.CreateIndex(
                name: "ix_staff_services_staff_id_service_definition_id",
                schema: "category",
                table: "staff_services",
                columns: new[] { "staff_id", "service_definition_id" },
                unique: true
            );

            migrationBuilder.AddForeignKey(
                name: "fk_service_attribute_definitions_attribute_types__attribute_ty",
                schema: "category",
                table: "service_attribute_definitions",
                column: "_attribute_type_id",
                principalSchema: "category",
                principalTable: "attribute_types",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_service_attribute_definitions_attribute_types__attribute_ty",
                schema: "category",
                table: "service_attribute_definitions"
            );

            migrationBuilder.DropTable(name: "provider_attribute_definition_domain_options", schema: "category");

            migrationBuilder.DropTable(name: "provider_attributes", schema: "category");

            migrationBuilder.DropTable(name: "provider_gallery_items", schema: "category");

            migrationBuilder.DropTable(name: "provider_policies", schema: "category");

            migrationBuilder.DropTable(name: "provider_staffs", schema: "category");

            migrationBuilder.DropTable(name: "service_attribute_values", schema: "category");

            migrationBuilder.DropTable(name: "service_definition_domain_requirements", schema: "category");

            migrationBuilder.DropTable(name: "staff_availabilities", schema: "category");

            migrationBuilder.DropTable(name: "staff_services", schema: "category");

            migrationBuilder.DropTable(name: "provider_attribute_definitions", schema: "category");

            migrationBuilder.DropTable(name: "provider_services", schema: "category");

            migrationBuilder.DropTable(name: "staff_availability_statuses", schema: "category");

            migrationBuilder.DropTable(name: "staff", schema: "category");

            migrationBuilder.DropTable(name: "attribute_types", schema: "category");

            migrationBuilder.DropTable(name: "service_providers", schema: "category");

            migrationBuilder.DropTable(name: "provider_types", schema: "category");

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

            migrationBuilder.AddForeignKey(
                name: "fk_service_attribute_definitions_service_attribute_types__attr",
                schema: "category",
                table: "service_attribute_definitions",
                column: "_attribute_type_id",
                principalSchema: "category",
                principalTable: "service_attribute_types",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade
            );
        }
    }
}
