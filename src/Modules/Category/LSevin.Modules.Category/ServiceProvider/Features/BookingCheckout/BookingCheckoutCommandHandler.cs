using Ardalis.GuardClauses;
using AutoMapper;
using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Security.Jwt.Services;
using LSevin.Modules.Category.ServiceProvider.Data.Repository;
using LSevin.Modules.Category.ServiceProvider.Entities;
using LSevin.Modules.Category.ServiceProvider.Enumerations;
using LSevin.Modules.Category.ServiceProvider.Services;
using ServiceProviderDomain = LSevin.Modules.Category.ServiceProvider.Entities.ServiceProvider;

namespace LSevin.Modules.Category.ServiceProvider.Features.BookingCheckout;

internal sealed class BookingCheckoutCommandHandler(
    IBookingRepository repository,
    IUserAccessor userAccessor,

    IMapper mapper,
    IServiceProviderUniquenessCheckerService uniquenessChecker
) : CommandHandler<BookingCheckoutCommand, Guid>
{
    public override async Task<Result<Guid>> Handle(
        BookingCheckoutCommand command,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(command, nameof(command));

        if (
            command.SelectedTimeFrom.HasValue &&
            command.SelectedTimeTo.HasValue &&
            command.SelectedTimeFrom.Value >= command.SelectedTimeTo.Value
        )
        {
            return AppError.ApplicationErrorMessage(
                    "Booking.InvalidTimeRange",
                    "selected_time_from must be less than selected_time_to."
            );
        }

        var booking = await repository.GetPendingByUserIdAsync(userAccessor.GetUserIdentity, cancellationToken);

        if (booking is null)
        {
            booking = BookingDomain.CreateDraft(userAccessor.GetUserIdentity);

            booking.SaveCheckout(
                command.ProviderId,
                command.ServiceId,
                command.SpecialistId,
                command.SelectedDate,
                command.SelectedDateFrom,
                command.SelectedDateTo,
                command.SelectedTime,
                command.SelectedTimeFrom,
                command.SelectedTimeTo,
                command.PaymentMethod,
                command.AddOns,
                command.UploadFiles,
                command.AdditionalServices,
                command.Step
            );

            if (command.IsFinalSubmit)
            {
                try
                {
                    booking.FinalizeCheckout(command.PaymentStatus, command.ConfirmationCode);
                }
                catch (InvalidOperationException ex)
                {
                    return AppError.ApplicationErrorMessage(
                        "Booking.IncompleteCheckout", ex.Message
                    );
                }
            }

            await repository.AddAsync(booking, cancellationToken);
            await repository.UnitOfWork.SaveEntitiesAsync(cancellationToken);

            return booking.Id;
        }

        if (!string.Equals(booking.BookingStatus, BookingStatuses.Pending, StringComparison.OrdinalIgnoreCase))
        {
            return AppError.AuthenticationError(
                    "Booking.CheckoutFinalized " + "\n"+
                    "This booking checkout is already final and cannot be edited."
            );
        }

        booking.SaveCheckout(
            command.ProviderId,
            command.ServiceId,
            command.SpecialistId,
            command.SelectedDate,
            command.SelectedDateFrom,
            command.SelectedDateTo,
            command.SelectedTime,
            command.SelectedTimeFrom,
            command.SelectedTimeTo,
            command.PaymentMethod,
            command.AddOns,
            command.UploadFiles,
            command.AdditionalServices,
            command.Step
        );

        if (command.IsFinalSubmit)
        {
            try
            {
                booking.FinalizeCheckout(command.PaymentStatus, command.ConfirmationCode);
            }
            catch (InvalidOperationException ex)
            {
                return AppError.ApplicationErrorMessage(
                    "Booking.IncompleteCheckout", ex.Message
                );
            }
        }

        repository.Update(booking);
        await repository.UnitOfWork.SaveEntitiesAsync(cancellationToken);

        return booking.Id;
    }
}
