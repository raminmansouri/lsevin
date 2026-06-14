using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LSevin.Modules.Customer.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class FixCustomerIdColumnInDocument : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "CustomerId",
                schema: "customer",
                table: "customer_documents",
                newName: "customer_id"
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "customer_id",
                schema: "customer",
                table: "customer_documents",
                newName: "CustomerId"
            );
        }
    }
}
