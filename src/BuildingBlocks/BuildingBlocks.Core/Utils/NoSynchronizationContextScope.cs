namespace BuildingBlocks.Core.Utils;

/// <summary>
/// Represents the no synchronization context scope.
/// </summary>
public static class NoSynchronizationContextScope
{
    /// <summary>
    /// Enters the no synchronization context scope.
    /// </summary>
    /// <returns>The disposable.</returns>
    public static Disposable Enter()
    {
        var context = SynchronizationContext.Current;
        SynchronizationContext.SetSynchronizationContext(null);
        return new Disposable(context);
    }

    /// <summary>
    /// Represents the disposable.
    /// </summary>
    public readonly struct Disposable(SynchronizationContext? synchronizationContext) : IDisposable
    {
        /// <summary>
        /// Disposes of the synchronization context.
        /// </summary>
        public void Dispose() => SynchronizationContext.SetSynchronizationContext(synchronizationContext);
    }
}
