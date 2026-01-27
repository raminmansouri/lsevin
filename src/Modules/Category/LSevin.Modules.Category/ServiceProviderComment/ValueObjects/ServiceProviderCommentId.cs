using BuildingBlocks.Core.Domain.Primitives;

namespace LSevin.Modules.Category.ServiceProviderComment.ValueObjects;

public sealed record ServiceProviderCommentId(Guid Value) : TypedIdValueBase(Value)
{
    public static ServiceProviderCommentId Create(Guid value) => new(value);

    public static implicit operator Guid(ServiceProviderCommentId id) => id.Value;

    public static implicit operator ServiceProviderCommentId(Guid id) => Create(id);
}
