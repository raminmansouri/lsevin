using BuildingBlocks.Core.Domain.Exceptions;
using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Validation.Common;
using BuildingBlocks.Web.Middlewares;
using Grpc.Core;
using LSevin.Tests.Shared.XunitCategories;
using LSevin.UnitTests.Abstractions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;

namespace LSevin.UnitTests.Middlewares;

/// <summary>
/// Tests for the <see cref="ExceptionHandler"/> class.
/// </summary>
public class ExceptionHandlerTests : BaseUnitTest
{
    #region Constructor

    private static readonly string _errorMessage = Faker.Lorem.Sentence();
    private readonly ExceptionHandler _handler;

    /// <summary>
    /// Initializes a new instance of the <see cref="ExceptionHandlerTests"/> class.
    /// </summary>
    public ExceptionHandlerTests()
    {
        var problemDetailsService = Substitute.For<IProblemDetailsService>();

        _handler = new ExceptionHandler(problemDetailsService, NullLogger<ExceptionHandler>.Instance);
    }

    #endregion

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public async Task TryHandleAsync_BusinessRuleValidationException_Returns409Conflict()
    {
        // Arrange
        var context = new DefaultHttpContext { Response = { Body = new MemoryStream() } };
        var exception = new BusinessRuleValidationException(new FakeBusinessRule());

        // Act
        var result = await _handler.TryHandleAsync(context, exception, default);

        // Assert
        result.Should().BeTrue();
        context.Response.StatusCode.Should().Be(StatusCodes.Status409Conflict);
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public async Task TryHandleAsync_DomainException_Returns400BadRequest()
    {
        // Arrange
        var context = new DefaultHttpContext { Response = { Body = new MemoryStream() } };
        var exception = new DomainException(_errorMessage);

        // Act
        var result = await _handler.TryHandleAsync(context, exception, default);

        // Assert
        result.Should().BeTrue();
        context.Response.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public async Task TryHandleAsync_ValidationException_Returns400BadRequest()
    {
        // Arrange
        var context = new DefaultHttpContext { Response = { Body = new MemoryStream() } };
        var exception = new ValidationException(_errorMessage);

        // Act
        var result = await _handler.TryHandleAsync(context, exception, default);

        // Assert
        result.Should().BeTrue();
        context.Response.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public async Task TryHandleAsync_RpcException_Returns400BadRequest()
    {
        // Arrange
        var context = new DefaultHttpContext { Response = { Body = new MemoryStream() } };
        var exception = new RpcException(new Status(StatusCode.InvalidArgument, _errorMessage));

        // Act
        var result = await _handler.TryHandleAsync(context, exception, default);

        // Assert
        result.Should().BeTrue();
        context.Response.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public async Task TryHandleAsync_UnknownException_Returns500InternalServerError()
    {
        // Arrange
        var context = new DefaultHttpContext { Response = { Body = new MemoryStream() } };
        var exception = new Exception(_errorMessage);

        // Act
        var result = await _handler.TryHandleAsync(context, exception, default);

        // Assert
        result.Should().BeTrue();
        context.Response.StatusCode.Should().Be(StatusCodes.Status500InternalServerError);
    }

    /// <summary>
    /// Represents a fake business rule.
    /// </summary>
    private sealed class FakeBusinessRule : IBusinessRule
    {
        /// <inheritdoc />
        public string Message => _errorMessage;

        /// <inheritdoc />
        public bool IsBroken() => true;
    }
}
