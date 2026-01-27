using BuildingBlocks.Validation.Common;
using FluentValidation;

namespace LSevin.Modules.Customer.Consulting.Features.GetConsultings;

internal sealed class GetConsultingsQueryValidator : AbstractValidator<GetConsultingsQuery>
{
    public GetConsultingsQueryValidator()
    {
        Include(new PageRequestValidator());
    }
}
