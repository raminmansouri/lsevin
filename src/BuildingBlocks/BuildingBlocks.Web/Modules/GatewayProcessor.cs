using AutoMapper;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.Messaging.EventBus;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.ResultPattern;
using Microsoft.Extensions.DependencyInjection;

namespace BuildingBlocks.Web.Modules;

/// <summary>
/// Provides gateway processing capabilities for a specific module.
/// </summary>
/// <typeparam name="TModule">The type of module to process.</typeparam>
public class GatewayProcessor<TModule> : IGatewayProcessor<TModule>
    where TModule : class, IModuleDefinition
{
    private readonly IServiceProvider _serviceProvider;

    /// <summary>
    /// Initializes a new instance of the <see cref="GatewayProcessor{TModule}"/> class.
    /// </summary>
    /// <param name="serviceProvider">The service provider.</param>
    public GatewayProcessor(IServiceProvider serviceProvider)
    {
        var compositionRoot = CompositionRootRegistry.GetByModule<TModule>();
        _serviceProvider = compositionRoot?.ServiceProvider ?? serviceProvider;
    }

    /// <summary>
    /// Executes an action within a service scope asynchronously.
    /// </summary>
    /// <param name="action">The action to execute.</param>
    /// <returns>A <see cref="ValueTask"/> representing the asynchronous operation.</returns>
    public async ValueTask ExecuteScopeAsync(Func<IServiceProvider, ValueTask> action)
    {
        var scope = _serviceProvider.CreateAsyncScope();
        await using var scope1 = scope.ConfigureAwait(false);
        await action(scope.ServiceProvider).ConfigureAwait(false);
    }

    /// <summary>
    /// Executes an action within a service scope asynchronously and returns a result.
    /// </summary>
    /// <typeparam name="T">The type of result to return.</typeparam>
    /// <param name="action">The action to execute.</param>
    /// <returns>A <see cref="ValueTask{T}"/> representing the asynchronous operation.</returns>
    public async ValueTask<T> ExecuteScopeAsync<T>(Func<IServiceProvider, ValueTask<T>> action)
    {
        var scope = _serviceProvider.CreateAsyncScope();
        await using var scope1 = scope.ConfigureAwait(false);

        return await action(scope.ServiceProvider).ConfigureAwait(false);
    }

    /// <summary>
    /// Sends a command asynchronously and returns a response.
    /// </summary>
    /// <param name="request">The command request.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    public async Task<Result<TResponse>> SendCommandAsync<TResponse>(
        ICommand<TResponse> request,
        CancellationToken cancellationToken = default
    )
        where TResponse : notnull
    {
        return await ExecuteScopeAsync(async sp =>
            {
                var commandProcessor = sp.GetRequiredService<ICommandBus>();

                return await commandProcessor.SendAsync(request, cancellationToken).ConfigureAwait(false);
            })
            .ConfigureAwait(false);
    }

    /// <summary>
    /// Executes a command asynchronously and returns a result.
    /// </summary>
    /// <typeparam name="TCommand">The type of command.</typeparam>
    /// <typeparam name="TResult">The type of result.</typeparam>
    /// <param name="command">The command to execute.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    public async Task<Result<TResult>> ExecuteCommand<TCommand, TResult>(
        TCommand command,
        CancellationToken cancellationToken = default
    )
        where TCommand : ICommand<TResult>
        where TResult : notnull
    {
        return await ExecuteScopeAsync(async sp =>
            {
                var commandProcessor = sp.GetRequiredService<ICommandBus>();

                return await commandProcessor.SendAsync(command, cancellationToken).ConfigureAwait(false);
            })
            .ConfigureAwait(false);
    }

    /// <summary>
    /// Executes a command action with command processor and mapper.
    /// </summary>
    /// <param name="action">The action to execute.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    public async Task ExecuteCommand(Func<ICommandBus, IMapper, Task> action)
    {
        await ExecuteScopeAsync(async sp =>
            {
                var commandProcessor = sp.GetRequiredService<ICommandBus>();
                var mapper = sp.GetRequiredService<IMapper>();

                await action.Invoke(commandProcessor, mapper).ConfigureAwait(false);
            })
            .ConfigureAwait(false);
    }

    /// <summary>
    /// Executes a command action with command processor.
    /// </summary>
    /// <param name="action">The action to execute.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    public async Task ExecuteCommand(Func<ICommandBus, Task> action)
    {
        await ExecuteCommand(async (processor, _) => await action(processor).ConfigureAwait(false))
            .ConfigureAwait(false);
    }

    /// <summary>
    /// Executes a command action with command processor and returns a result.
    /// </summary>
    /// <typeparam name="T">The type of result.</typeparam>
    /// <param name="action">The action to execute.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    public async Task<T> ExecuteCommand<T>(Func<ICommandBus, Task<T>> action)
    {
        var result = await ExecuteCommand((processor, _) => action(processor)).ConfigureAwait(false);
        return result;
    }

    /// <summary>
    /// Executes a command action with command processor and mapper and returns a result.
    /// </summary>
    /// <typeparam name="T">The type of result.</typeparam>
    /// <param name="action">The action to execute.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    public async Task<T> ExecuteCommand<T>(Func<ICommandBus, IMapper, Task<T>> action)
    {
        return await ExecuteScopeAsync(async sp =>
            {
                var commandProcessor = sp.GetRequiredService<ICommandBus>();
                var mapper = sp.GetRequiredService<IMapper>();

                return await action.Invoke(commandProcessor, mapper).ConfigureAwait(false);
            })
            .ConfigureAwait(false);
    }

    /// <inheritdoc />
    public async Task ScheduleCommandAsync<TResponse>(
        ICommand<TResponse> request,
        CancellationToken cancellationToken = default
    )
        where TResponse : notnull
    {
        await ExecuteScopeAsync(async sp =>
            {
                var commandProcessor = sp.GetRequiredService<ICommandBus>();
                await commandProcessor.ScheduleAsync(request, cancellationToken).ConfigureAwait(false);
            })
            .ConfigureAwait(false);
    }

    /// <summary>
    /// Publishes an action to the message bus.
    /// </summary>
    /// <param name="action">The action to publish.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    public async Task Publish(Func<IEventBus, Task> action)
    {
        var bus = _serviceProvider.GetRequiredService<IEventBus>();
        await action(bus).ConfigureAwait(false);
    }

    /// <summary>
    /// Sends a query asynchronously and returns a response.
    /// </summary>
    /// <typeparam name="TResponse">The type of response.</typeparam>
    /// <param name="query">The query to send.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    public async Task<Result<TResponse>> SendQueryAsync<TResponse>(
        IQuery<TResponse> query,
        CancellationToken cancellationToken = default
    )
        where TResponse : class
    {
        return await ExecuteScopeAsync(async sp =>
            {
                var queryProcessor = sp.GetRequiredService<IQueryBus>();

                return await queryProcessor.SendAsync(query, cancellationToken).ConfigureAwait(false);
            })
            .ConfigureAwait(false);
    }

    /// <summary>
    /// Executes a query asynchronously and returns a result.
    /// </summary>
    /// <typeparam name="TQuery">The type of query.</typeparam>
    /// <typeparam name="TResult">The type of result.</typeparam>
    /// <param name="query">The query to execute.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    public async Task<Result<TResult>> ExecuteQuery<TQuery, TResult>(
        TQuery query,
        CancellationToken cancellationToken = default
    )
        where TQuery : IQuery<TResult>
        where TResult : notnull
    {
        return await ExecuteScopeAsync(async sp =>
            {
                var queryProcessor = sp.GetRequiredService<IQueryBus>();

                return await queryProcessor.SendAsync(query, cancellationToken).ConfigureAwait(false);
            })
            .ConfigureAwait(false);
    }

    /// <summary>
    /// Executes a query action with query processor and returns a result.
    /// </summary>
    /// <typeparam name="T">The type of result.</typeparam>
    /// <param name="action">The action to execute.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    public async Task<T> ExecuteQuery<T>(Func<IQueryBus, Task<T>> action)
    {
        var result = await ExecuteQuery((processor, _) => action(processor)).ConfigureAwait(false);
        return result;
    }

    /// <summary>
    /// Executes a query action with query processor and mapper and returns a result.
    /// </summary>
    /// <typeparam name="T">The type of result.</typeparam>
    /// <param name="action">The action to execute.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    public async Task<T> ExecuteQuery<T>(Func<IQueryBus, IMapper, Task<T>> action)
    {
        return await ExecuteScopeAsync(async sp =>
            {
                var queryProcessor = sp.GetRequiredService<IQueryBus>();
                var mapper = sp.GetRequiredService<IMapper>();

                return await action.Invoke(queryProcessor, mapper).ConfigureAwait(false);
            })
            .ConfigureAwait(false);
    }
}
