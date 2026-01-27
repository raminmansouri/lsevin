using System.Collections;
using System.Text.Json;
using BuildingBlocks.Core.Extensions;
using Microsoft.AspNetCore.Http;

namespace BuildingBlocks.Core.Web.Extensions;

/// <summary>
/// Represents the query collection extensions.
/// </summary>
public static class QueryCollectionExtensions
{
    /// <summary>
    /// Gets the value of the specified key.
    /// </summary>
    /// <typeparam name="T">The type of the value.</typeparam>
    /// <param name="collection">The collection.</param>
    /// <param name="key">The key.</param>
    /// <returns>The value of the specified key.</returns>
    public static IReadOnlyList<T> All<T>(this IQueryCollection collection, string key)
    {
        List<T> values = new();

        if (collection.TryGetValue(key, out var results))
        {
            foreach (var s in results)
            {
                try
                {
                    var result = (T)Convert.ChangeType(s, typeof(T))!;
                    values.Add(result);
                }
                catch (Exception ex)
                {
                    Console.WriteLine(ex);
                }
            }
        }

        return values;
    }

    /// <summary>
    /// Gets the value of the specified key.
    /// </summary>
    /// <typeparam name="T">The type of the value.</typeparam>
    /// <param name="collection">The collection.</param>
    /// <param name="key">The key.</param>
    /// <param name="default">The default value.</param>
    /// <param name="option">The option.</param>
    /// <returns>The value of the specified key.</returns>
    public static T? Get<T>(
        this IQueryCollection collection,
        string key,
        T? @default = default,
        ParameterPick option = ParameterPick.First
    )
    {
        var values = All<T>(collection, key);
        var value = @default;

        if (values.Any())
        {
            value = option switch
            {
                ParameterPick.First => values[0],
                ParameterPick.Last => values[^1],
                _ => value,
            };
        }

        return value ?? @default;
    }

    /// <summary>
    /// Gets the value of the specified key.
    /// </summary>
    /// <typeparam name="T">The type of the value.</typeparam>
    /// <param name="collection">The collection.</param>
    /// <param name="key">The key.</param>
    /// <param name="default">The default value.</param>
    /// <returns>The value of the specified key.</returns>
    public static T? GetCollection<T>(this IQueryCollection collection, string key, T? @default = default)
        where T : IEnumerable
    {
        var type = typeof(T).GetGenericArguments()[0];
        var listType = typeof(List<>);
        var constructedListType = listType.MakeGenericType(type);
        dynamic values = Activator.CreateInstance(constructedListType)!;

        if (collection.TryGetValue(key, out var results))
        {
            foreach (var s in results)
            {
                try
                {
                    if ((s ?? string.Empty).IsValidJson())
                    {
                        dynamic result = JsonSerializer.Deserialize(s!, type)!;
                        values.Add(result);
                    }
                    else
                    {
                        dynamic result = Convert.ChangeType(s, type)!;
                        values.Add(result);
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine(ex);
                }
            }
        }
        else
        {
            return @default;
        }

        return values;
    }
}
