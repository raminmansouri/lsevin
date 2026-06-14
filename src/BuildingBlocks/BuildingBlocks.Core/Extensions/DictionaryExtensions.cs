namespace BuildingBlocks.Core.Extensions;

/// <summary>
/// Represents the dictionary extensions.
/// </summary>
public static class DictionaryExtensions
{
    /// <summary>
    /// Tries to add the key-value pair to the dictionary.
    /// </summary>
    /// <typeparam name="TKey">The key type.</typeparam>
    /// <typeparam name="TValue">The value type.</typeparam>
    /// <param name="dictionary">The dictionary.</param>
    /// <param name="key">The key.</param>
    /// <param name="value">The value.</param>
    /// <returns>The result of the operation.</returns>
    public static bool TryAdd<TKey, TValue>(this IDictionary<TKey, TValue> dictionary, TKey key, TValue value)
    {
        if (dictionary.ContainsKey(key))
        {
            return false;
        }

        dictionary.Add(key, value);
        return true;
    }

    /// <summary>
    /// Adds or replaces the key-value pair in the dictionary.
    /// </summary>
    /// <typeparam name="TKey">The key type.</typeparam>
    /// <typeparam name="TValue">The value type.</typeparam>
    /// <param name="dictionary">The dictionary.</param>
    /// <param name="key">The key.</param>
    /// <param name="value">The value.</param>
    /// <returns>The result of the operation.</returns>
    public static bool AddOrReplace<TKey, TValue>(this IDictionary<TKey, TValue> dictionary, TKey key, TValue value)
    {
        dictionary.Remove(key);

        return dictionary.TryAdd(key, value);
    }

    /// <summary>
    /// Gets the value from the dictionary by the key.
    /// </summary>
    /// <param name="dictionary">The dictionary.</param>
    /// <param name="key">The key.</param>
    /// <returns>The value.</returns>
    public static object? Get(this IDictionary<string, object?> dictionary, string key)
    {
        dictionary.TryGetValue(key, out object? val);

        return val;
    }

    /// <summary>
    /// Gets the value from the dictionary by the key.
    /// </summary>
    /// <typeparam name="TValue">The value type.</typeparam>
    /// <param name="dictionary">The dictionary.</param>
    /// <param name="key">The key.</param>
    /// <returns>The value.</returns>
    public static TValue? Get<TValue>(this IDictionary<string, object?> dictionary, string key)
        where TValue : class
    {
        dictionary.TryGetValue(key, out object? val);

        return val as TValue;
    }
}
