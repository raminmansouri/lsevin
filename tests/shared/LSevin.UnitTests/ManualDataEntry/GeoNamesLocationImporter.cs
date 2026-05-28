namespace LSevin.UnitTests.Middlewares;

using System;
using System.Collections.Generic;
using System.Data;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using Dapper;
using Npgsql;
public sealed class GeoNamesLocationImporter
{
    private readonly string _connectionString;
    private readonly int _countryTypeId; // LocationType.Country.Id
    private readonly int _cityTypeId;    // you said 2
     private   int i = 0;

    public GeoNamesLocationImporter(string connectionString, int countryTypeId, int cityTypeId = 2)
    {
        _connectionString = connectionString;
        _countryTypeId = countryTypeId;
        _cityTypeId = cityTypeId;
    }
    
    private static readonly Regex ArabicScript =
        new(@"[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]", RegexOptions.Compiled);

    private static string PickPersianOrEnglishName(string englishName, string? alternateNames)
    {
        if (!string.IsNullOrWhiteSpace(alternateNames))
        {
            var candidates = alternateNames.Split(',')
                .Select(x => x.Trim())
                .Where(x => x.Length > 0)
                .Where(x => ArabicScript.IsMatch(x))
                .Distinct(StringComparer.Ordinal)
                .ToList();

            if (candidates.Count > 0)
                return candidates.OrderBy(x => x.Length).First();
        }

        return englishName;
    }

    public async Task ImportAsync(string countryInfoPath, string cities15000Path, CancellationToken ct = default)
    {
        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync(ct);

        // Make re-runs safe
        await EnsureIndexesAsync(conn, ct);

        await using var tx = await conn.BeginTransactionAsync(ct);

        // 1) Import countries
        var countries = ReadCountries(countryInfoPath);
        await InsertCountriesAsync(conn, tx, countries, ct);

        // Build countryCode -> countryId map (needed for city parent_id)
        var countryIdMap = await LoadCountryIdMapAsync(conn, tx, ct);

        // 2) Import cities (with dedup within country)
        await ImportCitiesAsync(conn, tx, cities15000Path, countryIdMap, ct);

        await tx.CommitAsync(ct);
    }

    private async Task EnsureIndexesAsync(NpgsqlConnection conn, CancellationToken ct)
    {
        // If you already have these constraints/indexes, this is harmless.
        var sql = $@"
create unique index if not exists ux_locations_country_code
on category.locations(code)
where location_type_id = {_countryTypeId};

create unique index if not exists ux_locations_city_parent_code
on category.locations(parent_id, code)
where location_type_id = {_cityTypeId};
";
        await conn.ExecuteAsync(new CommandDefinition(sql, cancellationToken: ct));
    }

    private static IEnumerable<CountryRow> ReadCountries(string path)
    {
        foreach (var line in File.ReadLines(path, Encoding.UTF8))
        {
            if (string.IsNullOrWhiteSpace(line)) continue;
            if (line.StartsWith("#", StringComparison.Ordinal)) continue;

            // GeoNames countryInfo.txt is tab-delimited.
            // We only need ISO and Country Name (and maybe population for display_order).
            var parts = line.Split('\t');
            if (parts.Length < 8) continue;

            var iso = parts[0]?.Trim();
            var countryName = parts[4]?.Trim(); // "Country" column
            var popStr = parts[7]?.Trim();

            if (string.IsNullOrWhiteSpace(iso) || string.IsNullOrWhiteSpace(countryName))
                continue;

            long population = 0;
            long.TryParse(popStr, NumberStyles.Integer, CultureInfo.InvariantCulture, out population);

            yield return new CountryRow
            {
                Iso2 = iso.ToUpperInvariant(),
                Name = countryName,
                Population = population
            };
        }
    }

    private async Task InsertCountriesAsync(
        NpgsqlConnection conn,
        IDbTransaction tx,
        IEnumerable<CountryRow> countries,
        CancellationToken ct)
    {
        const int batchSize = 500;

        var sql = $@"
insert into category.locations
(id,code, value_translations, location_type_id, parent_id, create_date, last_modified_date, display_order)
values (@Id,@Code, @ValueTranslations::jsonb, @TypeId, null, now(), now(), @DisplayOrder)
on conflict do nothing;
";

        foreach (var batch in countries.Chunk(batchSize))
        {
            var param = batch.Select(c => new
            {
                Id=Guid.NewGuid(),
                Code = c.Iso2,
                ValueTranslations = JsonSerializer.Serialize(new Dictionary<string, string> { ["en"] = c.Name }),
                TypeId = _countryTypeId,
                DisplayOrder = c.Population
            });

            await conn.ExecuteAsync(new CommandDefinition(sql, param, tx, cancellationToken: ct));
        }
    }

