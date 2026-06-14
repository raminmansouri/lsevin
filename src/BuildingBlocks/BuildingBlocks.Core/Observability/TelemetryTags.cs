namespace BuildingBlocks.Core.Observability;

/// <summary>
/// Telemetry tags use for adding tags to activities as tag name.
/// </summary>
public static class TelemetryTags
{
    // https://opentelemetry.io/docs/specs/semconv/general/trace/
    // https://opentelemetry.io/docs/specs/semconv/general/attribute-naming/

    /// <summary>
    /// Contains tracing-related telemetry tags.
    /// </summary>
    public static class Tracing
    {
        /// <summary>
        /// Contains service-related telemetry tags.
        /// </summary>
        public static class Service
        {
            /// <summary>
            /// The name of the remote service being called.
            /// </summary>
            public const string PeerService = "peer.service";

            /// <summary>
            /// The name of the service.
            /// </summary>
            public const string Name = "service.name";

            /// <summary>
            /// The unique identifier of the service instance.
            /// </summary>
            public const string InstanceId = "service.instance.id";

            /// <summary>
            /// The version of the service.
            /// </summary>
            public const string Version = "service.version";

            /// <summary>
            /// The namespace of the service.
            /// </summary>
            public const string NameSpace = "service.namespace";
        }

        /// <summary>
        /// Contains messaging-related telemetry tags.
        /// </summary>
        public static class Messaging
        {
            /// <summary>
            /// Contains messaging operation type telemetry tags.
            /// </summary>
            public static class OperationType
            {
                /// <summary>
                /// The key for messaging operation type.
                /// </summary>
                public const string Key = "messaging.operation.type";

                /// <summary>
                /// Indicates a receive operation.
                /// </summary>
                public const string Receive = "receive";

                /// <summary>
                /// Indicates a send operation.
                /// </summary>
                public const string Send = "send";

                /// <summary>
                /// Indicates a process operation.
                /// </summary>
                public const string Process = "process";
            }

            /// <summary>
            /// Contains messaging system telemetry tags.
            /// </summary>
            public static class System
            {
                /// <summary>
                /// The key for messaging system.
                /// </summary>
                public const string Key = "messaging.system";

                /// <summary>
                /// Indicates ActiveMQ messaging system.
                /// </summary>
                public const string ActiveMQ = "activemq";

                /// <summary>
                /// Indicates RabbitMQ messaging system.
                /// </summary>
                public const string RabbitMQ = "rabbitmq";

                /// <summary>
                /// Indicates AWS SQS messaging system.
                /// </summary>
                public const string AwsSqs = "aws_sqs";

                /// <summary>
                /// Indicates Azure Event Grid messaging system.
                /// </summary>
                public const string EventGrid = "eventgrid";

                /// <summary>
                /// Indicates Azure Event Hubs messaging system.
                /// </summary>
                public const string EventHubs = "eventhubs";

                /// <summary>
                /// Indicates Google Cloud Pub/Sub messaging system.
                /// </summary>
                public const string GcpPubSub = "gcp_pubsub";

                /// <summary>
                /// Indicates Kafka messaging system.
                /// </summary>
                public const string Kafka = "kafka";

                /// <summary>
                /// Indicates Apache Pulsar messaging system.
                /// </summary>
                public const string Pulsar = "pulsar";

                /// <summary>
                /// Indicates Azure Service Bus messaging system.
                /// </summary>
                public const string ServiceBus = "servicebus";
            }

            /// <summary>
            /// The destination of the message.
            /// </summary>
            public const string Destination = "messaging.destination";

            /// <summary>
            /// The kind of destination.
            /// </summary>
            public const string DestinationKind = "messaging.destination_kind";

            /// <summary>
            /// The URL of the messaging system.
            /// </summary>
            public const string Url = "messaging.url";

            /// <summary>
            /// The unique identifier of the message.
            /// </summary>
            public const string MessageId = "messaging.message_id";

            /// <summary>
            /// The conversation identifier for the message.
            /// </summary>
            public const string ConversationId = "messaging.conversation_id";

            /// <summary>
            /// The correlation identifier for the message.
            /// </summary>
            public const string CorrelationId = "messaging.correlation_id";

            /// <summary>
            /// The causation identifier for the message.
            /// </summary>
            public const string CausationId = "messaging.causation_id";

            /// <summary>
            /// The operation being performed.
            /// </summary>
            public const string Operation = "messaging.operation";

            /// <summary>
            /// The name of the operation being performed.
            /// </summary>
            public const string OperationName = "messaging.operation.name";

