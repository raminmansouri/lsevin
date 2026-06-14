using System.Collections.ObjectModel;
using System.Text.Json.Serialization;
using BuildingBlocks.Core.ErrorHandling;

namespace BuildingBlocks.Core.ResultPattern;

/// <summary>
/// Represents the outcome of an operation, which may be successful with a value, successful without a value, or may have errors.
/// </summary>
public class Result
{
    /// <summary>
    /// Gets the list of errors associated with the result, if any.
    /// </summary>
    public IReadOnlyCollection<AppError>? Errors { get; init; }

    /// <summary>
    /// Gets a value indicating whether the result represents a failure.
    /// </summary>
    [JsonIgnore]
    public bool IsFailure => Errors is { Count: > 0 };

    /// <summary>
    /// Gets a value indicating whether the result represents a success.
    /// </summary>
    [JsonIgnore]
    public bool IsSuccess => !IsFailure;

    /// <summary>
    /// Initializes a new instance of the <see cref="Result"/> class with the specified errors.
    /// </summary>
    /// <param name="errors">The errors associated with the result, if any.</param>
    protected Result(IReadOnlyCollection<AppError>? errors) => Errors = errors;

    /// <summary>
    /// Creates a successful result.
    /// </summary>
    /// <returns>The successful result.</returns>
    public static Result Success() => new(null);

    /// <summary>
    /// Creates a successful result with the specified value.
    /// </summary>
    /// <typeparam name="TValue">The type of the value.</typeparam>
    /// <param name="value">The value associated with the result.</param>
    /// <returns>The successful result.</returns>
    public static Result<TValue> Success<TValue>(TValue value) => new(value, null);

    /// <summary>
    /// Creates a result based on the specified value.
    /// </summary>
    /// <typeparam name="TValue">The type of the value.</typeparam>
    /// <param name="value">The value associated with the result.</param>
    /// <param name="errors"></param>
    /// <returns>The result.</returns>
    public static Result<TValue> Create<TValue>(TValue? value, IReadOnlyCollection<AppError>? errors = null) =>
        value is null || errors is { Count: > 0 }
            ? Error<TValue>(AppError.ApplicationErrorMessage("⚠️"))
            : Success(value);

    /// <summary>
    /// Creates an error result with the specified error.
    /// </summary>
    /// <param name="error">The error associated with the result.</param>
    /// <returns>The error result.</returns>
    public static Result Error(AppError error) => new(new ReadOnlyCollection<AppError>([error]));

    /// <summary>
    /// Creates an error result with the specified errors.
    /// </summary>
    /// <typeparam name="TValue">The type of the value.</typeparam>
    /// <param name="errors">The errors associated with the result.</param>
    /// <returns>The error result.</returns>
    public static Result<TValue> Error<TValue>(IReadOnlyCollection<AppError>? errors) => new(default, errors);

    /// <summary>
    /// Creates an error result with the specified error.
    /// </summary>
    /// <typeparam name="TValue">The type of the value.</typeparam>
    /// <param name="error">The error associated with the result.</param>
    /// <returns>The error result.</returns>
    public static Result<TValue> Error<TValue>(AppError error) => new(default, [error]);

    /// <summary>
    /// Implicitly converts an error to a failed result.
    /// </summary>
    /// <param name="error">The error to convert.</param>
    public static implicit operator Result(AppError error) => Error(error);
}

/// <summary>
/// Represents a result that contains a value or error(s).
/// </summary>
/// <typeparam name="TValue">The type of the value.</typeparam>
public class Result<TValue> : Result, IEquatable<Result<TValue>>
{
    /// <summary>
    /// Gets the value associated with the result, if any.
    /// </summary>
    public TValue? Value { get; }

    /// <summary>
    /// Gets a value indicating whether the result has a value.
    /// </summary>
    [JsonIgnore]
    public bool HasValue => Value is not null;

    /// <summary>
    /// Gets a value indicating whether the result has no value.
    /// </summary>
    [JsonIgnore]
    public bool HasNoValue => !HasValue;

    /// <summary>
    /// Initializes a new instance of the <see cref="Result{TValue}"/> class.
    /// </summary>
    /// <param name="value">The value.</param>
    /// <param name="errors">The errors.</param>
    [JsonConstructor]
    public Result(TValue? value, IReadOnlyCollection<AppError>? errors)
        : base(errors) => Value = value;

    /// <summary>
    /// Creates a successful result with the specified value.
    /// </summary>
    /// <param name="value">The value associated with the result.</param>
    /// <returns>The successful result.</returns>
    public static Result<TValue> From(TValue value) => new(value, null);

    /// <summary>
    /// Gets the default instance representing no value.
    /// </summary>
    public static Result<TValue> None => new(default, null);

    /// <summary>
    /// Implicitly converts a value to a successful result.
    /// </summary>
    /// <param name="value">The value to convert.</param>
    public static implicit operator Result<TValue>(TValue? value) => From(value!);

    /// <summary>
    /// Implicitly converts a result to its value.
    /// </summary>
    /// <param name="result">The result to convert.</param>
    public static implicit operator TValue?(Result<TValue> result) => result.Value;

    /// <summary>
    /// Implicitly converts an error to a failed result.
    /// </summary>
    /// <param name="error">The error to convert.</param>
    public static implicit operator Result<TValue>(AppError error) => Error<TValue>(error);

    /// <inheritdoc />
    public bool Equals(Result<TValue>? other)
    {
        if (other is null)
        {
            return false;
        }

        if (HasNoValue && other.HasNoValue)
        {
            return (Errors?.SequenceEqual(other.Errors ?? []) ?? other.Errors is null)
                && Value is null
                && other.Value is null;
        }

        if (HasNoValue || other.HasNoValue)
        {
            return false;
        }

        return EqualityComparer<TValue>.Default.Equals(Value!, other.Value!)
            && (Errors?.SequenceEqual(other.Errors ?? []) ?? other.Errors is null);
    }

    /// <inheritdoc />
    public override bool Equals(object? obj) =>
        obj switch
        {
            null => false,
            TValue value => Equals(new Result<TValue>(value, null)),
            Result<TValue> result => Equals(result),
            _ => false,
        };

    /// <inheritdoc />
    public override int GetHashCode()
    {
        var hash = default(HashCode);
        hash.Add(Value);
        if (Errors is null)
        {
            return hash.ToHashCode();
        }

        foreach (var error in Errors)
        {
            hash.Add(error);
        }

        return hash.ToHashCode();
    }
}
