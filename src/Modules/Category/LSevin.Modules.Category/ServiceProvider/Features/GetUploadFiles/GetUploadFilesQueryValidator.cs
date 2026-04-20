using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetUploadFiles;

internal sealed class GetUploadFilesQueryValidator : AbstractValidator<GetUploadFilesQuery>
{
    public GetUploadFilesQueryValidator()
    {
        //RuleFor(query => query.ServiceProviderId).ValidateGuid(CategoryResource.Service_Provider);
    }
}
