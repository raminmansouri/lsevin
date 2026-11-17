namespace LSevin.Api.Middleware.AdminAccess;

/// <summary>What a request needs: reading, or anything that can change state.</summary>
public enum AdminAccessLevel
{
    /// <summary>Open and read.</summary>
    View = 0,

    /// <summary>Also change (includes <see cref="View"/>).</summary>
    Manage = 1,
}

/// <summary>How the admin panel's access management sees one person.</summary>
public enum AdminAccessKind
{
    /// <summary>Not under access management: a plain admin, unlimited (the behaviour before this existed).</summary>
    Unmanaged,

    /// <summary>Managed and revoked: no admin access, even while their token still says <c>admin</c>.</summary>
    Disabled,

    /// <summary>Managed and active: limited to <see cref="AdminAccessSnapshot.Grants"/>.</summary>
    Active,
}

/// <summary>One person's access, as stored in <c>auth.staff_members</c> and <c>auth.role_admin_permissions</c>.</summary>
public sealed record AdminAccessSnapshot(AdminAccessKind Kind, IReadOnlyDictionary<string, AdminAccessLevel> Grants)
{
    private static readonly IReadOnlyDictionary<string, AdminAccessLevel> NoGrants =
        new Dictionary<string, AdminAccessLevel>();

    /// <summary>A plain admin nobody has put under management.</summary>
    public static AdminAccessSnapshot Unmanaged { get; } = new(AdminAccessKind.Unmanaged, NoGrants);

    /// <summary>A managed admin whose access was revoked.</summary>
    public static AdminAccessSnapshot Disabled { get; } = new(AdminAccessKind.Disabled, NoGrants);
}

/// <summary>
/// The backend half of the admin panel's access control (the Next.js app enforces the same model in
/// <c>frontend/webapp/src/lib/admin/access</c>; keep the two in step).
///
/// A limited admin still carries the <c>admin</c> role, because this API authorizes admin endpoints by it —
/// and the Next.js app hands the browser that token. Without this, a limited admin could call any admin
/// endpoint directly with their own token and bypass every check made in the web app.
///
/// The rules are deliberately small and default-deny. An admin endpoint is mapped to the same permission
/// resource the sidebar uses; anything this class cannot map is refused for a limited admin. Pure: no I/O,
/// so every branch is unit-tested.
/// </summary>
public static class AdminAccessPolicy
{
    /// <summary>Holding any of these is holding everything; no custom role may carry them.</summary>
    public static readonly IReadOnlySet<string> UnlimitedOnly = new HashSet<string>(StringComparer.Ordinal)
    {
        "access-control",
        "identity-users",
        "table-browser",
    };

    /// <summary>
    /// Catalogues every admin form leans on. A limited admin who holds anything may <em>read</em> them (never
    /// change them), so a bookings screen can still list categories without "categories" being granted too.
    /// </summary>
    private static readonly IReadOnlySet<string> ReferenceData = new HashSet<string>(StringComparer.Ordinal)
    {
        "categories",
        "provider-types",
        "service-definitions",
    };

    private const string CategoryAdmin = "category-module/admin/";

    /// <summary>Reads need <see cref="AdminAccessLevel.View"/>; anything that can write needs <see cref="AdminAccessLevel.Manage"/>.</summary>
    /// <param name="httpMethod">The HTTP method.</param>
    /// <returns>The level the request needs.</returns>
    public static AdminAccessLevel LevelFor(string? httpMethod) =>
        HttpMethods.IsGet(httpMethod ?? "GET") || HttpMethods.IsHead(httpMethod ?? "GET") || HttpMethods.IsOptions(httpMethod ?? "GET")
            ? AdminAccessLevel.View
            : AdminAccessLevel.Manage;

    /// <summary>
    /// The permission resource an admin route belongs to, or <c>null</c> when it is not mapped.
    /// </summary>
    /// <param name="route">The route pattern (<c>category-module/admin/categories/{id:guid}</c>) or the request path.</param>
    public static string? ResourceFor(string? route)
    {
        var r = (route ?? string.Empty).Trim('/').ToLowerInvariant();

        var at = r.IndexOf(CategoryAdmin, StringComparison.Ordinal);
        if (at >= 0)
        {
            var segment = r[(at + CategoryAdmin.Length)..].Split('/', 2)[0];
            return segment switch
            {
                "categories" => "categories",
                "service-definitions" => "service-definitions",
                "booking" or "bookings" => "bookings",
                "service-providers" => "service-providers",
                "staff" => "staff",
                "provider-types" => "provider-types",
                _ => null,
            };
        }

        if (r.Contains("customer-module/", StringComparison.Ordinal) && r.Contains("consult", StringComparison.Ordinal))
        {
            return "consultation-requests";
        }

        if (r.Contains("identity-module/", StringComparison.Ordinal))
        {
            return "identity-users";
        }

        return null;
    }

    /// <summary>May this person make this request to an admin endpoint?</summary>
    public static bool IsAllowed(AdminAccessSnapshot access, string? route, string? httpMethod)
    {
        switch (access.Kind)
        {
            case AdminAccessKind.Unmanaged:
                return true;
            case AdminAccessKind.Disabled:
                return false;
        }

        var level = LevelFor(httpMethod);
        var resource = ResourceFor(route);

        if (resource is not null)
        {
            if (UnlimitedOnly.Contains(resource))
            {
                return false;
            }

            if (access.Grants.TryGetValue(resource, out var granted) && (granted == AdminAccessLevel.Manage || level == AdminAccessLevel.View))
            {
                return true;
            }

            return level == AdminAccessLevel.View && ReferenceData.Contains(resource) && access.Grants.Count > 0;
        }

        // Admin endpoints outside the mapped areas.
        var r = (route ?? string.Empty).ToLowerInvariant();

        // File upload / delete: whoever may change something may attach a file to it.
        if (r.Contains("file", StringComparison.Ordinal))
        {
            return access.Grants.Values.Any(l => l == AdminAccessLevel.Manage);
        }

        // Geography lookups (countries, cities): reading is harmless.
        if (r.Contains("countr", StringComparison.Ordinal) || r.Contains("cities", StringComparison.Ordinal) || r.Contains("location", StringComparison.Ordinal))
        {
            return level == AdminAccessLevel.View && access.Grants.Count > 0;
        }

        return false;
    }
}
