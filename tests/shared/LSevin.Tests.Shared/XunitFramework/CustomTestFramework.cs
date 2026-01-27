using System.Reflection;
using LSevin.Tests.Shared.Helpers;
using Xunit.Sdk;
using ThreadingTimeout = System.Threading.Timeout;

[assembly: TestFramework(TestConstants.AssemblyTestFrameworkTypeName, TestConstants.AssemblyTestFrameworkAssemblyName)]

namespace LSevin.Tests.Shared.XunitFramework;

/// <summary>
/// Represents the custom test framework.
/// </summary>
public class CustomTestFramework : XunitTestFramework
{
    /// <summary>
    /// Initializes a new instance of the <see cref="CustomTestFramework"/> class.
    /// </summary>
    public CustomTestFramework(IMessageSink messageSink)
        : base(messageSink)
    {
        messageSink.OnMessage(new DiagnosticMessage("Using CustomTestFramework..."));
    }

    /// <summary>
    /// Creates the executor.
    /// </summary>
    /// <param name="assemblyName">The assembly name.</param>
    /// <returns>The executor.</returns>
    protected override ITestFrameworkExecutor CreateExecutor(AssemblyName assemblyName) =>
        new CustomExecutor(assemblyName, SourceInformationProvider, DiagnosticMessageSink);

    /// <summary>
    /// Represents the custom executor.
    /// </summary>
    private sealed class CustomExecutor(
        AssemblyName assemblyName,
        ISourceInformationProvider sourceInformationProvider,
        IMessageSink diagnosticMessageSink
    ) : XunitTestFrameworkExecutor(assemblyName, sourceInformationProvider, diagnosticMessageSink)
    {
        /// <summary>
        /// Runs the test cases.
        /// </summary>
        /// <param name="testCases">The test cases.</param>
        /// <param name="executionMessageSink">The execution message sink.</param>
        /// <param name="executionOptions">The execution options.</param>
        protected override void RunTestCases(
            IEnumerable<IXunitTestCase> testCases,
            IMessageSink executionMessageSink,
            ITestFrameworkExecutionOptions executionOptions
        )
        {
            _ = RunTestCasesAsync(testCases, executionMessageSink, executionOptions);
        }

        /// <summary>
        /// Runs the test cases.
        /// </summary>
        /// <param name="testCases">The test cases.</param>
        /// <param name="executionMessageSink">The execution message sink.</param>
        /// <param name="executionOptions">The execution options.</param>
        /// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
        private async Task RunTestCasesAsync(
            IEnumerable<IXunitTestCase> testCases,
            IMessageSink executionMessageSink,
            ITestFrameworkExecutionOptions executionOptions
        )
        {
            using var assemblyRunner = new CustomAssemblyRunner(
                TestAssembly,
                testCases,
                DiagnosticMessageSink,
                executionMessageSink,
                executionOptions
            );
            await assemblyRunner.RunAsync();
        }
    }

    /// <summary>
    /// Represents the custom assembly runner.
    /// </summary>
    private sealed class CustomAssemblyRunner(
        ITestAssembly testAssembly,
        IEnumerable<IXunitTestCase> testCases,
        IMessageSink diagnosticMessageSink,
        IMessageSink executionMessageSink,
        ITestFrameworkExecutionOptions executionOptions
    ) : XunitTestAssemblyRunner(testAssembly, testCases, diagnosticMessageSink, executionMessageSink, executionOptions)
    {
        /// <summary>
        /// Runs the test collection.
        /// </summary>
        /// <param name="messageBus">The message bus.</param>
        /// <param name="testCollection">The test collection.</param>
        /// <param name="testCases">The test cases.</param>
        /// <param name="cancellationTokenSource">The cancellation token source.</param>
        protected override Task<RunSummary> RunTestCollectionAsync(
            IMessageBus messageBus,
            ITestCollection testCollection,
            IEnumerable<IXunitTestCase> testCases,
            CancellationTokenSource cancellationTokenSource
        ) =>
            new CustomTestCollectionRunner(
                testCollection,
                testCases,
                DiagnosticMessageSink,
                messageBus,
                TestCaseOrderer,
                new ExceptionAggregator(Aggregator),
                cancellationTokenSource
            ).RunAsync();
    }

