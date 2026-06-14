using BuildingBlocks.Core.Clock;
using BuildingBlocks.Core.Domain.Constants;
using BuildingBlocks.Core.Domain.Enumerations;
using BuildingBlocks.Core.Extensions;
using BuildingBlocks.Core.Resources;
using BuildingBlocks.Validation.Common;
using BuildingBlocks.Validation.Extensions;
using FluentValidation;

namespace LSevin.Modules.Customer.Customer.Features.UpdateCustomer;

internal sealed class UpdateCustomerCommandValidator : AbstractValidator<UpdateCustomerCommand>
{
    public UpdateCustomerCommandValidator()
    {
        RuleFor(x => x.BirthDate)
            .Must(date =>
                date < SystemClock.Today || date > SystemClock.Today.AddYears(-GlobalDomainConstValues.MaxAge)
            )
            .WithMessage(SharedResource.Validation_Error_Message.FormatWithStr(SharedResource.Birth_Date));

        RuleFor(x => x.Address).SetValidator(new AddressDtoValidator());

        RuleFor(x => x.Gender).MustBeValidEnumeration<UpdateCustomerCommand, Gender>(SharedResource.Gender);
    }
}
