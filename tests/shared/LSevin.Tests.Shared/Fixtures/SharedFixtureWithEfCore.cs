using BuildingBlocks.Core.Messaging.Commands;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit.Sdk;

namespace LSevin.Tests.Shared.Fixtures;

/// <summary>
/// Represents a shared fixture with Entity Framework Core support.
/// </summary>
/// <typeparam name="TEntryPoint">The type of the entry point.</typeparam>
/// <typeparam name="TEfCoreDbContext">The type of the Entity Framework Core database context.</typeparam>
public class SharedFixtureWithEfCore<TEntryPoint, TEfCoreDbContext> : SharedFixture<TEntryPoint>
    where TEntryPoint : class
    where TEfCoreDbContext : DbContext
{
    /// <summary>
    /// Executes a transaction context asynchronously.
    /// </summary>
    /// <param name="action">The action to execute within the transaction.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    /// <param name="cancellationToken">The cancellation token.</param>
    public async Task ExecuteTxContextAsync(
        Func<IServiceProvider, TEfCoreDbContext, Task> action,
        CancellationToken cancellationToken = default
    )
    {
        await using var scope = ServiceProvider.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<TEfCoreDbContext>();
        var strategy = dbContext.Database.CreateExecutionStrategy();
        await strategy.ExecuteAsync(async () =>
        {
            try
            {
                await dbContext.Database.BeginTransactionAsync(cancellationToken);

                await action(scope.ServiceProvider, dbContext);

                await dbContext.Database.CommitTransactionAsync(cancellationToken);
            }
            catch (Exception)
            {
                await dbContext.Database.RollbackTransactionAsync(cancellationToken);
                throw;
            }
        });
    }

    /// <summary>
    /// Executes and resets a context state asynchronously.
    /// </summary>
    /// <param name="action">The action to execute.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    public async Task ExecuteAndResetStateContextAsync(
        Func<IServiceProvider, TEfCoreDbContext, Task> action,
        CancellationToken cancellationToken = default
    )
    {
        await using var scope = ServiceProvider.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<TEfCoreDbContext>();
        var strategy = dbContext.Database.CreateExecutionStrategy();
        await strategy.ExecuteAsync(async () =>
        {
            try
            {
                await dbContext.Database.BeginTransactionAsync(cancellationToken);
                await action(scope.ServiceProvider, dbContext);
                await dbContext.Database.RollbackTransactionAsync(cancellationToken);
            }
            catch (Exception)
            {
                await dbContext.Database.RollbackTransactionAsync(cancellationToken);
                throw;
            }
        });
    }

    /// <summary>
    /// Executes a transaction context asynchronously and returns a result.
    /// </summary>
    /// <typeparam name="T">The type of the result.</typeparam>
    /// <param name="action">The action to execute within the transaction.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    public async Task<T> ExecuteTxContextAsync<T>(
        Func<IServiceProvider, TEfCoreDbContext, Task<T>> action,
        CancellationToken cancellationToken = default
    )
    {
        await using var scope = ServiceProvider.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<TEfCoreDbContext>();
        var strategy = dbContext.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            try
            {
                await dbContext.Database.BeginTransactionAsync(cancellationToken);
                var result = await action(scope.ServiceProvider, dbContext);
                await dbContext.Database.CommitTransactionAsync(cancellationToken);
                return result;
            }
            catch (Exception)
            {
                await dbContext.Database.RollbackTransactionAsync(cancellationToken);
                throw;
            }
        });
    }

    /// <summary>
    /// Executes and resets a context state asynchronously and returns a result.
    /// </summary>
    /// <typeparam name="T">The type of the result.</typeparam>
    /// <param name="action">The action to execute.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    public async Task<T> ExecuteAndResetStateContextAsync<T>(
        Func<IServiceProvider, TEfCoreDbContext, Task<T>> action,
        CancellationToken cancellationToken = default
    )
    {
        await using var scope = ServiceProvider.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<TEfCoreDbContext>();
        var strategy = dbContext.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            try
            {
                await dbContext.Database.BeginTransactionAsync(cancellationToken);
                var result = await action(scope.ServiceProvider, dbContext);
                await dbContext.Database.RollbackTransactionAsync(cancellationToken);
                return result;
            }
            catch (Exception)
            {
                await dbContext.Database.RollbackTransactionAsync(cancellationToken);
                throw;
            }
        });
    }

    /// <summary>
    /// Executes an Entity Framework database context operation asynchronously.
    /// </summary>
    /// <param name="action">The action to execute.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    public async Task ExecuteEfDbContextAsync(Func<IServiceProvider, TEfCoreDbContext, Task> action)
    {
        await using var scope = ServiceProvider.CreateAsyncScope();
        await ExecuteScopeAsync(sp => action(scope.ServiceProvider, sp.GetRequiredService<TEfCoreDbContext>()));
    }

    /// <summary>
    /// Executes an Entity Framework database context operation asynchronously and returns a result.
    /// </summary>
    /// <typeparam name="T">The type of the result.</typeparam>
    /// <param name="action">The action to execute.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    public async Task<T> ExecuteEfDbContextAsync<T>(Func<IServiceProvider, TEfCoreDbContext, Task<T>> action)
    {
        await using var scope = ServiceProvider.CreateAsyncScope();
        return await ExecuteScopeAsync(sp => action(scope.ServiceProvider, sp.GetRequiredService<TEfCoreDbContext>()));
    }

    /// <summary>
    /// Executes an Entity Framework database context operation asynchronously.
    /// </summary>
    /// <param name="action">The action to execute.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    public Task ExecuteEfDbContextAsync(Func<TEfCoreDbContext, Task> action) =>
        ExecuteScopeAsync(sp => action(sp.GetRequiredService<TEfCoreDbContext>()));

    /// <summary>
    /// Executes an Entity Framework database context operation with mediator asynchronously.
    /// </summary>
    /// <param name="action">The action to execute.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    public Task ExecuteEfDbContextAsync(Func<TEfCoreDbContext, IMediator, Task> action) =>
        ExecuteScopeAsync(sp => action(sp.GetRequiredService<TEfCoreDbContext>(), sp.GetRequiredService<IMediator>()));

    /// <summary>
    /// Executes an Entity Framework database context operation asynchronously and returns a result.
    /// </summary>
    /// <typeparam name="T">The type of the result.</typeparam>
    /// <param name="action">The action to execute.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    public Task<T> ExecuteEfDbContextAsync<T>(Func<TEfCoreDbContext, Task<T>> action) =>
        ExecuteScopeAsync(sp => action(sp.GetRequiredService<TEfCoreDbContext>()));

    /// <summary>
    /// Executes an Entity Framework database context operation with mediator asynchronously and returns a result.
    /// </summary>
    /// <typeparam name="T">The type of the result.</typeparam>
    /// <param name="action">The action to execute.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    public Task<T> ExecuteEfDbContextAsync<T>(Func<TEfCoreDbContext, IMediator, Task<T>> action) =>
        ExecuteScopeAsync(sp => action(sp.GetRequiredService<TEfCoreDbContext>(), sp.GetRequiredService<IMediator>()));

    /// <summary>
    /// Executes an Entity Framework database context operation with in-memory bus asynchronously.
    /// </summary>
    /// <param name="action">The action to execute.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    public Task ExecuteEfDbContextAsync(Func<TEfCoreDbContext, ICommandBus, Task> action) =>
        ExecuteScopeAsync(sp =>
            action(sp.GetRequiredService<TEfCoreDbContext>(), sp.GetRequiredService<ICommandBus>())
        );

    /// <summary>
    /// Inserts entities into the database asynchronously.
    /// </summary>
    /// <typeparam name="T">The type of the entities.</typeparam>
    /// <param name="entities">The entities to insert.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    public Task<int> InsertEfDbContextAsync<T>(T[] entities, CancellationToken cancellationToken = default)
        where T : class
    {
        return ExecuteEfDbContextAsync(db =>
        {
            foreach (var entity in entities.ToList())
            {
                db.Set<T>().Add(entity);
            }

            return db.SaveChangesAsync(cancellationToken);
        });
    }

    /// <summary>
    /// Inserts a single entity into the database asynchronously.
    /// </summary>
    /// <typeparam name="TEntity">The type of the entity.</typeparam>
    /// <param name="entity">The entity to insert.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    public Task<int> InsertEfDbContextAsync<TEntity>(TEntity entity, CancellationToken cancellationToken = default)
        where TEntity : class
    {
        return ExecuteEfDbContextAsync(db =>
        {
            db.Set<TEntity>().Add(entity);
            return db.SaveChangesAsync(cancellationToken);
        });
    }

    /// <summary>
    /// Inserts two entities into the database asynchronously.
    /// </summary>
    /// <typeparam name="TEntity">The type of the first entity.</typeparam>
    /// <typeparam name="TEntity2">The type of the second entity.</typeparam>
    /// <param name="entity">The first entity to insert.</param>
    /// <param name="entity2">The second entity to insert.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    public Task<int> InsertEfDbContextAsync<TEntity, TEntity2>(
        TEntity entity,
        TEntity2 entity2,
        CancellationToken cancellationToken = default
    )
        where TEntity : class
        where TEntity2 : class
    {
        return ExecuteEfDbContextAsync(db =>
        {
            db.Set<TEntity>().Add(entity);
            db.Set<TEntity2>().Add(entity2);
            return db.SaveChangesAsync(cancellationToken);
        });
    }

    /// <summary>
    /// Inserts three entities into the database asynchronously.
    /// </summary>
    /// <typeparam name="TEntity">The type of the first entity.</typeparam>
    /// <typeparam name="TEntity2">The type of the second entity.</typeparam>
    /// <typeparam name="TEntity3">The type of the third entity.</typeparam>
    /// <param name="entity">The first entity to insert.</param>
    /// <param name="entity2">The second entity to insert.</param>
    /// <param name="entity3">The third entity to insert.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    public Task<int> InsertEfDbContextAsync<TEntity, TEntity2, TEntity3>(
        TEntity entity,
        TEntity2 entity2,
        TEntity3 entity3,
        CancellationToken cancellationToken = default
    )
        where TEntity : class
        where TEntity2 : class
        where TEntity3 : class
    {
        return ExecuteEfDbContextAsync(db =>
        {
            db.Set<TEntity>().Add(entity);
            db.Set<TEntity2>().Add(entity2);
            db.Set<TEntity3>().Add(entity3);
            return db.SaveChangesAsync(cancellationToken);
        });
    }

    /// <summary>
    /// Inserts four entities into the database asynchronously.
    /// </summary>
    /// <typeparam name="TEntity">The type of the first entity.</typeparam>
    /// <typeparam name="TEntity2">The type of the second entity.</typeparam>
    /// <typeparam name="TEntity3">The type of the third entity.</typeparam>
    /// <typeparam name="TEntity4">The type of the fourth entity.</typeparam>
    /// <param name="entity">The first entity to insert.</param>
    /// <param name="entity2">The second entity to insert.</param>
    /// <param name="entity3">The third entity to insert.</param>
    /// <param name="entity4">The fourth entity to insert.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    public Task<int> InsertEfDbContextAsync<TEntity, TEntity2, TEntity3, TEntity4>(
        TEntity entity,
        TEntity2 entity2,
        TEntity3 entity3,
        TEntity4 entity4,
        CancellationToken cancellationToken = default
    )
        where TEntity : class
        where TEntity2 : class
        where TEntity3 : class
        where TEntity4 : class
    {
        return ExecuteEfDbContextAsync(db =>
        {
            db.Set<TEntity>().Add(entity);
            db.Set<TEntity2>().Add(entity2);
            db.Set<TEntity3>().Add(entity3);
            db.Set<TEntity4>().Add(entity4);
            return db.SaveChangesAsync(cancellationToken);
        });
    }

    /// <summary>
    /// Finds an entity by ID asynchronously.
    /// </summary>
    /// <typeparam name="T">The type of the entity.</typeparam>
    /// <param name="id">The ID of the entity to find.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    public Task<T?> FindEfDbContextAsync<T>(object id, CancellationToken cancellationToken = default)
        where T : class
    {
        return ExecuteEfDbContextAsync(db => db.Set<T>().FindAsync([id], cancellationToken).AsTask());
    }

    /// <summary>
    /// Initializes a new instance of the <see cref="SharedFixtureWithEfCore{TEntryPoint, TEfCoreDbContext}"/> class.
    /// </summary>
    /// <param name="messageSink">The message sink.</param>
    public SharedFixtureWithEfCore(IMessageSink messageSink)
        : base(messageSink)
    {
        messageSink.OnMessage(new DiagnosticMessage("Constructing SharedFixtureWithEfCore ..."));
    }
}
