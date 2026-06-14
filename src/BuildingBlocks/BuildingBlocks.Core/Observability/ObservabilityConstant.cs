namespace BuildingBlocks.Core.Observability;

/// <summary>
/// Represents the observability constant.
/// </summary>
public static class ObservabilityConstant
{
    /// <summary>
    /// Represents the instrumentation name.
    /// </summary>
    public static string InstrumentationName = null!;

    /// <summary>
    /// Represents the components.
    /// </summary>
    public static class Components
    {
        /// <summary>
        /// Represents the command handler component.
        /// </summary>
        public const string CommandHandler = "CommandHandler";

        /// <summary>
        /// Represents the query handler component.
        /// </summary>
        public const string QueryHandler = "QueryHandler";

        /// <summary>
        /// Represents the event store component.
        /// </summary>
        public const string EventStore = "EventStore";

        /// <summary>
        /// Represents the producer component.
        /// </summary>
        public const string Producer = "Producer";

        /// <summary>
        /// Represents the consumer component.
        /// </summary>
        public const string Consumer = "Consumer";

        /// <summary>
        /// Represents the event handler component.
        /// </summary>
        public const string EventHandler = "EventHandler";
    }

    /// <summary>
    /// Represents the activity source names.
    /// </summary>
    public static class ActivitySourceNames
    {
        /// <summary>
        /// Represents the migration activity source name.
        /// </summary>
        public const string Migration = "DbMigrations";
    }
}
