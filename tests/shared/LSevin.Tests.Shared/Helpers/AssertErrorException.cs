namespace LSevin.Tests.Shared.Helpers;

/// <summary>
/// Represents an exception that is thrown when an assertion fails.
/// </summary>
public class AssertErrorException : Exception
{
    /// <summary>
    /// Initializes a new instance of the <see cref="AssertErrorException"/> class.
    /// </summary>
    public AssertErrorException() { }

    /// <summary>
    /// Initializes a new instance of the <see cref="AssertErrorException"/> class.
    /// </summary>
    /// <param name="message">The message that describes the error.</param>
    public AssertErrorException(string message)
        : base(message) { }

    /// <summary>
    /// Initializes a new instance of the <see cref="AssertErrorException"/> class.
    /// </summary>
    /// <param name="message">The message that describes the error.</param>
    /// <param name="innerException">The exception that is the cause of the current exception.</param>
    public AssertErrorException(string message, Exception innerException)
        : base(message, innerException) { }
}
