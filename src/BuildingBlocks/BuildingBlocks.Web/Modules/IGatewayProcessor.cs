using AutoMapper;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.Messaging.EventBus;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.ResultPattern;

namespace BuildingBlocks.Web.Modules;

/// <summary>
/// Gateway processor interface for handling module-specific operations.
/// </summary>
/// <typeparam name="TModule">The module type that implements IModuleDefinition.</typeparam>
public interface IGatewayProcessor<TModule>
    where TModule : class, IModuleDefinition
{
    /// <summary>
    /// Executes an asynchronous operation within a scope.
    /// </summary>
    /// <param name="action">The action to execute.</param>
    /// <returns>A ValueTask representing the asynchronous operation.</returns>
    ValueTask ExecuteScopeAsync(Func<IServiceProvider, ValueTask> action);

    /// <summary>
    /// Executes an asynchronous operation within a scope and returns a result.
    /// </summary>
    /// <typeparam name="T">The type of the result.</typeparam>
    /// <param name="action">The action to execute.</param>
    /// <returns>A ValueTask containing the result of type T.</returns>
    ValueTask<T> ExecuteScopeAsync<T>(Func<IServiceProvider, ValueTask<T>> action);

    /// <summary>
    /// Sends a command asynchronously and returns a response.
    /// </summary>
    /// <typeparam name="TResponse">The type of the response.</typeparam>
    /// <param name="request">The command request.</param>
    /// <param name="cancellationToken">Optional cancellation token.</param>
    /// <returns>A Task containing the command response.</returns>
    Task<Result<TResponse>> SendCommandAsync<TResponse>(
        ICommand<TResponse> request,
        CancellationToken cancellationToken = default
    )
        where TResponse : notnull;

    /// <summary>
    /// Executes a command asynchronously and returns a result.
    /// </summary>
    /// <typeparam name="TCommand">The type of the command.</typeparam>
    /// <typeparam name="TResult">The type of the result.</typeparam>
    /// <param name="command">The command to execute.</param>
    /// <param name="cancellationToken">Optional cancellation token.</param>
    /// <returns>A Task containing the command result.</returns>
    Task<Result<TResult>> ExecuteCommand<TCommand, TResult>(
        TCommand command,
        CancellationToken cancellationToken = default
    )
        where TCommand : ICommand<TResult>
        where TResult : notnull;

    /// <summary>
    /// Executes a command using a command processor and mapper.
    /// </summary>
    /// <param name="action">The action to execute.</param>
    /// <returns>A Task representing the asynchronous operation.</returns>
    Task ExecuteCommand(Func<ICommandBus, IMapper, Task> action);

    /// <summary>
    /// Executes a command using a command processor.
    /// </summary>
    /// <param name="action">The action to execute.</param>
    /// <returns>A Task representing the asynchronous operation.</returns>
    Task ExecuteCommand(Func<ICommandBus, Task> action);

    /// <summary>
    /// Executes a command using a command processor and returns a result.
    /// </summary>
    /// <typeparam name="T">The type of the result.</typeparam>
    /// <param name="action">The action to execute.</param>
    /// <returns>A Task containing the result.</returns>
    Task<T> ExecuteCommand<T>(Func<ICommandBus, Task<T>> action);

    /// <summary>
    /// Executes a command using a command processor and mapper, and returns a result.
    /// </summary>
    /// <typeparam name="T">The type of the result.</typeparam>
    /// <param name="action">The action to execute.</param>
    /// <returns>A Task containing the result.</returns>
    Task<T> ExecuteCommand<T>(Func<ICommandBus, IMapper, Task<T>> action);

    /// <summary>
    /// Schedules a command asynchronously.
    /// </summary>
    /// <typeparam name="TResponse">The type of the response.</typeparam>
    /// <param name="request">The command request.</param>
    /// <param name="cancellationToken">Optional cancellation token.</param>
    /// <returns>A Task containing the command response.</returns>
    Task ScheduleCommandAsync<TResponse>(ICommand<TResponse> request, CancellationToken cancellationToken = default)
        where TResponse : notnull;

    /// <summary>
    /// Publishes a message to the message bus.
    /// </summary>
    /// <param name="action">The action to execute.</param>
    /// <returns>A Task representing the asynchronous operation.</returns>
    Task Publish(Func<IEventBus, Task> action);

    /// <summary>
    /// Sends a query asynchronously and returns a response.
    /// </summary>
    /// <typeparam name="TResponse">The type of the response.</typeparam>
    /// <param name="query">The query to send.</param>
    /// <param name="cancellationToken">Optional cancellation token.</param>
    /// <returns>A Task containing the query response.</returns>
    Task<Result<TResponse>> SendQueryAsync<TResponse>(
        IQuery<TResponse> query,
        CancellationToken cancellationToken = default
    )
        where TResponse : class;

    /// <summary>
    /// Executes a query and returns a result.
    /// </summary>
    /// <typeparam name="TQuery">The type of the query.</typeparam>
    /// <typeparam name="TResult">The type of the result.</typeparam>
    /// <param name="query">The query to execute.</param>
    /// <param name="cancellationToken">Optional cancellation token.</param>
    /// <returns>A Task containing the query result.</returns>
    Task<Result<TResult>> ExecuteQuery<TQuery, TResult>(TQuery query, CancellationToken cancellationToken = default)
        where TQuery : IQuery<TResult>
        where TResult : notnull;

    /// <summary>
    /// Executes a query using a query processor and returns a result.
    /// </summary>
    /// <typeparam name="T">The type of the result.</typeparam>
    /// <param name="action">The action to execute.</param>
    /// <returns>A Task containing the result.</returns>
    Task<T> ExecuteQuery<T>(Func<IQueryBus, Task<T>> action);

    /// <summary>
    /// Executes a query using a query processor and mapper, and returns a result.
    /// </summary>
    /// <typeparam name="T">The type of the result.</typeparam>
    /// <param name="action">The action to execute.</param>
    /// <returns>A Task containing the result.</returns>
    Task<T> ExecuteQuery<T>(Func<IQueryBus, IMapper, Task<T>> action);
}
