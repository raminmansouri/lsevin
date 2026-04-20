using Ardalis.GuardClauses;
using BuildingBlocks.Core.Dtos.Localization;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Services;
using Dapper;
using LSevin.Modules.Category.Resources;
using LSevinModels.Models;
using System.Data;
using System.Text;
using System.Text.Json;
using System.Threading;
using static BuildingBlocks.Core.Observability.TelemetryTags.Tracing;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetAddOns;

internal sealed class GetAddOnsQueryHandler(
    IDbConnectionFactory dbConnectionFactory,
    ILocaleAccessor localeAccessor
) : IQueryHandler<GetAddOnsQuery, AddonListResponse>
{
    public async Task<Result<AddonListResponse>> Handle(
        GetAddOnsQuery request,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(request, nameof(request));

        await using var connection = await dbConnectionFactory.GetOrCreateConnectionAsync(cancellationToken);
        var parameters = new DynamicParameters();

        using(var context=new LsevinContext())
        {
            int maxImagesPerProvider = 5;   // e.g. most recent 5 images

          

        }

        // Build the query with optional filters
        var sql = new StringBuilder();
        var currentLocale = localeAccessor.CurrentLocale;
        var defaultLocale = localeAccessor.DefaultLocale;

        var response= AddonProvider.GetAddons();
        return response;
    }


    // ─────────────────────────────────────────────────────────────────────────
    // 1.  Get ALL addons (no filter) → AddonListResponse
    //     Multi-mapping: addons  ×  addon_details
    //     One row per detail; addons are deduplicated client-side.
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Returns every active add-on with its detail bullets.
    /// Uses Dapper multi-mapping to join <c>addons</c> → <c>addon_details</c>.
    /// </summary>
    public async Task<AddonListResponse> GetAllAddonsAsync(
        CancellationToken ct = default)
    {
        const string sql = """
            SELECT
                a.id,
                a.name,
                a.description,
                a.price,
                a.icon,
                a.popular,
                -- split point ──────────────────────────
                d.id          AS detail_id,
                d.addon_id,
                d.detail,
                d.display_order
            FROM  category.addons        a
            LEFT JOIN category.addon_details d
                   ON d.addon_id = a.id
            ORDER BY a.id, d.display_order;
            """;
        await using var _db = await dbConnectionFactory.GetOrCreateConnectionAsync(CancellationToken.None);

        var addonMap = new Dictionary<string, Addon>();

        await _db.QueryAsync<Addon, AddonDetailRow, Addon>(
            sql,
            map: (addon, detail) =>
            {
                if (!addonMap.TryGetValue(addon.Id, out var existing))
                {
                    existing = addon;
                    existing.Details = new List<string>();
                    addonMap[addon.Id] = existing;
                }

                if (detail is not null && detail.Detail is not null)
                    existing.Details.Add(detail.Detail);

                return existing;
            },
            splitOn: "detail_id",
            commandType: CommandType.Text
        );

        return new AddonListResponse { Addons = addonMap.Values.ToList() };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2.  Get addons for a specific provider service
    //     Multi-mapping: addons  ×  addon_details  (filtered via link table)
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Returns all add-ons available for the given <paramref name="providerServiceId"/>.
    /// </summary>
    public async Task<AddonListResponse> GetAddonsByProviderServiceAsync(
        Guid providerServiceId,
        CancellationToken ct = default)
    {
        const string sql = """
            SELECT
                a.id,
                a.name,
                a.description,
                a.price,
                a.icon,
                a.popular,
                -- split point ──────────────────────────
                d.id          AS detail_id,
                d.addon_id,
                d.detail,
                d.display_order
            FROM  category.provider_service_addons psa
            JOIN  category.addons                  a
                   ON a.id = psa.addon_id
            LEFT JOIN category.addon_details       d
                   ON d.addon_id = a.id
            WHERE psa.provider_service_id = @ProviderServiceId
            ORDER BY a.id, d.display_order;
            """;

        var addonMap = new Dictionary<string, Addon>();

        await using var _db = await dbConnectionFactory.GetOrCreateConnectionAsync(CancellationToken.None);
        await _db.QueryAsync<Addon, AddonDetailRow, Addon>(
            sql,
            map: (addon, detail) =>
            {
                if (!addonMap.TryGetValue(addon.Id, out var existing))
                {
                    existing = addon;
                    existing.Details = new List<string>();
                    addonMap[addon.Id] = existing;
                }

                if (detail is not null && detail.Detail is not null)
                    existing.Details.Add(detail.Detail);

                return existing;
            },
            param: new { ProviderServiceId = providerServiceId },
            splitOn: "detail_id",
            commandType: CommandType.Text
        );

        return new AddonListResponse { Addons = addonMap.Values.ToList() };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3.  Get a single addon by its text ID
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Returns one <see cref="Addon"/> (with details) or <c>null</c> if not found.
    /// </summary>
    public async Task<Addon?> GetAddonByIdAsync(
        string addonId,
        CancellationToken ct = default)
    {
        const string sql = """
            SELECT
                a.id,
                a.name,
                a.description,
                a.price,
                a.icon,
                a.popular,
                -- split point ──────────────────────────
                d.id          AS detail_id,
                d.addon_id,
                d.detail,
                d.display_order
            FROM  category.addons        a
            LEFT JOIN category.addon_details d
                   ON d.addon_id = a.id
            WHERE a.id = @AddonId
            ORDER BY d.display_order;
            """;

        Addon? result = null;

        await using var _db = await dbConnectionFactory.GetOrCreateConnectionAsync(CancellationToken.None);
        await _db.QueryAsync<Addon, AddonDetailRow, Addon>(
            sql,
            map: (addon, detail) =>
            {
                result ??= addon;
                result.Details ??= new List<string>();

                if (detail is not null && detail.Detail is not null)
                    result.Details.Add(detail.Detail);

                return result;
            },
            param: new { AddonId = addonId },
            splitOn: "detail_id",
            commandType: CommandType.Text
        );

        return result;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4.  Get popular addons only
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Returns only add-ons where <c>popular = true</c>.
    /// </summary>
    public async Task<AddonListResponse> GetPopularAddonsAsync(
        CancellationToken ct = default)
    {
        const string sql = """
            SELECT
                a.id,
                a.name,
                a.description,
                a.price,
                a.icon,
                a.popular,
                -- split point ──────────────────────────
                d.id          AS detail_id,
                d.addon_id,
                d.detail,
                d.display_order
            FROM  category.addons        a
            LEFT JOIN category.addon_details d
                   ON d.addon_id = a.id
            WHERE a.popular = true
            ORDER BY a.id, d.display_order;
            """;

        var addonMap = new Dictionary<string, Addon>();

        await using var _db = await dbConnectionFactory.GetOrCreateConnectionAsync(CancellationToken.None);
        await _db.QueryAsync<Addon, AddonDetailRow, Addon>(
            sql,
            map: (addon, detail) =>
            {
                if (!addonMap.TryGetValue(addon.Id, out var existing))
                {
                    existing = addon;
                    existing.Details = new List<string>();
                    addonMap[addon.Id] = existing;
                }

                if (detail is not null && detail.Detail is not null)
                    existing.Details.Add(detail.Detail);

                return existing;
            },
            splitOn: "detail_id",
            commandType: CommandType.Text
        );

        return new AddonListResponse { Addons = addonMap.Values.ToList() };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 5.  Batch fetch – multiple addon IDs (e.g., from a booking's add_ons JSONB)
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// Fetches multiple add-ons by a set of IDs in one round-trip.
    /// Useful when the booking's <c>add_ons</c> JSONB has been parsed into a list of IDs.
    /// </summary>
    public async Task<AddonListResponse> GetAddonsByIdsAsync(
        IEnumerable<string> addonIds,
        CancellationToken ct = default)
    {
        var ids = addonIds as string[] ?? addonIds.ToArray();
        if (ids.Length == 0)
            return new AddonListResponse();

        const string sql = """
            SELECT
                a.id,
                a.name,
                a.description,
                a.price,
                a.icon,
                a.popular,
                -- split point ──────────────────────────
                d.id          AS detail_id,
                d.addon_id,
                d.detail,
                d.display_order
            FROM  category.addons        a
            LEFT JOIN category.addon_details d
                   ON d.addon_id = a.id
            WHERE a.id = ANY(@Ids)
            ORDER BY a.id, d.display_order;
            """;

        var addonMap = new Dictionary<string, Addon>();

        await using var _db = await dbConnectionFactory.GetOrCreateConnectionAsync(CancellationToken.None);
        await _db.QueryAsync<Addon, AddonDetailRow, Addon>(
            sql,
            map: (addon, detail) =>
            {
                if (!addonMap.TryGetValue(addon.Id, out var existing))
                {
                    existing = addon;
                    existing.Details = new List<string>();
                    addonMap[addon.Id] = existing;
                }

                if (detail is not null && detail.Detail is not null)
                    existing.Details.Add(detail.Detail);

                return existing;
            },
            param: new { Ids = ids },
            splitOn: "detail_id",
            commandType: CommandType.Text
        );

        return new AddonListResponse { Addons = addonMap.Values.ToList() };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private helper type – maps the right half of the multi-mapping join
    // ─────────────────────────────────────────────────────────────────────────

    private sealed class AddonDetailRow
    {
        // Aliased to "detail_id" in every query – used as the Dapper splitOn point
        public Guid? Id { get; init; }
        public string? AddonId { get; init; }
        public string? Detail { get; init; }
        public int DisplayOrder { get; init; }
    }
}

