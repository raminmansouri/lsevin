using Ardalis.GuardClauses;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Category.Resources;
using LSevin.Modules.Category.Staff.Data.Repository;
using LSevin.Modules.Category.Staff.Specifications;
using LSevin.Modules.Category.Staff.ValueObjects;

namespace LSevin.Modules.Category.Staff.Features.DeleteStaff;

internal sealed class DeleteStaffCommandHandler(IStaffRepository repository) : CommandHandler<DeleteStaffCommand, Guid>
{
    public override async Task<Result<Guid>> Handle(DeleteStaffCommand command, CancellationToken cancellationToken)
    {
        Guard.Against.Null(command, nameof(command));

        var spec = new StaffByIdSpec(command.StaffId);
        var staff = await repository.FirstOrDefaultAsync(spec, cancellationToken);

        if (staff is null)
        {
            return AppError.NotFoundErrorMessage(CategoryResource.Staff);
        }

        repository.Delete(staff);
        await repository.UnitOfWork.SaveChangesAsync(cancellationToken);

        return staff.Id.Value;
    }
}
