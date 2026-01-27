using AutoMapper;
using LSevin.Modules.Common.IntegrationEvents.Customer;
using LSevin.Modules.Common.IntegrationEvents.User;
using LSevin.Modules.Customer.Customer.Features.ChangeCustomerActivation;
using LSevin.Modules.Customer.Customer.Features.CreateCustomer;
using LSevin.Modules.Customer.Customer.Features.UpdateCustomerUserIdentityBaseInfo;

namespace LSevin.Modules.Customer.Customer.Mappings;

internal sealed class CustomerMappings : Profile
{
    public CustomerMappings()
    {
        CreateMap<UserRegisteredIntegrationEvent, CreateCustomerCommand>()
            .ConstructUsing(src => new CreateCustomerCommand(
                src.UserId,
                src.FirstName,
                src.LastName,
                src.PhoneNumber,
                src.PhoneNumberCountryCode,
                src.Email
            ));

        CreateMap<UserUpdatedIntegrationEvent, UpdateCustomerUserIdentityBaseInfoCommand>()
            .ConstructUsing(src => new UpdateCustomerUserIdentityBaseInfoCommand(
                src.UserId,
                src.FirstName,
                src.LastName,
                src.PhoneNumber,
                src.PhoneNumberCountryCode,
                src.Email
            ));

        CreateMap<UserStateUpdatedIntegrationEvent, ChangeCustomerActivationCommand>()
            .ConstructUsing(src => new ChangeCustomerActivationCommand(src.UserId, src.IsActive));
    }
}
