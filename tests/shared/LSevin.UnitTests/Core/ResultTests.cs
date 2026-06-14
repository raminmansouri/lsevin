using System.Globalization;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Tests.Shared.XunitCategories;

namespace LSevin.UnitTests.Core;

/// <summary>
/// Represents the unit tests for the <see cref="Result"/> class.
/// </summary>
public class ResultTests : ResultBaseTest
{
    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void Success_ShouldCreateSuccessfulResult()
    {
        // Act
        var result = Result.Success();

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.IsFailure.Should().BeFalse();
        result.Errors.Should().BeNull();
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void Success_WithValue_ShouldCreateSuccessfulResult()
    {
        // Arrange
        var value = Faker.Lorem.Sentence();

        // Act
        var result = Result.Success(value);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.IsFailure.Should().BeFalse();
        result.Value.Should().Be(value);
        result.Errors.Should().BeNull();
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void Error_ShouldCreateFailureResult()
    {
        // Arrange

        // Act
        var result = Result.Error(RandomError);

        // Assert
        result.IsFailure.Should().BeTrue();
        result.IsSuccess.Should().BeFalse();
        result.Errors.Should().ContainSingle().Which.Should().Be(RandomError);
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void Error_WithGenericType_ShouldCreateFailureResult()
    {
        // Arrange

        // Act
        var result = Result.Error<string>(RandomError);

        // Assert
        result.IsFailure.Should().BeTrue();
        result.IsSuccess.Should().BeFalse();
        result.Value.Should().BeNull();
        result.Errors.Should().ContainSingle().Which.Should().Be(RandomError);
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void Create_WithNullValue_ShouldCreateFailureResult()
    {
        // Act
        var result = Result.Create<string>(value: null);

        // Assert
        result.IsFailure.Should().BeTrue();
        result.IsSuccess.Should().BeFalse();
        result.Value.Should().BeNull();
        result.Errors.Should().ContainSingle();
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void Create_WithNonNullValue_ShouldCreateSuccessResult()
    {
        // Arrange
        var value = Faker.Lorem.Word();

        // Act
        var result = Result.Create(value);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.IsFailure.Should().BeFalse();
        result.Value.Should().Be(value);
        result.Errors.Should().BeNull();
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void Ensure_WhenPredicateIsFalse_ShouldReturnErrorResult()
    {
        // Arrange
        var result = Result.Success(Faker.Lorem.Word());

        // Act
        var ensuredResult = result.Ensure(value => value?.Length > 100, RandomError);

        // Assert
        ensuredResult.IsFailure.Should().BeTrue();
        ensuredResult.Errors.Should().ContainSingle().Which.Should().Be(RandomError);
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void Map_WhenResultIsSuccess_ShouldTransformValue()
    {
        // Arrange
        var number = Faker.Random.Number(1, 100).ToString(CultureInfo.InvariantCulture);
        var result = Result.Success(number);

        // Act
        var mappedResult = result.Map(int.Parse);

        // Assert
        mappedResult.IsSuccess.Should().BeTrue();
        mappedResult.Value.Should().Be(int.Parse(number, CultureInfo.InvariantCulture));
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public async Task Bind_WhenResultIsSuccess_ShouldExecuteFunction()
    {
        // Arrange
        var delay = Faker.Random.Number(1, 10);
        var number = Faker.Random.Number(1, 100);
        var result = Result.Success(number);

        // Act
        var boundResult = await result.Bind(async value =>
        {
            await Task.Delay(delay, CancellationToken.None);
            return Result.Success(value * 2);
        });

        // Assert
        boundResult.IsSuccess.Should().BeTrue();
        boundResult.Value.Should().Be(number * 2);
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void Match_WhenResultIsSuccess_ShouldExecuteSuccessFunction()
    {
        // Arrange
        var number = Faker.Random.Number(1, 100);
        var result = Result.Success(number);

        // Act
        var matchResult = result.Match(
            onSuccess: value => $"{nameof(Result.Success)}: {value}",
            onFailure: errors => $"{nameof(Result.Error)}: {errors?.Count}"
        );

        // Assert
        matchResult.Should().Be($"{nameof(Result.Success)}: {number}");
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void Match_WhenResultIsFailure_ShouldExecuteFailureFunction()
    {
        // Arrange
        var result = Result.Error<int>(RandomError);

        // Act
        var matchResult = result.Match(
            onSuccess: value => $"{nameof(Result.Success)}: {value}",
            onFailure: errors => $"{nameof(Result.Error)}: {errors?.Count}"
        );

        // Assert
        matchResult.Should().Be($"{nameof(Result.Error)}: 1");
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public async Task TryCatch_WhenFunctionThrowsException_ShouldReturnErrorResult()
    {
        // Arrange
        var result = Result.Success(Faker.Random.Number(1, 100));

        // Act
        var catchResult = result.TryCatch<int, object>(
            func: _ => throw new Exception(nameof(Result)),
            onError: RandomError
        );

        // Assert
        var res = await catchResult;
        res.IsSuccess.Should().BeFalse();
        res.Errors.Should().ContainSingle().Which.Should().Be(RandomError);
    }

    // Add these new tests to the existing ResultTests class

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void ImplicitConversion_FromValue_ShouldCreateSuccessResult()
    {
        // Arrange
        var value = Faker.Lorem.Sentence();

        // Act
        Result<string> result = value;

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().Be(value);
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void ImplicitConversion_FromAppError_ShouldCreateFailureResult()
    {
        // Act
        Result<string> result = RandomError;

        // Assert
        result.IsFailure.Should().BeTrue();
        result.Errors.Should().ContainSingle().Which.Should().Be(RandomError);
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void ImplicitConversion_FromResultToValue_ShouldReturnValue()
    {
        // Arrange
        var value = Faker.Lorem.Sentence();
        var result = Result.Success(value);

        // Act
        string? convertedValue = result;

        // Assert
        convertedValue.Should().Be(value);
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void Tap_WhenResultIsSuccess_ShouldExecuteAction()
    {
        // Arrange
        var value = Faker.Lorem.Word();
        var result = Result.Success(value);
        var wasCalled = false;

        // Act
        var tappedResult = result.Tap(v =>
        {
            v.Should().Be(value);
            wasCalled = true;
        });

        // Assert
        tappedResult.Should().Be(result);
        wasCalled.Should().BeTrue();
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void OrElse_WhenResultIsFailure_ShouldReturnFallbackValue()
    {
        // Arrange
        var result = Result.Error<string>(RandomError);
        var fallbackValue = Faker.Lorem.Word();

        // Act
        var orElseResult = result.OrElse(_ => fallbackValue);

        // Assert
        orElseResult.IsSuccess.Should().BeTrue();
        orElseResult.Value.Should().Be(fallbackValue);
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void OnSuccess_WhenResultIsSuccess_ShouldExecuteAction()
    {
        // Arrange
        var value = Faker.Lorem.Word();
        var result = Result.Success(value);
        var wasCalled = false;

        // Act
        var onSuccessResult = result.OnSuccess(v =>
        {
            v.Should().Be(value);
            wasCalled = true;
        });

        // Assert
        onSuccessResult.Should().Be(result);
        wasCalled.Should().BeTrue();
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void OnFailure_WhenResultIsFailure_ShouldExecuteAction()
    {
        // Arrange
        var result = Result.Error<string>(RandomError);
        var wasCalled = false;

        // Act
        var onFailureResult = result.OnFailure(errors =>
        {
            errors.Should().ContainSingle().Which.Should().Be(RandomError);
            wasCalled = true;
        });

        // Assert
        onFailureResult.Should().Be(result);
        wasCalled.Should().BeTrue();
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void Flatten_ShouldFlattenNestedResult()
    {
        // Arrange
        var value = Faker.Lorem.Word();
        var nestedResult = Result.Success(Result.Success(value));

        // Act
        var flattenedResult = nestedResult.Flatten();

        // Assert
        flattenedResult.IsSuccess.Should().BeTrue();
        flattenedResult.Value.Should().Be(value);
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void Filter_WhenPredicateIsFalse_ShouldReturnErrorResult()
    {
        // Arrange
        var value = Faker.Random.Number(1, 50);
        var result = Result.Success(value);

        // Act
        var filteredResult = result.Filter(v => v > 100, RandomError);

        // Assert
        filteredResult.IsFailure.Should().BeTrue();
        filteredResult.Errors.Should().ContainSingle().Which.Should().Be(RandomError);
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public async Task TryCatch_Async_WhenFunctionThrowsException_ShouldReturnErrorResult()
    {
        // Arrange
        var result = Result.Success(Faker.Random.Number(1, 100));

        // Act
        var catchResult = await result.TryCatch<int, string>(
            async _ =>
            {
                await Task.Delay(10);
                throw new Exception(nameof(Result));
            },
            RandomError
        );

        // Assert
        catchResult.IsFailure.Should().BeTrue();
        catchResult.Errors.Should().ContainSingle().Which.Should().Be(RandomError);
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void OnSuccess_WhenResultIsFailure_ShouldNotExecuteAction()
    {
        // Arrange
        var result = Result.Error<string>(RandomError);
        var wasCalled = false;

        // Act
        var onSuccessResult = result.OnSuccess(_ =>
        {
            wasCalled = true;
        });

        // Assert
        onSuccessResult.Should().Be(result);
        wasCalled.Should().BeFalse();
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void OnFailure_WhenResultIsSuccess_ShouldNotExecuteAction()
    {
        // Arrange
        var result = Result.Success(Faker.Lorem.Word());
        var wasCalled = false;

        // Act
        var onFailureResult = result.OnFailure(_ =>
        {
            wasCalled = true;
        });

        // Assert
        onFailureResult.Should().Be(result);
        wasCalled.Should().BeFalse();
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void Flatten_WhenOuterResultIsFailure_ShouldReturnFailure()
    {
        // Arrange
        var outerResult = Result.Error<Result<string>>(RandomError);

        // Act
        var flattenedResult = outerResult.Flatten();

        // Assert
        flattenedResult.IsFailure.Should().BeTrue();
        flattenedResult.Errors.Should().ContainSingle().Which.Should().Be(RandomError);
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void Flatten_WhenInnerResultIsFailure_ShouldReturnFailure()
    {
        // Arrange
        var innerResult = Result.Error<string>(RandomError);
        var outerResult = Result.Success(innerResult);

        // Act
        var flattenedResult = outerResult.Flatten();

        // Assert
        flattenedResult.IsFailure.Should().BeTrue();
        flattenedResult.Errors.Should().ContainSingle().Which.Should().Be(RandomError);
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void Filter_WhenPredicateIsTrue_ShouldReturnOriginalResult()
    {
        // Arrange
        var value = Faker.Random.Number(101, 200);
        var result = Result.Success(value);

        // Act
        var filteredResult = result.Filter(v => v > 100, RandomError);

        // Assert
        filteredResult.IsSuccess.Should().BeTrue();
        filteredResult.Value.Should().Be(value);
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void Filter_WhenResultIsFailure_ShouldReturnOriginalFailure()
    {
        // Arrange
        var result = Result.Error<int>(RandomError);

        // Act
        var filteredResult = result.Filter(v => v > 100, RandomError);

        // Assert
        filteredResult.IsFailure.Should().BeTrue();
        filteredResult.Errors.Should().ContainSingle().Which.Should().Be(RandomError);
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void Tap_WhenResultIsFailure_ShouldNotExecuteAction()
    {
        // Arrange
        var result = Result.Error<string>(RandomError);
        var wasCalled = false;

        // Act
        var tappedResult = result.Tap(_ =>
        {
            wasCalled = true;
        });

        // Assert
        tappedResult.Should().Be(result);
        wasCalled.Should().BeFalse();
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void OrElse_WhenResultIsSuccess_ShouldReturnOriginalResult()
    {
        // Arrange
        var value = Faker.Lorem.Word();
        var result = Result.Success(value);
        var fallbackValue = Faker.Lorem.Word();

        // Act
        var orElseResult = result.OrElse(_ => fallbackValue);

        // Assert
        orElseResult.IsSuccess.Should().BeTrue();
        orElseResult.Value.Should().Be(value);
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public async Task Bind_WhenResultIsFailure_ShouldNotExecuteFunction()
    {
        // Arrange
        var result = Result.Error<int>(RandomError);
        var wasCalled = false;

        // Act
        var boundResult = await result.Bind(async value =>
        {
            wasCalled = true;
            await Task.Delay(1);
            return Result.Success(value * 2);
        });

        // Assert
        boundResult.IsFailure.Should().BeTrue();
        boundResult.Errors.Should().ContainSingle().Which.Should().Be(RandomError);
        wasCalled.Should().BeFalse();
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void Bind_Sync_WhenResultIsSuccess_ShouldExecuteFunction()
    {
        // Arrange
        var number = Faker.Random.Number(1, 100);
        var result = Result.Success(number);

        // Act
        var boundResult = result.Bind(value => Result.Success(value * 2));

        // Assert
        boundResult.IsSuccess.Should().BeTrue();
        boundResult.Value.Should().Be(number * 2);
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void Bind_Sync_WhenResultIsFailure_ShouldNotExecuteFunction()
    {
        // Arrange
        var result = Result.Error<int>(RandomError);
        var wasCalled = false;

        // Act
        var boundResult = result.Bind(value =>
        {
            wasCalled = true;
            return Result.Success(value * 2);
        });

        // Assert
        boundResult.IsFailure.Should().BeTrue();
        boundResult.Errors.Should().ContainSingle().Which.Should().Be(RandomError);
        wasCalled.Should().BeFalse();
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void Map_WhenResultIsFailure_ShouldNotTransformValue()
    {
        // Arrange
        var result = Result.Error<string>(RandomError);

        // Act
        var mappedResult = result.Map(int.Parse);

        // Assert
        mappedResult.IsFailure.Should().BeTrue();
        mappedResult.Errors.Should().ContainSingle().Which.Should().Be(RandomError);
    }
}
