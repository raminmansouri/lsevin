using Ardalis.GuardClauses;
using AutoMapper;
using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Category.Resources;
using LSevin.Modules.Category.ServiceProvider.Data.Repository;
using LSevin.Modules.Category.ServiceProvider.Enumerations;
using LSevin.Modules.Category.ServiceProvider.Services;
using LSevin.Modules.Category.ServiceProvider.Specifications;

namespace LSevin.Modules.Category.ServiceProvider.Features.UpdateServiceProvider;

internal sealed class UpdateServiceProviderCommandHandler(
    IServiceProviderRepository repository,
    IMapper mapper,
    IServiceProviderUniquenessCheckerService uniquenessChecker
) : CommandHandler<UpdateServiceProviderCommand, Guid>
{
    public override async Task<Result<Guid>> Handle(
        UpdateServiceProviderCommand command,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(command, nameof(command));

        var spec = new ServiceProviderByIdSpec(command.ServiceProviderId);
        var serviceProvider = await repository.FirstOrDefaultAsync(spec, cancellationToken);

        if (serviceProvider is null)
            return AppError.NotFoundErrorMessage(CategoryResource.Service_Provider);

        var name = LocalizedString.Create(command.Name.Translations);
        var description = LocalizedString.Create(command.Description.Translations);
        var grade = command.GradeId.HasValue
            ? Enumeration.FromValue<ServiceProviderGrade>(command.GradeId.Value)
            : null;
        var address = mapper.Map<Address>(command.Address);
        var phoneNumber = PhoneNumber.Create(command.ContactPhone, command.CountryCode);

        serviceProvider.Update(
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

        repository.Update(serviceProvider);
        await repository.UnitOfWork.SaveEntitiesAsync(cancellationToken);

        return serviceProvider.Id.Value;
    }
}
