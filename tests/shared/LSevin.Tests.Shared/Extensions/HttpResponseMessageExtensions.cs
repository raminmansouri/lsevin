using System.Net.Http.Json;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Exceptions;
using BuildingBlocks.Core.Resources;
using BuildingBlocks.Web.ProblemDetail;
using FluentAssertions.Primitives;
using Microsoft.AspNetCore.Mvc;

namespace LSevin.Tests.Shared.Extensions;

/// <summary>
/// Represents the extension methods for <see cref="HttpResponseMessage"/>.
/// </summary>
public static class HttpResponseMessageExtensions
{
    /// <summary>
    /// Check for exact expected problem detail and title in the response.
    /// </summary>
    /// <param name="assertions"></param>
    /// <param name="expectedProblem"></param>
    /// <returns></returns>
    public static AndConstraint<HttpResponseMessageAssertions> HasProblemDetail<T>(
        this HttpResponseMessageAssertions assertions,
        T expectedProblem
    )
        where T : ProblemDetails
    {
        var responseProblemDetails = assertions
            .Subject.Content.ReadFromJsonAsync<ProblemDetails>()
            .GetAwaiter()
            .GetResult();

        responseProblemDetails
            .Should()
            .BeEquivalentTo(
                expectedProblem,
                options => options.Including(p => p.Detail).Including(p => p.Detail).Including(p => p.Status)
            );

        var responseMessageAssertions = new HttpResponseMessageAssertions(assertions.Subject);

        return new AndConstraint<HttpResponseMessageAssertions>(responseMessageAssertions);
    }

    /// <summary>
    /// Check for containing expected problem detail and title in the response.
    /// </summary>
    /// <param name="assertions"></param>
    /// <param name="detail"></param>
    /// <param name="title"></param>
    /// <returns></returns>
    public static AndConstraint<HttpResponseMessageAssertions> ContainsProblemDetail(
        this HttpResponseMessageAssertions assertions,
        string detail,
        string? title = null
    )
    {
        var responseProblemDetails = assertions
            .Subject.Content.ReadFromJsonAsync<ProblemDetails>()
            .GetAwaiter()
            .GetResult();

        responseProblemDetails.Should().NotBeNull();
        responseProblemDetails!.Detail.Should().Contain(detail);

        if (!string.IsNullOrWhiteSpace(title))
        {
            responseProblemDetails.Title.Should().Be(title);
        }

        var responseMessageAssertions = new HttpResponseMessageAssertions(assertions.Subject);

        return new AndConstraint<HttpResponseMessageAssertions>(responseMessageAssertions);
    }

    /// <summary>
    /// Check for containing expected problem detail in the response.
    /// </summary>
    /// <param name="assertions"></param>
    /// <param name="expectedProblemDetails"></param>
    /// <returns></returns>
    public static AndConstraint<HttpResponseMessageAssertions> ContainsProblemDetail(
        this HttpResponseMessageAssertions assertions,
        ProblemDetails expectedProblemDetails
    )
    {
        var responseProblemDetails = assertions
            .Subject.Content.ReadFromJsonAsync<ProblemDetails>()
            .GetAwaiter()
            .GetResult();

        responseProblemDetails.Should().NotBeNull();

        if (!string.IsNullOrWhiteSpace(expectedProblemDetails.Title))
        {
            responseProblemDetails!.Title.Should().Be(expectedProblemDetails.Title);
        }

        if (!string.IsNullOrWhiteSpace(expectedProblemDetails.Detail))
        {
            responseProblemDetails!.Detail.Should().Contain(expectedProblemDetails.Detail);
        }

        if (!string.IsNullOrWhiteSpace(expectedProblemDetails.Type))
        {
            responseProblemDetails!.Type.Should().Be(expectedProblemDetails.Type);
        }

        if (expectedProblemDetails.Status is not null)
        {
            responseProblemDetails!.Status.Should().Be(expectedProblemDetails.Status);
        }

        var responseMessageAssertions = new HttpResponseMessageAssertions(assertions.Subject);

        return new AndConstraint<HttpResponseMessageAssertions>(responseMessageAssertions);
    }

    /// <summary>
    /// Check for containing expected problem detail and title in the response.
    /// </summary>
    /// <param name="assertions"></param>
    /// <param name="expectedObject">The expected object.</param>
    /// <param name="responseAction">The response action.</param>
    /// <typeparam name="TResponse">The type of the response.</typeparam>
    /// <returns>The current <see cref="AndConstraint{T}"/>.</returns>
    public static AndConstraint<HttpResponseMessageAssertions> HasResponse<TResponse>(
        this HttpResponseMessageAssertions assertions,
        object? expectedObject = null,
        Action<TResponse?>? responseAction = null
    )
    {
        assertions.BeSuccessful();

        var responseObject = assertions.Subject.Content.ReadFromJsonAsync<TResponse>().GetAwaiter().GetResult();

        responseObject.Should().NotBeNull();

        if (expectedObject is not null)
        {
            responseObject.Should().BeEquivalentTo(expectedObject, options => options.ExcludingMissingMembers());
        }

        responseAction?.Invoke(responseObject);

        var responseMessageAssertions = new HttpResponseMessageAssertions(assertions.Subject);
        return new AndConstraint<HttpResponseMessageAssertions>(responseMessageAssertions);
    }

