using Microsoft.Extensions.Caching.Memory;
using Npgsql;

namespace LSevin.Api.Middleware.AdminAccess;

/// <summary>Where the access model is read from.</summary>
public interface IAdminAccessStore
{
    /// <summary>One person's access. Throws when the database cannot be read (the caller must not guess).</summary>
    Task<AdminAccessSnapshot> GetAsync(Guid userId, CancellationToken cancellationToken);
}

/// <summary>
/// Reads <c>auth.staff_members</c> and <c>auth.role_admin_permissions</c> (migration 0112 of the web app)
/// directly, the same tables the web app's access-control screens write. Cached for a few seconds, so a
/// change made in the screens reaches this API within <see cref="CacheSeconds"/>.
/// </summary>
public sealed class PostgresAdminAccessStore(
    IConfiguration configuration,
    IMemoryCache cache,
    ILogger<PostgresAdminAccessStore> logger
) : IAdminAccessStore
{
    /// <summary>How long one person's access is remembered.</summary>
    public const int CacheSeconds = 10;

    private const string StaffSql = "select status from auth.staff_members where user_id = @user";

    private const string GrantsSql = """
        select p.resource_key, p.level
        from auth.user_roles ur
        join auth.roles r on r.id = ur.role_id and r.is_system = false
        join auth.role_admin_permissions p on p.role_id = r.id
        where ur.user_id = @user
        """;

    /// <inheritdoc />
    public async Task<AdminAccessSnapshot> GetAsync(Guid userId, CancellationToken cancellationToken)
    {
        if (cache.TryGetValue(userId, out AdminAccessSnapshot? cached) && cached is not null)
        {
            return cached;
        }

        var connectionString = configuration.GetConnectionString("database")
            ?? throw new InvalidOperationException("ConnectionStrings:database is not configured.");

        AdminAccessSnapshot snapshot;
        try
        {
            await using var connection = new NpgsqlConnection(connectionString);
            await connection.OpenAsync(cancellationToken);

            string? status;
            await using (var staff = new NpgsqlCommand(StaffSql, connection))
            {
                staff.Parameters.AddWithValue("user", userId);
                status = await staff.ExecuteScalarAsync(cancellationToken) as string;
            }

            if (status is null)
            {
                snapshot = AdminAccessSnapshot.Unmanaged;
            }
            else if (string.Equals(status, "disabled", StringComparison.OrdinalIgnoreCase))
            {
                snapshot = AdminAccessSnapshot.Disabled;
            }
            else
            {
                var grants = new Dictionary<string, AdminAccessLevel>(StringComparer.Ordinal);
                await using var command = new NpgsqlCommand(GrantsSql, connection);
                command.Parameters.AddWithValue("user", userId);
                await using var reader = await command.ExecuteReaderAsync(cancellationToken);
                while (await reader.ReadAsync(cancellationToken))
                {
                    var key = reader.GetString(0);
                    var level = string.Equals(reader.GetString(1), "manage", StringComparison.OrdinalIgnoreCase)
                        ? AdminAccessLevel.Manage
                        : AdminAccessLevel.View;
                    // Union across roles: manage beats view.
                    if (!grants.TryGetValue(key, out var existing) || existing != AdminAccessLevel.Manage)
                    {
                        grants[key] = level;
                    }
                }

                snapshot = new AdminAccessSnapshot(AdminAccessKind.Active, grants);
            }
        }
        catch (PostgresException ex) when (ex.SqlState is "42P01" or "42703")
        {
            // The web app's migration has not been applied: nobody can be under access management yet, so
            // every admin keeps the access they had. Not a fallback for any other failure.
            logger.LogWarning("Admin access tables are not present yet (SQLSTATE {SqlState}); treating all admins as unmanaged.", ex.SqlState);
            snapshot = AdminAccessSnapshot.Unmanaged;
        }

        cache.Set(userId, snapshot, TimeSpan.FromSeconds(CacheSeconds));
        return snapshot;
    }
}
