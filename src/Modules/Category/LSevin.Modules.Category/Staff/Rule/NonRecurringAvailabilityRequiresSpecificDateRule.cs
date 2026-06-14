using BuildingBlocks.Core.Domain.Primitives;
using LSevin.Modules.Category.Resources;

namespace LSevin.Modules.Category.Staff.Rule;

public sealed class NonRecurringAvailabilityRequiresSpecificDateRule(bool isRecurring, DateTime? specificDate)
    : IBusinessRule
{
    public bool IsBroken() => !isRecurring && specificDate == null;

    public string Message => CategoryResource.Staff_NonRecurring_Availability_Requires_Date_Error_Message;
}
