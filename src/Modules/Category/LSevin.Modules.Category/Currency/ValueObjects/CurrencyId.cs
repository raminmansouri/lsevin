using BuildingBlocks.Core.Domain.Primitives;

namespace LSevin.Modules.Category.Category.ValueObjects;

public sealed record CurrencyId(Guid Value) : TypedIdValueBase(Value)
{
    public static CurrencyId Create(Guid value) => new(value);

    public static implicit operator Guid(CurrencyId categoryId) => categoryId.Value;

    public static implicit operator CurrencyId(Guid categoryId) => Create(categoryId);
}