            /// <summary>
            /// The name of the destination.
            /// </summary>
            public const string DestinationName = "messaging.destination.name";

            /// <summary>
            /// The name of the consumer group.
            /// </summary>
            public const string ConsumerGroup = "messaging.consumer.group.name";

            /// <summary>
            /// The partition identifier of the destination.
            /// </summary>
            public const string DestinationPartition = "messaging.destination.partition.id";

            /// <summary>
            /// Contains RabbitMQ-specific telemetry tags.
            /// </summary>
            public static class RabbitMQ
            {
                /// <summary>
                /// The routing key for RabbitMQ messages.
                /// </summary>
                public const string RoutingKey = "messaging.rabbitmq.destination.routing_key";

                /// <summary>
                /// The delivery tag for RabbitMQ messages.
                /// </summary>
                public const string DeliveryTag = "messaging.rabbitmq.message.delivery_tag";

                /// <summary>
                /// Creates tags for a RabbitMQ producer.
                /// </summary>
                public static IDictionary<string, object?> ProducerTags(
                    string serviceName,
                    string topicName,
                    string routingKey,
                    string? deliveryTag = null
                ) =>
                    new Dictionary<string, object?>
                    {
                        { System.Key, System.Kafka },
                        { DeliveryTag, deliveryTag },
                        { Destination, topicName },
                        { OperationType.Key, OperationType.Send },
                        { Service.Name, serviceName },
                        { RoutingKey, routingKey },
                    };

                /// <summary>
                /// Creates tags for a RabbitMQ consumer.
                /// </summary>
                public static IDictionary<string, object?> ConsumerTags(
                    string serviceName,
                    string topicName,
                    string routingKey,
                    string? consumerGroup = null
                ) =>
                    new Dictionary<string, object?>
                    {
                        { System.Key, System.Kafka },
                        { Destination, topicName },
                        { OperationType.Key, OperationType.Receive },
                        { Service.Name, serviceName },
                        { ConsumerGroup, consumerGroup },
                        { RoutingKey, routingKey },
                    };
            }

            /// <summary>
            /// Contains Kafka-specific telemetry tags.
            /// </summary>
            public static class Kafka
            {
                /// <summary>
                /// The key of the Kafka message.
                /// </summary>
                public const string MessageKey = "messaging.kafka.message.key";

                /// <summary>
                /// Indicates if the message is a tombstone.
                /// </summary>
                public const string Tombstone = "messaging.kafka.message.tombstone";

                /// <summary>
                /// The offset of the Kafka message.
                /// </summary>
                public const string Offset = "messaging.kafka.offset";

                /// <summary>
                /// Creates tags for a Kafka producer.
                /// </summary>
                public static IDictionary<string, object?> ProducerTags(
                    string serviceName,
                    string topicName,
                    string messageKey
                ) =>
                    new Dictionary<string, object?>
                    {
                        { System.Key, System.Kafka },
                        { Destination, topicName },
                        { OperationType.Key, OperationType.Send },
                        { Service.Name, serviceName },
                        { MessageKey, messageKey },
                    };

                /// <summary>
                /// Creates tags for a Kafka consumer.
                /// </summary>
                public static IDictionary<string, object?> ConsumerTags(
                    string serviceName,
                    string topicName,
                    string messageKey,
                    string partitionName,
                    string consumerGroup
                ) =>
                    new Dictionary<string, object?>
                    {
                        { System.Key, System.Kafka },
                        { Destination, topicName },
                        { OperationType.Key, OperationType.Receive },
                        { Service.Name, serviceName },
                        { MessageKey, messageKey },
                        { DestinationPartition, partitionName },
                        { ConsumerGroup, consumerGroup },
                    };
            }
        }

        /// <summary>
        /// Contains database-related telemetry tags.
        /// </summary>
        public static class Db
        {
            /// <summary>
            /// The database system being used.
            /// </summary>
            public const string System = "db.system";

            /// <summary>
            /// The database connection string.
            /// </summary>
            public const string ConnectionString = "db.connection_string";

            /// <summary>
            /// The database user.
            /// </summary>
            public const string User = "db.user";

            /// <summary>
            /// The MS SQL Server instance name.
            /// </summary>
            public const string MsSqlInstanceName = "db.mssql.instance_name";

            /// <summary>
            /// The database name.
            /// </summary>
            public const string Name = "db.name";

            /// <summary>
            /// The database statement being executed.
            /// </summary>
            public const string Statement = "db.statement";

            /// <summary>
            /// The database operation being performed.
            /// </summary>
            public const string Operation = "db.operation";

