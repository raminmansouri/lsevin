namespace LSevin.Modules.Identity.Constants;

internal static class Routes
{
    private const string AppBaseUrl = "identity-module";

    internal static class Identity
    {
        internal const string Group = "Identity";

        private const string MainUrl = $"{AppBaseUrl}/identity";

        internal const string Login = $"{MainUrl}/login";

        internal const string Logout = $"{MainUrl}/logout";

        internal const string RefreshToken = $"{MainUrl}/refresh";

        internal const string VerifyEmail = $"{MainUrl}/verify-email";

        internal const string SendOtp = $"{MainUrl}/otp/send";

        internal const string VerifyOtp = $"{MainUrl}/otp/verify";

        internal const string ResendOtp = $"{MainUrl}/otp/resend";
    }

    internal static class User
    {
        internal const string Group = "User";

        internal const string MainUrl = $"{AppBaseUrl}/users";

        internal const string GetAll = $"{MainUrl}";

        internal const string GetById = $"{MainUrl}/{{userId:guid}}";

        internal const string GetByEmail = $"{MainUrl}/by-email/{{email:regex(^[^@]+@[^@]+\\.[^@]+$)}}";

        internal const string RegisterUser = $"{MainUrl}/register";

        internal const string Update = $"{MainUrl}";

        internal const string UpdateState = $"{MainUrl}/{{userId:guid}}/state";
    }
}
