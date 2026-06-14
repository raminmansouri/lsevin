using System.Net;
using System.Numerics;
using BuildingBlocks.Core.Extensions;
using BuildingBlocks.Core.Resources;

namespace BuildingBlocks.Core.ErrorHandling;

/// <summary>
/// Represents an application error with a code and message.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="AppError"/> class with specified code and message.
/// </remarks>
/// <param name="Code">The error code.</param>
/// <param name="Title">The error title.</param>
/// <param name="Message">The error message.</param>
public sealed record AppError(int Code, string Title, string Message)
{
    /// <summary>
    /// Converts the error to a string.
    /// </summary>
    /// <param name="error">The error.</param>
    public static implicit operator string(AppError? error) => error?.Message ?? string.Empty;

    /// <summary>
    /// Returns the message for the given resource name.
    /// </summary>
    /// <param name="resourceName">The resource name.</param>
    /// <returns>A <see cref="AppError"/> instance.</returns>
    public static AppError AuthenticationError(string resourceName)
    {
        return new AppError((int)HttpStatusCode.Unauthorized, SharedResource.Authentication_Error, resourceName);
    }

    /// <summary>
    /// Returns the message for the given resource name.
    /// </summary>
    /// <param name="resourceName">The resource name.</param>
    /// <returns>A <see cref="AppError"/> instance.</returns>
    public static AppError ForbiddenError(string resourceName)
    {
        return new AppError((int)HttpStatusCode.Forbidden, SharedResource.Access_Denied_Error, resourceName);
    }

    /// <summary>
    ///  Returns the message for the given resource name.
    /// </summary>
    /// <param name="resourceName">The resource name.</param>
    /// <returns>A <see cref="AppError"/> instance.</returns>
    public static AppError NotFoundErrorMessage(string resourceName)
    {
        return new AppError(
            (int)HttpStatusCode.NotFound,
            Title: SharedResource.Not_Found,
            Message: SharedResource.Not_Found_Error_Message.FormatWithStr(resourceName)
        );
    }

    /// <summary>
    /// Returns the message for the given resource name.
    /// </summary>
    /// <returns>A <see cref="AppError"/> instance.</returns>
    public static AppError UnAuthorizedError()
    {
        return new AppError(
            (int)HttpStatusCode.Unauthorized,
            Title: SharedResource.Access_Denied_Error,
            Message: SharedResource.Access_Denied_Message
        );
    }

    /// <summary>
    ///  Returns the message for the given resource name.
    /// </summary>
    /// <param name="resourceName">The resource name.</param>
    /// <param name="message">The message.</param>
    /// <returns>A <see cref="AppError"/> instance.</returns>
    public static AppError ApplicationErrorMessage(string resourceName, string? message = "")
    {
        return new AppError(
            (int)HttpStatusCode.BadRequest,
            Title: SharedResource.Application_Error,
            Message: string.IsNullOrWhiteSpace(message) ? resourceName : message
        );
    }

    /// <summary>
    /// Returns the message for the given resource name.
    /// </summary>
    /// <param name="resourceName">The resource name.</param>
    /// <returns>A message string.</returns>
    public static string RequiredMessage(string resourceName)
    {
        return SharedResource.Required_Error_Message.FormatWithStr(resourceName);
    }

    /// <summary>
    /// Returns the message for the given resource name.
    /// </summary>
    /// <param name="resourceName">The resource name.</param>
    /// <param name="to">The param for comparison.</param>
    /// <returns>A message string.</returns>
    public static string GreaterThanOrEqualToMessage<T>(string resourceName, T to = default)
        where T : struct, IComparable, INumber<T>
    {
        var resourceTitle =
            to == default
                ? SharedResource.Greater_Than_Zero_Error_Message
                : SharedResource.Greater_Or_Equal_Error_Message;
        return resourceTitle.FormatWithStr(resourceName, to);
    }

    /// <summary>
    /// Returns the message for the given resource name.
    /// </summary>
    /// <param name="resourceName">The resource name.</param>
    /// <param name="to">The param for comparison.</param>
    /// <returns>A message string.</returns>
    public static string LessThanOrEqualToMessage<T>(string resourceName, T to)
        where T : struct, IComparable, INumber<T>
    {
        return SharedResource.Less_Or_Equal_Error_Message.FormatWithStr(resourceName, to);
    }

    /// <summary>
    /// Returns the message for the given resource name.
    /// </summary>
    /// <param name="resourceName">The resource name.</param>
    /// <returns>A message string.</returns>
    public static string ValidationMessage(string resourceName)
    {
        return SharedResource.Validation_Error_Message.FormatWithStr(resourceName);
    }

    /// <summary>
    /// Returns the message for the given resource name.
    /// </summary>
    /// <param name="resourceName">The resource name.</param>
    /// <param name="minLength">The min length param for comparison.</param>
    /// <returns>A message string.</returns>
    public static string MinLengthMessage(string resourceName, int minLength)
    {
        return SharedResource.Greater_Length_Error_Message.FormatWithStr(resourceName, minLength);
    }

    /// <summary>
    /// Returns the message for the given resource name.
    /// </summary>
    /// <param name="resourceName">The resource name.</param>
    /// <param name="maxLength">The maxlength param for comparison.</param>
    /// <returns>A message string.</returns>
    public static string MaxLengthMessage(string resourceName, int maxLength)
    {
        return SharedResource.Less_Length_Error_Message.FormatWithStr(resourceName, maxLength);
    }
}
