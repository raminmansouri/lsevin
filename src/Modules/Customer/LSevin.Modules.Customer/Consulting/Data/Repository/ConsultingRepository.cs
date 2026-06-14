using BuildingBlocks.Core.Persistence.Repositories;
using BuildingBlocks.Core.Persistence.Specification;
using LSevin.Modules.Customer.Consulting.ValueObjects;
using LSevin.Modules.Customer.Infrastructure.Data.Context;
using Sieve.Services;
using ConsultingDomain = LSevin.Modules.Customer.Consulting.Entities.Consulting;

namespace LSevin.Modules.Customer.Consulting.Data.Repository;

internal sealed class ConsultingRepository(CustomerContext dbContext, ISieveProcessor sieveProcessor)
    : Repository<ConsultingDomain, ConsultingId>(dbContext, SpecificationBaseEvaluator.Instance, sieveProcessor),
        IConsultingRepository;
