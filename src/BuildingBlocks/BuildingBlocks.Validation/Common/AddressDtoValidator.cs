using BuildingBlocks.Core.Models;
using BuildingBlocks.Core.Resources;
using BuildingBlocks.Validation.Extensions;
using FluentValidation;

namespace BuildingBlocks.Validation.Common;

public sealed class AddressDtoValidator : AbstractValidator<AddressDto>
{
    public AddressDtoValidator()
    {
        RuleFor(r => r.Country).ValidateText(SharedResource.Country);
        RuleFor(r => r.City).ValidateText(SharedResource.City);

        When(
            r => r.Street is not null,
            () =>
                RuleFor(r => r.Street!).ValidateLocalizedContent(SharedResource.Street, supportEmptyTranslations: true)
        );

        When(
            r => r.Detail is not null,
            () =>
                RuleFor(r => r.Detail!).ValidateLocalizedContent(SharedResource.Address, supportEmptyTranslations: true)
        );

        RuleFor(r => r.ZipCode).ValidateText(SharedResource.Zip_Code, nullable: true);

        // Validate coordinates when present
        When(
            r => r.Coordinates is not null,
            () => RuleFor(r => r.Coordinates!).SetValidator(new CoordinatesDtoValidator())
        );
    }
}
