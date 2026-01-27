using BuildingBlocks.Validation.Common;
using FluentValidation;

namespace LSevin.Modules.Identity.User.Features.GetUsers;

internal sealed class GetUsersQueryValidator : AbstractValidator<GetUsersQuery>
{
    public GetUsersQueryValidator()
    {
        Include(new PageRequestValidator());
    }
}
