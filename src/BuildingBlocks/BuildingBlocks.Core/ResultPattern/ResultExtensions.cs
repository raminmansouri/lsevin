using BuildingBlocks.Core.ErrorHandling;

namespace BuildingBlocks.Core.ResultPattern;

/// <summary>
/// Contains extension methods for the Result class.
/// </summary>
public static class ResultExtensions
{
    /// <summary>
    /// Ensures that the result satisfies a specified condition.
    /// </summary>
    public static Result<T> Ensure<T>(this Result<T> result, Func<T?, bool> predicate, AppError error) =>
        result.IsFailure ? result
        : predicate(result.Value) ? result
        : Result.Error<T>(error);

    /// <summary>
    /// Maps a result to a new result using the specified function.
    /// </summary>
    public static Result<TOut> Map<TIn, TOut>(this Result<TIn> result, Func<TIn, TOut> func) =>
        result is { IsSuccess: true, Value: not null }
            ? Result.Success(func(result.Value))
            : Result.Error<TOut>(result.Errors);

    /// <summary>
    /// Binds a result to a new result using the specified asynchronous function.
    /// </summary>
    public static async Task<Result<TOut>> Bind<TIn, TOut>(
        this Result<TIn> result,
        Func<TIn, Task<Result<TOut>>> func
    ) => result is { IsSuccess: true, Value: not null } ? await func(result.Value) : Result.Error<TOut>(result.Errors);

    /// <summary>
    /// Binds a result to a new result using the specified function.
    /// </summary>
    public static Result<TOut> Bind<TIn, TOut>(this Result<TIn> result, Func<TIn, Result<TOut>> func) =>
        result is { IsSuccess: true, Value: not null } ? func(result.Value) : Result.Error<TOut>(result.Errors);

    /// <summary>
    /// Matches the result to corresponding functions based on success or failure.
    /// </summary>
    public static async Task<TOut> Match<TIn, TOut>(
        this Task<Result<TIn>> resultTask,
        Func<TIn?, TOut> onSuccess,
        Func<IReadOnlyCollection<AppError>?, TOut> onFailure
    )
    {
        var result = await resultTask;
        return result.IsSuccess ? onSuccess(result.Value) : onFailure(result.Errors);
    }

    /// <summary>
    /// Matches the result to corresponding functions based on success or failure.
    /// </summary>
    public static TOut Match<TIn, TOut>(
        this Result<TIn> result,
        Func<TIn?, TOut> onSuccess,
        Func<IReadOnlyCollection<AppError>?, TOut> onFailure
    ) => result.IsSuccess ? onSuccess(result.Value) : onFailure(result.Errors);

    /// <summary>
    /// Executes an action on the result value if successful.
    /// </summary>
    public static Result<T> Tap<T>(this Result<T> result, Action<T?> action)
    {
        if (result.IsSuccess)
        {
            action(result.Value);
        }

        return result;
    }

    /// <summary>
    /// Returns a fallback value if the result is a failure.
    /// </summary>
    public static Result<T> OrElse<T>(this Result<T> result, Func<AppError?, T> fallback) =>
        result.IsSuccess ? result : Result.Success(fallback(result.Errors?.FirstOrDefault()));

    /// <summary>
    /// Filters a result based on a predicate.
    /// </summary>
    public static Result<T> Filter<T>(this Result<T> result, Func<T?, bool> predicate, AppError error)
    {
        if (result.IsSuccess && !predicate(result.Value))
        {
            return Result.Error<T>(error);
        }

        return result;
    }

    /// <summary>
    /// Wraps a synchronous function in a try-catch block.
    /// </summary>
    public static Result<TOut> TryCatch<TIn, TOut>(this Result<TIn> result, Func<TIn, TOut> func, AppError onError)
    {
        try
        {
            return result is { IsSuccess: true, Value: not null }
                ? Result.Success(func(result.Value))
                : Result.Error<TOut>(result.Errors);
        }
        catch (Exception ex)
        {
            Console.WriteLine(ex);
            return Result.Error<TOut>(onError);
        }
    }

    /// <summary>
    /// Wraps an asynchronous function in a try-catch block.
    /// </summary>
    public static async Task<Result<TOut>> TryCatch<TIn, TOut>(
        this Result<TIn> result,
        Func<TIn, Task<TOut>> func,
        AppError onError
    )
    {
        try
        {
            return result is { IsSuccess: true, Value: not null }
                ? Result.Success(await func(result.Value))
                : Result.Error<TOut>(result.Errors);
        }
        catch (Exception ex)
        {
            Console.WriteLine(ex);
            return Result.Error<TOut>(onError);
        }
    }

    /// <summary>
    /// Executes an action if the result is successful.
    /// </summary>
    public static Result<T> OnSuccess<T>(this Result<T> result, Action<T?> action)
    {
        if (result.IsSuccess)
        {
            action(result.Value);
        }

        return result;
    }

    /// <summary>
    /// Executes an action if the result is a failure.
    /// </summary>
    public static Result<T> OnFailure<T>(this Result<T> result, Action<IReadOnlyCollection<AppError>?> action)
    {
        if (result.IsFailure)
        {
            action(result.Errors);
        }

        return result;
    }

    /// <summary>
    /// Flattens a nested result into a single result.
    /// </summary>
    public static Result<T> Flatten<T>(this Result<Result<T>> result) =>
        result.IsFailure ? Result.Error<T>(result.Errors) : result.Value!;
}
