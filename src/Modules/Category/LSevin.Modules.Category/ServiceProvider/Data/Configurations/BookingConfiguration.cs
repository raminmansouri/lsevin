using LSevin.Modules.Category.ServiceProvider.Entities;
using LSevin.Modules.Category.ServiceProvider.Features.BookingCheckout;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace LSevin.Modules.Category.ServiceProvider.Data.Configurations
{
    internal sealed class BookingConfiguration : IEntityTypeConfiguration<BookingDomain>
    {
        private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

        public void Configure(EntityTypeBuilder<BookingDomain> builder)
        {
            builder.ToTable("bookings", "booking");

            builder.HasKey(x => x.Id);

            builder.Property(x => x.Id).HasColumnName("id");
            builder.Property(x => x.UserId).HasColumnName("user_id");

            builder.Property(x => x.ProviderId).HasColumnName("provider_id");
            builder.Property(x => x.ServiceId).HasColumnName("service_id");
            builder.Property(x => x.SpecialistId).HasColumnName("specialist_id");

            builder.Property(x => x.SelectedDate)
                .HasColumnName("selected_date")
                .HasColumnType("date");

            builder.Property(x => x.SelectedDateFrom)
                .HasColumnName("selected_date_from")
                .HasColumnType("time without time zone");

            builder.Property(x => x.SelectedDateTo)
                .HasColumnName("selected_date_to")
                .HasColumnType("time without time zone");

            builder.Property(x => x.SelectedTime)
                .HasColumnName("selected_time")
                .HasColumnType("time without time zone");

            builder.Property(x => x.SelectedTimeFrom)
                .HasColumnName("selected_time_from")
                .HasColumnType("time without time zone");

            builder.Property(x => x.SelectedTimeTo)
                .HasColumnName("selected_time_to")
                .HasColumnType("time without time zone");

            builder.Property(x => x.PaymentMethod)
                .HasColumnName("payment_method");

            builder.Property(x => x.CheckoutStep)
                .HasColumnName("checkout_step");

            builder.Property(x => x.PaymentStatus)
                .HasColumnName("payment_status")
                .HasMaxLength(50);

            builder.Property(x => x.ConfirmationCode)
                .HasColumnName("confirmation_code")
                .HasMaxLength(100);

            builder.Property(x => x.BookingStatus)
                .HasColumnName("booking_status")
                .HasMaxLength(30);

            builder.Property(x => x.CreateDate)
                .HasColumnName("create_date");

            builder.Property(x => x.LastModifiedDate)
                .HasColumnName("last_modified_date");

            builder.Property(x => x.AddOns)
                .HasColumnName("add_ons")
                .HasColumnType("jsonb")
                .HasConversion(
                    v => JsonSerializer.Serialize(v, JsonOptions),
                    v => JsonSerializer.Deserialize<List<BookingAddOnItem>>(v, JsonOptions) ?? new List<BookingAddOnItem>()
                );

            builder.Property(x => x.UploadFiles)
                .HasColumnName("upload_files")
                .HasColumnType("jsonb")
                .HasConversion(
                    v => JsonSerializer.Serialize(v, JsonOptions),
                    v => JsonSerializer.Deserialize<List<BookingUploadFileItem>>(v, JsonOptions) ?? new List<BookingUploadFileItem>()
                );

            builder.Property(x => x.AdditionalServices)
                .HasColumnName("additional_services")
                .HasColumnType("jsonb")
                .HasConversion(
                    v => JsonSerializer.Serialize(v, JsonOptions),
                    v => JsonSerializer.Deserialize<List<BookingAdditionalServiceItem>>(v, JsonOptions) ?? new List<BookingAdditionalServiceItem>()
                );

            builder.HasIndex(x => x.UserId)
                .HasDatabaseName("ux_bookings_one_pending_checkout_per_user")
                .IsUnique()
                .HasFilter("booking_status = 'Pending'");
        }
    }
}
