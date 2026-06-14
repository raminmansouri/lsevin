using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace LSevinModels.Models;

public partial class LsevinContext : DbContext
{
    public LsevinContext()
    {
    }

    public LsevinContext(DbContextOptions<LsevinContext> options)
        : base(options)
    {
    }

    public virtual DbSet<AccessToken> AccessTokens { get; set; }

    public virtual DbSet<Addon> Addons { get; set; }

    public virtual DbSet<AddonDetail> AddonDetails { get; set; }

    public virtual DbSet<AspNetRole> AspNetRoles { get; set; }

    public virtual DbSet<AspNetRoleClaim> AspNetRoleClaims { get; set; }

    public virtual DbSet<AspNetUser> AspNetUsers { get; set; }

    public virtual DbSet<AspNetUserClaim> AspNetUserClaims { get; set; }

    public virtual DbSet<AspNetUserLogin> AspNetUserLogins { get; set; }

    public virtual DbSet<AspNetUserToken> AspNetUserTokens { get; set; }

    public virtual DbSet<AttributeType> AttributeTypes { get; set; }

    public virtual DbSet<Booking> Bookings { get; set; }

    public virtual DbSet<Category> Categories { get; set; }

    public virtual DbSet<CategoryGroup> CategoryGroups { get; set; }

    public virtual DbSet<Consulting> Consultings { get; set; }

    public virtual DbSet<ConsultingSelectedDocumentReference> ConsultingSelectedDocumentReferences { get; set; }

    public virtual DbSet<Currency> Currencies { get; set; }

    public virtual DbSet<Currency1> Currencies1 { get; set; }

    public virtual DbSet<Customer> Customers { get; set; }

    public virtual DbSet<CustomerDocument> CustomerDocuments { get; set; }

    public virtual DbSet<CustomerDocumentType> CustomerDocumentTypes { get; set; }

    public virtual DbSet<EmailVerificationCode> EmailVerificationCodes { get; set; }

    public virtual DbSet<Favorite> Favorites { get; set; }

    public virtual DbSet<InboxMessage> InboxMessages { get; set; }

    public virtual DbSet<InboxMessage1> InboxMessages1 { get; set; }

    public virtual DbSet<InboxMessage2> InboxMessages2 { get; set; }

    public virtual DbSet<InboxMessageConsumer> InboxMessageConsumers { get; set; }

    public virtual DbSet<InboxMessageConsumer1> InboxMessageConsumers1 { get; set; }

    public virtual DbSet<InboxMessageConsumer2> InboxMessageConsumers2 { get; set; }

    public virtual DbSet<InternalCommandMessage> InternalCommandMessages { get; set; }

    public virtual DbSet<InternalCommandMessage1> InternalCommandMessages1 { get; set; }

    public virtual DbSet<InternalCommandMessage2> InternalCommandMessages2 { get; set; }

    public virtual DbSet<InternalCommandMessageConsumer> InternalCommandMessageConsumers { get; set; }

    public virtual DbSet<InternalCommandMessageConsumer1> InternalCommandMessageConsumers1 { get; set; }

    public virtual DbSet<InternalCommandMessageConsumer2> InternalCommandMessageConsumers2 { get; set; }

    public virtual DbSet<Location> Locations { get; set; }

    public virtual DbSet<LocationType> LocationTypes { get; set; }

    public virtual DbSet<Offer> Offers { get; set; }

    public virtual DbSet<OutboxMessage> OutboxMessages { get; set; }

    public virtual DbSet<OutboxMessage1> OutboxMessages1 { get; set; }

    public virtual DbSet<OutboxMessage2> OutboxMessages2 { get; set; }

    public virtual DbSet<OutboxMessageConsumer> OutboxMessageConsumers { get; set; }

    public virtual DbSet<OutboxMessageConsumer1> OutboxMessageConsumers1 { get; set; }

    public virtual DbSet<OutboxMessageConsumer2> OutboxMessageConsumers2 { get; set; }

    public virtual DbSet<PasswordResetCode> PasswordResetCodes { get; set; }

    public virtual DbSet<PhoneLoginCode> PhoneLoginCodes { get; set; }

    public virtual DbSet<ProviderAttribute> ProviderAttributes { get; set; }

    public virtual DbSet<ProviderAttributeDefinition> ProviderAttributeDefinitions { get; set; }

    public virtual DbSet<ProviderAttributeDefinitionDomainOption> ProviderAttributeDefinitionDomainOptions { get; set; }

    public virtual DbSet<ProviderCertification> ProviderCertifications { get; set; }

    public virtual DbSet<ProviderGalleryItem> ProviderGalleryItems { get; set; }

    public virtual DbSet<ProviderLanguage> ProviderLanguages { get; set; }

    public virtual DbSet<ProviderPolicy> ProviderPolicies { get; set; }

    public virtual DbSet<ProviderRecommendation> ProviderRecommendations { get; set; }

    public virtual DbSet<ProviderService> ProviderServices { get; set; }

    public virtual DbSet<ProviderServiceGalleryItem> ProviderServiceGalleryItems { get; set; }

    public virtual DbSet<ProviderStaff> ProviderStaffs { get; set; }

    public virtual DbSet<ProviderType> ProviderTypes { get; set; }

    public virtual DbSet<RefreshToken> RefreshTokens { get; set; }

    public virtual DbSet<ReviewImage> ReviewImages { get; set; }

    public virtual DbSet<ServiceAttributeDefinition> ServiceAttributeDefinitions { get; set; }

    public virtual DbSet<ServiceAttributeDefinitionOption> ServiceAttributeDefinitionOptions { get; set; }

    public virtual DbSet<ServiceAttributeValue> ServiceAttributeValues { get; set; }

    public virtual DbSet<ServiceDefinition> ServiceDefinitions { get; set; }

    public virtual DbSet<ServiceDefinitionDomainRequirement> ServiceDefinitionDomainRequirements { get; set; }

    public virtual DbSet<ServiceFaq> ServiceFaqs { get; set; }

    public virtual DbSet<ServiceIncluded> ServiceIncludeds { get; set; }

    public virtual DbSet<ServiceProcess> ServiceProcesses { get; set; }

    public virtual DbSet<ServiceProvider> ServiceProviders { get; set; }

    public virtual DbSet<ServiceProviderComment> ServiceProviderComments { get; set; }

    public virtual DbSet<ServiceProviderGrade> ServiceProviderGrades { get; set; }

    public virtual DbSet<ServiceProviderRequest> ServiceProviderRequests { get; set; }

    public virtual DbSet<ServiceProviderRequestStatus> ServiceProviderRequestStatuses { get; set; }

    public virtual DbSet<ServiceUploadFileRequirement> ServiceUploadFileRequirements { get; set; }

    public virtual DbSet<Staff> Staff { get; set; }

    public virtual DbSet<StaffAchievement> StaffAchievements { get; set; }

    public virtual DbSet<StaffAvailability> StaffAvailabilities { get; set; }

    public virtual DbSet<StaffAvailabilityStatus> StaffAvailabilityStatuses { get; set; }

    public virtual DbSet<StaffBeforeAfter> StaffBeforeAfters { get; set; }

    public virtual DbSet<StaffCertification> StaffCertifications { get; set; }

    public virtual DbSet<StaffCredential> StaffCredentials { get; set; }

    public virtual DbSet<StaffEducation> StaffEducations { get; set; }

    public virtual DbSet<StaffGalleryItem> StaffGalleryItems { get; set; }

    public virtual DbSet<StaffLanguage> StaffLanguages { get; set; }

    public virtual DbSet<StaffService> StaffServices { get; set; }

    public virtual DbSet<StaffSpecialization> StaffSpecializations { get; set; }

    public virtual DbSet<TranslationAudit> TranslationAudits { get; set; }

    public virtual DbSet<TrendingSearch> TrendingSearches { get; set; }

