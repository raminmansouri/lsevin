using Ardalis.GuardClauses;
using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Category.Resources;
using LSevin.Modules.Category.ServiceProvider.Data.Repository;
using LSevin.Modules.Category.ServiceProvider.Specifications;
using LSevin.Modules.Category.ServiceProvider.ValueObjects;
using LSevin.Modules.Category.Staff.ValueObjects;

namespace LSevin.Modules.Category.ServiceProvider.Features.UpdateProviderStaff;

internal sealed class UpdateProviderStaffCommandHandler(IServiceProviderRepository serviceProviderRepository)
    : CommandHandler<UpdateProviderStaffCommand, bool>
{
    public override async Task<Result<bool>> Handle(
        UpdateProviderStaffCommand command,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(command, nameof(command));

        var spec = new ServiceProviderByIdWithDetailsSpec(command.ServiceProviderId);
        var serviceProvider = await serviceProviderRepository.FirstOrDefaultAsync(spec, cancellationToken);

        if (serviceProvider is null)
        {
            return AppError.NotFoundErrorMessage(CategoryResource.Service_Provider);
        }

        var staff = serviceProvider.StaffMembers.FirstOrDefault(s => s.StaffId.Value == command.StaffId);

        if (staff is null)
        {
            return AppError.NotFoundErrorMessage(CategoryResource.Staff);
        }

        // Convert LocalizedContentDto to LocalizedString
        var notes = LocalizedString.Create(command.Notes.Translations);
        var newStaffId = command.NewStaffId.HasValue ? StaffId.Create(command.NewStaffId.Value) : null;

        // Update staff using domain entity methods
        staff.Update(command.IsActive, notes, newStaffId);

        serviceProviderRepository.Update(serviceProvider);
        await serviceProviderRepository.UnitOfWork.SaveEntitiesAsync(cancellationToken);

        return true;
    }
}
