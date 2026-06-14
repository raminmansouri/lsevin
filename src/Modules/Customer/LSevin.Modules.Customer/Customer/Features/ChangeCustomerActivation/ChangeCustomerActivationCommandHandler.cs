using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Customer.Customer.Data.Repository;
using LSevin.Modules.Customer.Customer.Specifications;
using LSevin.Modules.Customer.Resources;

namespace LSevin.Modules.Customer.Customer.Features.ChangeCustomerActivation;

internal sealed class ChangeCustomerActivationCommandHandler(ICustomerRepository repository)
    : InternalCommandHandler<ChangeCustomerActivationCommand>
{
    public override async Task<Result<bool>> Handle(
        ChangeCustomerActivationCommand request,
        CancellationToken cancellationToken
    )
    {
        var spec = new CustomerByIdSpec(request.UserId);
        var customer = await repository.FirstOrDefaultAsync(spec, cancellationToken);
        if (customer is null)
            return AppError.NotFoundErrorMessage(CustomerResource.Customer);

        customer.ChangeActivation(request.IsActive);

        repository.Update(customer);
        return await repository.UnitOfWork.SaveEntitiesAsync(cancellationToken);
    }
}
