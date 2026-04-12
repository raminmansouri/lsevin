using Ardalis.GuardClauses;
using AutoMapper;
using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Category.ServiceProvider.Data.Repository;
using LSevin.Modules.Category.ServiceProvider.Enumerations;
using LSevin.Modules.Category.ServiceProvider.Services;
using ServiceProviderDomain = LSevin.Modules.Category.ServiceProvider.Entities.ServiceProvider;

namespace LSevin.Modules.Category.ServiceProvider.Features.BookingCheckout;

internal sealed class BookingCheckoutCommandHandler(
    IServiceProviderRepository repository,
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

        var name = LocalizedString.Create(command.Name.Translations);
        var description = LocalizedString.Create(command.Description.Translations);

        var grade = command.GradeId.HasValue
            ? Enumeration.FromValue<ServiceProviderGrade>(command.GradeId.Value)
            : null;
        var address = mapper.Map<Address>(command.Address);
        var phoneNumber = PhoneNumber.Create(command.ContactPhone, command.CountryCode);

        var serviceProvider = ServiceProviderDomain.Create(
            uniquenessChecker,
            name,
            description,
            command.ContactEmail,
            phoneNumber,
            address,
            command.ProviderTypeId,
            command.IsActive,
            grade
        );

        await repository.CreateAsync(serviceProvider, cancellationToken);

        return serviceProvider.Id.Value;
    }
}
