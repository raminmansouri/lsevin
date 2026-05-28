using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.ServiceProvider.Features.UpdateCategoryImage;

public sealed class UploadAnyFileValidator : AbstractValidator<UploadAnyFileCommand>
{
    public UploadAnyFileValidator()
    {
        //RuleFor(x => x.ServiceProviderId).ValidateGuid(CategoryResource.Service_Provider);

      
    }
}
