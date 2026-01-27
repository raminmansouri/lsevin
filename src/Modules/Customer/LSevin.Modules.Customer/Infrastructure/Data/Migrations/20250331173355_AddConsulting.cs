using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LSevin.Modules.Customer.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddConsulting : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_customer_documents_customers_customer_id",
                schema: "customer",
                table: "customer_documents"
            );

            migrationBuilder.CreateTable(
                name: "consulting_reasons",
                schema: "customer",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false),
                    name = table.Column<string>(type: "character varying(25)", maxLength: 25, nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_consulting_reasons", x => x.id);
                }
            );

            migrationBuilder.CreateTable(
                name: "consultings",
                schema: "customer",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    customer_id = table.Column<Guid>(type: "uuid", nullable: false),
                    description = table.Column<string>(
                        type: "character varying(2000)",
                        maxLength: 2000,
                        nullable: false
                    ),
                    consulting_reason_id = table.Column<int>(type: "integer", nullable: false),
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
                    table.PrimaryKey("pk_consultings", x => x.id);
                    table.ForeignKey(
                        name: "fk_consultings_consulting_reasons_consulting_reason_id",
                        column: x => x.consulting_reason_id,
                        principalSchema: "customer",
                        principalTable: "consulting_reasons",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade
                    );
                    table.ForeignKey(
                        name: "fk_consultings_customers_customer_id",
                        column: x => x.customer_id,
                        principalSchema: "customer",
                        principalTable: "customers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "consulting_selected_document_references",
                schema: "customer",
                columns: table => new
                {
                    customer_document_id = table.Column<Guid>(type: "uuid", nullable: false),
                    consulting_id = table.Column<Guid>(type: "uuid", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey(
                        "pk_consulting_selected_document_references",
                        x => new { x.consulting_id, x.customer_document_id }
                    );
                    table.ForeignKey(
                        name: "fk_consulting_selected_document_references_consultings_consult",
                        column: x => x.consulting_id,
                        principalSchema: "customer",
                        principalTable: "consultings",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateIndex(
                name: "ix_consultings_consulting_reason_id",
                schema: "customer",
                table: "consultings",
                column: "consulting_reason_id"
            );

            migrationBuilder.CreateIndex(
                name: "ix_consultings_customer_id",
                schema: "customer",
                table: "consultings",
                column: "customer_id"
            );

            migrationBuilder.AddForeignKey(
                name: "fk_customer_documents_customers_customer_id",
                schema: "customer",
                table: "customer_documents",
                column: "customer_id",
                principalSchema: "customer",
                principalTable: "customers",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_customer_documents_customers_customer_id",
                schema: "customer",
                table: "customer_documents"
            );

            migrationBuilder.DropTable(name: "consulting_selected_document_references", schema: "customer");

            migrationBuilder.DropTable(name: "consultings", schema: "customer");

            migrationBuilder.DropTable(name: "consulting_reasons", schema: "customer");

            migrationBuilder.AddForeignKey(
                name: "fk_customer_documents_customers_customer_id",
                schema: "customer",
                table: "customer_documents",
                column: "customer_id",
                principalSchema: "customer",
                principalTable: "customers",
                principalColumn: "id"
            );
        }
    }
}