    /// <summary>
    /// Represents the custom test collection runner.
    /// </summary>
    /// <remarks>
    /// Initializes a new instance of the <see cref="CustomTestCollectionRunner"/> class.
    /// </remarks>
    /// <param name="testCollection">The test collection.</param>
    /// <param name="testCases">The test cases.</param>
    /// <param name="diagnosticMessageSink">The diagnostic message sink.</param>
    /// <param name="messageBus">The message bus.</param>
    /// <param name="testCaseOrderer">The test case orderer.</param>
    /// <param name="aggregator">The aggregator.</param>
    /// <param name="cancellationTokenSource">The cancellation token source.</param>
    private sealed class CustomTestCollectionRunner(
        ITestCollection testCollection,
        IEnumerable<IXunitTestCase> testCases,
        IMessageSink diagnosticMessageSink,
        IMessageBus messageBus,
        ITestCaseOrderer testCaseOrderer,
        ExceptionAggregator aggregator,
        CancellationTokenSource cancellationTokenSource
    )
        : XunitTestCollectionRunner(
            testCollection,
            testCases,
            diagnosticMessageSink,
            messageBus,
            testCaseOrderer,
            aggregator,
            cancellationTokenSource
        )
    {
        /// <summary>
        /// Runs the test class.
        /// </summary>
        /// <param name="testClass">The test class.</param>
        /// <param name="class">The class.</param>
        /// <param name="testCases">The test cases.</param>
        /// <returns>The run summary.</returns>
        protected override Task<RunSummary> RunTestClassAsync(
            ITestClass testClass,
            IReflectionTypeInfo @class,
            IEnumerable<IXunitTestCase> testCases
        ) =>
            new CustomTestClassRunner(
                testClass,
                @class,
                testCases,
                DiagnosticMessageSink,
                MessageBus,
                TestCaseOrderer,
                new ExceptionAggregator(Aggregator),
                CancellationTokenSource,
                CollectionFixtureMappings
            ).RunAsync();
    }

    /// <summary>
    /// Represents the custom test class runner.
    /// </summary>
    /// <remarks>
    /// Initializes a new instance of the <see cref="CustomTestClassRunner"/> class.
    /// </remarks>
    /// <param name="testClass">The test class.</param>
    /// <param name="class">The class.</param>
    /// <param name="testCases">The test cases.</param>
    /// <param name="diagnosticMessageSink">The diagnostic message sink.</param>
    /// <param name="messageBus">The message bus.</param>
    /// <param name="testCaseOrderer">The test case orderer.</param>
    /// <param name="aggregator">The aggregator.</param>
    /// <param name="cancellationTokenSource">The cancellation token source.</param>
    /// <param name="collectionFixtureMappings">The collection fixture mappings.</param>
    private sealed class CustomTestClassRunner(
        ITestClass testClass,
        IReflectionTypeInfo @class,
        IEnumerable<IXunitTestCase> testCases,
        IMessageSink diagnosticMessageSink,
        IMessageBus messageBus,
        ITestCaseOrderer testCaseOrderer,
        ExceptionAggregator aggregator,
        CancellationTokenSource cancellationTokenSource,
        IDictionary<Type, object> collectionFixtureMappings
    )
        : XunitTestClassRunner(
            testClass,
            @class,
            testCases,
            diagnosticMessageSink,
            messageBus,
            testCaseOrderer,
            aggregator,
            cancellationTokenSource,
            collectionFixtureMappings
        )
    {
        /// <summary>
        /// Runs the test method.
        /// </summary>
        /// <param name="testMethod">The test method.</param>
        /// <param name="method">The method.</param>
        /// <param name="testCases">The test cases.</param>
        /// <param name="constructorArguments">The constructor arguments.</param>
        /// <returns>The run summary.</returns>
        protected override Task<RunSummary> RunTestMethodAsync(
            ITestMethod testMethod,
            IReflectionMethodInfo method,
            IEnumerable<IXunitTestCase> testCases,
            object[] constructorArguments
        ) =>
            new CustomTestMethodRunner(
                testMethod,
                Class,
                method,
                testCases,
                DiagnosticMessageSink,
                MessageBus,
                new ExceptionAggregator(Aggregator),
                CancellationTokenSource,
                constructorArguments
            ).RunAsync();
    }

