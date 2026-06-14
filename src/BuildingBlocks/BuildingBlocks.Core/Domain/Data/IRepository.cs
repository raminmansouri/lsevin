using BuildingBlocks.Core.Domain.Primitives;

namespace BuildingBlocks.Core.Domain.Data;

/// <summary>
/// Provides a combined interface for CRUD (Create, Read, Update, Delete) operations and unit of work for entities of type <typeparamref name="T"/>.
/// </summary>
/// <typeparam name="T">The type of the entity.</typeparam>
/// <typeparam name="TId">The type of the entity identifier.</typeparam>
public interface IRepository<T, TId>
    : ISaveRepository<T>,
        IDeleteRepository<T>,
        IFetchRepository<T>,
        IAsyncDisposable,
        IDisposable
    where T : IAggregateRoot<TId>
    where TId : TypedIdValueBase
{
    /// <summary>
    /// Gets the unit of work associated with this repository.
    /// </summary>
    IUnitOfWork UnitOfWork { get; }
}
