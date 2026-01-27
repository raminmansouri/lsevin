using BuildingBlocks.Validation.Extensions;
using FluentValidation;
using LSevin.Modules.Customer.Resources;

namespace LSevin.Modules.Customer.Consulting.Features.GetConsultingSelectedDocuments;

internal sealed class GetConsultingSelectedDocumentsQueryValidator
    : AbstractValidator<GetConsultingSelectedDocumentsQuery>
{
    public GetConsultingSelectedDocumentsQueryValidator()
    {
        RuleFor(x => x.ConsultingId).ValidateGuid(CustomerResource.Consulting);
    }
}
