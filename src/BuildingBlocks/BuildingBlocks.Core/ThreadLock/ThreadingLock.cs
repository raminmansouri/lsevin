using System.Collections.Concurrent;
using Microsoft.Extensions.Logging;

namespace BuildingBlocks.Core.ThreadLock;

/// <summary>
/// Implementation of exclusive lock using the new System.Threading.Lock.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="ThreadingLock"/> class.
/// </remarks>
/// <param name="logger">The logger.</param>
public sealed class ThreadingLock(ILogger<ThreadingLock> logger) : IThreadingLock
{
    private readonly ConcurrentDictionary<object, Lock> _lockDictionary = new();
    private const int DefaultTimeoutMs = 30000; // 30 seconds

    /// <inheritdoc />
    public LockResult<TResult> Execute<T, TResult>(T obj, Func<T, TResult> action, CancellationToken token = default)
    {
        if (obj is null)
        {
            return LockResult<TResult>.Failed("Object to lock is null");
        }

        if (token.IsCancellationRequested)
        {
            return LockResult<TResult>.Failed("Operation was cancelled");
        }

        var theLock = _lockDictionary.GetOrAdd(obj, _ => new Lock());

        if (!theLock.TryEnter(millisecondsTimeout: DefaultTimeoutMs))
        {
            logger.LogWarning("Failed to acquire lock for object of type {Type} within timeout period", typeof(T));
            return LockResult<TResult>.Failed("Failed to acquire lock within timeout period");
        }

        try
        {
            var result = action(obj);
            return LockResult<TResult>.Succeeded(result);
        }
        catch (System.Exception ex)
        {
            logger.LogError(ex, "Error executing action within lock for object of type {Type}", typeof(T));
            return LockResult<TResult>.Failed($"Error executing action: {ex.Message}");
        }
        finally
        {
            theLock.Exit();
        }
    }

    /// <inheritdoc />
    public async Task<LockResult<TResult>> ExecuteAsync<T, TResult>(
        T obj,
        Func<T, Task<TResult>> func,
        CancellationToken token = default
    )
    {
        if (obj is null)
        {
            return LockResult<TResult>.Failed("Object to lock is null");
        }

        if (token.IsCancellationRequested)
        {
            return LockResult<TResult>.Failed("Operation was cancelled");
        }

        var theLock = _lockDictionary.GetOrAdd(obj, _ => new Lock());

        if (!theLock.TryEnter(millisecondsTimeout: DefaultTimeoutMs))
        {
            logger.LogWarning("Failed to acquire lock for object of type {Type} within timeout period", typeof(T));
            return LockResult<TResult>.Failed("Failed to acquire lock within timeout period");
        }

        try
        {
            var result = await func(obj).ConfigureAwait(false);
            return LockResult<TResult>.Succeeded(result);
        }
        catch (System.Exception ex)
        {
            logger.LogError(ex, "Error executing async action within lock for object of type {Type}", typeof(T));
            return LockResult<TResult>.Failed($"Error executing action: {ex.Message}");
        }
        finally
        {
            theLock.Exit();
        }
    }

    /// <inheritdoc />
    public void Dispose()
    {
        _lockDictionary.Clear();
        GC.SuppressFinalize(this);
    }
}
