using AutoMapper;
using BuildingBlocks.Core.Domain.Enumerations;
using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Security.Jwt.Services;
using LSevin.Modules.Customer.Customer.Data.Repository;
using LSevin.Modules.Customer.Customer.Specifications;
using LSevin.Modules.Customer.Resources;

namespace LSevin.Modules.Customer.Customer.Features.UpdateCustomer;

internal sealed class UpdateCustomerCommandHandler(
    ICustomerRepository repository,
    IUserAccessor userAccessor,
    IMapper mapper
) : CommandHandler<UpdateCustomerCommand, Guid>
{
    public override async Task<Result<Guid>> Handle(UpdateCustomerCommand request, CancellationToken cancellationToken)
    {
        var spec = new CustomerByIdSpec(userAccessor.GetUserIdentity);
        var customer = await repository.FirstOrDefaultAsync(spec, cancellationToken);
        if (customer is null)
            return AppError.NotFoundErrorMessage(CustomerResource.Customer);

        customer.ChangeAttribute(
            birthDate: request.BirthDate,
            address: mapper.Map<Address>(request.Address),
            gender: Enumeration.FromValue<Gender>(request.Gender)
        );

        repository.Update(customer);
        await repository.UnitOfWork.SaveEntitiesAsync(cancellationToken);
        return customer.Id.Value;
    }
}
