using Bogus;
using BuildingBlocks.Core.ErrorHandling;

namespace LSevin.Tests.Shared.FakeData;

/// <summary>
/// Represents a fake app error.
/// </summary>
public sealed class FakeAppError : Faker<AppError>
{
    /// <summary>
    /// Initializes a new instance of the <see cref="FakeAppError"/> class.
    /// </summary>
    public FakeAppError()
    {
        CustomInstantiator(f =>
        {
            var code = f.Random.Int(1, 100);
            var title = f.Lorem.Sentence();
            var message = f.Lorem.Sentence();

            return new AppError(code, title, message);
        });
    }
}
