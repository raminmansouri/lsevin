using FluentValidation;

namespace LSevin.Modules.Category.ServiceRequest.Features.GetServiceProviderRequestsPagedAdmin;

internal sealed class GetServiceProviderRequestsPagedAdminQueryValidator
    : AbstractValidator<GetServiceProviderRequestsPagedAdminQuery>
{
    public GetServiceProviderRequestsPagedAdminQueryValidator()
    {
        // No extra params beyond inherited paging; add rules if new filters are introduced later
    }
}
