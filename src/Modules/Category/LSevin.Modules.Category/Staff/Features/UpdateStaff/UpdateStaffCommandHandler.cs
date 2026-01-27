using Ardalis.GuardClauses;
using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Category.Resources;
using LSevin.Modules.Category.Staff.Data.Repository;
using LSevin.Modules.Category.Staff.Specifications;
using LSevin.Modules.Category.Staff.ValueObjects;

namespace LSevin.Modules.Category.Staff.Features.UpdateStaff;

internal sealed class UpdateStaffCommandHandler(IStaffRepository repository) : CommandHandler<UpdateStaffCommand, Guid>
{
    public override async Task<Result<Guid>> Handle(UpdateStaffCommand command, CancellationToken cancellationToken)
    {
        Guard.Against.Null(command, nameof(command));

        var spec = new StaffByIdSpec(command.StaffId);
        var staff = await repository.FirstOrDefaultAsync(spec, cancellationToken);

        if (staff is null)
        {
            return AppError.NotFoundErrorMessage(CategoryResource.Staff);
        }

        // Convert DTOs to LocalizedString
        var name = LocalizedString.Create(command.Name.Translations);
        var biography = LocalizedString.Create(command.Biography.Translations);
        var title = LocalizedString.Create(command.Title.Translations);

        staff.Update(name, biography, title, command.ProfileImageUrl, command.IsActive);

        repository.Update(staff);
        await repository.UnitOfWork.SaveChangesAsync(cancellationToken);

        return staff.Id.Value;
    }
}
