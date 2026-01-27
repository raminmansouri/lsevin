using Ardalis.GuardClauses;
using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Category.Resources;
using LSevin.Modules.Category.ServiceDefinition.ValueObjects;
using LSevin.Modules.Category.Staff.Data.Repository;
using LSevin.Modules.Category.Staff.Specifications;

namespace LSevin.Modules.Category.Staff.Features.AddStaffService;

internal sealed class AddStaffServiceCommandHandler(IStaffRepository repository)
    : CommandHandler<AddStaffServiceCommand, Guid>
{
    public override async Task<Result<Guid>> Handle(AddStaffServiceCommand command, CancellationToken cancellationToken)
    {
        Guard.Against.Null(command, nameof(command));

        var spec = new StaffByIdWithDetailsSpec(command.StaffId);
        var staff = await repository.FirstOrDefaultAsync(spec, cancellationToken);

        if (staff is null)
        {
            return AppError.NotFoundErrorMessage(CategoryResource.Staff);
        }

        var notes = LocalizedString.Create(command.Notes.Translations);

        staff.AddService(ServiceDefinitionId.Create(command.ServiceDefinitionId), notes);

        repository.Update(staff);
        await repository.UnitOfWork.SaveChangesAsync(cancellationToken);

        return staff.Id.Value;
    }
}