            /// <summary>
            /// The database instance.
            /// </summary>
            public const string Instance = "db.instance";

            /// <summary>
            /// The database URL.
            /// </summary>
            public const string Url = "db.url";

            /// <summary>
            /// The Cassandra keyspace.
            /// </summary>
            public const string CassandraKeyspace = "db.cassandra.keyspace";

            /// <summary>
            /// The Redis database index.
            /// </summary>
            public const string RedisDatabaseIndex = "db.redis.database_index";

            /// <summary>
            /// The MongoDB collection.
            /// </summary>
            public const string MongoDbCollection = "db.mongodb.collection";
        }

        /// <summary>
        /// Contains exception-related telemetry tags.
        /// </summary>
        public static class Exceptions
        {
            /// <summary>
            /// The name of the exception event.
            /// </summary>
            public const string EventName = "exception";

            /// <summary>
            /// The type of the exception.
            /// </summary>
            public const string Type = "exception.type";

            /// <summary>
            /// The exception message.
            /// </summary>
            public const string Message = "exception.message";

            /// <summary>
            /// The exception stack trace.
            /// </summary>
            public const string Stacktrace = "exception.stacktrace";
        }

        /// <summary>
        /// Contains OpenTelemetry-specific telemetry tags.
        /// </summary>
        public static class Otel
        {
            /// <summary>
            /// The OpenTelemetry status code.
            /// </summary>
            public const string StatusCode = "otel.status_code";

            /// <summary>
            /// The OpenTelemetry status description.
            /// </summary>
            public const string StatusDescription = "otel.status_description";
        }

        /// <summary>
        /// Contains message-related telemetry tags.
        /// </summary>
        public static class Message
        {
            /// <summary>
            /// The type of the message.
            /// </summary>
            public const string Type = "message.type";

            /// <summary>
            /// The identifier of the message.
            /// </summary>
            public const string Id = "message.id";
        }

        /// <summary>
        /// Contains application-specific telemetry tags.
        /// </summary>
        public static class Application
        {
            /// <summary>
            /// The application service tag.
            /// </summary>
            public static readonly string AppService = $"{ObservabilityConstant.InstrumentationName}.appservice";

            /// <summary>
            /// The consumer tag.
            /// </summary>
            public static readonly string Consumer = $"{ObservabilityConstant.InstrumentationName}.consumer";

            /// <summary>
            /// The producer tag.
            /// </summary>
            public static readonly string Producer = $"{ObservabilityConstant.InstrumentationName}.producer";

            /// <summary>
            /// Contains command-related telemetry tags.
            /// </summary>
            public static class Commands
            {
                /// <summary>
                /// The command tag.
                /// </summary>
                public static readonly string Command = $"{ObservabilityConstant.InstrumentationName}.command";

                /// <summary>
                /// The command type tag.
                /// </summary>
                public static readonly string CommandType = $"{Command}.type";

                /// <summary>
                /// The command handler tag.
                /// </summary>
                public static readonly string CommandHandler = $"{Command}.handler";

                /// <summary>
                /// The command handler type tag.
                /// </summary>
                public static readonly string CommandHandlerType = $"{CommandHandler}.type";
            }

            /// <summary>
            /// Contains query-related telemetry tags.
            /// </summary>
            public static class Queries
            {
                /// <summary>
                /// The query tag.
                /// </summary>
                public static readonly string Query = $"{ObservabilityConstant.InstrumentationName}.query";

                /// <summary>
                /// The query type tag.
                /// </summary>
                public static readonly string QueryType = $"{Query}.type";

                /// <summary>
                /// The query handler tag.
                /// </summary>
                public static readonly string QueryHandler = $"{Query}.handler";

                /// <summary>
                /// The query handler type tag.
                /// </summary>
                public static readonly string QueryHandlerType = $"{QueryHandler}.type";
            }

            /// <summary>
            /// Contains event-related telemetry tags.
            /// </summary>
            public static class Events
            {
                /// <summary>
                /// The event tag.
                /// </summary>
                public static readonly string Event = $"{ObservabilityConstant.InstrumentationName}.event";

                /// <summary>
                /// The event type tag.
                /// </summary>
                public static readonly string EventType = $"{Event}.type";

                /// <summary>
                /// The event handler tag.
                /// </summary>
                public static readonly string EventHandler = $"{Event}.handler";

                /// <summary>
                /// The event handler type tag.
                /// </summary>
                public static readonly string EventHandlerType = $"{EventHandler}.type";
            }
        }
    }

