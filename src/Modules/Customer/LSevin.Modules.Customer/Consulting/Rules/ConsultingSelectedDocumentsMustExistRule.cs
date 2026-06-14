using BuildingBlocks.Core.Domain.Primitives;
using LSevin.Modules.Customer.Customer.Services;
using LSevin.Modules.Customer.Customer.ValueObjects;
using LSevin.Modules.Customer.Resources;

namespace LSevin.Modules.Customer.Consulting.Rules;

internal sealed class ConsultingSelectedDocumentsMustExistRule(
    ICustomerDocumentCheckerService customerDocumentCheckerService,
    CustomerId customerId,
    IReadOnlyCollection<CustomerDocumentId> selectedDocumentIds
) : IBusinessRule
{
    public bool IsBroken() => !customerDocumentCheckerService.ContainsAll(customerId, selectedDocumentIds);

    public string Message => CustomerResource.Customer_Document_Mismatch_Error_Message;
}
