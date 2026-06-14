using Microsoft.AspNetCore.Http;

namespace BuildingBlocks.Core.Web.Extensions;

/// <summary>
/// Represents the header dictionary extensions.
/// </summary>
public static class HeaderDictionaryExtensions
{
    /// <summary>
    /// Gets the value of the specified key.
    /// </summary>
    /// <typeparam name="T">The type of the value.</typeparam>
    /// <param name="collection">The collection.</param>
    /// <param name="key">The key.</param>
    /// <returns>The value of the specified key.</returns>
    public static IReadOnlyList<T> All<T>(this IHeaderDictionary collection, string key)
    {
        var values = new List<T>();

        if (!collection.TryGetValue(key, out var results))
            return values;

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

        // return an array with at least one
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
        this IHeaderDictionary collection,
        string key,
        T? @default = default,
        ParameterPick option = ParameterPick.First
    )
    {
        var values = All<T>(collection, key).ToList();
        var value = @default;

        if (values.Count != 0)
        {
            value = option switch
            {
                ParameterPick.First => values.FirstOrDefault(),
                ParameterPick.Last => values.LastOrDefault(),
                _ => value,
            };
        }

        return value ?? @default;
    }
}

/// <summary>
/// Represents the parameter pick.
/// </summary>
public enum ParameterPick
{
    First,
    Last,
}