    /// <summary>
    /// Represents the custom test method runner.
    /// </summary>
    /// <remarks>
    /// Initializes a new instance of the <see cref="CustomTestMethodRunner"/> class.
    /// </remarks>
    /// <param name="testMethod">The test method.</param>
    /// <param name="class">The class.</param>
    /// <param name="method">The method.</param>
    /// <param name="testCases">The test cases.</param>
    /// <param name="diagnosticMessageSink">The diagnostic message sink.</param>
    /// <param name="messageBus">The message bus.</param>
    /// <param name="aggregator">The aggregator.</param>
    /// <param name="cancellationTokenSource">The cancellation token source.</param>
    private sealed class CustomTestMethodRunner(
        ITestMethod testMethod,
        IReflectionTypeInfo @class,
        IReflectionMethodInfo method,
        IEnumerable<IXunitTestCase> testCases,
        IMessageSink diagnosticMessageSink,
        IMessageBus messageBus,
        ExceptionAggregator aggregator,
        CancellationTokenSource cancellationTokenSource,
        object[] constructorArguments
    )
        : XunitTestMethodRunner(
            testMethod,
            @class,
            method,
            testCases,
            diagnosticMessageSink,
            messageBus,
            aggregator,
            cancellationTokenSource,
            constructorArguments
        )
    {
        /// <summary>
        /// The diagnostic message sink.
        /// </summary>
        private readonly IMessageSink _diagnosticMessageSink = diagnosticMessageSink;

        /// <summary>
        /// Runs the test case.
        /// </summary>
        /// <param name="testCase">The test case.</param>
        /// <returns>The run summary.</returns>
        protected override async Task<RunSummary> RunTestCaseAsync(IXunitTestCase testCase)
        {
            var parameters = string.Empty;

            if (testCase.TestMethodArguments != null)
            {
                parameters = string.Join(", ", testCase.TestMethodArguments.Select(a => a?.ToString() ?? "null"));
            }

            var test = $"{TestMethod.TestClass.Class.Name}.{TestMethod.Method.Name}({parameters})";

            _diagnosticMessageSink.OnMessage(new DiagnosticMessage($"STARTED: {test}"));

            try
            {
                var deadlineMinutes = 2;
                await using var timer = new Timer(
                    _ =>
                        _diagnosticMessageSink.OnMessage(
                            new DiagnosticMessage(
                                $"WARNING: {test} has been running for more than {deadlineMinutes} minutes"
                            )
                        ),
                    state: null,
                    TimeSpan.FromMinutes(deadlineMinutes),
                    period: ThreadingTimeout.InfiniteTimeSpan
                );

                var result = await base.RunTestCaseAsync(testCase);

                var status =
                    result.Failed > 0 ? "FAILURE"
                    : result.Skipped > 0 ? "SKIPPED"
                    : "SUCCESS";

                _diagnosticMessageSink.OnMessage(new DiagnosticMessage($"{status}: {test} ({result.Time}s)"));

                return result;
            }
            catch (Exception ex)
            {
                _diagnosticMessageSink.OnMessage(new DiagnosticMessage($"ERROR: {test} ({ex.Message})"));
                throw;
            }
        }
    }
}
