using Ardalis.GuardClauses;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Category.Resources;
using LSevin.Modules.Category.Staff.Data.Repository;
using LSevin.Modules.Category.Staff.Specifications;

namespace LSevin.Modules.Category.Staff.Features.RemoveStaffService;

internal sealed class RemoveStaffServiceCommandHandler(IStaffRepository repository)
    : CommandHandler<RemoveStaffServiceCommand, Guid>
{
    public override async Task<Result<Guid>> Handle(
        RemoveStaffServiceCommand command,
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

        staff.RemoveService(command.ServiceId);

        repository.Update(staff);
        await repository.UnitOfWork.SaveChangesAsync(cancellationToken);

        return staff.Id.Value;
    }
}
