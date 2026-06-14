using BuildingBlocks.Validation.Common;
using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ServiceProviderComment.Features.GetCommentsByServiceProvider;

internal sealed class GetCommentsByServiceProviderQueryValidator : AbstractValidator<GetCommentsByServiceProviderQuery>
{
    public GetCommentsByServiceProviderQueryValidator()
    {
        RuleFor(x => x.ServiceProviderId).ValidateGuid(CategoryResource.Service_Provider);

        Include(new PageRequestValidator());
    }
}
