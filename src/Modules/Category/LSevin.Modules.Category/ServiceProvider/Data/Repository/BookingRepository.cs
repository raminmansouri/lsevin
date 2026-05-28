using BuildingBlocks.Core.Domain.Data;
using BuildingBlocks.Core.Persistence.Repositories;
using BuildingBlocks.Core.Persistence.Specification;
using LSevin.Modules.Category.Infrastructure.Data.Context;
using LSevin.Modules.Category.ServiceProvider.Entities;
using LSevin.Modules.Category.ServiceProvider.Features.BookingCheckout;
using LSevin.Modules.Category.ServiceProvider.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Sieve.Services;

internal sealed class BookingRepository(CategoryContext dbContext, ISieveProcessor sieveProcessor) :  
    Repository<BookingDomain, BookingId>(
        dbContext,
        SpecificationBaseEvaluator.Instance,
        sieveProcessor
    ),
        IBookingRepository  
{
    public IUnitOfWork UnitOfWork => dbContext;

    public async Task<BookingDomain?> GetPendingByUserIdAsync(
        Guid userId,
        CancellationToken cancellationToken
    )
    {
        return await dbContext.Bookings
            .FirstOrDefaultAsync(
                x => x.UserId == userId && x.BookingStatus == BookingStatuses.Pending,
                cancellationToken
            );
    }

    public async Task<BookingDomain?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return await dbContext.Bookings
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task AddAsync(BookingDomain booking, CancellationToken cancellationToken)
    {
        await dbContext.Bookings.AddAsync(booking, cancellationToken);
    }

    public void Update(BookingDomain booking)
    {
        dbContext.Bookings.Update(booking);
    }
}