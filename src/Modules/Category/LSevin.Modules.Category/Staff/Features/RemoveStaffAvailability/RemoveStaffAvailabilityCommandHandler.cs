using Ardalis.GuardClauses;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Category.Resources;
using LSevin.Modules.Category.Staff.Data.Repository;
using LSevin.Modules.Category.Staff.Specifications;

namespace LSevin.Modules.Category.Staff.Features.RemoveStaffAvailability;

internal sealed class RemoveStaffAvailabilityCommandHandler(IStaffRepository repository)
    : CommandHandler<RemoveStaffAvailabilityCommand, Guid>
{
    public override async Task<Result<Guid>> Handle(
        RemoveStaffAvailabilityCommand command,
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

        staff.RemoveAvailability(command.AvailabilityId);

        repository.Update(staff);
        await repository.UnitOfWork.SaveChangesAsync(cancellationToken);

        return staff.Id.Value;
    }
}
