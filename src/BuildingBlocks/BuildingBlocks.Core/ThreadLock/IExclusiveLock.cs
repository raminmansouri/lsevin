namespace BuildingBlocks.Core.ThreadLock;

/// <summary>
/// Represents a lock that is used to manage access to a resource, allowing multiple threads for read access or exclusive access for write access.
/// </summary>
public interface IExclusiveLock : IDisposable
{
    /// <summary>
    /// Acquires a read lock.
    /// </summary>
    /// <param name="obj">The object to lock.</param>
    /// <param name="token">The token to monitor for cancellation requests.</param>
    /// <returns>The object that represents the lock.</returns>
    Task<object> AcquireAsync(object obj, CancellationToken token = default);

    /// <summary>
    /// Releases a read lock.
    /// </summary>
    /// <param name="obj">The object to unlock.</param>
    /// <returns>A task that represents the asynchronous operation.</returns>
    Task ReleaseAsync(object obj);

    /// <summary>
    /// Executes the specified action with a read lock.
    /// </summary>
    /// <param name="obj">The object to lock.</param>
    /// <param name="action">The action to execute.</param>
    /// <param name="token">The token to monitor for cancellation requests.</param>
    /// <typeparam name="T">The type of the object to lock.</typeparam>
    void Execute<T>(T obj, Action<T> action, CancellationToken token = default);

    /// <summary>
    /// Executes the specified function with a read lock.
    /// </summary>
    /// <param name="obj">The object to lock.</param>
    /// <param name="func">The function to execute.</param>
    /// <param name="token">The token to monitor for cancellation requests.</param>
    /// <typeparam name="T">The type of the object to lock.</typeparam>
    /// <exception cref="TimeoutException">Thrown when the lock cannot be acquired within the specified timeout.</exception>
    /// <returns>A task that represents the asynchronous operation.</returns>
    Task ExecuteAsync<T>(T obj, Func<T, Task> func, CancellationToken token = default);
}
