namespace LSevin.Modules.Category.Constants;

internal static class Routes
{
    private const string AppBaseUrl = "category-module";

    internal static class Category
    {
        internal const string Group = "Category";

        internal const string MainUrl = $"{AppBaseUrl}/categories";
        internal const string AdminUrl = $"{AppBaseUrl}/admin/categories";

        internal const string GetAll = $"{AdminUrl}";

        internal const string GetById = $"{AdminUrl}/{{categoryId:guid}}";

        internal const string Create = $"{AdminUrl}";

        internal const string Update = $"{AdminUrl}/{{categoryId:guid}}";

        internal const string Delete = $"{AdminUrl}/{{categoryId:guid}}";

        internal const string ChangeParent = $"{AdminUrl}/{{categoryId:guid}}/parent";

        internal const string ChangeActivation = $"{AdminUrl}/{{categoryId:guid}}/activation";

        internal const string GetCategoryTree = $"{AdminUrl}/tree";
    }

    internal static class Location
    {
        internal const string Group = "Location";

        internal const string MainUrl = $"{AppBaseUrl}/locations";

        internal const string GetCountries = $"{MainUrl}/countries";

        internal const string GetCitiesByCountry = $"{MainUrl}/countries/{{countryId:guid}}/cities";

        internal const string GetAllCountries = $"{MainUrl}/all-countries";

        internal const string GetAllCitiesByCountry = $"{MainUrl}/all-cities/{{countryCode}}";
    }

    internal static class ServiceDefinition
    {
        internal const string Group = "ServiceDefinition";

        internal const string MainUrl = $"{AppBaseUrl}/service-definitions";
        internal const string AdminUrl = $"{AppBaseUrl}/admin/service-definitions";

        internal const string GetAll = $"{AdminUrl}";

        internal const string GetAllLocales = $"{AdminUrl}/all-locales";

        internal const string GetById = $"{AdminUrl}/{{serviceDefinitionId:guid}}";

        internal const string GetByCategory = $"{AppBaseUrl}/categories/{{categoryId:guid}}/service-definitions";

        internal const string Create = $"{AdminUrl}";

        internal const string Update = $"{AdminUrl}/{{serviceDefinitionId:guid}}";

        internal const string Delete = $"{AdminUrl}/{{serviceDefinitionId:guid}}";

        internal const string AddAttributeDefinition = $"{AdminUrl}/{{serviceDefinitionId:guid}}/attributes";

        internal const string UpdateAttributeDefinition =
            $"{AdminUrl}/{{serviceDefinitionId:guid}}/attributes/{{attributeDefinitionId:guid}}";

        internal const string RemoveAttributeDefinition =
            $"{AdminUrl}/{{serviceDefinitionId:guid}}/attributes/{{attributeDefinitionId:guid}}";

        internal const string AddRequirement = $"{AdminUrl}/{{serviceDefinitionId:guid}}/requirements";

        internal const string UpdateRequirement =
            $"{AdminUrl}/{{serviceDefinitionId:guid}}/requirements/{{requirementIndex:int}}";

        internal const string RemoveRequirement = $"{AdminUrl}/{{serviceDefinitionId:guid}}/requirements";

        internal const string ChangeActivation = $"{AdminUrl}/{{serviceDefinitionId:guid}}/activation";
    }

    internal static class ServiceProvider
    {
        internal const string Group = "ServiceProvider";

        internal const string MainUrl = $"{AppBaseUrl}/service-providers";
        internal const string AdminUrl = $"{AppBaseUrl}/admin/service-providers";

        internal const string GetPublicAll = $"{MainUrl}";
        internal const string GetAll = $"{AdminUrl}";

        internal const string GetPublicById = $"{MainUrl}/{{serviceProviderId:guid}}";
        internal const string GetFeaturedServices = $"{MainUrl}/featured-services";
        internal const string GetById = $"{AdminUrl}/{{serviceProviderId:guid}}";

        internal const string GetByProviderType = $"{MainUrl}/by-provider-type/{{providerTypeId:guid}}";

        internal const string Create = $"{AdminUrl}";

        internal const string Update = $"{AdminUrl}/{{serviceProviderId:guid}}";

        internal const string Delete = $"{AdminUrl}/{{serviceProviderId:guid}}";

        internal const string ChangeActivation = $"{AdminUrl}/{{serviceProviderId:guid}}/activation";

        internal const string AddAttribute = $"{AdminUrl}/{{serviceProviderId:guid}}/attributes";

        internal const string UpdateAttribute =
            $"{AdminUrl}/{{serviceProviderId:guid}}/attributes/{{attributeId:guid}}";

        internal const string RemoveAttribute =
            $"{AdminUrl}/{{serviceProviderId:guid}}/attributes/{{attributeId:guid}}";

        internal const string AddService = $"{AdminUrl}/{{serviceProviderId:guid}}/services";

        internal const string GetServices = $"{AdminUrl}/{{serviceProviderId:guid}}/services";

        internal const string UpdateService = $"{AdminUrl}/{{serviceProviderId:guid}}/services/{{serviceId:guid}}";

        internal const string RemoveService = $"{AdminUrl}/{{serviceProviderId:guid}}/services/{{serviceId:guid}}";

        internal const string AddGalleryItem = $"{AdminUrl}/{{serviceProviderId:guid}}/gallery-items";

