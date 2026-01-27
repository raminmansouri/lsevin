using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LSevin.Modules.Customer.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class FixCustomerDocumentRelation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "customer_id",
                schema: "customer",
                table: "customer_documents",
                newName: "CustomerId"
            );

            migrationBuilder.AlterColumn<Guid>(
                name: "CustomerId",
                schema: "customer",
                table: "customer_documents",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "CustomerId",
                schema: "customer",
                table: "customer_documents",
                newName: "customer_id"
            );

            migrationBuilder.AlterColumn<Guid>(
                name: "customer_id",
                schema: "customer",
                table: "customer_documents",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid"
            );
        }
    }
}
