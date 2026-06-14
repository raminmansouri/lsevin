using BuildingBlocks.Core.Persistence.Repositories;
using BuildingBlocks.Core.Persistence.Specification;
using LSevin.Modules.Category.Infrastructure.Data.Context;
using LSevin.Modules.Category.Staff.ValueObjects;
using Sieve.Services;

namespace LSevin.Modules.Category.Staff.Data.Repository;

internal sealed class StaffRepository(CategoryContext dbContext, ISieveProcessor sieveProcessor)
    : Repository<Entities.Staff, StaffId>(dbContext, SpecificationBaseEvaluator.Instance, sieveProcessor),
        IStaffRepository;
