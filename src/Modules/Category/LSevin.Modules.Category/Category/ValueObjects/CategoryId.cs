using BuildingBlocks.Core.Domain.Primitives;

namespace LSevin.Modules.Category.Category.ValueObjects;

public sealed record CategoryId(Guid Value) : TypedIdValueBase(Value)
{
    public static CategoryId Create(Guid value) => new(value);

    public static implicit operator Guid(CategoryId categoryId) => categoryId.Value;

    public static implicit operator CategoryId(Guid categoryId) => Create(categoryId);
}
