using System.Collections.Concurrent;
using Microsoft.Extensions.Logging;

namespace BuildingBlocks.Core.ThreadLock;

/// <summary>
/// Represents a lock that is used to manage access to a resource, allowing multiple threads for read access or exclusive access for write access.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="ExclusiveLock"/> class.
/// </remarks>
/// <param name="logger">The logger.</param>
public sealed class ExclusiveLock(ILogger<ExclusiveLock> logger) : IExclusiveLock
{
    #region Fields

    private readonly ConcurrentDictionary<object, SemaphoreSlim> _semaphoreDictionary = new();
    private readonly ConcurrentDictionary<object, object> _lockDictionary = new();

    #endregion

    /// <inheritdoc />
    public Task<object> AcquireAsync(object obj, CancellationToken token = default)
    {
        var theLock = _lockDictionary.GetOrAdd(obj, _ => new object());
        var semaphore = _semaphoreDictionary.GetOrAdd(theLock, _ => new SemaphoreSlim(1, 1));

        return semaphore
            .WaitAsync(token)
            .ContinueWith(_ => theLock, token, TaskContinuationOptions.None, TaskScheduler.Default);
    }

    /// <inheritdoc />
    public Task ReleaseAsync(object obj)
    {
        var semaphore = _semaphoreDictionary.GetOrAdd(obj, _ => new SemaphoreSlim(1, 1));
        semaphore.Release();
        return Task.FromResult(0);
    }

    /// <inheritdoc />
    public void Execute<T>(T obj, Action<T> action, CancellationToken token = default)
    {
        if (obj is null)
        {
            return;
        }

        var theLock = _lockDictionary.GetOrAdd(obj, _ => new object());
        var semaphore = _semaphoreDictionary.GetOrAdd(theLock, _ => new SemaphoreSlim(1, 1));
        semaphore.Wait(token);

        try
        {
            action(obj);
        }
        catch (Exception e)
        {
            logger.LogError(e, "Exception when performing exclusive execute");
        }
        finally
        {
            semaphore.Release();
        }
    }

    /// <inheritdoc />
    public async Task ExecuteAsync<T>(T obj, Func<T, Task> func, CancellationToken token = default)
    {
        if (obj is null)
        {
            return;
        }

        var theLock = _lockDictionary.GetOrAdd(obj, _ => new object());
        var semaphore = _semaphoreDictionary.GetOrAdd(theLock, _ => new SemaphoreSlim(1, 1));
        await semaphore.WaitAsync(token);

        try
        {
            await func(obj);
        }
        catch (Exception e)
        {
            logger.LogError(e, "Exception when performing exclusive execute async");
        }
        finally
        {
            semaphore.Release();
        }
    }

    /// <inheritdoc />
    public void Dispose()
    {
        foreach (var slim in _semaphoreDictionary.Values)
        {
            slim.Dispose();
        }

        // ReSharper disable once GCSuppressFinalizeForTypeWithoutDestructor
        GC.SuppressFinalize(this);
    }
}
