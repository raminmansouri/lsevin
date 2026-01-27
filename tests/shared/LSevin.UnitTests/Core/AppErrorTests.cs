using BuildingBlocks.Core.ErrorHandling;
using LSevin.Tests.Shared.FakeData;
using LSevin.Tests.Shared.XunitCategories;
using LSevin.UnitTests.Abstractions;

namespace LSevin.UnitTests.Core;

/// <summary>
/// Represents the unit tests for the <see cref="AppError"/> class.
/// </summary>
public class AppErrorTests : BaseUnitTest
{
    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    [CategoryTrait(TestCategory.Unit)]
    public void Constructor_ShouldCreateAppErrorWithProvidedValues()
    {
        // Arrange
        var appErrorInput = new FakeAppError().Generate();

        // Act
        var appError = new AppError(appErrorInput.Code, appErrorInput.Title, appErrorInput.Message);

        // Assert
        appError.Code.Should().Be(appErrorInput.Code);
        appError.Title.Should().Be(appErrorInput.Title);
        appError.Message.Should().Be(appErrorInput.Message);
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void ImplicitConversion_ToString_ShouldReturnErrorMessage()
    {
        // Arrange
        var appErrorInput = new FakeAppError().Generate();

        // Act
        string result = appErrorInput;

        // Assert
        result.Should().Be(appErrorInput.Message);
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void ImplicitConversion_NullAppError_ShouldReturnEmptyString()
    {
        // Arrange
        AppError? appError = null;

        // Act
        string result = appError;

        // Assert
        result.Should().BeEmpty();
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void Equality_SameValues_ShouldBeEqual()
    {
        // Arrange
        var appErrorInput = new FakeAppError().Generate();
        var error1 = new AppError(appErrorInput.Code, appErrorInput.Title, appErrorInput.Message);
        var error2 = new AppError(appErrorInput.Code, appErrorInput.Title, appErrorInput.Message);

        // Act & Assert
        error1.Should().Be(error2);
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void Equality_DifferentValues_ShouldNotBeEqual()
    {
        // Arrange
        var error1 = new FakeAppError().Generate();
        var error2 = new FakeAppError().Generate();

        // Act & Assert
        error1.Should().NotBe(error2);
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void WithMessage_ShouldCreateNewAppErrorWithUpdatedMessage()
    {
        // Arrange
        var originalError = new FakeAppError().Generate();
        var newMessage = Faker.Lorem.Sentence();

        // Act
        var updatedError = originalError with
        {
            Message = newMessage,
        };

        // Assert
        updatedError.Should().NotBe(originalError);
        updatedError.Code.Should().Be(originalError.Code);
        updatedError.Title.Should().Be(originalError.Title);
        updatedError.Message.Should().Be(newMessage);
    }
}
