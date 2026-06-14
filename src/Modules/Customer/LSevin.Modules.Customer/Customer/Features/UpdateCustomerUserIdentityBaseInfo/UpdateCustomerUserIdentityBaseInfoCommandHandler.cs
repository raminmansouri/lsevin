using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Customer.Customer.Data.Repository;
using LSevin.Modules.Customer.Customer.Services;
using LSevin.Modules.Customer.Customer.Specifications;
using LSevin.Modules.Customer.Resources;

namespace LSevin.Modules.Customer.Customer.Features.UpdateCustomerUserIdentityBaseInfo;

internal sealed class UpdateCustomerUserIdentityBaseInfoCommandHandler(
    ICustomerRepository repository,
    ICustomerUniquenessCheckerService uniquenessCheckerService
) : InternalCommandHandler<UpdateCustomerUserIdentityBaseInfoCommand>
{
    public override async Task<Result<bool>> Handle(
        UpdateCustomerUserIdentityBaseInfoCommand request,
        CancellationToken cancellationToken
    )
    {
        var spec = new CustomerByIdSpec(request.UserId);
        var customer = await repository.FirstOrDefaultAsync(spec, cancellationToken);
        if (customer is null)
            return AppError.NotFoundErrorMessage(CustomerResource.Customer);

        customer.UpdateUserIdentity(
            request.FirstName,
            request.LastName,
            PhoneNumber.Create(request.PhoneNumber, request.PhoneNumberCountryCode),
            request.Email,
            uniquenessCheckerService
        );

        repository.Update(customer);
        return await repository.UnitOfWork.SaveEntitiesAsync(cancellationToken);
    }
}
