namespace BuildingBlocks.Core.ThreadLock;

/// <summary>
/// Represents a lock that is used to manage access to a resource.
/// </summary>
public interface IThreadingLock : IDisposable
{
    /// <summary>
    /// Executes the specified action within a lock.
    /// </summary>
    /// <param name="obj">The object to lock.</param>
    /// <param name="action">The action to execute.</param>
    /// <param name="token">The token to monitor for cancellation requests.</param>
    /// <typeparam name="T">The type of the object to lock.</typeparam>
    /// <typeparam name="TResult">The type of the result.</typeparam>
    LockResult<TResult> Execute<T, TResult>(T obj, Func<T, TResult> action, CancellationToken token = default);

    /// <summary>
    /// Executes the specified function within a lock asynchronously.
    /// </summary>
    /// <param name="obj">The object to lock.</param>
    /// <param name="func">The function to execute.</param>
    /// <param name="token">The token to monitor for cancellation requests.</param>
    /// <typeparam name="T">The type of the object to lock.</typeparam>
    /// <typeparam name="TResult">The type of the result.</typeparam>
    Task<LockResult<TResult>> ExecuteAsync<T, TResult>(
        T obj,
        Func<T, Task<TResult>> func,
        CancellationToken token = default
    );
}