        internal const string GetGalleryItems = $"{AdminUrl}/{{serviceProviderId:guid}}/gallery-items";

        internal const string UpdateGalleryItem =
            $"{AdminUrl}/{{serviceProviderId:guid}}/gallery-items/{{galleryItemId:guid}}";

        internal const string RemoveGalleryItem =
            $"{AdminUrl}/{{serviceProviderId:guid}}/gallery-items/{{galleryItemId:guid}}";

        internal const string AddPolicy = $"{AdminUrl}/{{serviceProviderId:guid}}/policies";

        internal const string GetPolicies = $"{AdminUrl}/{{serviceProviderId:guid}}/policies";

        internal const string UpdatePolicy = $"{AdminUrl}/{{serviceProviderId:guid}}/policies/{{policyId:guid}}";

        internal const string RemovePolicy = $"{AdminUrl}/{{serviceProviderId:guid}}/policies/{{policyId:guid}}";

        internal const string AddStaff = $"{AdminUrl}/{{serviceProviderId:guid}}/staff";

        internal const string GetStaff = $"{AdminUrl}/{{serviceProviderId:guid}}/staff";

        internal const string UpdateStaff = $"{AdminUrl}/{{serviceProviderId:guid}}/staff/{{staffId:guid}}";

        internal const string RemoveStaff = $"{AdminUrl}/{{serviceProviderId:guid}}/staff/{{staffId:guid}}";

        internal const string GetAvailableCountries = $"{MainUrl}/available-countries";

        internal const string GetAvailableCitiesByCountry = $"{MainUrl}/available-cities/{{countryCode}}";

        // Service Provider Requests (user-facing and admin)
        internal const string AddRequest = $"{MainUrl}/{{serviceProviderId:guid}}/requests";
        internal const string GetMyRequests = $"{MainUrl}/{{serviceProviderId:guid}}/requests";
        internal const string GetRequestsByProviderAdmin = $"{AdminUrl}/{{serviceProviderId:guid}}/requests";
        internal const string GetAllRequestsAdmin = $"{AdminUrl}/requests";

        // Service Provider Comments (user-facing)
        internal const string AddComment = $"{MainUrl}/{{serviceProviderId:guid}}/comments";
        internal const string GetComments = $"{MainUrl}/{{serviceProviderId:guid}}/comments";
        internal const string RemoveComment = $"{MainUrl}/{{serviceProviderId:guid}}/comments/{{commentId:guid}}";
    }

    internal static class Staff
    {
        internal const string Group = "Staff";

        internal const string MainUrl = $"{AppBaseUrl}/staff";
        internal const string AdminUrl = $"{AppBaseUrl}/admin/staff";

        internal const string GetAll = $"{AdminUrl}";

        internal const string GetById = $"{AdminUrl}/{{staffId:guid}}";

        internal const string GetDetails = $"{AdminUrl}/{{staffId:guid}}/details";

        internal const string Create = $"{AdminUrl}";

        internal const string Update = $"{AdminUrl}/{{staffId:guid}}";

        internal const string Delete = $"{AdminUrl}/{{staffId:guid}}";

        internal const string ChangeActivation = $"{AdminUrl}/{{staffId:guid}}/activation";

        internal const string AddService = $"{AdminUrl}/{{staffId:guid}}/services";

        internal const string UpdateService = $"{AdminUrl}/{{staffId:guid}}/services/{{serviceId:guid}}";

        internal const string RemoveService = $"{AdminUrl}/{{staffId:guid}}/services/{{serviceId:guid}}";

        internal const string GetServices = $"{AdminUrl}/{{staffId:guid}}/services";

        internal const string AddAvailability = $"{AdminUrl}/{{staffId:guid}}/availabilities";

        internal const string UpdateAvailability =
            $"{AdminUrl}/{{staffId:guid}}/availabilities/{{availabilityId:guid}}";

        internal const string RemoveAvailability =
            $"{AdminUrl}/{{staffId:guid}}/availabilities/{{availabilityId:guid}}";

        internal const string GetAvailabilities = $"{AdminUrl}/{{staffId:guid}}/availabilities";
    }

    internal static class ProviderType
    {
        internal const string Group = "ProviderType";

        internal const string MainUrl = $"{AppBaseUrl}/provider-types";
        internal const string AdminUrl = $"{AppBaseUrl}/admin/provider-types";

        internal const string GetPublicProviderTypes = $"{MainUrl}";

        internal const string GetAll = $"{AdminUrl}";

        internal const string GetAttributes = $"{MainUrl}/{{providerTypeId:guid}}/attributes";

        internal const string Create = $"{AdminUrl}";

        internal const string GetById = $"{AdminUrl}/{{providerTypeId:guid}}";

        internal const string Update = $"{AdminUrl}/{{providerTypeId:guid}}";

        internal const string Delete = $"{AdminUrl}/{{providerTypeId:guid}}";

        internal const string ChangeActivation = $"{AdminUrl}/{{providerTypeId:guid}}/activation";

        internal const string AddAttributeDefinition = $"{AdminUrl}/{{providerTypeId:guid}}/attributes";

        internal const string UpdateAttributeDefinition =
            $"{AdminUrl}/{{providerTypeId:guid}}/attributes/{{attributeDefinitionId:guid}}";

        internal const string RemoveAttributeDefinition =
            $"{AdminUrl}/{{providerTypeId:guid}}/attributes/{{attributeDefinitionId:guid}}";
    }
}
