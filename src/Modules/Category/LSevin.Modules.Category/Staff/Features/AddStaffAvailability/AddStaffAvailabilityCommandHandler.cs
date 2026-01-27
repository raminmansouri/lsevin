using Ardalis.GuardClauses;
using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Category.Resources;
using LSevin.Modules.Category.Staff.Data.Repository;
using LSevin.Modules.Category.Staff.Enumerations;
using LSevin.Modules.Category.Staff.Specifications;
using LSevin.Modules.Category.Staff.ValueObjects;

namespace LSevin.Modules.Category.Staff.Features.AddStaffAvailability;

internal sealed class AddStaffAvailabilityCommandHandler(IStaffRepository repository)
    : CommandHandler<AddStaffAvailabilityCommand, Guid>
{
    public override async Task<Result<Guid>> Handle(
        AddStaffAvailabilityCommand command,
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

        staff.AddAvailability(
            command.DayOfWeek,
            command.StartTime,
            command.EndTime,
            status,
            command.IsRecurring,
            command.SpecificDate
        );

        repository.Update(staff);
        await repository.UnitOfWork.SaveChangesAsync(cancellationToken);

        return staff.Id.Value;
    }
}
