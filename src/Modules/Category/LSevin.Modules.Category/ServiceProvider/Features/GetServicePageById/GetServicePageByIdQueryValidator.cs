using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServicePageById;

internal sealed class GetServicePageByIdQueryValidator : AbstractValidator<GetServicePageByIdQuery>
{
    public GetServicePageByIdQueryValidator()
    {
        RuleFor(x => x.Id   ).ValidateGuid(CategoryResource.Service_Provider);
    }
}
