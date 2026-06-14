using Ardalis.GuardClauses;
using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Category.Resources;
using LSevin.Modules.Category.Staff.Data.Repository;
using LSevin.Modules.Category.Staff.Enumerations;
using LSevin.Modules.Category.Staff.Specifications;

namespace LSevin.Modules.Category.Staff.Features.UpdateStaffAvailability;

internal sealed class UpdateStaffAvailabilityCommandHandler(IStaffRepository repository)
    : CommandHandler<UpdateStaffAvailabilityCommand, Guid>
{
    public override async Task<Result<Guid>> Handle(
        UpdateStaffAvailabilityCommand command,
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

        var status = Enumeration.FromValue<StaffAvailabilityStatus>(command.AvailabilityStatusId);
        if (status is null)
        {
            return AppError.NotFoundErrorMessage(CategoryResource.Staff_Availability_Status);
        }

        staff.UpdateAvailability(
            command.AvailabilityId,
            command.DayOfWeek,
            command.StartTime,
            command.EndTime,
            command.IsRecurring,
            status,
            command.SpecificDate
        );

        repository.Update(staff);
        await repository.UnitOfWork.SaveChangesAsync(cancellationToken);

        return staff.Id.Value;
    }
}
