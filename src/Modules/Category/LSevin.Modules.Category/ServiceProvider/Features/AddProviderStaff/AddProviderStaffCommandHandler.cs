using Ardalis.GuardClauses;
using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Category.Resources;
using LSevin.Modules.Category.ServiceProvider.Data.Repository;
using LSevin.Modules.Category.ServiceProvider.Entities;
using LSevin.Modules.Category.ServiceProvider.Specifications;
using LSevin.Modules.Category.Staff.Data.Repository;
using LSevin.Modules.Category.Staff.ValueObjects;

namespace LSevin.Modules.Category.ServiceProvider.Features.AddProviderStaff;

internal sealed class AddProviderStaffCommandHandler(IServiceProviderRepository serviceProviderRepository)
    : CommandHandler<AddProviderStaffCommand, Guid>
{
    public override async Task<Result<Guid>> Handle(
        AddProviderStaffCommand command,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(command, nameof(command));

        // Verify the service provider exists
        var spec = new ServiceProviderByIdWithDetailsSpec(command.ServiceProviderId);
        var serviceProvider = await serviceProviderRepository.FirstOrDefaultAsync(spec, cancellationToken);

        if (serviceProvider is null)
        {
            return AppError.NotFoundErrorMessage(CategoryResource.Service_Provider);
        }

        // Convert LocalizedContentDto to LocalizedString
        var notes = LocalizedString.Create(command.Notes.Translations);

        var providerStaff = ProviderStaff.Create(command.StaffId, notes, command.IsActive);

        serviceProvider.AddStaffMember(providerStaff);

        serviceProviderRepository.Update(serviceProvider);
        await serviceProviderRepository.UnitOfWork.SaveEntitiesAsync(cancellationToken);

        return providerStaff.Id.Value;
    }
}
