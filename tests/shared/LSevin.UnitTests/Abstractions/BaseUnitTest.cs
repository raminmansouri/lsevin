using Bogus;
using BuildingBlocks.Core.Clock;

namespace LSevin.UnitTests.Abstractions;

/// <summary>
/// Represents the base test class.
/// </summary>
public abstract class BaseUnitTest : IDisposable
{
    /// <summary>
    /// Gets the faker for the test.
    /// </summary>
    protected static readonly Faker Faker = new();

    /// <summary>
    /// Initializes a new instance of the <see cref="BaseUnitTest"/> class.
    /// </summary>
    protected BaseUnitTest()
    {
        Setup();
    }

    /// <summary>
    /// Represents the test setup.
    /// </summary>
    private void Setup()
    {
        FixtureSetup();
    }

    /// <summary>
    /// Each test class should set up its fixture.
    /// </summary>
    protected virtual void FixtureSetup() { }

    /// <inheritdoc />
    public void Dispose()
    {
        GC.SuppressFinalize(this);
        SystemClock.Reset();
    }
}
