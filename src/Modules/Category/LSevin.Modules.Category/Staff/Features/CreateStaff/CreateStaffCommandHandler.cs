using Ardalis.GuardClauses;
using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Category.Staff.Data.Repository;
using StaffDomain = LSevin.Modules.Category.Staff.Entities.Staff;

namespace LSevin.Modules.Category.Staff.Features.CreateStaff;

internal sealed class CreateStaffCommandHandler(IStaffRepository repository) : CommandHandler<CreateStaffCommand, Guid>
{
    public override async Task<Result<Guid>> Handle(CreateStaffCommand command, CancellationToken cancellationToken)
    {
        Guard.Against.Null(command, nameof(command));

        // Convert DTOs to LocalizedString
        var name = LocalizedString.Create(command.Name.Translations);
        var biography = LocalizedString.Create(command.Biography.Translations);
        var title = LocalizedString.Create(command.Title.Translations);

        var staff = StaffDomain.Create(name, biography, title, command.ProfileImageUrl, command.IsActive);

        await repository.CreateAsync(staff, cancellationToken);

        return staff.Id.Value;
    }
}
