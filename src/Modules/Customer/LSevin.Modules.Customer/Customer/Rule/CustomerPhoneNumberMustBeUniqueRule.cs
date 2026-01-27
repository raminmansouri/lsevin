using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.Resources;
using LSevin.Modules.Customer.Customer.Services;
using LSevin.Modules.Customer.Customer.ValueObjects;

namespace LSevin.Modules.Customer.Customer.Rule;

internal sealed class CustomerPhoneNumberMustBeUniqueRule(
    ICustomerUniquenessCheckerService customerUniquenessCheckerService,
    PhoneNumber phoneNumber,
    CustomerId? id = null
) : IBusinessRule
{
    public bool IsBroken() => !customerUniquenessCheckerService.IsUnique(phoneNumber, id);

    public string Message => SharedResource.Phone_Number_Uniqueness_Error_Message;
}
