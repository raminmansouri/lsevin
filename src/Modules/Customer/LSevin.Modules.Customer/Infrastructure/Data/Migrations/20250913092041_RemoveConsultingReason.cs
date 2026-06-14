using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LSevin.Modules.Customer.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class RemoveConsultingReason : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_consultings_consulting_reasons_consulting_reason_id",
                schema: "customer",
                table: "consultings"
            );

            migrationBuilder.DropTable(name: "consulting_reasons", schema: "customer");

            migrationBuilder.DropIndex(
                name: "ix_consultings_consulting_reason_id",
                schema: "customer",
                table: "consultings"
            );

            migrationBuilder.DropColumn(name: "consulting_reason_id", schema: "customer", table: "consultings");

            migrationBuilder.AddColumn<Guid>(
                name: "category_id",
                schema: "customer",
                table: "consultings",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000")
            );

            migrationBuilder.AddColumn<string>(
                name: "category_name",
                schema: "customer",
                table: "consultings",
                type: "character varying(250)",
                maxLength: 250,
                nullable: false,
                defaultValue: ""
            );

            migrationBuilder.CreateIndex(
                name: "ix_consultings_category_id",
                schema: "customer",
                table: "consultings",
                column: "category_id"
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(name: "ix_consultings_category_id", schema: "customer", table: "consultings");

            migrationBuilder.DropColumn(name: "category_id", schema: "customer", table: "consultings");

            migrationBuilder.DropColumn(name: "category_name", schema: "customer", table: "consultings");

            migrationBuilder.AddColumn<int>(
                name: "consulting_reason_id",
                schema: "customer",
                table: "consultings",
                type: "integer",
                nullable: false,
                defaultValue: 0
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

            migrationBuilder.CreateIndex(
                name: "ix_consultings_consulting_reason_id",
                schema: "customer",
                table: "consultings",
                column: "consulting_reason_id"
            );

            migrationBuilder.AddForeignKey(
                name: "fk_consultings_consulting_reasons_consulting_reason_id",
                schema: "customer",
                table: "consultings",
                column: "consulting_reason_id",
                principalSchema: "customer",
                principalTable: "consulting_reasons",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade
            );
        }
    }
}