    public virtual DbSet<UserSearchHistory> UserSearchHistories { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
        => optionsBuilder.UseNpgsql("Host=62.60.212.187:5432;Database=lsevin;Username=postgres;Password=S@vin4451;Timezone=Asia/Tehran", x => x.UseNodaTime());

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder
            .HasPostgresEnum("customer", "favorite_type", new[] { "provider", "service", "specialist" })
            .HasPostgresExtension("btree_gist")
            .HasPostgresExtension("pg_trgm")
            .HasPostgresExtension("uuid-ossp");

        modelBuilder.Entity<AccessToken>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("pk_access_tokens");

            entity.ToTable("access_tokens", "identity");

            entity.HasIndex(e => new { e.Token, e.UserId }, "ix_access_tokens_token_user_id").IsUnique();

            entity.HasIndex(e => e.UserId, "ix_access_tokens_user_id");

            entity.Property(e => e.Id)
                .ValueGeneratedNever()
                .HasColumnName("id");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.CreatedByIp)
                .HasMaxLength(50)
                .HasColumnName("created_by_ip");
            entity.Property(e => e.ExpiredAt).HasColumnName("expired_at");
            entity.Property(e => e.Token)
                .HasMaxLength(2000)
                .HasColumnName("token");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.User).WithMany(p => p.AccessTokens)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("fk_access_tokens_asp_net_users_user_id");
        });

        modelBuilder.Entity<Addon>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("pk_addons");

            entity.ToTable("addons", "category");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreateDate)
                .HasDefaultValueSql("now()")
                .HasColumnName("create_date");
            entity.Property(e => e.Description)
                .HasDefaultValueSql("''::text")
                .HasColumnName("description");
            entity.Property(e => e.Icon)
                .HasDefaultValueSql("''::text")
                .HasColumnName("icon");
            entity.Property(e => e.LastModifiedDate)
                .HasDefaultValueSql("now()")
                .HasColumnName("last_modified_date");
            entity.Property(e => e.Name).HasColumnName("name");
            entity.Property(e => e.Popular).HasColumnName("popular");
            entity.Property(e => e.Price)
                .HasPrecision(18, 2)
                .HasColumnName("price");
        });

        modelBuilder.Entity<AddonDetail>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("pk_addon_details");

            entity.ToTable("addon_details", "category");

            entity.HasIndex(e => e.AddonId, "ix_addon_details_addon_id");

            entity.Property(e => e.Id)
                .HasDefaultValueSql("uuid_generate_v4()")
                .HasColumnName("id");
            entity.Property(e => e.AddonId).HasColumnName("addon_id");
            entity.Property(e => e.Detail).HasColumnName("detail");
            entity.Property(e => e.DisplayOrder)
                .HasDefaultValue(0)
                .HasColumnName("display_order");

            entity.HasOne(d => d.Addon).WithMany(p => p.AddonDetails)
                .HasForeignKey(d => d.AddonId)
                .HasConstraintName("fk_addon_details_addons");
        });

        modelBuilder.Entity<AspNetRole>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("pk_asp_net_roles");

            entity.ToTable("asp_net_roles", "identity");

            entity.HasIndex(e => e.NormalizedName, "RoleNameIndex").IsUnique();

            entity.Property(e => e.Id)
                .ValueGeneratedNever()
                .HasColumnName("id");
            entity.Property(e => e.ConcurrencyStamp).HasColumnName("concurrency_stamp");
            entity.Property(e => e.Name)
                .HasMaxLength(256)
                .HasColumnName("name");
            entity.Property(e => e.NormalizedName)
                .HasMaxLength(256)
                .HasColumnName("normalized_name");
        });

        modelBuilder.Entity<AspNetRoleClaim>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("pk_asp_net_role_claims");

            entity.ToTable("asp_net_role_claims", "identity");

            entity.HasIndex(e => e.RoleId, "ix_asp_net_role_claims_role_id");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ClaimType).HasColumnName("claim_type");
            entity.Property(e => e.ClaimValue).HasColumnName("claim_value");
            entity.Property(e => e.RoleId).HasColumnName("role_id");

            entity.HasOne(d => d.Role).WithMany(p => p.AspNetRoleClaims)
                .HasForeignKey(d => d.RoleId)
                .HasConstraintName("fk_asp_net_role_claims_asp_net_roles_role_id");
        });

        modelBuilder.Entity<AspNetUser>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("pk_asp_net_users");

            entity.ToTable("asp_net_users", "identity");

            entity.HasIndex(e => e.NormalizedEmail, "EmailIndex").IsUnique();

            entity.HasIndex(e => e.NormalizedUserName, "UserNameIndex").IsUnique();

            entity.HasIndex(e => e.Email, "ix_asp_net_users_email").IsUnique();

            entity.HasIndex(e => new { e.PhoneNumberCountryCode, e.PhoneNumber }, "ix_asp_net_users_phone_number_country_code_phone_number").IsUnique();

            entity.Property(e => e.Id)
                .ValueGeneratedNever()
                .HasColumnName("id");
            entity.Property(e => e.AccessFailedCount).HasColumnName("access_failed_count");
            entity.Property(e => e.ConcurrencyStamp).HasColumnName("concurrency_stamp");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnName("created_at");
            entity.Property(e => e.Email)
                .HasMaxLength(250)
                .HasColumnName("email");
            entity.Property(e => e.EmailConfirmed).HasColumnName("email_confirmed");
            entity.Property(e => e.FirstName)
                .HasMaxLength(100)
                .HasColumnName("first_name");
            entity.Property(e => e.LastLoggedInAt).HasColumnName("last_logged_in_at");
            entity.Property(e => e.LastName)
                .HasMaxLength(50)
                .HasColumnName("last_name");
            entity.Property(e => e.LockoutEnabled).HasColumnName("lockout_enabled");
            entity.Property(e => e.LockoutEnd).HasColumnName("lockout_end");
            entity.Property(e => e.NormalizedEmail)
                .HasMaxLength(250)
                .HasColumnName("normalized_email");
            entity.Property(e => e.NormalizedUserName)
                .HasMaxLength(50)
                .HasColumnName("normalized_user_name");
            entity.Property(e => e.PasswordHash).HasColumnName("password_hash");
            entity.Property(e => e.PhoneNumber)
                .HasMaxLength(20)
                .HasColumnName("phone_number");
            entity.Property(e => e.PhoneNumberConfirmed).HasColumnName("phone_number_confirmed");
            entity.Property(e => e.PhoneNumberCountryCode)
                .HasMaxLength(3)
                .HasColumnName("phone_number_country_code");
            entity.Property(e => e.SecurityStamp).HasColumnName("security_stamp");
            entity.Property(e => e.TwoFactorEnabled).HasColumnName("two_factor_enabled");
            entity.Property(e => e.UserName)
                .HasMaxLength(50)
                .HasColumnName("user_name");
            entity.Property(e => e.UserState)
                .HasDefaultValueSql("'Active'::text")
                .HasColumnName("user_state");

            entity.HasMany(d => d.Roles).WithMany(p => p.Users)
                .UsingEntity<Dictionary<string, object>>(
                    "AspNetUserRole",
                    r => r.HasOne<AspNetRole>().WithMany()
                        .HasForeignKey("RoleId")
                        .HasConstraintName("fk_asp_net_user_roles_asp_net_roles_role_id"),
                    l => l.HasOne<AspNetUser>().WithMany()
                        .HasForeignKey("UserId")
                        .HasConstraintName("fk_asp_net_user_roles_asp_net_users_user_id"),
                    j =>
                    {
                        j.HasKey("UserId", "RoleId").HasName("pk_asp_net_user_roles");
                        j.ToTable("asp_net_user_roles", "identity");
                        j.HasIndex(new[] { "RoleId" }, "ix_asp_net_user_roles_role_id");
                        j.IndexerProperty<Guid>("UserId").HasColumnName("user_id");
                        j.IndexerProperty<Guid>("RoleId").HasColumnName("role_id");
                    });
        });

        modelBuilder.Entity<AspNetUserClaim>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("pk_asp_net_user_claims");

            entity.ToTable("asp_net_user_claims", "identity");

            entity.HasIndex(e => e.UserId, "ix_asp_net_user_claims_user_id");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ClaimType).HasColumnName("claim_type");
            entity.Property(e => e.ClaimValue).HasColumnName("claim_value");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.User).WithMany(p => p.AspNetUserClaims)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("fk_asp_net_user_claims_asp_net_users_user_id");
        });

        modelBuilder.Entity<AspNetUserLogin>(entity =>
        {
            entity.HasKey(e => new { e.LoginProvider, e.ProviderKey }).HasName("pk_asp_net_user_logins");

            entity.ToTable("asp_net_user_logins", "identity");

            entity.HasIndex(e => e.UserId, "ix_asp_net_user_logins_user_id");

            entity.Property(e => e.LoginProvider).HasColumnName("login_provider");
            entity.Property(e => e.ProviderKey).HasColumnName("provider_key");
            entity.Property(e => e.ProviderDisplayName).HasColumnName("provider_display_name");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.User).WithMany(p => p.AspNetUserLogins)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("fk_asp_net_user_logins_asp_net_users_user_id");
        });

        modelBuilder.Entity<AspNetUserToken>(entity =>
        {
            entity.HasKey(e => new { e.UserId, e.LoginProvider, e.Name }).HasName("pk_asp_net_user_tokens");

            entity.ToTable("asp_net_user_tokens", "identity");

            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.LoginProvider).HasColumnName("login_provider");
            entity.Property(e => e.Name).HasColumnName("name");
            entity.Property(e => e.Value).HasColumnName("value");

            entity.HasOne(d => d.User).WithMany(p => p.AspNetUserTokens)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("fk_asp_net_user_tokens_asp_net_users_user_id");
        });

        modelBuilder.Entity<AttributeType>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("pk_attribute_types");

            entity.ToTable("attribute_types", "category");

            entity.Property(e => e.Id)
                .ValueGeneratedNever()
                .HasColumnName("id");
            entity.Property(e => e.Name)
                .HasMaxLength(25)
                .HasColumnName("name");
        });

        modelBuilder.Entity<Booking>(entity =>
        {
            entity.HasKey(e => new { e.ProviderId, e.ServiceId, e.SpecialistId, e.SelectedDate, e.SelectedTime }).HasName("pk_booking");

            entity.ToTable("bookings", "booking");

            entity.HasIndex(e => new { e.ProviderId, e.ServiceId, e.SpecialistId, e.SelectedDate }, "ix_booking_bookings_provider_service_specialist_selected_date");

            entity.HasIndex(e => new { e.ProviderId, e.SpecialistId, e.SelectedDate }, "ix_booking_bookings_provider_specialist_selected_date");

            entity.HasIndex(e => e.Id, "uq_bookings_id").IsUnique();

            entity.HasIndex(e => e.UserId, "ux_bookings_one_pending_checkout_per_user")
                .IsUnique()
                .HasFilter("((booking_status)::text = 'Pending'::text)");

            entity.Property(e => e.ProviderId).HasColumnName("provider_id");
            entity.Property(e => e.ServiceId).HasColumnName("service_id");
            entity.Property(e => e.SpecialistId).HasColumnName("specialist_id");
            entity.Property(e => e.SelectedDate).HasColumnName("selected_date");
            entity.Property(e => e.SelectedTime)
                .HasColumnType("time without time zone")
                .HasColumnName("selected_time");
            entity.Property(e => e.AddOns)
                .HasColumnType("jsonb")
                .HasColumnName("add_ons");
            entity.Property(e => e.AdditionalServices)
                .HasColumnType("jsonb")
                .HasColumnName("additional_services");
            entity.Property(e => e.BookingStatus)
                .HasMaxLength(30)
                .HasDefaultValueSql("'Confirmed'::character varying")
                .HasColumnName("booking_status");
            entity.Property(e => e.ConfirmationCode)
                .HasMaxLength(100)
                .HasColumnName("confirmation_code");
            entity.Property(e => e.CreateDate)
                .HasDefaultValueSql("now()")
                .HasColumnName("create_date");
            entity.Property(e => e.Id)
                .HasDefaultValueSql("uuid_generate_v4()")
                .HasColumnName("id");
            entity.Property(e => e.LastModifiedDate)
                .HasDefaultValueSql("now()")
                .HasColumnName("last_modified_date");
            entity.Property(e => e.PaymentMethod).HasColumnName("payment_method");
            entity.Property(e => e.PaymentStatus)
                .HasMaxLength(50)
                .HasColumnName("payment_status");
            entity.Property(e => e.SelectedDateFrom)
                .HasColumnType("time without time zone")
                .HasColumnName("selected_date_from");
            entity.Property(e => e.SelectedDateTo)
                .HasColumnType("time without time zone")
                .HasColumnName("selected_date_to");
            entity.Property(e => e.SelectedTimeFrom)
                .HasColumnType("time without time zone")
                .HasColumnName("selected_time_from");
            entity.Property(e => e.SelectedTimeTo)
                .HasColumnType("time without time zone")
                .HasColumnName("selected_time_to");
            entity.Property(e => e.UploadFiles)
                .HasColumnType("jsonb")
                .HasColumnName("upload_files");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.Provider).WithMany(p => p.Bookings)
                .HasForeignKey(d => d.ProviderId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_booking_bookings_service_providers_provider_id");

            entity.HasOne(d => d.Service).WithMany(p => p.Bookings)
                .HasForeignKey(d => d.ServiceId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_booking_bookings_provider_services_service_id");

            entity.HasOne(d => d.Specialist).WithMany(p => p.Bookings)
                .HasForeignKey(d => d.SpecialistId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_booking_bookings_staff_specialist_id");
        });

        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("pk_categories");

            entity.ToTable("categories", "category");

            entity.HasIndex(e => e.ParentId, "ix_categories_parent_id");

            entity.Property(e => e.Id)
                .ValueGeneratedNever()
                .HasColumnName("id");
            entity.Property(e => e.CreateDate)
                .HasDefaultValueSql("now()")
                .HasColumnName("create_date");
            entity.Property(e => e.DescriptionTranslations)
                .HasColumnType("jsonb")
                .HasColumnName("description_translations");
            entity.Property(e => e.DisplayOrder)
                .HasDefaultValue(0)
                .HasColumnName("display_order");
            entity.Property(e => e.Gradient)
                .HasMaxLength(100)
                .HasColumnName("gradient");
            entity.Property(e => e.GroupId).HasColumnName("group_id");
            entity.Property(e => e.Icon).HasColumnName("icon");
            entity.Property(e => e.IconUrl)
                .HasMaxLength(250)
                .HasColumnName("icon_url");
            entity.Property(e => e.ImageUrl).HasColumnName("image_url");
            entity.Property(e => e.IsActive).HasColumnName("is_active");
            entity.Property(e => e.LastModifiedDate)
                .HasDefaultValueSql("now()")
                .HasColumnName("last_modified_date");
            entity.Property(e => e.NameTranslations)
                .HasColumnType("jsonb")
                .HasColumnName("name_translations");
            entity.Property(e => e.ParentId).HasColumnName("parent_id");

            entity.HasOne(d => d.Group).WithMany(p => p.Categories)
                .HasForeignKey(d => d.GroupId)
                .HasConstraintName("categories_group_id_fkey");

            entity.HasOne(d => d.Parent).WithMany(p => p.InverseParent)
                .HasForeignKey(d => d.ParentId)
                .HasConstraintName("fk_categories_categories_parent_id");
        });

        modelBuilder.Entity<CategoryGroup>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("category_groups_pkey");

            entity.ToTable("category_groups", "category");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Title)
                .HasMaxLength(200)
                .HasColumnName("title");
        });

        modelBuilder.Entity<Consulting>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("pk_consultings");

            entity.ToTable("consultings", "customer");

            entity.HasIndex(e => e.CategoryId, "ix_consultings_category_id");

            entity.HasIndex(e => e.CustomerId, "ix_consultings_customer_id");

            entity.Property(e => e.Id)
                .ValueGeneratedNever()
                .HasColumnName("id");
            entity.Property(e => e.CategoryId).HasColumnName("category_id");
            entity.Property(e => e.CategoryName)
                .HasMaxLength(250)
                .HasDefaultValueSql("''::character varying")
                .HasColumnName("category_name");
            entity.Property(e => e.CreateDate)
                .HasDefaultValueSql("now()")
                .HasColumnName("create_date");
            entity.Property(e => e.CustomerId).HasColumnName("customer_id");
            entity.Property(e => e.Description)
                .HasMaxLength(2000)
                .HasColumnName("description");
            entity.Property(e => e.LastModifiedDate)
                .HasDefaultValueSql("now()")
                .HasColumnName("last_modified_date");

            entity.HasOne(d => d.Customer).WithMany(p => p.Consultings)
                .HasForeignKey(d => d.CustomerId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("fk_consultings_customers_customer_id");
        });

        modelBuilder.Entity<ConsultingSelectedDocumentReference>(entity =>
        {
            entity.HasKey(e => new { e.ConsultingId, e.CustomerDocumentId }).HasName("pk_consulting_selected_document_references");

            entity.ToTable("consulting_selected_document_references", "customer");

            entity.Property(e => e.ConsultingId).HasColumnName("consulting_id");
            entity.Property(e => e.CustomerDocumentId).HasColumnName("customer_document_id");

            entity.HasOne(d => d.Consulting).WithMany(p => p.ConsultingSelectedDocumentReferences)
                .HasForeignKey(d => d.ConsultingId)
                .HasConstraintName("fk_consulting_selected_document_references_consultings_consult");
        });

        modelBuilder.Entity<Currency>(entity =>
        {
            entity
                .HasNoKey()
                .ToTable("Currency", "category");

            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.Price).HasColumnType("money");
            entity.Property(e => e.Symbol).HasColumnType("character varying");
        });

        modelBuilder.Entity<Currency1>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("pk_currencies");

            entity.ToTable("currencies", "category");

            entity.Property(e => e.Id)
                .ValueGeneratedNever()
                .HasColumnName("id");
            entity.Property(e => e.CreateDate)
                .HasDefaultValueSql("now()")
                .HasColumnName("create_date");
            entity.Property(e => e.LastModifiedDate)
                .HasDefaultValueSql("now()")
                .HasColumnName("last_modified_date");
            entity.Property(e => e.Name)
                .HasDefaultValueSql("''::text")
                .HasColumnName("name");
            entity.Property(e => e.Price).HasColumnName("price");
            entity.Property(e => e.Symbol).HasColumnName("symbol");
        });

        modelBuilder.Entity<Customer>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("pk_customers");

            entity.ToTable("customers", "customer");

            entity.HasIndex(e => e.Email, "ix_customers_email").IsUnique();

            entity.HasIndex(e => new { e.PhoneNumber, e.PhoneNumberCountryCode }, "ix_customers_phone_number_phone_number_country_code").IsUnique();

            entity.Property(e => e.Id)
                .ValueGeneratedNever()
                .HasColumnName("id");
            entity.Property(e => e.BirthDate).HasColumnName("birth_date");
            entity.Property(e => e.City)
                .HasMaxLength(15)
                .HasColumnName("city");
            entity.Property(e => e.Country)
                .HasMaxLength(15)
                .HasColumnName("country");
            entity.Property(e => e.CreateDate)
                .HasDefaultValueSql("now()")
                .HasColumnName("create_date");
            entity.Property(e => e.DetailTranslations)
                .HasColumnType("jsonb")
                .HasColumnName("detail_translations");
            entity.Property(e => e.Email)
                .HasMaxLength(250)
                .HasColumnName("email");
            entity.Property(e => e.FirstName)
                .HasMaxLength(100)
                .HasColumnName("first_name");
            entity.Property(e => e.Gender)
                .HasMaxLength(25)
                .HasColumnName("gender");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.LastModifiedDate)
                .HasDefaultValueSql("now()")
                .HasColumnName("last_modified_date");
            entity.Property(e => e.LastName)
                .HasMaxLength(50)
                .HasColumnName("last_name");
            entity.Property(e => e.Latitude)
                .HasPrecision(10, 7)
                .HasColumnName("latitude");
            entity.Property(e => e.Longitude)
                .HasPrecision(10, 7)
                .HasColumnName("longitude");
            entity.Property(e => e.PhoneNumber)
                .HasMaxLength(15)
                .HasColumnName("phone_number");
            entity.Property(e => e.PhoneNumberCountryCode)
                .HasMaxLength(3)
                .HasColumnName("phone_number_country_code");
            entity.Property(e => e.StreetTranslations)
                .HasColumnType("jsonb")
                .HasColumnName("street_translations");
            entity.Property(e => e.ZipCode)
                .HasMaxLength(50)
                .HasColumnName("zip_code");
        });

        modelBuilder.Entity<CustomerDocument>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("pk_customer_documents");

            entity.ToTable("customer_documents", "customer");

            entity.HasIndex(e => e.CustomerId, "ix_customer_documents_customer_id");

            entity.HasIndex(e => e.DocumentTypeId, "ix_customer_documents_document_type_id");

            entity.Property(e => e.Id)
                .ValueGeneratedNever()
                .HasColumnName("id");
            entity.Property(e => e.CreateDate).HasColumnName("create_date");
            entity.Property(e => e.CustomerId).HasColumnName("customer_id");
            entity.Property(e => e.DocumentTypeId).HasColumnName("document_type_id");
            entity.Property(e => e.DocumentUrl)
                .HasMaxLength(250)
                .HasColumnName("document_url");
            entity.Property(e => e.LastModifiedDate).HasColumnName("last_modified_date");

            entity.HasOne(d => d.Customer).WithMany(p => p.CustomerDocuments)
                .HasForeignKey(d => d.CustomerId)
                .HasConstraintName("fk_customer_documents_customers_customer_id");

            entity.HasOne(d => d.DocumentType).WithMany(p => p.CustomerDocuments)
                .HasForeignKey(d => d.DocumentTypeId)
                .HasConstraintName("fk_customer_documents_customer_document_types_document_type_id");
        });

        modelBuilder.Entity<CustomerDocumentType>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("pk_customer_document_types");

            entity.ToTable("customer_document_types", "customer");

            entity.Property(e => e.Id)
                .ValueGeneratedNever()
                .HasColumnName("id");
            entity.Property(e => e.Name)
                .HasMaxLength(25)
                .HasColumnName("name");
        });

        modelBuilder.Entity<EmailVerificationCode>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("pk_email_verification_codes");

            entity.ToTable("email_verification_codes", "identity");

            entity.Property(e => e.Id)
                .ValueGeneratedNever()
                .HasColumnName("id");
            entity.Property(e => e.Code)
                .HasMaxLength(6)
                .IsFixedLength()
                .HasColumnName("code");
            entity.Property(e => e.Email)
                .HasMaxLength(250)
                .HasColumnName("email");
            entity.Property(e => e.SentAt).HasColumnName("sent_at");
            entity.Property(e => e.UsedAt).HasColumnName("used_at");
        });

        modelBuilder.Entity<Favorite>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("favorites_pkey");

            entity.ToTable("favorites", "customer");

            entity.HasIndex(e => e.CustomerId, "ix_favorites_customer_id");

            entity.HasIndex(e => e.EntityId, "ix_favorites_entity");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnName("created_at");
            entity.Property(e => e.CustomerId).HasColumnName("customer_id");
            entity.Property(e => e.EntityId).HasColumnName("entity_id");

            entity.HasOne(d => d.Customer).WithMany(p => p.Favorites)
                .HasForeignKey(d => d.CustomerId)
                .HasConstraintName("fk_favorites_customer");
        });

        modelBuilder.Entity<InboxMessage>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("pk_inbox_messages");

            entity.ToTable("inbox_messages", "category");

            entity.HasIndex(e => e.OccurredOnUtc, "idx_inbox_messages_occurred_on");

            entity.HasIndex(e => new { e.ProcessedOnUtc, e.OccurredOnUtc }, "idx_inbox_messages_processed_occurred");

            entity.HasIndex(e => e.ProcessedOnUtc, "idx_inbox_messages_processed_on");

            entity.HasIndex(e => new { e.OccurredOnUtc, e.ProcessedOnUtc }, "idx_inbox_messages_unprocessed").HasFilter("(processed_on_utc IS NULL)");

            entity.Property(e => e.Id)
                .ValueGeneratedNever()
                .HasColumnName("id");
            entity.Property(e => e.Content)
                .HasColumnType("jsonb")
                .HasColumnName("content");
            entity.Property(e => e.Error).HasColumnName("error");
            entity.Property(e => e.OccurredOnUtc).HasColumnName("occurred_on_utc");
            entity.Property(e => e.ProcessedOnUtc).HasColumnName("processed_on_utc");
            entity.Property(e => e.Type)
                .HasMaxLength(250)
                .HasColumnName("type");
        });

        modelBuilder.Entity<InboxMessage1>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("pk_inbox_messages");

            entity.ToTable("inbox_messages", "customer");

            entity.HasIndex(e => e.OccurredOnUtc, "idx_inbox_messages_occurred_on");

            entity.HasIndex(e => new { e.ProcessedOnUtc, e.OccurredOnUtc }, "idx_inbox_messages_processed_occurred");

            entity.HasIndex(e => e.ProcessedOnUtc, "idx_inbox_messages_processed_on");

            entity.HasIndex(e => new { e.OccurredOnUtc, e.ProcessedOnUtc }, "idx_inbox_messages_unprocessed").HasFilter("(processed_on_utc IS NULL)");

            entity.Property(e => e.Id)
                .ValueGeneratedNever()
                .HasColumnName("id");
            entity.Property(e => e.Content)
                .HasColumnType("jsonb")
                .HasColumnName("content");
            entity.Property(e => e.Error).HasColumnName("error");
            entity.Property(e => e.OccurredOnUtc).HasColumnName("occurred_on_utc");
            entity.Property(e => e.ProcessedOnUtc).HasColumnName("processed_on_utc");
            entity.Property(e => e.Type)
                .HasMaxLength(250)
                .HasColumnName("type");
        });

        modelBuilder.Entity<InboxMessage2>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("pk_inbox_messages");

            entity.ToTable("inbox_messages", "identity");

            entity.HasIndex(e => e.OccurredOnUtc, "idx_inbox_messages_occurred_on");

            entity.HasIndex(e => new { e.ProcessedOnUtc, e.OccurredOnUtc }, "idx_inbox_messages_processed_occurred");

            entity.HasIndex(e => e.ProcessedOnUtc, "idx_inbox_messages_processed_on");

            entity.HasIndex(e => new { e.OccurredOnUtc, e.ProcessedOnUtc }, "idx_inbox_messages_unprocessed").HasFilter("(processed_on_utc IS NULL)");

            entity.Property(e => e.Id)
                .ValueGeneratedNever()
                .HasColumnName("id");
            entity.Property(e => e.Content)
                .HasColumnType("jsonb")
                .HasColumnName("content");
            entity.Property(e => e.Error).HasColumnName("error");
            entity.Property(e => e.OccurredOnUtc).HasColumnName("occurred_on_utc");
            entity.Property(e => e.ProcessedOnUtc).HasColumnName("processed_on_utc");
            entity.Property(e => e.Type)
                .HasMaxLength(250)
                .HasColumnName("type");
        });

        modelBuilder.Entity<InboxMessageConsumer>(entity =>
        {
            entity.HasKey(e => new { e.MessageId, e.Name }).HasName("pk_inbox_message_consumers");

            entity.ToTable("inbox_message_consumers", "identity");

            entity.HasIndex(e => new { e.MessageId, e.Name }, "inbox_message_consumers_message_id_name");

            entity.Property(e => e.MessageId).HasColumnName("message_id");
            entity.Property(e => e.Name)
                .HasMaxLength(500)
                .HasColumnName("name");
        });

        modelBuilder.Entity<InboxMessageConsumer1>(entity =>
        {
            entity.HasKey(e => new { e.MessageId, e.Name }).HasName("pk_inbox_message_consumers");

            entity.ToTable("inbox_message_consumers", "customer");

            entity.HasIndex(e => new { e.MessageId, e.Name }, "inbox_message_consumers_message_id_name");

            entity.Property(e => e.MessageId).HasColumnName("message_id");
            entity.Property(e => e.Name)
                .HasMaxLength(500)
                .HasColumnName("name");
        });

        modelBuilder.Entity<InboxMessageConsumer2>(entity =>
        {
            entity.HasKey(e => new { e.MessageId, e.Name }).HasName("pk_inbox_message_consumers");

            entity.ToTable("inbox_message_consumers", "category");

            entity.HasIndex(e => new { e.MessageId, e.Name }, "inbox_message_consumers_message_id_name");

            entity.Property(e => e.MessageId).HasColumnName("message_id");
            entity.Property(e => e.Name)
                .HasMaxLength(500)
                .HasColumnName("name");
        });

        modelBuilder.Entity<InternalCommandMessage>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("pk_internal_command_messages");

            entity.ToTable("internal_command_messages", "identity");

            entity.HasIndex(e => e.OccurredOnUtc, "idx_internal_command_messages_occurred_on");

            entity.HasIndex(e => new { e.ProcessedOnUtc, e.OccurredOnUtc }, "idx_internal_command_messages_processed_occurred");

            entity.HasIndex(e => e.ProcessedOnUtc, "idx_internal_command_messages_processed_on");

            entity.HasIndex(e => new { e.OccurredOnUtc, e.ProcessedOnUtc }, "idx_internal_command_messages_unprocessed").HasFilter("(processed_on_utc IS NULL)");

            entity.Property(e => e.Id)
                .ValueGeneratedNever()
                .HasColumnName("id");
            entity.Property(e => e.Content)
                .HasColumnType("jsonb")
                .HasColumnName("content");
            entity.Property(e => e.Error).HasColumnName("error");
            entity.Property(e => e.OccurredOnUtc).HasColumnName("occurred_on_utc");
            entity.Property(e => e.ProcessedOnUtc).HasColumnName("processed_on_utc");
            entity.Property(e => e.Type)
                .HasMaxLength(250)
                .HasColumnName("type");
        });

        modelBuilder.Entity<InternalCommandMessage1>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("pk_internal_command_messages");

            entity.ToTable("internal_command_messages", "customer");

            entity.HasIndex(e => e.OccurredOnUtc, "idx_internal_command_messages_occurred_on");

            entity.HasIndex(e => new { e.ProcessedOnUtc, e.OccurredOnUtc }, "idx_internal_command_messages_processed_occurred");

            entity.HasIndex(e => e.ProcessedOnUtc, "idx_internal_command_messages_processed_on");

            entity.HasIndex(e => new { e.OccurredOnUtc, e.ProcessedOnUtc }, "idx_internal_command_messages_unprocessed").HasFilter("(processed_on_utc IS NULL)");

            entity.Property(e => e.Id)
                .ValueGeneratedNever()
                .HasColumnName("id");
            entity.Property(e => e.Content)
                .HasColumnType("jsonb")
                .HasColumnName("content");
            entity.Property(e => e.Error).HasColumnName("error");
            entity.Property(e => e.OccurredOnUtc).HasColumnName("occurred_on_utc");
            entity.Property(e => e.ProcessedOnUtc).HasColumnName("processed_on_utc");
            entity.Property(e => e.Type)
                .HasMaxLength(250)
                .HasColumnName("type");
        });

        modelBuilder.Entity<InternalCommandMessage2>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("pk_internal_command_messages");

            entity.ToTable("internal_command_messages", "category");

            entity.HasIndex(e => e.OccurredOnUtc, "idx_internal_command_messages_occurred_on");

            entity.HasIndex(e => new { e.ProcessedOnUtc, e.OccurredOnUtc }, "idx_internal_command_messages_processed_occurred");

            entity.HasIndex(e => e.ProcessedOnUtc, "idx_internal_command_messages_processed_on");

            entity.HasIndex(e => new { e.OccurredOnUtc, e.ProcessedOnUtc }, "idx_internal_command_messages_unprocessed").HasFilter("(processed_on_utc IS NULL)");

            entity.Property(e => e.Id)
                .ValueGeneratedNever()
                .HasColumnName("id");
            entity.Property(e => e.Content)
                .HasColumnType("jsonb")
                .HasColumnName("content");
            entity.Property(e => e.Error).HasColumnName("error");
            entity.Property(e => e.OccurredOnUtc).HasColumnName("occurred_on_utc");
            entity.Property(e => e.ProcessedOnUtc).HasColumnName("processed_on_utc");
            entity.Property(e => e.Type)
                .HasMaxLength(250)
                .HasColumnName("type");
        });

        modelBuilder.Entity<InternalCommandMessageConsumer>(entity =>
        {
            entity.HasKey(e => new { e.MessageId, e.Name }).HasName("pk_internal_command_message_consumers");

            entity.ToTable("internal_command_message_consumers", "category");

            entity.HasIndex(e => new { e.MessageId, e.Name }, "internal_command_message_consumers_message_id_name");

            entity.Property(e => e.MessageId).HasColumnName("message_id");
            entity.Property(e => e.Name)
                .HasMaxLength(500)
                .HasColumnName("name");
        });

        modelBuilder.Entity<InternalCommandMessageConsumer1>(entity =>
        {
            entity.HasKey(e => new { e.MessageId, e.Name }).HasName("pk_internal_command_message_consumers");

            entity.ToTable("internal_command_message_consumers", "identity");

            entity.HasIndex(e => new { e.MessageId, e.Name }, "internal_command_message_consumers_message_id_name");

            entity.Property(e => e.MessageId).HasColumnName("message_id");
            entity.Property(e => e.Name)
                .HasMaxLength(500)
                .HasColumnName("name");
        });

        modelBuilder.Entity<InternalCommandMessageConsumer2>(entity =>
        {
            entity.HasKey(e => new { e.MessageId, e.Name }).HasName("pk_internal_command_message_consumers");

            entity.ToTable("internal_command_message_consumers", "customer");

            entity.HasIndex(e => new { e.MessageId, e.Name }, "internal_command_message_consumers_message_id_name");

            entity.Property(e => e.MessageId).HasColumnName("message_id");
            entity.Property(e => e.Name)
                .HasMaxLength(500)
                .HasColumnName("name");
        });

        modelBuilder.Entity<Location>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("pk_locations");

            entity.ToTable("locations", "category");

            entity.HasIndex(e => e.Code, "ix_locations_code");

            entity.HasIndex(e => e.LocationTypeId, "ix_locations_location_type_id");

            entity.HasIndex(e => e.ParentId, "ix_locations_parent_id");

            entity.HasIndex(e => new { e.ParentId, e.Code }, "ux_locations_city_parent_code")
                .IsUnique()
                .HasFilter("(location_type_id = 2)");

            entity.HasIndex(e => e.Code, "ux_locations_country_code")
                .IsUnique()
                .HasFilter("(location_type_id = 1)");

            entity.Property(e => e.Id)
                .ValueGeneratedNever()
                .HasColumnName("id");
            entity.Property(e => e.Code)
                .HasMaxLength(10)
                .HasColumnName("code");
            entity.Property(e => e.CreateDate)
                .HasDefaultValueSql("now()")
                .HasColumnName("create_date");
            entity.Property(e => e.DisplayOrder).HasColumnName("display_order");
            entity.Property(e => e.LastModifiedDate)
                .HasDefaultValueSql("now()")
                .HasColumnName("last_modified_date");
            entity.Property(e => e.LocationTypeId).HasColumnName("location_type_id");
            entity.Property(e => e.ParentId).HasColumnName("parent_id");
            entity.Property(e => e.ValueTranslations)
                .HasColumnType("jsonb")
                .HasColumnName("value_translations");

            entity.HasOne(d => d.LocationType).WithMany(p => p.Locations)
                .HasForeignKey(d => d.LocationTypeId)
                .HasConstraintName("fk_locations_location_type_location_type_id");

            entity.HasOne(d => d.Parent).WithMany(p => p.InverseParent)
                .HasForeignKey(d => d.ParentId)
                .HasConstraintName("fk_locations_locations_parent_id");
        });

        modelBuilder.Entity<LocationType>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("pk_location_type");

            entity.ToTable("LocationType", "category");

            entity.Property(e => e.Id)
                .ValueGeneratedNever()
                .HasColumnName("id");
            entity.Property(e => e.Name)
                .HasMaxLength(50)
                .HasColumnName("name");
        });

        modelBuilder.Entity<Offer>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("offers_pkey");

            entity.ToTable("offers", "marketing");

            entity.HasIndex(e => new { e.IsActive, e.ValidUntil }, "idx_offers_active");

            entity.HasIndex(e => e.ProviderServiceId, "idx_offers_provider_service");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Code)
                .HasMaxLength(50)
                .HasColumnName("code");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnName("created_at");
            entity.Property(e => e.DiscountPercent)
                .HasPrecision(5, 2)
                .HasColumnName("discount_percent");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.IsFeatured)
                .HasDefaultValue(false)
                .HasColumnName("is_featured");
            entity.Property(e => e.ProviderServiceId).HasColumnName("provider_service_id");
            entity.Property(e => e.Subtitle).HasColumnName("subtitle");
            entity.Property(e => e.Title).HasColumnName("title");
            entity.Property(e => e.UsageLimit).HasColumnName("usage_limit");
            entity.Property(e => e.UsedCount)
                .HasDefaultValue(0)
                .HasColumnName("used_count");
            entity.Property(e => e.ValidUntil).HasColumnName("valid_until");

            entity.HasOne(d => d.ProviderService).WithMany(p => p.Offers)
                .HasForeignKey(d => d.ProviderServiceId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("offers_provider_service_id_fkey");
        });

        modelBuilder.Entity<OutboxMessage>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("pk_outbox_messages");

            entity.ToTable("outbox_messages", "customer");

            entity.HasIndex(e => e.OccurredOnUtc, "idx_outbox_messages_occurred_on");

            entity.HasIndex(e => new { e.ProcessedOnUtc, e.OccurredOnUtc }, "idx_outbox_messages_processed_occurred");

            entity.HasIndex(e => e.ProcessedOnUtc, "idx_outbox_messages_processed_on");

            entity.HasIndex(e => new { e.OccurredOnUtc, e.ProcessedOnUtc }, "idx_outbox_messages_unprocessed").HasFilter("(processed_on_utc IS NULL)");

            entity.Property(e => e.Id)
                .ValueGeneratedNever()
                .HasColumnName("id");
            entity.Property(e => e.Content)
                .HasColumnType("jsonb")
                .HasColumnName("content");
            entity.Property(e => e.Error).HasColumnName("error");
            entity.Property(e => e.OccurredOnUtc).HasColumnName("occurred_on_utc");
            entity.Property(e => e.ProcessedOnUtc).HasColumnName("processed_on_utc");
            entity.Property(e => e.Type)
                .HasMaxLength(250)
                .HasColumnName("type");
        });

        modelBuilder.Entity<OutboxMessage1>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("pk_outbox_messages");

            entity.ToTable("outbox_messages", "category");

            entity.HasIndex(e => e.OccurredOnUtc, "idx_outbox_messages_occurred_on");

            entity.HasIndex(e => new { e.ProcessedOnUtc, e.OccurredOnUtc }, "idx_outbox_messages_processed_occurred");

            entity.HasIndex(e => e.ProcessedOnUtc, "idx_outbox_messages_processed_on");

            entity.HasIndex(e => new { e.OccurredOnUtc, e.ProcessedOnUtc }, "idx_outbox_messages_unprocessed").HasFilter("(processed_on_utc IS NULL)");

            entity.Property(e => e.Id)
                .ValueGeneratedNever()
                .HasColumnName("id");
            entity.Property(e => e.Content)
                .HasColumnType("jsonb")
                .HasColumnName("content");
            entity.Property(e => e.Error).HasColumnName("error");
            entity.Property(e => e.OccurredOnUtc).HasColumnName("occurred_on_utc");
            entity.Property(e => e.ProcessedOnUtc).HasColumnName("processed_on_utc");
            entity.Property(e => e.Type)
                .HasMaxLength(250)
                .HasColumnName("type");
        });

        modelBuilder.Entity<OutboxMessage2>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("pk_outbox_messages");

            entity.ToTable("outbox_messages", "identity");

            entity.HasIndex(e => e.OccurredOnUtc, "idx_outbox_messages_occurred_on");

            entity.HasIndex(e => new { e.ProcessedOnUtc, e.OccurredOnUtc }, "idx_outbox_messages_processed_occurred");

            entity.HasIndex(e => e.ProcessedOnUtc, "idx_outbox_messages_processed_on");

            entity.HasIndex(e => new { e.OccurredOnUtc, e.ProcessedOnUtc }, "idx_outbox_messages_unprocessed").HasFilter("(processed_on_utc IS NULL)");

            entity.Property(e => e.Id)
                .ValueGeneratedNever()
                .HasColumnName("id");
            entity.Property(e => e.Content)
                .HasColumnType("jsonb")
                .HasColumnName("content");
            entity.Property(e => e.Error).HasColumnName("error");
            entity.Property(e => e.OccurredOnUtc).HasColumnName("occurred_on_utc");
            entity.Property(e => e.ProcessedOnUtc).HasColumnName("processed_on_utc");
            entity.Property(e => e.Type)
                .HasMaxLength(250)
                .HasColumnName("type");
        });

        modelBuilder.Entity<OutboxMessageConsumer>(entity =>
        {
            entity.HasKey(e => new { e.MessageId, e.Name }).HasName("pk_outbox_message_consumers");

            entity.ToTable("outbox_message_consumers", "identity");

            entity.HasIndex(e => new { e.MessageId, e.Name }, "outbox_message_consumers_message_id_name");

            entity.Property(e => e.MessageId).HasColumnName("message_id");
            entity.Property(e => e.Name)
                .HasMaxLength(500)
                .HasColumnName("name");
        });

        modelBuilder.Entity<OutboxMessageConsumer1>(entity =>
        {
            entity.HasKey(e => new { e.MessageId, e.Name }).HasName("pk_outbox_message_consumers");

            entity.ToTable("outbox_message_consumers", "customer");

            entity.HasIndex(e => new { e.MessageId, e.Name }, "outbox_message_consumers_message_id_name");

            entity.Property(e => e.MessageId).HasColumnName("message_id");
            entity.Property(e => e.Name)
                .HasMaxLength(500)
                .HasColumnName("name");
        });

        modelBuilder.Entity<OutboxMessageConsumer2>(entity =>
        {
            entity.HasKey(e => new { e.MessageId, e.Name }).HasName("pk_outbox_message_consumers");

            entity.ToTable("outbox_message_consumers", "category");

            entity.HasIndex(e => new { e.MessageId, e.Name }, "outbox_message_consumers_message_id_name");

            entity.Property(e => e.MessageId).HasColumnName("message_id");
            entity.Property(e => e.Name)
                .HasMaxLength(500)
                .HasColumnName("name");
        });

        modelBuilder.Entity<PasswordResetCode>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("pk_password_reset_codes");

            entity.ToTable("password_reset_codes", "identity");

            entity.Property(e => e.Id)
                .ValueGeneratedNever()
                .HasColumnName("id");
            entity.Property(e => e.Code)
                .HasMaxLength(6)
                .HasColumnName("code");
            entity.Property(e => e.Email)
                .HasMaxLength(250)
                .HasColumnName("email");
            entity.Property(e => e.SentAt).HasColumnName("sent_at");
            entity.Property(e => e.UsedAt).HasColumnName("used_at");
        });

        modelBuilder.Entity<PhoneLoginCode>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("pk_phone_login_codes");

            entity.ToTable("phone_login_codes", "identity");

            entity.HasIndex(e => e.ExpiresAt, "ix_phone_login_codes_expires_at");

            entity.HasIndex(e => e.UserId, "ix_phone_login_codes_user_id");

            entity.HasIndex(e => new { e.UserId, e.IsInvalidated, e.ExpiresAt }, "ix_phone_login_codes_user_id_is_invalidated_expires_at");

            entity.Property(e => e.Id)
                .ValueGeneratedNever()
                .HasColumnName("id");
            entity.Property(e => e.AttemptCount)
                .HasDefaultValue(0)
                .HasColumnName("attempt_count");
            entity.Property(e => e.Code)
                .HasMaxLength(6)
                .IsFixedLength()
                .HasColumnName("code");
            entity.Property(e => e.ExpiresAt).HasColumnName("expires_at");
            entity.Property(e => e.IsInvalidated)
                .HasDefaultValue(false)
                .HasColumnName("is_invalidated");
            entity.Property(e => e.PhoneNumber)
                .HasMaxLength(15)
                .HasColumnName("phone_number");
            entity.Property(e => e.PhoneNumberCountryCode)
                .HasMaxLength(3)
                .HasColumnName("phone_number_country_code");
            entity.Property(e => e.SentAt).HasColumnName("sent_at");
            entity.Property(e => e.UsedAt).HasColumnName("used_at");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.User).WithMany(p => p.PhoneLoginCodes)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("fk_phone_login_codes_asp_net_users_user_id");
        });

        modelBuilder.Entity<ProviderAttribute>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("pk_provider_attributes");

            entity.ToTable("provider_attributes", "category");

            entity.HasIndex(e => e.AttributeDefinitionId, "ix_provider_attributes_attribute_definition_id");

            entity.HasIndex(e => new { e.ServiceProviderId, e.AttributeDefinitionId }, "ix_provider_attributes_service_provider_id_attribute_definitio").IsUnique();

            entity.Property(e => e.Id)
                .ValueGeneratedNever()
                .HasColumnName("id");
            entity.Property(e => e.AttributeDefinitionId).HasColumnName("attribute_definition_id");
            entity.Property(e => e.CreateDate).HasColumnName("create_date");
            entity.Property(e => e.LastModifiedDate).HasColumnName("last_modified_date");
            entity.Property(e => e.ServiceProviderId).HasColumnName("service_provider_id");
            entity.Property(e => e.ValueTranslations)
                .HasColumnType("jsonb")
                .HasColumnName("value_translations");

            entity.HasOne(d => d.ServiceProvider).WithMany(p => p.ProviderAttributes)
                .HasForeignKey(d => d.ServiceProviderId)
                .HasConstraintName("fk_provider_attributes_service_providers_service_provider_id");
        });

        modelBuilder.Entity<ProviderAttributeDefinition>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("pk_provider_attribute_definitions");

            entity.ToTable("provider_attribute_definitions", "category");

            entity.HasIndex(e => e.AttributeTypeId, "ix_provider_attribute_definitions_attribute_type_id");

            entity.HasIndex(e => e.ProviderTypeId, "ix_provider_attribute_definitions_provider_type_id");

            entity.Property(e => e.Id)
                .ValueGeneratedNever()
                .HasColumnName("id");
            entity.Property(e => e.AttributeTypeId).HasColumnName("attribute_type_id");
            entity.Property(e => e.CreateDate).HasColumnName("create_date");
            entity.Property(e => e.DescriptionTranslations)
                .HasColumnType("jsonb")
                .HasColumnName("description_translations");
            entity.Property(e => e.IsRequired).HasColumnName("is_required");
            entity.Property(e => e.LastModifiedDate).HasColumnName("last_modified_date");
            entity.Property(e => e.NameTranslations)
                .HasColumnType("jsonb")
                .HasColumnName("name_translations");
            entity.Property(e => e.ProviderTypeId).HasColumnName("provider_type_id");
            entity.Property(e => e.ValidationRules)
                .HasMaxLength(250)
                .HasColumnName("validation_rules");

            entity.HasOne(d => d.AttributeType).WithMany(p => p.ProviderAttributeDefinitions)
                .HasForeignKey(d => d.AttributeTypeId)
                .HasConstraintName("fk_provider_attribute_definitions_attribute_types_attribute_ty");

            entity.HasOne(d => d.ProviderType).WithMany(p => p.ProviderAttributeDefinitions)
                .HasForeignKey(d => d.ProviderTypeId)
                .HasConstraintName("fk_provider_attribute_definitions_provider_types_provider_type");
        });

        modelBuilder.Entity<ProviderAttributeDefinitionDomainOption>(entity =>
        {
            entity.HasKey(e => new { e.ProviderAttributeDefinitionId, e.Id }).HasName("pk_provider_attribute_definition_domain_options");

            entity.ToTable("provider_attribute_definition_domain_options", "category");

            entity.Property(e => e.ProviderAttributeDefinitionId).HasColumnName("provider_attribute_definition_id");
            entity.Property(e => e.Id)
                .ValueGeneratedOnAdd()
                .HasColumnName("id");
            entity.Property(e => e.DisplayNameTranslations)
                .HasColumnType("jsonb")
                .HasColumnName("display_name_translations");
            entity.Property(e => e.ValueTranslations)
                .HasColumnType("jsonb")
                .HasColumnName("value_translations");

            entity.HasOne(d => d.ProviderAttributeDefinition).WithMany(p => p.ProviderAttributeDefinitionDomainOptions)
                .HasForeignKey(d => d.ProviderAttributeDefinitionId)
                .HasConstraintName("fk_provider_attribute_definition_domain_options_provider_attri");
        });

        modelBuilder.Entity<ProviderCertification>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("provider_certifications_pkey");

            entity.ToTable("provider_certifications", "category");

            entity.Property(e => e.Id)
                .HasDefaultValueSql("uuid_generate_v4()")
                .HasColumnName("id");
            entity.Property(e => e.IsVerified)
                .HasDefaultValue(false)
                .HasColumnName("is_verified");
            entity.Property(e => e.Name)
                .HasMaxLength(200)
                .HasColumnName("name");
            entity.Property(e => e.ServiceProviderId).HasColumnName("service_provider_id");
        });

        modelBuilder.Entity<ProviderGalleryItem>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("pk_provider_gallery_items");

            entity.ToTable("provider_gallery_items", "category");

            entity.HasIndex(e => e.DisplayOrder, "ix_provider_gallery_items_display_order");

            entity.HasIndex(e => e.ServiceProviderId, "ix_provider_gallery_items_service_provider_id");

            entity.Property(e => e.Id)
                .ValueGeneratedNever()
                .HasColumnName("id");
            entity.Property(e => e.CreateDate).HasColumnName("create_date");
            entity.Property(e => e.DescriptionTranslations)
                .HasColumnType("jsonb")
                .HasColumnName("description_translations");
            entity.Property(e => e.DisplayOrder).HasColumnName("display_order");
            entity.Property(e => e.LastModifiedDate).HasColumnName("last_modified_date");
            entity.Property(e => e.MediaType)
                .HasMaxLength(50)
                .HasColumnName("media_type");
            entity.Property(e => e.ServiceProviderId).HasColumnName("service_provider_id");
            entity.Property(e => e.TitleTranslations)
                .HasColumnType("jsonb")
                .HasColumnName("title_translations");
            entity.Property(e => e.Url)
                .HasMaxLength(250)
                .HasColumnName("url");

            entity.HasOne(d => d.ServiceProvider).WithMany(p => p.ProviderGalleryItems)
                .HasForeignKey(d => d.ServiceProviderId)
                .HasConstraintName("fk_provider_gallery_items_service_providers_service_provider_id");
        });

        modelBuilder.Entity<ProviderLanguage>(entity =>
        {
            entity.HasKey(e => new { e.ServiceProviderId, e.Language }).HasName("pk_provider_languages");

            entity.ToTable("provider_languages", "category");

            entity.HasIndex(e => e.ServiceProviderId, "ix_provider_languages_service_provider_id");

            entity.Property(e => e.ServiceProviderId).HasColumnName("service_provider_id");
            entity.Property(e => e.Language).HasColumnName("language");
            entity.Property(e => e.CreateDate)
                .HasDefaultValueSql("now()")
                .HasColumnName("create_date");

            entity.HasOne(d => d.ServiceProvider).WithMany(p => p.ProviderLanguages)
                .HasForeignKey(d => d.ServiceProviderId)
                .HasConstraintName("fk_provider_languages_service_provider");
        });

        modelBuilder.Entity<ProviderPolicy>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("pk_provider_policies");

            entity.ToTable("provider_policies", "category");

            entity.HasIndex(e => new { e.ServiceProviderId, e.TypeTranslations }, "ix_provider_policies_service_provider_id_type_translations").IsUnique();

            entity.HasIndex(e => e.TypeTranslations, "ix_provider_policies_type_translations");

            entity.Property(e => e.Id)
                .ValueGeneratedNever()
                .HasColumnName("id");
            entity.Property(e => e.CreateDate).HasColumnName("create_date");
            entity.Property(e => e.DescriptionTranslations)
                .HasColumnType("jsonb")
                .HasColumnName("description_translations");
            entity.Property(e => e.LastModifiedDate).HasColumnName("last_modified_date");
            entity.Property(e => e.ServiceProviderId).HasColumnName("service_provider_id");
            entity.Property(e => e.TypeTranslations)
                .HasColumnType("jsonb")
                .HasColumnName("type_translations");

            entity.HasOne(d => d.ServiceProvider).WithMany(p => p.ProviderPolicies)
                .HasForeignKey(d => d.ServiceProviderId)
                .HasConstraintName("fk_provider_policies_service_providers_service_provider_id");
        });

        modelBuilder.Entity<ProviderRecommendation>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("provider_recommendations_pkey");

            entity.ToTable("provider_recommendations", "category");

            entity.Property(e => e.Id)
                .HasDefaultValueSql("uuid_generate_v4()")
                .HasColumnName("id");
            entity.Property(e => e.CreateDate)
                .HasDefaultValueSql("now()")
                .HasColumnName("create_date");
            entity.Property(e => e.SourceProviderId).HasColumnName("source_provider_id");
            entity.Property(e => e.TargetProviderId).HasColumnName("target_provider_id");
            entity.Property(e => e.Type)
                .HasMaxLength(20)
                .HasColumnName("type");
        });

        modelBuilder.Entity<ProviderService>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("pk_provider_services");

            entity.ToTable("provider_services", "category");

            entity.HasIndex(e => e.SearchVector, "idx_provider_services_search").HasMethod("gin");

            entity.HasIndex(e => e.IsActive, "ix_provider_services_is_active");

            entity.HasIndex(e => e.ServiceDefinitionId, "ix_provider_services_service_definition_id");

            entity.HasIndex(e => new { e.ServiceProviderId, e.ServiceDefinitionId }, "ix_provider_services_service_provider_id_service_definition_id").IsUnique();

            entity.Property(e => e.Id)
                .ValueGeneratedNever()
                .HasColumnName("id");
            entity.Property(e => e.Anesthesia)
                .HasMaxLength(100)
                .HasColumnName("anesthesia");
            entity.Property(e => e.CreateDate).HasColumnName("create_date");
            entity.Property(e => e.Currency)
                .HasMaxLength(15)
                .HasColumnName("currency");
            entity.Property(e => e.DescriptionTranslations)
                .HasColumnType("jsonb")
                .HasColumnName("description_translations");
            entity.Property(e => e.DisplayNameTranslations)
                .HasColumnType("jsonb")
                .HasColumnName("display_name_translations");
            entity.Property(e => e.DurationMinutes)
                .HasDefaultValue(0)
                .HasColumnName("duration_minutes");
            entity.Property(e => e.Growth)
                .HasMaxLength(50)
                .HasColumnName("growth");
            entity.Property(e => e.ImageUrl)
                .HasMaxLength(250)
                .HasColumnName("image_url");
            entity.Property(e => e.IsActive).HasColumnName("is_active");
            entity.Property(e => e.IsPopular)
                .HasDefaultValue(false)
                .HasColumnName("is_popular");
            entity.Property(e => e.LastModifiedDate).HasColumnName("last_modified_date");
            entity.Property(e => e.Rating)
                .HasPrecision(3, 2)
                .HasDefaultValueSql("0")
                .HasColumnName("rating");
            entity.Property(e => e.Recovery)
                .HasMaxLength(100)
                .HasColumnName("recovery");
            entity.Property(e => e.ReviewCount)
                .HasDefaultValue(0)
                .HasColumnName("review_count");
            entity.Property(e => e.Satisfaction)
                .HasMaxLength(50)
                .HasColumnName("satisfaction");
            entity.Property(e => e.SearchVector).HasColumnName("search_vector");
            entity.Property(e => e.ServiceDefinitionId).HasColumnName("service_definition_id");
            entity.Property(e => e.ServiceProviderId).HasColumnName("service_provider_id");
            entity.Property(e => e.SlotIntervalMinutes)
                .HasDefaultValue(15)
                .HasColumnName("slot_interval_minutes");
            entity.Property(e => e.StayRequired)
                .HasMaxLength(100)
                .HasColumnName("stay_required");
            entity.Property(e => e.SuccessRate)
                .HasMaxLength(50)
                .HasColumnName("success_rate");
            entity.Property(e => e.Tags).HasColumnName("tags");
            entity.Property(e => e.TrendingScore)
                .HasDefaultValueSql("0")
                .HasColumnName("trending_score");
            entity.Property(e => e.Value)
                .HasPrecision(18, 2)
                .HasColumnName("value");

            entity.HasOne(d => d.ServiceDefinition).WithMany(p => p.ProviderServices)
                .HasForeignKey(d => d.ServiceDefinitionId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_provider_services_service_definitions_service_definition_id");

            entity.HasOne(d => d.ServiceProvider).WithMany(p => p.ProviderServices)
                .HasForeignKey(d => d.ServiceProviderId)
                .HasConstraintName("fk_provider_services_service_providers_service_provider_id");

            entity.HasMany(d => d.Addons).WithMany(p => p.ProviderServices)
                .UsingEntity<Dictionary<string, object>>(
                    "ProviderServiceAddon",
                    r => r.HasOne<Addon>().WithMany()
                        .HasForeignKey("AddonId")
                        .HasConstraintName("fk_psa_addons"),
                    l => l.HasOne<ProviderService>().WithMany()
                        .HasForeignKey("ProviderServiceId")
                        .HasConstraintName("fk_psa_provider_services"),
                    j =>
                    {
                        j.HasKey("ProviderServiceId", "AddonId").HasName("pk_provider_service_addons");
                        j.ToTable("provider_service_addons", "category");
                        j.HasIndex(new[] { "AddonId" }, "ix_psa_addon_id");
                        j.IndexerProperty<Guid>("ProviderServiceId").HasColumnName("provider_service_id");
                        j.IndexerProperty<string>("AddonId").HasColumnName("addon_id");
                    });
        });

        modelBuilder.Entity<ProviderServiceGalleryItem>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("pk_provider_service_gallery_items");

            entity.ToTable("provider_service_gallery_items", "category");

            entity.HasIndex(e => new { e.ProviderServiceId, e.DisplayOrder }, "ix_provider_service_gallery_items_display_order");

            entity.HasIndex(e => e.ProviderServiceId, "ix_provider_service_gallery_items_service_id");

            entity.HasIndex(e => e.ProviderServiceId, "ux_provider_service_gallery_items_one_primary")
                .IsUnique()
                .HasFilter("(is_primary = true)");

            entity.Property(e => e.Id)
                .HasDefaultValueSql("uuid_generate_v4()")
                .HasColumnName("id");
            entity.Property(e => e.CreateDate)
                .HasDefaultValueSql("now()")
                .HasColumnName("create_date");
            entity.Property(e => e.DescriptionTranslations)
                .HasDefaultValueSql("'{}'::jsonb")
                .HasColumnType("jsonb")
                .HasColumnName("description_translations");
            entity.Property(e => e.DisplayOrder)
                .HasDefaultValue(0)
                .HasColumnName("display_order");
            entity.Property(e => e.IsPrimary)
                .HasDefaultValue(false)
                .HasColumnName("is_primary");
            entity.Property(e => e.LastModifiedDate).HasColumnName("last_modified_date");
            entity.Property(e => e.MediaType)
                .HasMaxLength(50)
                .HasDefaultValueSql("'image'::character varying")
                .HasColumnName("media_type");
            entity.Property(e => e.ProviderServiceId).HasColumnName("provider_service_id");
            entity.Property(e => e.TitleTranslations)
                .HasDefaultValueSql("'{}'::jsonb")
                .HasColumnType("jsonb")
                .HasColumnName("title_translations");
            entity.Property(e => e.Url)
                .HasMaxLength(250)
                .HasColumnName("url");

            entity.HasOne(d => d.ProviderService).WithOne(p => p.ProviderServiceGalleryItem)
                .HasForeignKey<ProviderServiceGalleryItem>(d => d.ProviderServiceId)
                .HasConstraintName("fk_provider_service_gallery_items_provider_service");
        });

        modelBuilder.Entity<ProviderStaff>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("pk_provider_staffs");

            entity.ToTable("provider_staffs", "category");

            entity.HasIndex(e => e.IsActive, "ix_provider_staffs_is_active");

            entity.HasIndex(e => new { e.ServiceProviderId, e.StaffId }, "ix_provider_staffs_service_provider_id_staff_id").IsUnique();

            entity.HasIndex(e => e.StaffId, "ix_provider_staffs_staff_id");

            entity.Property(e => e.Id)
                .ValueGeneratedNever()
                .HasColumnName("id");
            entity.Property(e => e.CreateDate).HasColumnName("create_date");
            entity.Property(e => e.IsActive).HasColumnName("is_active");
            entity.Property(e => e.LastModifiedDate).HasColumnName("last_modified_date");
            entity.Property(e => e.NotesTranslations)
                .HasColumnType("jsonb")
                .HasColumnName("notes_translations");
            entity.Property(e => e.ServiceProviderId).HasColumnName("service_provider_id");
            entity.Property(e => e.StaffId).HasColumnName("staff_id");

            entity.HasOne(d => d.ServiceProvider).WithMany(p => p.ProviderStaffs)
                .HasForeignKey(d => d.ServiceProviderId)
                .HasConstraintName("fk_provider_staffs_service_providers_service_provider_id");

            entity.HasOne(d => d.Staff).WithMany(p => p.ProviderStaffs)
                .HasForeignKey(d => d.StaffId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_provider_staffs_staffs_staff_id");
        });

        modelBuilder.Entity<ProviderType>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("pk_provider_types");

            entity.ToTable("provider_types", "category");

            entity.Property(e => e.Id)
                .ValueGeneratedNever()
                .HasColumnName("id");
            entity.Property(e => e.CreateDate)
                .HasDefaultValueSql("now()")
                .HasColumnName("create_date");
            entity.Property(e => e.DescriptionTranslations)
                .HasColumnType("jsonb")
                .HasColumnName("description_translations");
            entity.Property(e => e.IconUrl)
                .HasMaxLength(250)
                .HasColumnName("icon_url");
            entity.Property(e => e.IsActive).HasColumnName("is_active");
            entity.Property(e => e.LastModifiedDate)
                .HasDefaultValueSql("now()")
                .HasColumnName("last_modified_date");
            entity.Property(e => e.NameTranslations)
                .HasColumnType("jsonb")
                .HasColumnName("name_translations");
        });

        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("pk_refresh_tokens");

            entity.ToTable("refresh_tokens", "identity");

            entity.HasIndex(e => new { e.Token, e.UserId }, "ix_refresh_tokens_token_user_id").IsUnique();

            entity.HasIndex(e => e.UserId, "ix_refresh_tokens_user_id");

            entity.Property(e => e.Id)
                .ValueGeneratedNever()
                .HasColumnName("id");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.CreatedByIp).HasColumnName("created_by_ip");
            entity.Property(e => e.ExpiredAt).HasColumnName("expired_at");
            entity.Property(e => e.RevokedAt).HasColumnName("revoked_at");
            entity.Property(e => e.Token)
                .HasMaxLength(100)
                .HasColumnName("token");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.User).WithMany(p => p.RefreshTokens)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("fk_refresh_tokens_asp_net_users_user_id");
        });

        modelBuilder.Entity<ReviewImage>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("review_images_pkey");

            entity.ToTable("review_images", "category");

            entity.HasIndex(e => e.ReviewId, "ix_review_images_review_id");

            entity.Property(e => e.Id)
                .HasDefaultValueSql("uuid_generate_v4()")
                .HasColumnName("id");
            entity.Property(e => e.ImageUrl)
                .HasMaxLength(250)
                .HasColumnName("image_url");
            entity.Property(e => e.ReviewId).HasColumnName("review_id");

            entity.HasOne(d => d.Review).WithMany(p => p.ReviewImages)
                .HasForeignKey(d => d.ReviewId)
                .HasConstraintName("fk_review_images_service_provider_comments_review_id");
        });

        modelBuilder.Entity<ServiceAttributeDefinition>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("pk_service_attribute_definitions");

            entity.ToTable("service_attribute_definitions", "category");

            entity.HasIndex(e => e.AttributeTypeId, "ix_service_attribute_definitions_attribute_type_id");

            entity.HasIndex(e => e.ServiceDefinitionId, "ix_service_attribute_definitions_service_definition_id");

            entity.Property(e => e.Id)
                .ValueGeneratedNever()
                .HasColumnName("id");
            entity.Property(e => e.AffectsPricing).HasColumnName("affects_pricing");
            entity.Property(e => e.AttributeTypeId).HasColumnName("attribute_type_id");
            entity.Property(e => e.CreateDate).HasColumnName("create_date");
            entity.Property(e => e.DescriptionTranslations)
                .HasColumnType("jsonb")
                .HasColumnName("description_translations");
            entity.Property(e => e.DisplayOrder).HasColumnName("display_order");
            entity.Property(e => e.IsRequired).HasColumnName("is_required");
            entity.Property(e => e.LastModifiedDate).HasColumnName("last_modified_date");
            entity.Property(e => e.NameTranslations)
                .HasColumnType("jsonb")
                .HasColumnName("name_translations");
            entity.Property(e => e.ServiceDefinitionId).HasColumnName("service_definition_id");

            entity.HasOne(d => d.AttributeType).WithMany(p => p.ServiceAttributeDefinitions)
                .HasForeignKey(d => d.AttributeTypeId)
                .HasConstraintName("fk_service_attribute_definitions_attribute_types_attribute_typ");

            entity.HasOne(d => d.ServiceDefinition).WithMany(p => p.ServiceAttributeDefinitions)
                .HasForeignKey(d => d.ServiceDefinitionId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("fk_service_attribute_definitions_service_definitions_service_d");
        });

        modelBuilder.Entity<ServiceAttributeDefinitionOption>(entity =>
        {
            entity.HasKey(e => new { e.ServiceAttributeDefinitionId, e.Id }).HasName("pk_service_attribute_definition_options");

            entity.ToTable("service_attribute_definition_options", "category");

            entity.Property(e => e.ServiceAttributeDefinitionId).HasColumnName("service_attribute_definition_id");
            entity.Property(e => e.Id)
                .ValueGeneratedOnAdd()
                .HasColumnName("id");
            entity.Property(e => e.AdditionalPrice)
                .HasPrecision(18, 2)
                .HasColumnName("additional_price");
            entity.Property(e => e.DisplayNameTranslations)
                .HasColumnType("jsonb")
                .HasColumnName("display_name_translations");
            entity.Property(e => e.ValueTranslations)
                .HasColumnType("jsonb")
                .HasColumnName("value_translations");

            entity.HasOne(d => d.ServiceAttributeDefinition).WithMany(p => p.ServiceAttributeDefinitionOptions)
                .HasForeignKey(d => d.ServiceAttributeDefinitionId)
                .HasConstraintName("fk_service_attribute_definition_options_service_attribute_defi");
        });

        modelBuilder.Entity<ServiceAttributeValue>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("pk_service_attribute_values");

            entity.ToTable("service_attribute_values", "category");

            entity.HasIndex(e => e.AttributeDefinitionId, "ix_service_attribute_values_attribute_definition_id");

            entity.HasIndex(e => new { e.ProviderServiceId, e.AttributeDefinitionId }, "ix_service_attribute_values_provider_service_id_attribute_defi").IsUnique();

            entity.Property(e => e.Id)
                .ValueGeneratedNever()
                .HasColumnName("id");
            entity.Property(e => e.AttributeDefinitionId).HasColumnName("attribute_definition_id");
            entity.Property(e => e.CreateDate).HasColumnName("create_date");
            entity.Property(e => e.LastModifiedDate).HasColumnName("last_modified_date");
            entity.Property(e => e.ProviderServiceId).HasColumnName("provider_service_id");
            entity.Property(e => e.ValueTranslations)
                .HasColumnType("jsonb")
                .HasColumnName("value_translations");

            entity.HasOne(d => d.ProviderService).WithMany(p => p.ServiceAttributeValues)
                .HasForeignKey(d => d.ProviderServiceId)
                .HasConstraintName("fk_service_attribute_values_provider_services_provider_service");
        });

        modelBuilder.Entity<ServiceDefinition>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("pk_service_definitions");

            entity.ToTable("service_definitions", "category");

            entity.HasIndex(e => e.CategoryId, "ix_service_definitions_category_id");

            entity.Property(e => e.Id)
                .ValueGeneratedNever()
                .HasColumnName("id");
            entity.Property(e => e.CategoryId).HasColumnName("category_id");
            entity.Property(e => e.CreateDate)
                .HasDefaultValueSql("now()")
                .HasColumnName("create_date");
            entity.Property(e => e.Currency)
                .HasMaxLength(15)
                .HasColumnName("currency");
            entity.Property(e => e.DescriptionTranslations)
                .HasColumnType("jsonb")
                .HasColumnName("description_translations");
            entity.Property(e => e.DurationMinutes).HasColumnName("duration_minutes");
            entity.Property(e => e.IsActive).HasColumnName("is_active");
            entity.Property(e => e.LastModifiedDate)
                .HasDefaultValueSql("now()")
                .HasColumnName("last_modified_date");
            entity.Property(e => e.NameTranslations)
                .HasColumnType("jsonb")
                .HasColumnName("name_translations");
            entity.Property(e => e.PricingModel)
                .HasMaxLength(100)
                .HasColumnName("pricing_model");
            entity.Property(e => e.Value)
                .HasPrecision(18, 2)
                .HasColumnName("value");

            entity.HasOne(d => d.Category).WithMany(p => p.ServiceDefinitions)
                .HasForeignKey(d => d.CategoryId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_service_definitions_categories_category_id");
        });

        modelBuilder.Entity<ServiceDefinitionDomainRequirement>(entity =>
        {
            entity.HasKey(e => new { e.ServiceDefinitionId, e.Id }).HasName("pk_service_definition_domain_requirements");

            entity.ToTable("service_definition_domain_requirements", "category");

            entity.Property(e => e.ServiceDefinitionId).HasColumnName("service_definition_id");
            entity.Property(e => e.Id)
                .ValueGeneratedOnAdd()
                .HasColumnName("id");
            entity.Property(e => e.DescriptionTranslations)
                .HasColumnType("jsonb")
                .HasColumnName("description_translations");
            entity.Property(e => e.IsMandatory).HasColumnName("is_mandatory");

            entity.HasOne(d => d.ServiceDefinition).WithMany(p => p.ServiceDefinitionDomainRequirements)
                .HasForeignKey(d => d.ServiceDefinitionId)
                .HasConstraintName("fk_service_definition_domain_requirements_service_definitions_");
        });

        modelBuilder.Entity<ServiceFaq>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("service_faqs_pkey");

            entity.ToTable("service_faqs", "category");

            entity.Property(e => e.Id)
                .HasDefaultValueSql("uuid_generate_v4()")
                .HasColumnName("id");
            entity.Property(e => e.Answer).HasColumnName("answer");
            entity.Property(e => e.Question).HasColumnName("question");
            entity.Property(e => e.ServiceId).HasColumnName("service_id");
        });

        modelBuilder.Entity<ServiceIncluded>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("service_included_pkey");

            entity.ToTable("service_included", "category");

            entity.Property(e => e.Id)
                .HasDefaultValueSql("uuid_generate_v4()")
                .HasColumnName("id");
            entity.Property(e => e.Item)
                .HasMaxLength(200)
                .HasColumnName("item");
            entity.Property(e => e.ServiceId).HasColumnName("service_id");
        });

        modelBuilder.Entity<ServiceProcess>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("service_process_pkey");

            entity.ToTable("service_process", "category");

            entity.Property(e => e.Id)
                .HasDefaultValueSql("uuid_generate_v4()")
                .HasColumnName("id");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.Duration)
                .HasMaxLength(50)
                .HasColumnName("duration");
            entity.Property(e => e.ServiceId).HasColumnName("service_id");
            entity.Property(e => e.Step).HasColumnName("step");
            entity.Property(e => e.Title)
                .HasMaxLength(200)
                .HasColumnName("title");
        });

        modelBuilder.Entity<ServiceProvider>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("pk_service_providers");

            entity.ToTable("service_providers", "category");

            entity.HasIndex(e => e.SearchVector, "idx_providers_search").HasMethod("gin");

            entity.HasIndex(e => new { e.Country, e.City }, "ix_service_providers_country_city");

            entity.HasIndex(e => e.GradeId, "ix_service_providers_grade_id");

            entity.HasIndex(e => new { e.GradeId, e.ProviderTypeId }, "ix_service_providers_grade_id_provider_type_id");

            entity.HasIndex(e => new { e.GradeId, e.ProviderTypeId, e.Country, e.City }, "ix_service_providers_grade_id_provider_type_id_country_city");

            entity.HasIndex(e => e.IsActive, "ix_service_providers_is_active");

            entity.HasIndex(e => e.NameTranslations, "ix_service_providers_name_translations");

            entity.HasIndex(e => e.ProviderTypeId, "ix_service_providers_provider_type_id");

            entity.HasIndex(e => new { e.ProviderTypeId, e.Country, e.City }, "ix_service_providers_provider_type_id_country_city");

            entity.Property(e => e.Id)
                .ValueGeneratedNever()
                .HasColumnName("id");
            entity.Property(e => e.Accredited)
                .HasDefaultValue(false)
                .HasColumnName("accredited");
            entity.Property(e => e.City)
                .HasMaxLength(15)
                .HasColumnName("city");
            entity.Property(e => e.Country)
                .HasMaxLength(15)
                .HasColumnName("country");
            entity.Property(e => e.CreateDate)
                .HasDefaultValueSql("now()")
                .HasColumnName("create_date");
            entity.Property(e => e.DescriptionTranslations)
                .HasColumnType("jsonb")
                .HasColumnName("description_translations");
            entity.Property(e => e.DetailTranslations)
                .HasColumnType("jsonb")
                .HasColumnName("detail_translations");
            entity.Property(e => e.Email)
                .HasMaxLength(250)
                .HasColumnName("email");
            entity.Property(e => e.EstablishedYear).HasColumnName("established_year");
            entity.Property(e => e.FeaturedScore)
                .HasDefaultValueSql("0")
                .HasColumnName("featured_score");
            entity.Property(e => e.GradeId).HasColumnName("grade_id");
            entity.Property(e => e.ImageUrl).HasColumnName("image_url");
            entity.Property(e => e.IsActive).HasColumnName("is_active");
            entity.Property(e => e.IsSponsored)
                .HasDefaultValue(false)
                .HasColumnName("is_sponsored");
            entity.Property(e => e.Languages).HasColumnName("languages");
            entity.Property(e => e.LastModifiedDate)
                .HasDefaultValueSql("now()")
                .HasColumnName("last_modified_date");
            entity.Property(e => e.Latitude)
                .HasPrecision(10, 7)
                .HasColumnName("latitude");
            entity.Property(e => e.Longitude)
                .HasPrecision(10, 7)
                .HasColumnName("longitude");
            entity.Property(e => e.NameTranslations)
                .HasColumnType("jsonb")
                .HasColumnName("name_translations");
            entity.Property(e => e.PhoneNumber)
                .HasMaxLength(15)
                .HasColumnName("phone_number");
            entity.Property(e => e.PhoneNumberCountryCode)
                .HasMaxLength(3)
                .HasColumnName("phone_number_country_code");
            entity.Property(e => e.ProviderTypeId).HasColumnName("provider_type_id");
            entity.Property(e => e.Rating)
                .HasPrecision(3, 2)
                .HasDefaultValueSql("0")
                .HasColumnName("rating");
            entity.Property(e => e.ResponseTime)
                .HasMaxLength(50)
                .HasColumnName("response_time");
            entity.Property(e => e.ReviewCount)
                .HasDefaultValue(0)
                .HasColumnName("review_count");
            entity.Property(e => e.SearchVector).HasColumnName("search_vector");
            entity.Property(e => e.Specialties).HasColumnName("specialties");
            entity.Property(e => e.SponsoredTag)
                .HasMaxLength(50)
                .HasColumnName("sponsored_tag");
            entity.Property(e => e.StreetTranslations)
                .HasColumnType("jsonb")
                .HasColumnName("street_translations");
            entity.Property(e => e.SuccessRate)
                .HasMaxLength(50)
                .HasColumnName("success_rate");
            entity.Property(e => e.TimezoneId)
                .HasDefaultValueSql("'UTC'::text")
                .HasColumnName("timezone_id");
            entity.Property(e => e.TotalPatients)
                .HasMaxLength(50)
                .HasColumnName("total_patients");
            entity.Property(e => e.ZipCode)
                .HasMaxLength(50)
                .HasColumnName("zip_code");

            entity.HasOne(d => d.Grade).WithMany(p => p.ServiceProviders)
                .HasForeignKey(d => d.GradeId)
                .HasConstraintName("fk_service_providers_service_provider_grades_grade_id");

            entity.HasOne(d => d.ProviderType).WithMany(p => p.ServiceProviders)
                .HasForeignKey(d => d.ProviderTypeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_service_providers_provider_types_provider_type_id");
        });

        modelBuilder.Entity<ServiceProviderComment>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("pk_service_provider_comments");

            entity.ToTable("service_provider_comments", "category");

            entity.HasIndex(e => e.CreateDate, "ix_service_provider_comments_create_date");

            entity.HasIndex(e => e.CustomerId, "ix_service_provider_comments_customer_id");

            entity.HasIndex(e => e.ServiceProviderId, "ix_service_provider_comments_service_provider_id");

            entity.HasIndex(e => new { e.ServiceProviderId, e.IsPublic }, "ix_service_provider_comments_service_provider_id_is_public");

            entity.Property(e => e.Id)
                .ValueGeneratedNever()
                .HasColumnName("id");
            entity.Property(e => e.CommentText)
                .HasMaxLength(2000)
                .HasColumnName("comment_text");
            entity.Property(e => e.Country)
                .HasMaxLength(50)
                .HasColumnName("country");
            entity.Property(e => e.CreateDate).HasColumnName("create_date");
            entity.Property(e => e.CustomerId).HasColumnName("customer_id");
            entity.Property(e => e.CustomerName)
                .HasMaxLength(150)
                .HasColumnName("customer_name");
            entity.Property(e => e.HelpfulCount)
                .HasDefaultValue(0)
                .HasColumnName("helpful_count");
            entity.Property(e => e.IsPublic)
                .HasDefaultValue(true)
                .HasColumnName("is_public");
            entity.Property(e => e.IsVerified)
                .HasDefaultValue(false)
                .HasColumnName("is_verified");
            entity.Property(e => e.LastModifiedDate).HasColumnName("last_modified_date");
            entity.Property(e => e.Rating).HasColumnName("rating");
            entity.Property(e => e.ServiceProviderId).HasColumnName("service_provider_id");
            entity.Property(e => e.Treatment)
                .HasMaxLength(100)
                .HasColumnName("treatment");

            entity.HasOne(d => d.ServiceProvider).WithMany(p => p.ServiceProviderComments)
                .HasForeignKey(d => d.ServiceProviderId)
                .HasConstraintName("fk_service_provider_comments_service_providers_service_provide");
        });

        modelBuilder.Entity<ServiceProviderGrade>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("pk_service_provider_grades");

            entity.ToTable("service_provider_grades", "category");

            entity.Property(e => e.Id)
                .ValueGeneratedNever()
                .HasColumnName("id");
            entity.Property(e => e.Name)
                .HasMaxLength(25)
                .HasColumnName("name");
        });

        modelBuilder.Entity<ServiceProviderRequest>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("pk_service_provider_requests");

            entity.ToTable("service_provider_requests", "category");

            entity.HasIndex(e => e.CustomerId, "ix_service_provider_requests_customer_id");

            entity.HasIndex(e => e.RequestStatusId, "ix_service_provider_requests_request_status_id");

            entity.HasIndex(e => e.ServiceProviderId, "ix_service_provider_requests_service_provider_id");

            entity.Property(e => e.Id)
                .ValueGeneratedNever()
                .HasColumnName("id");
            entity.Property(e => e.CreateDate)
                .HasDefaultValueSql("now()")
                .HasColumnName("create_date");
            entity.Property(e => e.CustomerEmail)
                .HasMaxLength(256)
                .HasColumnName("customer_email");
            entity.Property(e => e.CustomerFullName)
                .HasMaxLength(256)
                .HasColumnName("customer_full_name");
            entity.Property(e => e.CustomerId).HasColumnName("customer_id");
            entity.Property(e => e.LastModifiedDate)
                .HasDefaultValueSql("now()")
                .HasColumnName("last_modified_date");
            entity.Property(e => e.Message)
                .HasMaxLength(2000)
                .HasColumnName("message");
            entity.Property(e => e.RequestStatusId).HasColumnName("request_status_id");
            entity.Property(e => e.ServiceProviderId).HasColumnName("service_provider_id");

            entity.HasOne(d => d.RequestStatus).WithMany(p => p.ServiceProviderRequests)
                .HasForeignKey(d => d.RequestStatusId)
                .HasConstraintName("fk_service_provider_requests_service_provider_request_statuses");

            entity.HasOne(d => d.ServiceProvider).WithMany(p => p.ServiceProviderRequests)
                .HasForeignKey(d => d.ServiceProviderId)
                .HasConstraintName("fk_service_provider_requests_service_providers_service_provide");
        });

        modelBuilder.Entity<ServiceProviderRequestStatus>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("pk_service_provider_request_statuses");

            entity.ToTable("service_provider_request_statuses", "category");

            entity.Property(e => e.Id)
                .ValueGeneratedNever()
                .HasColumnName("id");
            entity.Property(e => e.Name)
                .HasMaxLength(25)
                .HasColumnName("name");
        });

        modelBuilder.Entity<ServiceUploadFileRequirement>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("pk_service_upload_file_requirements");

            entity.ToTable("service_upload_file_requirements", "category");

            entity.HasIndex(e => e.ServiceDefinitionId, "ix_sufr_service_definition_id");

            entity.HasIndex(e => new { e.ServiceDefinitionId, e.DisplayOrder }, "ix_sufr_service_definition_id_display_order");

            entity.Property(e => e.Id)
                .HasDefaultValueSql("uuid_generate_v4()")
                .HasColumnName("id");
            entity.Property(e => e.AllowedExtensions)
                .HasDefaultValueSql("ARRAY[]::text[]")
                .HasColumnName("allowed_extensions");
            entity.Property(e => e.AllowedMimeTypes)
                .HasDefaultValueSql("ARRAY[]::text[]")
                .HasColumnName("allowed_mime_types");
            entity.Property(e => e.CreateDate)
                .HasDefaultValueSql("now()")
                .HasColumnName("create_date");
            entity.Property(e => e.DescriptionTranslations)
                .HasColumnType("jsonb")
                .HasColumnName("description_translations");
            entity.Property(e => e.DisplayOrder)
                .HasDefaultValue(0)
                .HasColumnName("display_order");
            entity.Property(e => e.ExampleFileUrl).HasColumnName("example_file_url");
            entity.Property(e => e.IsRequired)
                .HasDefaultValue(false)
                .HasColumnName("is_required");
            entity.Property(e => e.LastModifiedDate)
                .HasDefaultValueSql("now()")
                .HasColumnName("last_modified_date");
            entity.Property(e => e.MaxFileSizeBytes)
                .HasDefaultValue(0L)
                .HasColumnName("max_file_size_bytes");
            entity.Property(e => e.MaxFiles)
                .HasDefaultValue(1)
                .HasColumnName("max_files");
            entity.Property(e => e.ServiceDefinitionId).HasColumnName("service_definition_id");
            entity.Property(e => e.TitleTranslations)
                .HasColumnType("jsonb")
                .HasColumnName("title_translations");

            entity.HasOne(d => d.ServiceDefinition).WithMany(p => p.ServiceUploadFileRequirements)
                .HasForeignKey(d => d.ServiceDefinitionId)
                .HasConstraintName("fk_service_upload_file_requirements_service_definition");
        });

        modelBuilder.Entity<Staff>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("pk_staff");

            entity.ToTable("staff", "category");

            entity.Property(e => e.Id)
                .ValueGeneratedNever()
                .HasColumnName("id");
            entity.Property(e => e.BiographyTranslations)
                .HasColumnType("jsonb")
                .HasColumnName("biography_translations");
            entity.Property(e => e.ConsultationFee)
                .HasPrecision(18, 2)
                .HasDefaultValueSql("0")
                .HasColumnName("consultation_fee");
            entity.Property(e => e.CreateDate)
                .HasDefaultValueSql("now()")
                .HasColumnName("create_date");
            entity.Property(e => e.Experience)
                .HasMaxLength(50)
                .HasColumnName("experience");
            entity.Property(e => e.ExperienceYears).HasColumnName("experience_years");
            entity.Property(e => e.IsActive).HasColumnName("is_active");
            entity.Property(e => e.LastModifiedDate)
                .HasDefaultValueSql("now()")
                .HasColumnName("last_modified_date");
            entity.Property(e => e.NameTranslations)
                .HasColumnType("jsonb")
                .HasColumnName("name_translations");
            entity.Property(e => e.NextAvailableLabel).HasColumnName("next_available_label");
            entity.Property(e => e.Patients)
                .HasMaxLength(50)
                .HasColumnName("patients");
            entity.Property(e => e.ProfileImageUrl)
                .HasMaxLength(250)
                .HasColumnName("profile_image_url");
            entity.Property(e => e.Rating)
                .HasPrecision(3, 2)
                .HasDefaultValueSql("0")
                .HasColumnName("rating");
            entity.Property(e => e.ReviewCount)
                .HasDefaultValue(0)
                .HasColumnName("review_count");
            entity.Property(e => e.Specialty).HasColumnName("specialty");
            entity.Property(e => e.SpecialtyTranslations)
                .HasColumnType("jsonb")
                .HasColumnName("specialty_translations");
            entity.Property(e => e.SuccessRate)
                .HasMaxLength(50)
                .HasColumnName("success_rate");
            entity.Property(e => e.TitleTranslations)
                .HasColumnType("jsonb")
                .HasColumnName("title_translations");
        });

        modelBuilder.Entity<StaffAchievement>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("pk_staff_achievements");

            entity.ToTable("staff_achievements", "category");

            entity.HasIndex(e => e.StaffId, "ix_staff_achievements_staff_id");

            entity.HasIndex(e => new { e.StaffId, e.DisplayOrder }, "ix_staff_achievements_staff_id_display_order");

            entity.Property(e => e.Id)
                .HasDefaultValueSql("uuid_generate_v4()")
                .HasColumnName("id");
            entity.Property(e => e.CreateDate)
                .HasDefaultValueSql("now()")
                .HasColumnName("create_date");
            entity.Property(e => e.DisplayOrder)
                .HasDefaultValue(0)
                .HasColumnName("display_order");
            entity.Property(e => e.Icon)
                .HasMaxLength(100)
                .HasColumnName("icon");
            entity.Property(e => e.LastModifiedDate)
                .HasDefaultValueSql("now()")
                .HasColumnName("last_modified_date");
            entity.Property(e => e.Organization)
                .HasMaxLength(200)
                .HasColumnName("organization");
            entity.Property(e => e.StaffId).HasColumnName("staff_id");
            entity.Property(e => e.Title)
                .HasMaxLength(200)
                .HasColumnName("title");

            entity.HasOne(d => d.Staff).WithMany(p => p.StaffAchievements)
                .HasForeignKey(d => d.StaffId)
                .HasConstraintName("fk_staff_achievements_staff");
        });

        modelBuilder.Entity<StaffAvailability>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("pk_staff_availabilities");

            entity.ToTable("staff_availabilities", "category");

            entity.HasIndex(e => e.AvailabilityStatusId, "ix_staff_availabilities_availability_status_id");

            entity.HasIndex(e => e.StaffId, "ix_staff_availabilities_staff_id");

            entity.HasIndex(e => new { e.StaffId, e.DayOfWeek }, "ix_staff_availabilities_staff_id_day_of_week");

            entity.HasIndex(e => new { e.StaffId, e.SpecificDate }, "ix_staff_availabilities_staff_id_specific_date").HasFilter("(specific_date IS NOT NULL)");

            entity.Property(e => e.Id)
                .ValueGeneratedNever()
                .HasColumnName("id");
            entity.Property(e => e.AvailabilityStatusId).HasColumnName("availability_status_id");
            entity.Property(e => e.CreateDate).HasColumnName("create_date");
            entity.Property(e => e.DayOfWeek).HasColumnName("day_of_week");
            entity.Property(e => e.EndTime).HasColumnName("end_time");
            entity.Property(e => e.IsRecurring).HasColumnName("is_recurring");
            entity.Property(e => e.LastModifiedDate).HasColumnName("last_modified_date");
            entity.Property(e => e.SpecificDate).HasColumnName("specific_date");
            entity.Property(e => e.StaffId).HasColumnName("staff_id");
            entity.Property(e => e.StartTime).HasColumnName("start_time");

            entity.HasOne(d => d.AvailabilityStatus).WithMany(p => p.StaffAvailabilities)
                .HasForeignKey(d => d.AvailabilityStatusId)
                .HasConstraintName("fk_staff_availabilities_staff_availability_statuses_availabili");

            entity.HasOne(d => d.Staff).WithMany(p => p.StaffAvailabilities)
                .HasForeignKey(d => d.StaffId)
                .HasConstraintName("fk_staff_availabilities_staffs_staff_id");
        });

        modelBuilder.Entity<StaffAvailabilityStatus>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("pk_staff_availability_statuses");

            entity.ToTable("staff_availability_statuses", "category");

            entity.Property(e => e.Id)
                .ValueGeneratedNever()
                .HasColumnName("id");
            entity.Property(e => e.Name)
                .HasMaxLength(25)
                .HasColumnName("name");
        });

        modelBuilder.Entity<StaffBeforeAfter>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("pk_staff_before_after");

            entity.ToTable("staff_before_after", "category");

            entity.HasIndex(e => e.StaffId, "ix_staff_before_after_staff_id");

            entity.HasIndex(e => new { e.StaffId, e.DisplayOrder }, "ix_staff_before_after_staff_id_display_order");

            entity.Property(e => e.Id)
                .HasDefaultValueSql("uuid_generate_v4()")
                .HasColumnName("id");
            entity.Property(e => e.AfterImage)
                .HasMaxLength(250)
                .HasColumnName("after_image");
            entity.Property(e => e.BeforeImage)
                .HasMaxLength(250)
                .HasColumnName("before_image");
            entity.Property(e => e.CreateDate)
                .HasDefaultValueSql("now()")
                .HasColumnName("create_date");
            entity.Property(e => e.DisplayOrder)
                .HasDefaultValue(0)
                .HasColumnName("display_order");
            entity.Property(e => e.LastModifiedDate)
                .HasDefaultValueSql("now()")
                .HasColumnName("last_modified_date");
            entity.Property(e => e.Months).HasColumnName("months");
            entity.Property(e => e.Procedure)
                .HasMaxLength(200)
                .HasColumnName("procedure");
            entity.Property(e => e.StaffId).HasColumnName("staff_id");

            entity.HasOne(d => d.Staff).WithMany(p => p.StaffBeforeAfters)
                .HasForeignKey(d => d.StaffId)
                .HasConstraintName("fk_staff_before_after_staff");
        });

        modelBuilder.Entity<StaffCertification>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("pk_staff_certifications");

            entity.ToTable("staff_certifications", "category");

            entity.HasIndex(e => e.StaffId, "ix_staff_certifications_staff_id");

            entity.Property(e => e.Id)
                .HasDefaultValueSql("uuid_generate_v4()")
                .HasColumnName("id");
            entity.Property(e => e.CreateDate)
                .HasDefaultValueSql("now()")
                .HasColumnName("create_date");
            entity.Property(e => e.IsVerified)
                .HasDefaultValue(false)
                .HasColumnName("is_verified");
            entity.Property(e => e.Issuer)
                .HasMaxLength(200)
                .HasColumnName("issuer");
            entity.Property(e => e.LastModifiedDate)
                .HasDefaultValueSql("now()")
                .HasColumnName("last_modified_date");
            entity.Property(e => e.Name)
                .HasMaxLength(200)
                .HasColumnName("name");
            entity.Property(e => e.StaffId).HasColumnName("staff_id");

            entity.HasOne(d => d.Staff).WithMany(p => p.StaffCertifications)
                .HasForeignKey(d => d.StaffId)
                .HasConstraintName("fk_staff_certifications_staff");
        });

        modelBuilder.Entity<StaffCredential>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("pk_staff_credentials");

            entity.ToTable("staff_credentials", "category");

            entity.HasIndex(e => e.StaffId, "ix_staff_credentials_staff_id");

            entity.Property(e => e.Id)
                .HasDefaultValueSql("uuid_generate_v4()")
                .HasColumnName("id");
            entity.Property(e => e.Credential).HasColumnName("credential");
            entity.Property(e => e.IsVerified)
                .HasDefaultValue(false)
                .HasColumnName("is_verified");
            entity.Property(e => e.StaffId).HasColumnName("staff_id");

            entity.HasOne(d => d.Staff).WithMany(p => p.StaffCredentials)
                .HasForeignKey(d => d.StaffId)
                .HasConstraintName("fk_staff_credentials_staff");
        });

        modelBuilder.Entity<StaffEducation>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("pk_staff_education");

            entity.ToTable("staff_education", "category");

            entity.HasIndex(e => e.StaffId, "ix_staff_education_staff_id");

            entity.HasIndex(e => new { e.StaffId, e.Year }, "ix_staff_education_staff_id_year").IsDescending(false, true);

            entity.Property(e => e.Id)
                .HasDefaultValueSql("uuid_generate_v4()")
                .HasColumnName("id");
            entity.Property(e => e.CreateDate)
                .HasDefaultValueSql("now()")
                .HasColumnName("create_date");
            entity.Property(e => e.Degree)
                .HasMaxLength(200)
                .HasColumnName("degree");
            entity.Property(e => e.Institution)
                .HasMaxLength(250)
                .HasColumnName("institution");
            entity.Property(e => e.LastModifiedDate)
                .HasDefaultValueSql("now()")
                .HasColumnName("last_modified_date");
            entity.Property(e => e.StaffId).HasColumnName("staff_id");
            entity.Property(e => e.Year).HasColumnName("year");

            entity.HasOne(d => d.Staff).WithMany(p => p.StaffEducations)
                .HasForeignKey(d => d.StaffId)
                .HasConstraintName("fk_staff_education_staff");
        });

        modelBuilder.Entity<StaffGalleryItem>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("pk_staff_gallery_items");

            entity.ToTable("staff_gallery_items", "category");

            entity.HasIndex(e => new { e.StaffId, e.DisplayOrder }, "ix_staff_gallery_items_display_order");

            entity.HasIndex(e => e.StaffId, "ix_staff_gallery_items_staff_id");

            entity.HasIndex(e => e.StaffId, "ux_staff_gallery_items_one_primary")
                .IsUnique()
                .HasFilter("(is_primary = true)");

            entity.Property(e => e.Id)
                .HasDefaultValueSql("uuid_generate_v4()")
                .HasColumnName("id");
            entity.Property(e => e.CreateDate)
                .HasDefaultValueSql("now()")
                .HasColumnName("create_date");
            entity.Property(e => e.DescriptionTranslations)
                .HasDefaultValueSql("'{}'::jsonb")
                .HasColumnType("jsonb")
                .HasColumnName("description_translations");
            entity.Property(e => e.DisplayOrder)
                .HasDefaultValue(0)
                .HasColumnName("display_order");
            entity.Property(e => e.IsPrimary)
                .HasDefaultValue(false)
                .HasColumnName("is_primary");
            entity.Property(e => e.LastModifiedDate).HasColumnName("last_modified_date");
            entity.Property(e => e.MediaType)
                .HasMaxLength(50)
                .HasDefaultValueSql("'image'::character varying")
                .HasColumnName("media_type");
            entity.Property(e => e.StaffId).HasColumnName("staff_id");
            entity.Property(e => e.TitleTranslations)
                .HasDefaultValueSql("'{}'::jsonb")
                .HasColumnType("jsonb")
                .HasColumnName("title_translations");
            entity.Property(e => e.Url)
                .HasMaxLength(250)
                .HasColumnName("url");

            entity.HasOne(d => d.Staff).WithOne(p => p.StaffGalleryItem)
                .HasForeignKey<StaffGalleryItem>(d => d.StaffId)
                .HasConstraintName("fk_staff_gallery_items_staff");
        });

        modelBuilder.Entity<StaffLanguage>(entity =>
        {
            entity.HasKey(e => new { e.StaffId, e.Language }).HasName("pk_staff_languages");

            entity.ToTable("staff_languages", "category");

            entity.HasIndex(e => e.StaffId, "ix_staff_languages_staff_id");

            entity.Property(e => e.StaffId).HasColumnName("staff_id");
            entity.Property(e => e.Language).HasColumnName("language");
            entity.Property(e => e.CreateDate)
                .HasDefaultValueSql("now()")
                .HasColumnName("create_date");

            entity.HasOne(d => d.Staff).WithMany(p => p.StaffLanguages)
                .HasForeignKey(d => d.StaffId)
                .HasConstraintName("fk_staff_languages_staff");
        });

        modelBuilder.Entity<StaffService>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("pk_staff_services");

            entity.ToTable("staff_services", "category");

            entity.HasIndex(e => new { e.ServiceDefinitionId, e.StaffId }, "ix_staff_services_service_definition_id_staff_id_active").HasFilter("(is_active = true)");

            entity.HasIndex(e => e.StaffId, "ix_staff_services_staff_id");

            entity.HasIndex(e => new { e.StaffId, e.ServiceDefinitionId }, "ix_staff_services_staff_id_service_definition_id").IsUnique();

            entity.Property(e => e.Id)
                .ValueGeneratedNever()
                .HasColumnName("id");
            entity.Property(e => e.CreateDate).HasColumnName("create_date");
            entity.Property(e => e.IsActive).HasColumnName("is_active");
            entity.Property(e => e.LastModifiedDate).HasColumnName("last_modified_date");
            entity.Property(e => e.NotesTranslations)
                .HasColumnType("jsonb")
                .HasColumnName("notes_translations");
            entity.Property(e => e.ServiceDefinitionId).HasColumnName("service_definition_id");
            entity.Property(e => e.StaffId).HasColumnName("staff_id");

            entity.HasOne(d => d.ServiceDefinition).WithMany(p => p.StaffServices)
                .HasForeignKey(d => d.ServiceDefinitionId)
                .HasConstraintName("fk_staff_services_service_definitions_service_definition_id");

            entity.HasOne(d => d.Staff).WithMany(p => p.StaffServices)
                .HasForeignKey(d => d.StaffId)
                .HasConstraintName("fk_staff_services_staffs_staff_id");
        });

        modelBuilder.Entity<StaffSpecialization>(entity =>
        {
            entity.HasKey(e => new { e.StaffId, e.Specialty }).HasName("pk_staff_specializations");

            entity.ToTable("staff_specializations", "category");

            entity.HasIndex(e => e.StaffId, "ix_staff_specializations_staff_id");

            entity.Property(e => e.StaffId).HasColumnName("staff_id");
            entity.Property(e => e.Specialty).HasColumnName("specialty");
            entity.Property(e => e.CreateDate)
                .HasDefaultValueSql("now()")
                .HasColumnName("create_date");

            entity.HasOne(d => d.Staff).WithMany(p => p.StaffSpecializations)
                .HasForeignKey(d => d.StaffId)
                .HasConstraintName("fk_staff_specializations_staff");
        });

        modelBuilder.Entity<TranslationAudit>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("translation_audit_pkey");

            entity.ToTable("translation_audit");

            entity.HasIndex(e => new { e.TableName, e.ColumnName, e.RowPk, e.TargetLocale, e.CreatedAt }, "ix_translation_audit_lookup").IsDescending(false, false, false, false, true);

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ColumnName).HasColumnName("column_name");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnName("created_at");
            entity.Property(e => e.Error).HasColumnName("error");
            entity.Property(e => e.Model).HasColumnName("model");
            entity.Property(e => e.RowPk).HasColumnName("row_pk");
            entity.Property(e => e.SourceLocale).HasColumnName("source_locale");
            entity.Property(e => e.SourceText).HasColumnName("source_text");
            entity.Property(e => e.Status).HasColumnName("status");
            entity.Property(e => e.TableName).HasColumnName("table_name");
            entity.Property(e => e.TargetLocale).HasColumnName("target_locale");
            entity.Property(e => e.TranslatedText).HasColumnName("translated_text");
        });

        modelBuilder.Entity<TrendingSearch>(entity =>
        {
            entity
                .HasNoKey()
                .ToTable("trending_searches", "search");

            entity.Property(e => e.CalculatedAt).HasColumnName("calculated_at");
            entity.Property(e => e.Term).HasColumnName("term");
            entity.Property(e => e.Trend).HasColumnName("trend");
        });

        modelBuilder.Entity<UserSearchHistory>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("user_search_history_pkey");

            entity.ToTable("user_search_history", "search");

            entity.HasIndex(e => e.CategoryId, "idx_search_history_category");

            entity.HasIndex(e => e.NormalizedTerm, "idx_search_history_term");

            entity.HasIndex(e => new { e.UserId, e.CreatedAt }, "idx_search_history_user").IsDescending(false, true);

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CategoryId).HasColumnName("category_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("now()")
                .HasColumnName("created_at");
            entity.Property(e => e.NormalizedTerm).HasColumnName("normalized_term");
            entity.Property(e => e.Term).HasColumnName("term");
            entity.Property(e => e.UserId).HasColumnName("user_id");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