    /// <summary>
    /// Contains metrics-related telemetry tags.
    /// </summary>
    public static class Metrics
    {
        /// <summary>
        /// Contains application-specific metrics tags.
        /// </summary>
        public static class Application
        {
            /// <summary>
            /// The application service metrics tag.
            /// </summary>
            public static readonly string AppService = $"{ObservabilityConstant.InstrumentationName}.appservice";

            /// <summary>
            /// The consumer metrics tag.
            /// </summary>
            public static readonly string Consumer = $"{ObservabilityConstant.InstrumentationName}.consumer";

            /// <summary>
            /// The producer metrics tag.
            /// </summary>
            public static readonly string Producer = $"{ObservabilityConstant.InstrumentationName}.producer";

            /// <summary>
            /// Contains command-related metrics tags.
            /// </summary>
            public static class Commands
            {
                /// <summary>
                /// The command metrics tag.
                /// </summary>
                public static readonly string Command = $"{ObservabilityConstant.InstrumentationName}.command";

                /// <summary>
                /// The command type metrics tag.
                /// </summary>
                public static readonly string CommandType = $"{Command}.type";

                /// <summary>
                /// The command handler metrics tag.
                /// </summary>
                public static readonly string CommandHandler = $"{Command}.handler";

                /// <summary>
                /// The success count metrics tag.
                /// </summary>
                public static readonly string SuccessCount = $"{CommandHandler}.success.count";

                /// <summary>
                /// The failed count metrics tag.
                /// </summary>
                public static readonly string FaildCount = $"{CommandHandler}.failed.count";

                /// <summary>
                /// The active count metrics tag.
                /// </summary>
                public static readonly string ActiveCount = $"{CommandHandler}.active.count";

                /// <summary>
                /// The total executed count metrics tag.
                /// </summary>
                public static readonly string TotalExecutedCount = $"{CommandHandler}.total.count";

                /// <summary>
                /// The handler duration metrics tag.
                /// </summary>
                public static readonly string HandlerDuration = $"{CommandHandler}.duration";
            }

            /// <summary>
            /// Contains query-related metrics tags.
            /// </summary>
            public static class Queries
            {
                /// <summary>
                /// The query metrics tag.
                /// </summary>
                public static readonly string Query = $"{ObservabilityConstant.InstrumentationName}.query";

                /// <summary>
                /// The query type metrics tag.
                /// </summary>
                public static readonly string QueryType = $"{Query}.type";

                /// <summary>
                /// The query handler metrics tag.
                /// </summary>
                public static readonly string QueryHandler = $"{Query}.handler";

                /// <summary>
                /// The success count metrics tag.
                /// </summary>
                public static readonly string SuccessCount = $"{QueryHandler}.success.count";

                /// <summary>
                /// The failed count metrics tag.
                /// </summary>
                public static readonly string FaildCount = $"{QueryHandler}.failed.count";

                /// <summary>
                /// The active count metrics tag.
                /// </summary>
                public static readonly string ActiveCount = $"{QueryHandler}.active.count";

                /// <summary>
                /// The total executed count metrics tag.
                /// </summary>
                public static readonly string TotalExecutedCount = $"{QueryHandler}.total.count";

                /// <summary>
                /// The handler duration metrics tag.
                /// </summary>
                public static readonly string HandlerDuration = $"{QueryHandler}.duration";
            }

            /// <summary>
            /// Contains event-related metrics tags.
            /// </summary>
            public static class Events
            {
                /// <summary>
                /// The event metrics tag.
                /// </summary>
                public static readonly string Event = $"{ObservabilityConstant.InstrumentationName}.event";

                /// <summary>
                /// The event type metrics tag.
                /// </summary>
                public static readonly string EventType = $"{Event}.type";

                /// <summary>
                /// The event handler metrics tag.
                /// </summary>
                public static readonly string EventHandler = $"{Event}.handler";

                /// <summary>
                /// The success count metrics tag.
                /// </summary>
                public static readonly string SuccessCount = $"{EventHandler}.success.count";

                /// <summary>
                /// The failed count metrics tag.
                /// </summary>
                public static readonly string FaildCount = $"{EventHandler}.failed.count";

                /// <summary>
                /// The active count metrics tag.
                /// </summary>
                public static readonly string ActiveCount = $"{EventHandler}.active.count";

                /// <summary>
                /// The total executed count metrics tag.
                /// </summary>
                public static readonly string TotalExecutedCount = $"{EventHandler}.total.count";

                /// <summary>
                /// The handler duration metrics tag.
                /// </summary>
                public static readonly string HandlerDuration = $"{EventHandler}.duration";
            }
        }
    }
}
