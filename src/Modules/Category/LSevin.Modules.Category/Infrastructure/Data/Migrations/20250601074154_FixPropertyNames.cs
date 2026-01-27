using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LSevin.Modules.Category.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class FixPropertyNames : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_provider_attribute_definitions_attribute_types__attribute_t",
                schema: "category",
                table: "provider_attribute_definitions"
            );

            migrationBuilder.DropForeignKey(
                name: "fk_service_attribute_definitions_attribute_types__attribute_ty",
                schema: "category",
                table: "service_attribute_definitions"
            );

            migrationBuilder.DropForeignKey(
                name: "fk_staff_availabilities_staff_availability_statuses__availabil",
                schema: "category",
                table: "staff_availabilities"
            );

            migrationBuilder.RenameColumn(
                name: "_availability_status_id",
                schema: "category",
                table: "staff_availabilities",
                newName: "availability_status_id"
            );

            migrationBuilder.RenameIndex(
                name: "ix_staff_availabilities__availability_status_id",
                schema: "category",
                table: "staff_availabilities",
                newName: "ix_staff_availabilities_availability_status_id"
            );

            migrationBuilder.RenameColumn(
                name: "_attribute_type_id",
                schema: "category",
                table: "service_attribute_definitions",
                newName: "attribute_type_id"
            );

            migrationBuilder.RenameIndex(
                name: "ix_service_attribute_definitions__attribute_type_id",
                schema: "category",
                table: "service_attribute_definitions",
                newName: "ix_service_attribute_definitions_attribute_type_id"
            );

            migrationBuilder.RenameColumn(
                name: "_attribute_type_id",
                schema: "category",
                table: "provider_attribute_definitions",
                newName: "attribute_type_id"
            );

            migrationBuilder.RenameIndex(
                name: "ix_provider_attribute_definitions__attribute_type_id",
                schema: "category",
                table: "provider_attribute_definitions",
                newName: "ix_provider_attribute_definitions_attribute_type_id"
            );

            migrationBuilder.RenameColumn(
                name: "ParentId",
                schema: "category",
                table: "categories",
                newName: "parent_id"
            );

            migrationBuilder.AddForeignKey(
                name: "fk_provider_attribute_definitions_attribute_types_attribute_ty",
                schema: "category",
                table: "provider_attribute_definitions",
                column: "attribute_type_id",
                principalSchema: "category",
                principalTable: "attribute_types",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade
            );

            migrationBuilder.AddForeignKey(
                name: "fk_service_attribute_definitions_attribute_types_attribute_typ",
                schema: "category",
                table: "service_attribute_definitions",
                column: "attribute_type_id",
                principalSchema: "category",
                principalTable: "attribute_types",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade
            );

            migrationBuilder.AddForeignKey(
                name: "fk_staff_availabilities_staff_availability_statuses_availabili",
                schema: "category",
                table: "staff_availabilities",
                column: "availability_status_id",
                principalSchema: "category",
                principalTable: "staff_availability_statuses",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_provider_attribute_definitions_attribute_types_attribute_ty",
                schema: "category",
                table: "provider_attribute_definitions"
            );

            migrationBuilder.DropForeignKey(
                name: "fk_service_attribute_definitions_attribute_types_attribute_typ",
                schema: "category",
                table: "service_attribute_definitions"
            );

            migrationBuilder.DropForeignKey(
                name: "fk_staff_availabilities_staff_availability_statuses_availabili",
                schema: "category",
                table: "staff_availabilities"
            );

            migrationBuilder.RenameColumn(
                name: "availability_status_id",
                schema: "category",
                table: "staff_availabilities",
                newName: "_availability_status_id"
            );

            migrationBuilder.RenameIndex(
                name: "ix_staff_availabilities_availability_status_id",
                schema: "category",
                table: "staff_availabilities",
                newName: "ix_staff_availabilities__availability_status_id"
            );

            migrationBuilder.RenameColumn(
                name: "attribute_type_id",
                schema: "category",
                table: "service_attribute_definitions",
                newName: "_attribute_type_id"
            );

            migrationBuilder.RenameIndex(
                name: "ix_service_attribute_definitions_attribute_type_id",
                schema: "category",
                table: "service_attribute_definitions",
                newName: "ix_service_attribute_definitions__attribute_type_id"
            );

            migrationBuilder.RenameColumn(
                name: "attribute_type_id",
                schema: "category",
                table: "provider_attribute_definitions",
                newName: "_attribute_type_id"
            );

            migrationBuilder.RenameIndex(
                name: "ix_provider_attribute_definitions_attribute_type_id",
                schema: "category",
                table: "provider_attribute_definitions",
                newName: "ix_provider_attribute_definitions__attribute_type_id"
            );

            migrationBuilder.RenameColumn(
                name: "parent_id",
                schema: "category",
                table: "categories",
                newName: "ParentId"
            );

            migrationBuilder.AddForeignKey(
                name: "fk_provider_attribute_definitions_attribute_types__attribute_t",
                schema: "category",
                table: "provider_attribute_definitions",
                column: "_attribute_type_id",
                principalSchema: "category",
                principalTable: "attribute_types",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade
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

            migrationBuilder.AddForeignKey(
                name: "fk_staff_availabilities_staff_availability_statuses__availabil",
                schema: "category",
                table: "staff_availabilities",
                column: "_availability_status_id",
                principalSchema: "category",
                principalTable: "staff_availability_statuses",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade
            );
        }
    }
}
