using BuildingBlocks.Core.Domain.Data;
using LSevin.Modules.Customer.Customer.ValueObjects;
using CustomerDomain = LSevin.Modules.Customer.Customer.Entities.Customer;

namespace LSevin.Modules.Customer.Customer.Data.Repository;

public interface ICustomerRepository : IRepository<CustomerDomain, CustomerId>;
