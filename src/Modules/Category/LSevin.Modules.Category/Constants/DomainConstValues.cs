using BuildingBlocks.Core.Persistence;

namespace LSevin.Modules.Category.Constants;

internal static class DomainConstValues
{
    public const int CategoryNameMaxLength = EfConstants.Lenght.Large;
    public const int CategoryDescriptionMaxLength = EfConstants.Lenght.UltraLong;
    public const int CategoryIconUrlMaxLength = EfConstants.Lenght.Large;

    public const int ServiceDefinitionNameMaxLength = EfConstants.Lenght.Medium;
    public const int ServiceDefinitionDescriptionMaxLength = EfConstants.Lenght.UltraLong;
    public const int ServicePricingModelMaxLength = EfConstants.Lenght.Medium;

    public const int ServiceAttributeNameMaxLength = EfConstants.Lenght.Medium;
    public const int ServiceAttributeDescriptionMaxLength = EfConstants.Lenght.UltraLong;

    public const int AttributeOptionDisplayNameMaxLength = EfConstants.Lenght.Medium;
    public const int AttributeOptionValueMaxLength = EfConstants.Lenght.Medium;

    public const int ServiceRequirementDescriptionMaxLength = EfConstants.Lenght.UltraLong;

    public const int ProviderTypeNameMaxLength = EfConstants.Lenght.Medium;
    public const int ProviderTypeDescriptionMaxLength = EfConstants.Lenght.UltraLong;

    public const int ProviderAttributeNameMaxLength = EfConstants.Lenght.Medium;
    public const int ProviderAttributeDescriptionMaxLength = EfConstants.Lenght.UltraLong;
    public const int ProviderAttributeValidationRulesMaxLength = EfConstants.Lenght.Large;

    public const int ServiceProviderNameMaxLength = EfConstants.Lenght.Medium;
    public const int ServiceProviderDescriptionMaxLength = EfConstants.Lenght.UltraLong;
    public const int AttributeValueMaxLength = EfConstants.Lenght.Large;

    public const int ProviderServiceNameMaxLength = EfConstants.Lenght.Medium;
    public const int ProviderServiceDescriptionMaxLength = EfConstants.Lenght.UltraLong;

    public const int GalleryItemTitleMaxLength = EfConstants.Lenght.Medium;
    public const int GalleryItemDescriptionMaxLength = EfConstants.Lenght.UltraLong;
    public const int UrlMaxLength = EfConstants.Lenght.Large;

    public const int PolicyTitleMaxLength = EfConstants.Lenght.Medium;
    public const int PolicyDescriptionMaxLength = EfConstants.Lenght.UltraLong;

    public const int StaffNameMaxLength = EfConstants.Lenght.Medium;
    public const int StaffBiographyMaxLength = EfConstants.Lenght.UltraLong;
    public const int StaffTitleMaxLength = EfConstants.Lenght.Medium;
    public const int StaffProfileImageUrlMaxLength = EfConstants.Lenght.Large;
    public const int NotesMaxLength = EfConstants.Lenght.UltraLong;

    public const int ServiceProviderRequestMessageMaxLength = EfConstants.Lenght.UltraLong;

    public const int ServiceProviderCommentTextMaxLength = 2000;
}
