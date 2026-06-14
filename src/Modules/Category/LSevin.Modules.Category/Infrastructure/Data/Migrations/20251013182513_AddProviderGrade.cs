using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LSevin.Modules.Category.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddProviderGrade : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "grade_id",
                schema: "category",
                table: "service_providers",
                type: "integer",
                nullable: true
            );

            migrationBuilder.CreateTable(
                name: "service_provider_grades",
                schema: "category",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false),
                    name = table.Column<string>(type: "character varying(25)", maxLength: 25, nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_service_provider_grades", x => x.id);
                }
            );

            migrationBuilder.CreateIndex(
                name: "ix_service_providers_country_city",
                schema: "category",
                table: "service_providers",
                columns: new[] { "country", "city" }
            );

            migrationBuilder.CreateIndex(
                name: "ix_service_providers_grade_id",
                schema: "category",
                table: "service_providers",
                column: "grade_id"
            );

            migrationBuilder.CreateIndex(
                name: "ix_service_providers_grade_id_provider_type_id",
                schema: "category",
                table: "service_providers",
                columns: new[] { "grade_id", "provider_type_id" }
            );

            migrationBuilder.CreateIndex(
                name: "ix_service_providers_grade_id_provider_type_id_country_city",
                schema: "category",
                table: "service_providers",
                columns: new[] { "grade_id", "provider_type_id", "country", "city" }
            );

            migrationBuilder.CreateIndex(
                name: "ix_service_providers_provider_type_id_country_city",
                schema: "category",
                table: "service_providers",
                columns: new[] { "provider_type_id", "country", "city" }
            );

            migrationBuilder.AddForeignKey(
                name: "fk_service_providers_service_provider_grades_grade_id",
                schema: "category",
                table: "service_providers",
                column: "grade_id",
                principalSchema: "category",
                principalTable: "service_provider_grades",
                principalColumn: "id"
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_service_providers_service_provider_grades_grade_id",
                schema: "category",
                table: "service_providers"
            );

            migrationBuilder.DropTable(name: "service_provider_grades", schema: "category");

            migrationBuilder.DropIndex(
                name: "ix_service_providers_country_city",
                schema: "category",
                table: "service_providers"
            );

            migrationBuilder.DropIndex(
                name: "ix_service_providers_grade_id",
                schema: "category",
                table: "service_providers"
            );

            migrationBuilder.DropIndex(
                name: "ix_service_providers_grade_id_provider_type_id",
                schema: "category",
                table: "service_providers"
            );

            migrationBuilder.DropIndex(
                name: "ix_service_providers_grade_id_provider_type_id_country_city",
                schema: "category",
                table: "service_providers"
            );

            migrationBuilder.DropIndex(
                name: "ix_service_providers_provider_type_id_country_city",
                schema: "category",
                table: "service_providers"
            );

            migrationBuilder.DropColumn(name: "grade_id", schema: "category", table: "service_providers");
        }
    }
}
