using LSevin.Tests.Shared.Fixtures;
using Microsoft.EntityFrameworkCore;

namespace LSevin.Tests.Shared.TestBase;

/// <summary>
/// Represents the base class for end-to-end tests.
/// </summary>
/// <typeparam name="TEntryPoint">The type of the entry point.</typeparam>
/// <remarks>
/// Initializes a new instance of the <see cref="EndToEndTestBase{TEntryPoint}"/> class.
/// </remarks>
/// <param name="sharedFixture">The shared fixture.</param>
/// <param name="outputHelper">The output helper.</param>
public abstract class EndToEndTestBase<TEntryPoint>(
    SharedFixture<TEntryPoint> sharedFixture,
    ITestOutputHelper outputHelper
) : IntegrationTestBase<TEntryPoint>(sharedFixture, outputHelper)
    where TEntryPoint : class
{
    /// <inheritdoc />
    public override Task DisposeAsync()
    {
        SharedFixture.ResetMocks();
        return base.DisposeAsync();
    }
}

/// <summary>
/// Represents the base class for end-to-end tests.
/// </summary>
/// <remarks>
/// This class is used to provide a base class for end-to-end tests.
/// </remarks>
/// <typeparam name="TEntryPoint">The type of the entry point.</typeparam>
/// <typeparam name="TContext">The type of the database context.</typeparam>
/// <param name="sharedFixture">The shared fixture.</param>
/// <param name="outputHelper">The output helper.</param>
public abstract class EndToEndTestBase<TEntryPoint, TContext>(
    SharedFixtureWithEfCore<TEntryPoint, TContext> sharedFixture,
    ITestOutputHelper outputHelper
) : EndToEndTestBase<TEntryPoint>(sharedFixture, outputHelper)
    where TEntryPoint : class
    where TContext : DbContext
{
    /// <summary>
    /// Gets the shared fixture.
    /// </summary>
    protected new SharedFixtureWithEfCore<TEntryPoint, TContext> SharedFixture { get; } = sharedFixture;
}
