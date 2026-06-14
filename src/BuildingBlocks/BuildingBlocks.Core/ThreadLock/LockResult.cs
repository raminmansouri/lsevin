namespace BuildingBlocks.Core.ThreadLock;

/// <summary>
/// Represents the result of a lock operation.
/// </summary>
/// <typeparam name="T">The type of the result.</typeparam>
public readonly struct LockResult<T>
{
    public bool Success { get; }
    public T? Result { get; }
    public string? Message { get; }

    private LockResult(bool success, T? result = default, string? message = null)
    {
        Success = success;
        Result = result;
        Message = message;
    }

    public static LockResult<T> Succeeded(T result) => new(true, result);

    public static LockResult<T> Failed(string message) => new(false, message: message);
}
