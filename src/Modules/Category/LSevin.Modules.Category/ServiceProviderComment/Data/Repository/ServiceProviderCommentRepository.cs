using BuildingBlocks.Core.Persistence.Repositories;
using BuildingBlocks.Core.Persistence.Specification;
using LSevin.Modules.Category.Infrastructure.Data.Context;
using LSevin.Modules.Category.ServiceProviderComment.ValueObjects;
using Sieve.Services;

namespace LSevin.Modules.Category.ServiceProviderComment.Data.Repository;

internal sealed class ServiceProviderCommentRepository(CategoryContext dbContext, ISieveProcessor sieveProcessor)
    : Repository<Entities.ServiceProviderComment, ServiceProviderCommentId>(
        dbContext,
        SpecificationBaseEvaluator.Instance,
        sieveProcessor
    ),
        IServiceProviderCommentRepository
{
    // Additional repository methods implementation if needed
}
