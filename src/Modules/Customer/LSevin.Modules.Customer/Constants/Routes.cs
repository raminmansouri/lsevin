namespace LSevin.Modules.Customer.Constants;

internal static class Routes
{
    private const string AppBaseUrl = "customer-module";

    internal static class Customer
    {
        internal const string Group = "Customer";

        internal const string MainUrl = $"{AppBaseUrl}/customer";

        internal const string GetCurrent = $"{MainUrl}/current";
        internal const string GetSearchHistory = $"{MainUrl}/GetSearchHistory";
        internal const string GetSearchResults = $"{MainUrl}/GetSearchResults";
        internal const string Explore = $"{MainUrl}/Explore";
        internal const string Bookings = $"{MainUrl}/Bookings";
        internal const string GetBookingById = $"{MainUrl}/GetBookingById";
        internal const string CpCategoryGroups = $"{MainUrl}/CpCategoryGroups";

        internal const string Update = $"{MainUrl}";

        internal const string UploadDocument = $"{MainUrl}/document";

        internal const string GetDocuments = $"{MainUrl}/documents";

        internal const string DeleteDocument = $"{MainUrl}/document/{{documentId:guid}}";
    }

    internal static class Consulting
    {
        internal const string Group = "Consulting";

        internal const string MainUrl = $"{AppBaseUrl}/consulting";

        internal const string GetAll = $"{MainUrl}";

        internal const string GetSelectedDocuments = $"{MainUrl}/{{consultingId:guid}}/selected-documents";

        internal const string Create = $"{MainUrl}";
    }
}
