using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LSevin.Modules.Category.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddDurationToProviderService : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "duration_minutes",
                schema: "category",
                table: "provider_services",
                type: "integer",
                nullable: false,
                defaultValue: 0
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "duration_minutes", schema: "category", table: "provider_services");
        }
    }
}
