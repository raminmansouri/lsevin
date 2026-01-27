using Ardalis.GuardClauses;
using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Category.Resources;
using LSevin.Modules.Category.ServiceDefinition.ValueObjects;
using LSevin.Modules.Category.Staff.Data.Repository;
using LSevin.Modules.Category.Staff.Specifications;
using LSevin.Modules.Category.Staff.ValueObjects;

namespace LSevin.Modules.Category.Staff.Features.UpdateStaffService;

internal sealed class UpdateStaffServiceCommandHandler(IStaffRepository repository)
    : CommandHandler<UpdateStaffServiceCommand, Guid>
{
    public override async Task<Result<Guid>> Handle(
        UpdateStaffServiceCommand command,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(command, nameof(command));

        var spec = new StaffByIdWithDetailsSpec(command.StaffId);
        var staff = await repository.FirstOrDefaultAsync(spec, cancellationToken);

        if (staff is null)
        {
            return AppError.NotFoundErrorMessage(CategoryResource.Staff);
        }

        var serviceId = StaffServiceId.Create(command.ServiceId);
        var notes = LocalizedString.Create(command.Notes.Translations);
        var serviceDefinitionId = command.ServiceDefinitionId.HasValue
            ? ServiceDefinitionId.Create(command.ServiceDefinitionId.Value)
            : null;

        staff.UpdateService(serviceId, command.IsActive, notes, serviceDefinitionId);

        repository.Update(staff);
        await repository.UnitOfWork.SaveChangesAsync(cancellationToken);

        return command.ServiceId;
    }
}
