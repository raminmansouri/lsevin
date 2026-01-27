using System.Security.Cryptography;

namespace BuildingBlocks.Core.Generators;

/// <summary>
/// Represents the ID generator.
/// </summary>
public static class IdGenerator
{
    /// <summary>
    /// Generates a new ID.
    /// </summary>
    /// <returns>The new ID.</returns>
    public static Guid NewId()
    {
        // return Guid.CreateVersion7();
        return Ulid.NewUlid().ToGuid();
    }

    /// <summary>
    /// Gets generates a new ID as a string.
    /// </summary>
    /// <returns>The new ID as a string.</returns>
    public static Guid EmptyId => Guid.Empty;

    /// <summary>
    /// Gets the empty ID as a string.
    /// </summary>
    public const string EmptyIdString = "00000000-0000-0000-0000-000000000000";

    /// <summary>
    /// Generates a secure random number.
    /// </summary>
    /// <param name="minValue">The minimum value.</param>
    /// <param name="maxValue">The maximum value.</param>
    /// <returns>The generated secure random number.</returns>
    public static int GenerateRandomNumber(int minValue, int maxValue)
    {
        using var rng = RandomNumberGenerator.Create();
        var randomNumber = new byte[4];
        rng.GetBytes(randomNumber);
        var value = BitConverter.ToInt32(randomNumber, 0);
        return Math.Abs(value % (maxValue - minValue + 1)) + minValue;
    }
}
