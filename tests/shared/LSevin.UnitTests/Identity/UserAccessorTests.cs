using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using BuildingBlocks.Core.Generators;
using BuildingBlocks.Security.Jwt.Services;
using LSevin.Tests.Shared.XunitCategories;
using LSevin.UnitTests.Abstractions;
using Microsoft.AspNetCore.Http;

namespace LSevin.UnitTests.Identity;

/// <summary>
/// Represents the unit tests for the <see cref="UserAccessor"/> class.
/// </summary>
public class UserAccessorTests : BaseUnitTest
{
    #region Constructor

    private readonly IHttpContextAccessor _httpContextAccessorMock;
    private readonly UserAccessor _userAccessor;

    /// <summary>
    /// Initializes a new instance of the <see cref="UserAccessorTests"/> class.
    /// </summary>
    public UserAccessorTests()
    {
        _httpContextAccessorMock = Substitute.For<IHttpContextAccessor>();
        _userAccessor = new UserAccessor(_httpContextAccessorMock);
    }

    #endregion

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void GetUserIdentity_WhenUserIsAuthenticated_ShouldReturnUserId()
    {
        // Arrange
        var userId = Faker.Random.Guid();
        SetupAuthenticatedUser(userId);

        // Act
        var result = _userAccessor.GetUserIdentity;

        // Assert
        result.Should().Be(userId);
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void GetUserIdentity_WhenUserIsNotAuthenticated_ShouldReturnEmptyGuid()
    {
        // Arrange
        SetupUnauthenticatedUser();

        // Act
        var result = _userAccessor.GetUserIdentity;

        // Assert
        result.Should().Be(IdGenerator.EmptyId);
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void IsAuthenticated_WhenUserIsAuthenticated_ShouldReturnTrue()
    {
        // Arrange
        SetupAuthenticatedUser(Faker.Random.Guid());

        // Act
        var result = _userAccessor.IsAuthenticated;

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void IsAuthenticated_WhenUserIsNotAuthenticated_ShouldReturnFalse()
    {
        // Arrange
        SetupUnauthenticatedUser();

        // Act
        var result = _userAccessor.IsAuthenticated;

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void GetUserEmail_WhenUserIsAuthenticated_ShouldReturnEmail()
    {
        // Arrange
        var email = Faker.Internet.Email();
        SetupAuthenticatedUser(Faker.Random.Guid(), email);

        // Act
        var result = _userAccessor.GetUserEmail;

        // Assert
        result.Should().Be(email);
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void GetUserEmail_WhenUserIsNotAuthenticated_ShouldReturnEmptyString()
    {
        // Arrange
        SetupUnauthenticatedUser();

        // Act
        var result = _userAccessor.GetUserEmail;

        // Assert
        result.Should().BeEmpty();
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void GetUserFullName_WhenUserIsAuthenticated_ShouldReturnFullName()
    {
        // Arrange
        const string fullName = "John Doe";
        SetupAuthenticatedUser(Faker.Random.Guid(), fullName: fullName);

        // Act
        var result = _userAccessor.GetUserFullName;

        // Assert
        result.Should().Be(fullName);
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void GetUserFullName_WhenUserIsNotAuthenticated_ShouldReturnEmptyString()
    {
        // Arrange
        SetupUnauthenticatedUser();

        // Act
        var result = _userAccessor.GetUserFullName;

        // Assert
        result.Should().BeEmpty();
    }

    /// <summary>
    /// Sets up an authenticated user.
    /// </summary>
    /// <param name="userId">The user identifier.</param>
    /// <param name="email">The email address.</param>
    /// <param name="fullName">The full name.</param>
    private void SetupAuthenticatedUser(Guid userId, string email = "test@example.com", string fullName = "John Doe")
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Email, email),
            new Claim(JwtRegisteredClaimNames.Name, fullName),
        };
        var identity = new ClaimsIdentity(claims, "TestAuthType");
        var principal = new ClaimsPrincipal(identity);

        var context = new DefaultHttpContext { User = principal };
        _httpContextAccessorMock.HttpContext.Returns(context);
    }

    /// <summary>
    /// Sets up an unauthenticated user.
    /// </summary>
    private void SetupUnauthenticatedUser()
    {
        var context = new DefaultHttpContext();
        _httpContextAccessorMock.HttpContext.Returns(context);
    }
}
