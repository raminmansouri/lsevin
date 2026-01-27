using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LSevin.Modules.Customer.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCoordinatesToAddress : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "latitude",
                schema: "customer",
                table: "customers",
                type: "numeric(10,7)",
                nullable: true
            );

            migrationBuilder.AddColumn<double>(
                name: "longitude",
                schema: "customer",
                table: "customers",
                type: "numeric(10,7)",
                nullable: true
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "latitude", schema: "customer", table: "customers");

            migrationBuilder.DropColumn(name: "longitude", schema: "customer", table: "customers");
        }
    }
}
