using BuildingBlocks.Core.Domain.Primitives;

namespace LSevin.Modules.Category.ServiceProvider.ValueObjects;

public sealed record ProviderGalleryItemId(Guid Value) : TypedIdValueBase(Value)
{
    public static ProviderGalleryItemId Create(Guid value) => new(value);

    public static implicit operator Guid(ProviderGalleryItemId providerGalleryItemId) => providerGalleryItemId.Value;

    public static implicit operator ProviderGalleryItemId(Guid providerGalleryItemId) => Create(providerGalleryItemId);
}
