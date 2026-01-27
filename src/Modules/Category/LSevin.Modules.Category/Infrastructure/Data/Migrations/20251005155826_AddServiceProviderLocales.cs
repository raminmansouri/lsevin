using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LSevin.Modules.Category.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddServiceProviderLocales : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "name",
                schema: "category",
                table: "service_providers",
                newName: "name_translations"
            );

            migrationBuilder.RenameColumn(
                name: "description",
                schema: "category",
                table: "service_providers",
                newName: "description_translations"
            );

            migrationBuilder.RenameIndex(
                name: "ix_service_providers_name",
                schema: "category",
                table: "service_providers",
                newName: "ix_service_providers_name_translations"
            );

            migrationBuilder.RenameColumn(
                name: "value",
                schema: "category",
                table: "service_attribute_values",
                newName: "value_translations"
            );

            migrationBuilder.RenameColumn(
                name: "notes",
                schema: "category",
                table: "provider_staffs",
                newName: "notes_translations"
            );

            migrationBuilder.RenameColumn(
                name: "display_name",
                schema: "category",
                table: "provider_services",
                newName: "display_name_translations"
            );

            migrationBuilder.RenameColumn(
                name: "description",
                schema: "category",
                table: "provider_services",
                newName: "description_translations"
            );

            migrationBuilder.RenameColumn(
                name: "type",
                schema: "category",
                table: "provider_policies",
                newName: "type_translations"
            );

            migrationBuilder.RenameColumn(
                name: "description",
                schema: "category",
                table: "provider_policies",
                newName: "description_translations"
            );

            migrationBuilder.RenameIndex(
                name: "ix_provider_policies_type",
                schema: "category",
                table: "provider_policies",
                newName: "ix_provider_policies_type_translations"
            );

            migrationBuilder.RenameIndex(
                name: "ix_provider_policies_service_provider_id_type",
                schema: "category",
                table: "provider_policies",
                newName: "ix_provider_policies_service_provider_id_type_translations"
            );

            migrationBuilder.RenameColumn(
                name: "title",
                schema: "category",
                table: "provider_gallery_items",
                newName: "title_translations"
            );

            migrationBuilder.RenameColumn(
                name: "description",
                schema: "category",
                table: "provider_gallery_items",
                newName: "description_translations"
            );

            migrationBuilder.RenameColumn(
                name: "value",
                schema: "category",
                table: "provider_attributes",
                newName: "value_translations"
            );

            // Convert existing string data to JSONB format
            migrationBuilder.Sql(
                """
                ALTER TABLE category.service_providers
                ALTER COLUMN name_translations
                TYPE jsonb
                USING jsonb_build_object('en-US', name_translations);
                """
            );

            migrationBuilder.Sql(
                """
                ALTER TABLE category.service_providers
                ALTER COLUMN description_translations
                TYPE jsonb
                USING jsonb_build_object('en-US', description_translations);
                """
            );

            migrationBuilder.Sql(
                """
                ALTER TABLE category.service_attribute_values
                ALTER COLUMN value_translations
                TYPE jsonb
                USING jsonb_build_object('en-US', value_translations);
                """
            );

            migrationBuilder.Sql(
                """
                ALTER TABLE category.provider_staffs
                ALTER COLUMN notes_translations
                TYPE jsonb
                USING jsonb_build_object('en-US', notes_translations);
                """
            );

            migrationBuilder.Sql(
                """
                ALTER TABLE category.provider_services
                ALTER COLUMN display_name_translations
                TYPE jsonb
                USING jsonb_build_object('en-US', display_name_translations);
                """
            );

            migrationBuilder.Sql(
                """
                ALTER TABLE category.provider_services
                ALTER COLUMN description_translations
                TYPE jsonb
                USING jsonb_build_object('en-US', description_translations);
                """
            );

            migrationBuilder.Sql(
                """
                ALTER TABLE category.provider_policies
                ALTER COLUMN type_translations
                TYPE jsonb
                USING jsonb_build_object('en-US', type_translations);
                """
            );

            migrationBuilder.Sql(
                """
                ALTER TABLE category.provider_policies
                ALTER COLUMN description_translations
                TYPE jsonb
                USING jsonb_build_object('en-US', description_translations);
                """
            );

            migrationBuilder.Sql(
                """
                ALTER TABLE category.provider_gallery_items
                ALTER COLUMN title_translations
                TYPE jsonb
                USING jsonb_build_object('en-US', title_translations);
                """
            );

            migrationBuilder.Sql(
                """
                ALTER TABLE category.provider_gallery_items
                ALTER COLUMN description_translations
                TYPE jsonb
                USING jsonb_build_object('en-US', description_translations);
                """
            );

            migrationBuilder.Sql(
                """
                ALTER TABLE category.provider_attributes
                ALTER COLUMN value_translations
                TYPE jsonb
                USING jsonb_build_object('en-US', value_translations);
                """
            );

            migrationBuilder.AlterColumn<string>(
                name: "name_translations",
                schema: "category",
                table: "service_providers",
                type: "jsonb",
                maxLength: 1000,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100
            );

            migrationBuilder.AlterColumn<string>(
                name: "description_translations",
                schema: "category",
                table: "service_providers",
                type: "jsonb",
                maxLength: 20000,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(2000)",
                oldMaxLength: 2000
            );

            migrationBuilder.AlterColumn<string>(
                name: "value_translations",
                schema: "category",
                table: "service_attribute_values",
                type: "jsonb",
                maxLength: 2500,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(250)",
                oldMaxLength: 250
            );

            migrationBuilder.AlterColumn<string>(
                name: "notes_translations",
                schema: "category",
                table: "provider_staffs",
                type: "jsonb",
                maxLength: 20000,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(2000)",
                oldMaxLength: 2000
            );

            migrationBuilder.AlterColumn<string>(
                name: "display_name_translations",
                schema: "category",
                table: "provider_services",
                type: "jsonb",
                maxLength: 1000,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100
            );

            migrationBuilder.AlterColumn<string>(
                name: "description_translations",
                schema: "category",
                table: "provider_services",
                type: "jsonb",
                maxLength: 20000,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(2000)",
                oldMaxLength: 2000
            );

            migrationBuilder.AlterColumn<string>(
                name: "type_translations",
                schema: "category",
                table: "provider_policies",
                type: "jsonb",
                maxLength: 500,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(50)",
                oldMaxLength: 50
            );

            migrationBuilder.AlterColumn<string>(
                name: "description_translations",
                schema: "category",
                table: "provider_policies",
                type: "jsonb",
                maxLength: 20000,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(2000)",
                oldMaxLength: 2000
            );

            migrationBuilder.AlterColumn<string>(
                name: "title_translations",
                schema: "category",
                table: "provider_gallery_items",
                type: "jsonb",
                maxLength: 1000,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100
            );

            migrationBuilder.AlterColumn<string>(
                name: "description_translations",
                schema: "category",
                table: "provider_gallery_items",
                type: "jsonb",
                maxLength: 20000,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(2000)",
                oldMaxLength: 2000
            );

            migrationBuilder.AlterColumn<string>(
                name: "value_translations",
                schema: "category",
                table: "provider_attributes",
                type: "jsonb",
                maxLength: 2500,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(250)",
                oldMaxLength: 250
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "name_translations",
                schema: "category",
                table: "service_providers",
                newName: "name"
            );

            migrationBuilder.RenameColumn(
                name: "description_translations",
                schema: "category",
                table: "service_providers",
                newName: "description"
            );

            migrationBuilder.RenameIndex(
                name: "ix_service_providers_name_translations",
                schema: "category",
                table: "service_providers",
                newName: "ix_service_providers_name"
            );

            migrationBuilder.RenameColumn(
                name: "value_translations",
                schema: "category",
                table: "service_attribute_values",
                newName: "value"
            );

            migrationBuilder.RenameColumn(
                name: "notes_translations",
                schema: "category",
                table: "provider_staffs",
                newName: "notes"
            );

            migrationBuilder.RenameColumn(
                name: "display_name_translations",
                schema: "category",
                table: "provider_services",
                newName: "display_name"
            );

            migrationBuilder.RenameColumn(
                name: "description_translations",
                schema: "category",
                table: "provider_services",
                newName: "description"
            );

            migrationBuilder.RenameColumn(
                name: "type_translations",
                schema: "category",
                table: "provider_policies",
                newName: "type"
            );

            migrationBuilder.RenameColumn(
                name: "description_translations",
                schema: "category",
                table: "provider_policies",
                newName: "description"
            );

            migrationBuilder.RenameIndex(
                name: "ix_provider_policies_type_translations",
                schema: "category",
                table: "provider_policies",
                newName: "ix_provider_policies_type"
            );

            migrationBuilder.RenameIndex(
                name: "ix_provider_policies_service_provider_id_type_translations",
                schema: "category",
                table: "provider_policies",
                newName: "ix_provider_policies_service_provider_id_type"
            );

            migrationBuilder.RenameColumn(
                name: "title_translations",
                schema: "category",
                table: "provider_gallery_items",
                newName: "title"
            );

            migrationBuilder.RenameColumn(
                name: "description_translations",
                schema: "category",
                table: "provider_gallery_items",
                newName: "description"
            );

            migrationBuilder.RenameColumn(
                name: "value_translations",
                schema: "category",
                table: "provider_attributes",
                newName: "value"
            );

            // Convert JSONB data back to string format (extract 'en-US' key)
            migrationBuilder.Sql(
                """
                ALTER TABLE category.service_providers
                ALTER COLUMN name
                TYPE character varying(100)
                USING COALESCE(name ->> 'en-US', '');
                """
            );

            migrationBuilder.Sql(
                """
                ALTER TABLE category.service_providers
                ALTER COLUMN description
                TYPE character varying(2000)
                USING COALESCE(description ->> 'en-US', '');
                """
            );

            migrationBuilder.Sql(
                """
                ALTER TABLE category.service_attribute_values
                ALTER COLUMN value
                TYPE character varying(250)
                USING COALESCE(value ->> 'en-US', '');
                """
            );

            migrationBuilder.Sql(
                """
                ALTER TABLE category.provider_staffs
                ALTER COLUMN notes
                TYPE character varying(2000)
                USING COALESCE(notes ->> 'en-US', '');
                """
            );

            migrationBuilder.Sql(
                """
                ALTER TABLE category.provider_services
                ALTER COLUMN display_name
                TYPE character varying(100)
                USING COALESCE(display_name ->> 'en-US', '');
                """
            );

            migrationBuilder.Sql(
                """
                ALTER TABLE category.provider_services
                ALTER COLUMN description
                TYPE character varying(2000)
                USING COALESCE(description ->> 'en-US', '');
                """
            );

            migrationBuilder.Sql(
                """
                ALTER TABLE category.provider_policies
                ALTER COLUMN type
                TYPE character varying(50)
                USING COALESCE(type ->> 'en-US', '');
                """
            );

            migrationBuilder.Sql(
                """
                ALTER TABLE category.provider_policies
                ALTER COLUMN description
                TYPE character varying(2000)
                USING COALESCE(description ->> 'en-US', '');
                """
            );

            migrationBuilder.Sql(
                """
                ALTER TABLE category.provider_gallery_items
                ALTER COLUMN title
                TYPE character varying(100)
                USING COALESCE(title ->> 'en-US', '');
                """
            );

            migrationBuilder.Sql(
                """
                ALTER TABLE category.provider_gallery_items
                ALTER COLUMN description
                TYPE character varying(2000)
                USING COALESCE(description ->> 'en-US', '');
                """
            );

            migrationBuilder.Sql(
                """
                ALTER TABLE category.provider_attributes
                ALTER COLUMN value
                TYPE character varying(250)
                USING COALESCE(value ->> 'en-US', '');
                """
            );

            migrationBuilder.AlterColumn<string>(
                name: "name",
                schema: "category",
                table: "service_providers",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "jsonb",
                oldMaxLength: 1000
            );

            migrationBuilder.AlterColumn<string>(
                name: "description",
                schema: "category",
                table: "service_providers",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "jsonb",
                oldMaxLength: 20000
            );

            migrationBuilder.AlterColumn<string>(
                name: "value",
                schema: "category",
                table: "service_attribute_values",
                type: "character varying(250)",
                maxLength: 250,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "jsonb",
                oldMaxLength: 2500
            );

            migrationBuilder.AlterColumn<string>(
                name: "notes",
                schema: "category",
                table: "provider_staffs",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "jsonb",
                oldMaxLength: 20000
            );

            migrationBuilder.AlterColumn<string>(
                name: "display_name",
                schema: "category",
                table: "provider_services",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "jsonb",
                oldMaxLength: 1000
            );

            migrationBuilder.AlterColumn<string>(
                name: "description",
                schema: "category",
                table: "provider_services",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "jsonb",
                oldMaxLength: 20000
            );

            migrationBuilder.AlterColumn<string>(
                name: "type",
                schema: "category",
                table: "provider_policies",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "jsonb",
                oldMaxLength: 500
            );

            migrationBuilder.AlterColumn<string>(
                name: "description",
                schema: "category",
                table: "provider_policies",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "jsonb",
                oldMaxLength: 20000
            );

            migrationBuilder.AlterColumn<string>(
                name: "title",
                schema: "category",
                table: "provider_gallery_items",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "jsonb",
                oldMaxLength: 1000
            );

            migrationBuilder.AlterColumn<string>(
                name: "description",
                schema: "category",
                table: "provider_gallery_items",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "jsonb",
                oldMaxLength: 20000
            );

            migrationBuilder.AlterColumn<string>(
                name: "value",
                schema: "category",
                table: "provider_attributes",
                type: "character varying(250)",
                maxLength: 250,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "jsonb",
                oldMaxLength: 2500
            );
        }
    }
}
