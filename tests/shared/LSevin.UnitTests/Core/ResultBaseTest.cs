using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Tests.Shared.FakeData;
using LSevin.UnitTests.Abstractions;

namespace LSevin.UnitTests.Core;

/// <summary>
/// Represents the base test for the <see cref="Result{TValue}"/> class.
/// </summary>
public abstract class ResultBaseTest : BaseUnitTest
{
    /// <summary>
    /// Creates a random app RandomError.
    /// </summary>
    /// <returns>The random app RandomError.</returns>
    protected static readonly AppError RandomError = new FakeAppError().Generate();
}
