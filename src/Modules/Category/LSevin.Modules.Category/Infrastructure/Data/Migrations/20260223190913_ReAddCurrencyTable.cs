using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LSevin.Modules.Category.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class ReAddCurrencyTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "pk_currencies",
                schema: "common",
                table: "currencies");

            migrationBuilder.DropColumn(
                name: "rate",
                schema: "common",
                table: "currencies");

            migrationBuilder.DropColumn(
                name: "title",
                schema: "common",
                table: "currencies");

            migrationBuilder.RenameTable(
                name: "currencies",
                schema: "common",
                newName: "currencies",
                newSchema: "category");

            migrationBuilder.AlterColumn<string>(
                name: "name",
                schema: "category",
                table: "currencies",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(25)",
                oldMaxLength: 25,
                oldNullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "id",
                schema: "category",
                table: "currencies",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "symbol",
                schema: "category",
                table: "currencies",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(15)",
                oldMaxLength: 15);

            migrationBuilder.AddColumn<decimal>(
                name: "price",
                schema: "category",
                table: "currencies",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddPrimaryKey(
                name: "pk_currencies",
                schema: "category",
                table: "currencies",
                column: "id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "pk_currencies",
                schema: "category",
                table: "currencies");

            migrationBuilder.DropColumn(
                name: "price",
                schema: "category",
                table: "currencies");

            migrationBuilder.EnsureSchema(
                name: "common");

            migrationBuilder.RenameTable(
                name: "currencies",
                schema: "category",
                newName: "currencies",
                newSchema: "common");

            migrationBuilder.AlterColumn<string>(
                name: "symbol",
                schema: "common",
                table: "currencies",
                type: "character varying(15)",
                maxLength: 15,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "name",
                schema: "common",
                table: "currencies",
                type: "character varying(25)",
                maxLength: 25,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<Guid>(
                name: "id",
                schema: "common",
                table: "currencies",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddColumn<decimal>(
                name: "rate",
                schema: "common",
                table: "currencies",
                type: "numeric(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "title",
                schema: "common",
                table: "currencies",
                type: "character varying(25)",
                maxLength: 25,
                nullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "pk_currencies",
                schema: "common",
                table: "currencies",
                column: "symbol");
        }
    }
}
