using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Resources;
using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Customer.Constants;
using LSevin.Modules.Customer.Resources;

namespace LSevin.Modules.Customer.Consulting.Features.RequestConsulting;

internal sealed class RequestConsultingCommandValidator : AbstractValidator<RequestConsultingCommand>
{
    public RequestConsultingCommandValidator()
    {
        RuleFor(request => request.Description)
            .ValidateText(SharedResource.Description, maxLength: DomainConstValues.ConsultingDescriptionMaxLength);

        RuleFor(x => x.CategoryId).ValidateGuid(CustomerResource.Consulting_Reason);

        RuleFor(x => x.CategoryName)
            .ValidateText(
                CustomerResource.Consulting_Reason,
                maxLength: DomainConstValues.ConsultingCategoryNameMaxLength
            );

        RuleFor(x => x.DocumentIds)
            .Must(documents => documents.Count > 0)
            .WithMessage(AppError.RequiredMessage(SharedResource.Document));
    }
}
