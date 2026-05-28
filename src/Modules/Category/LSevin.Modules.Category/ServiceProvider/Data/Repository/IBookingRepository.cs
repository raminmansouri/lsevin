using BuildingBlocks.Core.Domain.Data;
using LSevin.Modules.Category.ServiceProvider.Entities;
using LSevin.Modules.Category.ServiceProvider.ValueObjects;

public interface IBookingRepository : IRepository<BookingDomain, BookingId>
{

    Task<BookingDomain?> GetPendingByUserIdAsync(Guid userId, CancellationToken cancellationToken);

    Task<BookingDomain?> GetByIdAsync(Guid id, CancellationToken cancellationToken);

    Task AddAsync(BookingDomain booking, CancellationToken cancellationToken);

    void Update(BookingDomain booking);
}