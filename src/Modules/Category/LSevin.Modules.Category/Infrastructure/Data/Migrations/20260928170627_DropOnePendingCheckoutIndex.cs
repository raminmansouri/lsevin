using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LSevin.Modules.Category.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class DropOnePendingCheckoutIndex : Migration
    {
protected override void Up(MigrationBuilder migrationBuilder)
{
    migrationBuilder.Sql(
        "DROP INDEX IF EXISTS booking.ux_bookings_one_pending_checkout_per_user;");
}

protected override void Down(MigrationBuilder migrationBuilder)
{
    migrationBuilder.Sql(
        "CREATE UNIQUE INDEX IF NOT EXISTS ux_bookings_one_pending_checkout_per_user " +
        "ON booking.bookings (user_id) WHERE booking_status = 'Pending';");
}
    }
}
