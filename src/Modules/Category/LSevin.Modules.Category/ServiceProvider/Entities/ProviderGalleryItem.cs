using Ardalis.GuardClauses;
using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.Generators;
using LSevin.Modules.Category.ServiceProvider.ValueObjects;

namespace LSevin.Modules.Category.ServiceProvider.Entities;

public sealed class ProviderGalleryItem : Entity<ProviderGalleryItemId>
{
    #region Constructors

    private ProviderGalleryItem()
    {
        Title = null!;
        Description = null!;
        Url = string.Empty;
        MediaType = string.Empty;
        DisplayOrder = 0;
    }

    private ProviderGalleryItem(
        LocalizedString title,
        LocalizedString description,
        string url,
        string mediaType,
        int displayOrder
    )
        : this()
    {
        Id = ProviderGalleryItemId.Create(IdGenerator.NewId());
        Title = title;
        Description = description;
        Url = url;
        MediaType = mediaType;
        DisplayOrder = displayOrder;
    }

    #endregion

    #region Properties

    public LocalizedString Title { get; private set; }
    public LocalizedString Description { get; private set; }
    public string Url { get; private set; }
    public string MediaType { get; private set; }
    public int DisplayOrder { get; private set; }

    #endregion

    #region Methods

    public static ProviderGalleryItem Create(
        LocalizedString title,
        LocalizedString description,
        string url,
        string mediaType,
        int displayOrder = 0
    )
    {
        Guard.Against.Null(title, nameof(title));
        Guard.Against.Null(description, nameof(description));
        Guard.Against.NullOrEmpty(url, nameof(url));
        Guard.Against.NullOrEmpty(mediaType, nameof(mediaType));
        Guard.Against.Negative(displayOrder, nameof(displayOrder));

        return new ProviderGalleryItem(title, description, url, mediaType, displayOrder);
    }

    public void Update(
        LocalizedString title,
        LocalizedString description,
        string url,
        string mediaType,
        int displayOrder
    )
    {
        Guard.Against.Null(title, nameof(title));
        Guard.Against.Null(description, nameof(description));
        Guard.Against.NullOrEmpty(url, nameof(url));
        Guard.Against.NullOrEmpty(mediaType, nameof(mediaType));
        Guard.Against.Negative(displayOrder, nameof(displayOrder));

        Title = title;
        Description = description;
        Url = url;
        MediaType = mediaType;
        DisplayOrder = displayOrder;
    }

    #endregion
}