    /// <summary>
    /// Asserts that the response is ok.
    /// </summary>
    /// <param name="assertions">The assertions.</param>
    /// <param name="additionalAssertions">The additional assertions.</param>
    /// <typeparam name="T">The type of the response.</typeparam>
    /// <returns>The current <see cref="AndConstraint{HttpResponseMessageAssertions}"/>.</returns>
    public static AndConstraint<HttpResponseMessageAssertions> BeOk<T>(
        this HttpResponseMessageAssertions assertions,
        Action<T>? additionalAssertions = null
    )
    {
        assertions.BeSuccessful();

        assertions
            .HasResponse<T>(responseAction: res =>
            {
                res.Should().NotBeNull();
                additionalAssertions?.Invoke(res!);
            })
            .And.Be200Ok();

        return new AndConstraint<HttpResponseMessageAssertions>(assertions);
    }

    /// <summary>
    /// Asserts that the response is created.
    /// </summary>
    /// <param name="assertions">The assertions.</param>
    /// <param name="additionalAssertions">The additional assertions.</param>
    /// <typeparam name="T">The type of the response.</typeparam>
    /// <returns>The current <see cref="AndConstraint{HttpResponseMessageAssertions}"/>.</returns>
    public static AndConstraint<HttpResponseMessageAssertions> BeCreated<T>(
        this HttpResponseMessageAssertions assertions,
        Action<ObjectAssertions>? additionalAssertions = null
    )
    {
        assertions.BeSuccessful();

        assertions
            .HasResponse<T>(responseAction: res =>
            {
                res.Should().NotBeNull();
                additionalAssertions?.Invoke(res.Should());
            })
            .And.Be201Created();

        return new AndConstraint<HttpResponseMessageAssertions>(assertions);
    }

    /// <summary>
    /// Asserts that the response is forbidden permission.
    /// </summary>
    /// <param name="assertions">The assertions.</param>
    /// <returns>The current <see cref="AndConstraint{HttpResponseMessageAssertions}"/>.</returns>
    public static AndConstraint<HttpResponseMessageAssertions> NotHavePermission(
        this HttpResponseMessageAssertions assertions
    )
    {
        assertions
            .HasProblemDetail(new CustomProblemDetails(new ForbiddenException(SharedResource.Access_Denied_Message)))
            .And.Be403Forbidden();

        return new AndConstraint<HttpResponseMessageAssertions>(assertions);
    }

    /// <summary>
    /// Asserts that the response is bad request for validation.
    /// </summary>
    /// <param name="assertions">The assertions.</param>
    /// <returns>The current <see cref="AndConstraint{HttpResponseMessageAssertions}"/>.</returns>
    public static AndConstraint<HttpResponseMessageAssertions> NotBeValid(this HttpResponseMessageAssertions assertions)
    {
        assertions
            .ContainsProblemDetail(new ProblemDetails { Title = SharedResource.Validation_Error })
            .And.Be400BadRequest();

        return new AndConstraint<HttpResponseMessageAssertions>(assertions);
    }

    /// <summary>
    /// Asserts that the response is bad request for business rule.
    /// </summary>
    /// <param name="assertions">The assertions.</param>
    /// <param name="message">The message.</param>
    /// <returns>The current <see cref="AndConstraint{HttpResponseMessageAssertions}"/>.</returns>
    public static AndConstraint<HttpResponseMessageAssertions> BeAgainstBusinessRule(
        this HttpResponseMessageAssertions assertions,
        string message
    )
    {
        assertions
            .ContainsProblemDetail(new ProblemDetails { Title = SharedResource.Business_Rule_Error, Detail = message })
            .And.Be409Conflict();

        return new AndConstraint<HttpResponseMessageAssertions>(assertions);
    }

    /// <summary>
    /// Assert that the response is not found.
    /// </summary>
    /// <param name="assertions">The assertions.</param>
    /// <param name="target">The target.</param>
    /// <returns>The current <see cref="AndConstraint{HttpResponseMessageAssertions}"/>.</returns>
    public static AndConstraint<HttpResponseMessageAssertions> NotBeNotFound(
        this HttpResponseMessageAssertions assertions,
        string target
    )
    {
        assertions
            .ContainsProblemDetail(
                new ProblemDetails { Title = SharedResource.Not_Found, Detail = AppError.NotFoundErrorMessage(target) }
            )
            .And.Be404NotFound();

        return new AndConstraint<HttpResponseMessageAssertions>(assertions);
    }
}