    private async Task<Dictionary<string, Guid>> LoadCountryIdMapAsync(NpgsqlConnection conn, IDbTransaction tx, CancellationToken ct)
    {
        var sql = $@"
select id, code
from category.locations
where location_type_id = {_countryTypeId};
";
        var rows = await conn.QueryAsync<(Guid id, string code)>(new CommandDefinition(sql, transaction: tx, cancellationToken: ct));
        return rows.ToDictionary(x => x.code, x => x.id, StringComparer.OrdinalIgnoreCase);
    }

    private async Task ImportCitiesAsync(
        NpgsqlConnection conn,
        IDbTransaction tx,
        string citiesPath,
        Dictionary<string, Guid> countryIdMap,
        CancellationToken ct)
    {
        // We'll dedup slugs per country as we stream, so we don't need to load all cities.
        var seenPerCountry = new Dictionary<string, Dictionary<string, int>>(StringComparer.OrdinalIgnoreCase);

        const int batchSize = 5000;
        var buffer = new List<dynamic>(batchSize);

        var insertSql = $@"
insert into category.locations
(id,code, value_translations, location_type_id, parent_id, create_date, last_modified_date, display_order)
values (@Id,@Code, @ValueTranslations::jsonb, @TypeId, @ParentId, now(), now(), @DisplayOrder)
on conflict do nothing;
";

        foreach (var line in File.ReadLines(citiesPath, Encoding.UTF8))
        {
            if (string.IsNullOrWhiteSpace(line)) continue;

            var parts = line.Split('\t');
            if (parts.Length < 15) continue;

            // cities15000.txt format (GeoNames "geoname" schema)
            // 0 geonameid, 1 name, 2 asciiname, 8 country_code, 14 population
            if (!long.TryParse(parts[0], out var geonameId)) continue;

            var name = parts[1]?.Trim();
            var ascii = parts[2]?.Trim();
            var countryCode = parts[8]?.Trim()?.ToUpperInvariant();
            var alternateNames = parts[3]?.Trim();   // ✅ add this

            var popStr = parts[14]?.Trim();

            if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(countryCode)) continue;
            if (!countryIdMap.TryGetValue(countryCode, out var parentId)) continue;

            long population = 0;
            long.TryParse(popStr, NumberStyles.Integer, CultureInfo.InvariantCulture, out population);

            var baseSlug = Slugify(string.IsNullOrWhiteSpace(ascii) ? name : ascii);

            // Dedup within country
            if (!seenPerCountry.TryGetValue(countryCode, out var seenSlugs))
            {
                seenSlugs = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
                seenPerCountry[countryCode] = seenSlugs;
            }

            string code;
            if (!seenSlugs.TryGetValue(baseSlug, out var count))
            {
                seenSlugs[baseSlug] = 1;
                code = baseSlug;
            }
            else
            {
                seenSlugs[baseSlug] = count + 1;
                code = $"{baseSlug}-{geonameId}";
            }

            Dictionary<string, string> dict;
            if (countryCode == "IR")
            {
                var faName = PickPersianOrEnglishName(name!, alternateNames);
                dict = new Dictionary<string, string> { ["en"] = name!, ["fa-ir"] = faName };
            }
            else
            {
                dict = new Dictionary<string, string> { ["en"] = name! };
            }

            buffer.Add(new
            {
                Id=Guid.NewGuid(),
                Code = code.Substring(0,code.Length > 9 ? 9 : code.Length),
                ValueTranslations = JsonSerializer.Serialize(dict),
                TypeId = _cityTypeId,
                ParentId = parentId,
                DisplayOrder = population
            });

            try
            {
                if (buffer.Count >= batchSize)
                {
                    await conn.ExecuteAsync(new CommandDefinition(insertSql, buffer, tx, cancellationToken: ct));
                    buffer.Clear();
                }
            }
            catch (Exception e)
            {
                Console.WriteLine(insertSql);
                Console.WriteLine(e);
                throw;
            }
        }

        if (buffer.Count > 0)
            await conn.ExecuteAsync(new CommandDefinition(insertSql, buffer, tx, cancellationToken: ct));
    }

    private static readonly Regex NonAlphaNum = new(@"[^a-zA-Z0-9]+", RegexOptions.Compiled);

    private static string Slugify(string input)
    {
        input = input.Trim();
        input = NonAlphaNum.Replace(input, "-");
        input = input.Trim('-');
        return input.ToLowerInvariant();
    }

    private sealed record CountryRow
    {
        public string Iso2 { get; init; } = default!;
        public string Name { get; init; } = default!;
        public long Population { get; init; }
    }
}
