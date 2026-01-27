using BuildingBlocks.Core.Models;
using FluentValidation;

namespace BuildingBlocks.Validation.Common;

/// <summary>
/// Validator for <see cref="CoordinatesDto"/> ensuring geographic coordinate ranges.
/// </summary>
public sealed class CoordinatesDtoValidator : AbstractValidator<CoordinatesDto>
{
    public CoordinatesDtoValidator()
    {
        RuleFor(x => x.Longitude)
            .InclusiveBetween(-180.0, 180.0)
            .WithMessage("Longitude must be between -180 and 180 degrees.")
            .WithErrorCode("COORDINATES_INVALID_LONGITUDE");

        RuleFor(x => x.Latitude)
            .InclusiveBetween(-90.0, 90.0)
            .WithMessage("Latitude must be between -90 and 90 degrees.")
            .WithErrorCode("COORDINATES_INVALID_LATITUDE");
    }
}
