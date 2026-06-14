using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Customer.Customer.Data.Repository;
using LSevin.Modules.Customer.Customer.Services;
using CustomerDomain = LSevin.Modules.Customer.Customer.Entities.Customer;

namespace LSevin.Modules.Customer.Customer.Features.CreateCustomer;

internal sealed class CreateCustomerCommandHandler(
    ICustomerRepository repository,
    ICustomerUniquenessCheckerService uniquenessCheckerService
) : InternalCommandHandler<CreateCustomerCommand>
{
    public override async Task<Result<bool>> Handle(CreateCustomerCommand request, CancellationToken cancellationToken)
    {
        var customer = CustomerDomain.Create(
            request.UserId,
            request.FirstName,
            request.LastName,
            PhoneNumber.Create(request.PhoneNumber, request.PhoneNumberCountryCode),
            request.Email,
            uniquenessCheckerService
        );

        await repository.CreateAsync(customer, cancellationToken);
        return true;
    }
}
