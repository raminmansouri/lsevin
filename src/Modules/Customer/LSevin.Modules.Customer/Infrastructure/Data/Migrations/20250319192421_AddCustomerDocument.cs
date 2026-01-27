using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LSevin.Modules.Customer.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCustomerDocument : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(name: "ix_customers_id", schema: "customer", table: "customers");

            migrationBuilder.DropColumn(name: "state", schema: "customer", table: "customers");

            migrationBuilder.AlterColumn<string>(
                name: "detail",
                schema: "customer",
                table: "customers",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(250)",
                oldMaxLength: 250,
                oldNullable: true
            );

            migrationBuilder.AlterColumn<string>(
                name: "country",
                schema: "customer",
                table: "customers",
                type: "character varying(15)",
                maxLength: 15,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(25)",
                oldMaxLength: 25,
                oldNullable: true
            );

            migrationBuilder.AlterColumn<string>(
                name: "city",
                schema: "customer",
                table: "customers",
                type: "character varying(15)",
                maxLength: 15,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100,
                oldNullable: true
            );

            migrationBuilder.AddColumn<string>(
                name: "gender",
                schema: "customer",
                table: "customers",
                type: "character varying(25)",
                maxLength: 25,
                nullable: true
            );

            migrationBuilder.AddColumn<bool>(
                name: "is_active",
                schema: "customer",
                table: "customers",
                type: "boolean",
                nullable: false,
                defaultValue: true
            );

            migrationBuilder.CreateTable(
                name: "customer_document_types",
                schema: "customer",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false),
                    name = table.Column<string>(type: "character varying(25)", maxLength: 25, nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_customer_document_types", x => x.id);
                }
            );

            migrationBuilder.CreateTable(
                name: "customer_documents",
                schema: "customer",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    document_type_id = table.Column<int>(type: "integer", nullable: false),
                    document_url = table.Column<string>(
                        type: "character varying(250)",
                        maxLength: 250,
                        nullable: false
                    ),
                    customer_id = table.Column<Guid>(type: "uuid", nullable: true),
                    create_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    last_modified_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_customer_documents", x => x.id);
                    table.ForeignKey(
                        name: "fk_customer_documents_customer_document_types_document_type_id",
                        column: x => x.document_type_id,
                        principalSchema: "customer",
                        principalTable: "customer_document_types",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade
                    );
                    table.ForeignKey(
                        name: "fk_customer_documents_customers_customer_id",
                        column: x => x.customer_id,
                        principalSchema: "customer",
                        principalTable: "customers",
                        principalColumn: "id"
                    );
                }
            );

            migrationBuilder.CreateIndex(
                name: "ix_customer_documents_customer_id",
                schema: "customer",
                table: "customer_documents",
                column: "customer_id"
            );

            migrationBuilder.CreateIndex(
                name: "ix_customer_documents_document_type_id",
                schema: "customer",
                table: "customer_documents",
                column: "document_type_id"
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "customer_documents", schema: "customer");

            migrationBuilder.DropTable(name: "customer_document_types", schema: "customer");

            migrationBuilder.DropColumn(name: "gender", schema: "customer", table: "customers");

            migrationBuilder.DropColumn(name: "is_active", schema: "customer", table: "customers");

            migrationBuilder.AlterColumn<string>(
                name: "detail",
                schema: "customer",
                table: "customers",
                type: "character varying(250)",
                maxLength: 250,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(500)",
                oldMaxLength: 500,
                oldNullable: true
            );

            migrationBuilder.AlterColumn<string>(
                name: "country",
                schema: "customer",
                table: "customers",
                type: "character varying(25)",
                maxLength: 25,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(15)",
                oldMaxLength: 15,
                oldNullable: true
            );

            migrationBuilder.AlterColumn<string>(
                name: "city",
                schema: "customer",
                table: "customers",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(15)",
                oldMaxLength: 15,
                oldNullable: true
            );

            migrationBuilder.AddColumn<string>(
                name: "state",
                schema: "customer",
                table: "customers",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true
            );

            migrationBuilder.CreateIndex(
                name: "ix_customers_id",
                schema: "customer",
                table: "customers",
                column: "id",
                unique: true
            );
        }
    }
}
