namespace BuildingBlocks.Web.Constants;

/// <summary>
/// Static class containing route constants for the Web project.
/// </summary>
public static class WebConstants
{
    /// <summary>
    /// Defines OpenAPI constants.
    /// </summary>
    public static class OpenApi
    {
        /// <summary>
        /// Default version.
        /// </summary>
        public const string DefaultVersion = "v1";

        /// <summary>
        /// Home route.
        /// </summary>
        public const string HomeRoute = "/";

        /// <summary>
        /// Scalar route.
        /// </summary>
        public const string ScalarRoute = "/scalar";

        /// <summary>
        /// Default scalar endpoint.
        /// </summary>
        public const string DefaultScalarEndpoint = $"{ScalarRoute}/{DefaultVersion}.json";

        /// <summary>
        /// Authorization format.
        /// </summary>
        public const string AuthorizationFormat = "JWT";
    }

    /// <summary>
    /// Defines health check constants.
    /// </summary>
    public static class HealthChecks
    {
        /// <summary>
        /// Name of the health check that must always pass.
        /// </summary>
        public const string HealthCheckName = "self";

        /// <summary>
        /// Tag for health checks that must pass for app to be considered alive.
        /// </summary>
        public const string HealthCheckLiveTag = "live";

        /// <summary>
        /// Tag for health checks that must pass for app to be considered alive.
        /// </summary>
        public const string HealthCheckReadyTag = "ready";

        /// <summary>
        /// Route for health check endpoint.
        /// </summary>
        public const string HealthCheck = "/hc";

        /// <summary>
        /// Route for health check live endpoint.
        /// </summary>
        public const string HealthCheckLive = "/liveness";

        /// <summary>
        /// Route for health check ready endpoint.
        /// </summary>
        public const string HealthCheckReady = "/readiness";

        /// <summary>
        /// The route for the health check endpoint.
        /// </summary>
        public const string HealthCheckUI = "/healthchecks-ui";
    }

    /// <summary>
    /// Defines routes related to the Admin section.
    /// </summary>
    public static class Route
    {
        /// <summary>
        /// The API prefix.
        /// </summary>
        public const string ApiPrefix = "api";

        /// <summary>
        /// API area for the Admin section.
        /// </summary>
        public const string AdminArea = "admin";

        /// <summary>
        /// The Default API version string.
        /// </summary>
        public const int ApiMajorVersion = 1;

        /// <summary>
        /// The Default API version string.
        /// </summary>
        public const int ApiMinorVersion = 0;

        /// <summary>
        /// The API version pattern.
        /// </summary>
        public const string ApiVersionPattern = "v{version:apiVersion}";
    }

    /// <summary>
    /// Defines routes related to the Admin section.
    /// </summary>
    public static class Language
    {
        /// <summary>
        /// Default language setting (English - United States).
        /// </summary>
        public const string EnglishLanguage = "en-US";

        /// <summary>
        /// Standard code for Persian language setting (Persian - Iran).
        /// </summary>
        public const string PersianLanguage = "fa-IR";

        /// <summary>
        /// Standard code for Arabic language setting (Arabic - Saudi Arabia).
        /// </summary>
        public const string ArabicLanguage = "ar-SA";

        /// <summary>
        /// Standard code for Spanish language setting (Spanish - Spain).
        /// </summary>
        public const string SpanishLanguage = "es-ES";

        /// <summary>
        /// Standard code for Turkish language setting (Turkish - Turkey).
        /// </summary>
        public const string TurkishLanguage = "tr-TR";

        /// <summary>
        /// Standard code for Kurdish language setting (Kurdish - Kurdistan).
        /// </summary>
        public const string KurdishLanguage = "ku-KU";

        /// <summary>
        /// Standard code for German language setting (German - Germany).
        /// </summary>
        public const string GermanLanguage = "de-DE";

        /// <summary>
        /// Standard code for French language setting (French - France).
        /// </summary>
        public const string FrenchLanguage = "fr-FR";
    }
}
