using BuildingBlocks.Core.Domain.Data;
using LSevin.Modules.Category.ServiceProviderComment.ValueObjects;

namespace LSevin.Modules.Category.ServiceProviderComment.Data.Repository;

public interface IServiceProviderCommentRepository
    : IRepository<Entities.ServiceProviderComment, ServiceProviderCommentId>;
