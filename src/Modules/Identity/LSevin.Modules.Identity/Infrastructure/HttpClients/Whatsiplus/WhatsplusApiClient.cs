using System.Net.Http.Json;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Identity.Infrastructure.HttpClients.Whatsiplus.Dtos;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace LSevin.Modules.Identity.Infrastructure.HttpClients.Whatsiplus;

internal sealed class WhatsplusApiClient(
    HttpClient httpClient,
    IOptions<WhatsplusClientOptions> options,
    ILogger<WhatsplusApiClient> logger
) : IWhatsplusApiClient
{
    private readonly WhatsplusClientOptions _options = options.Value;

    public async Task<Result> SendWhatsAppMessageAsync(
        string phoneNumber,
        string message,
        CancellationToken cancellationToken = default
    )
    {
        logger.LogInformation("[Whatsiplus] - Sending WhatsApp message to {PhoneNumber}", MaskPhoneNumber(phoneNumber));

        try
        {
            using var content = new MultipartFormDataContent();

            content.Add(new StringContent(phoneNumber), "phonenumber");
            content.Add(new StringContent(message), "message");

            if (string.IsNullOrWhiteSpace(_options.ApiKey))
            {
                logger.LogError(
                    "[Whatsiplus] - API key is not configured. Set the {EnvVar} environment variable.",
                    "WHATSIPLUS_API_KEY"
                );
                return AppError.ApplicationErrorMessage(
                    "Whatsiplus",
                    "WhatsiPlus API key is not configured."
                );
            }

            // POST to /sendMsg/{apiKey}
            var response = await httpClient.PostAsync($"sendMsg/{_options.ApiKey}", content, cancellationToken);

            // Read the raw body once; WhatsiPlus returns its real reason (invalid key,
            // bad recipient, quota) in the body, so surface it instead of just the status.
            var body = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                logger.LogError(
                    "[Whatsiplus] - HTTP error {StatusCode} sending to {PhoneNumber}. Body: {Body}",
                    response.StatusCode,
                    MaskPhoneNumber(phoneNumber),
                    body
                );
                return AppError.ApplicationErrorMessage(
                    "Whatsiplus",
                    $"HTTP error: {response.StatusCode}. {body}"
                );
            }

            SendWhatsAppMessageResponseClientDto? result = null;
            try
            {
                result = System.Text.Json.JsonSerializer.Deserialize<SendWhatsAppMessageResponseClientDto>(
                    body,
                    new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true }
                );
            }
            catch (System.Text.Json.JsonException jsonEx)
            {
                logger.LogError(
                    jsonEx,
                    "[Whatsiplus] - Could not parse response for {PhoneNumber}. Body: {Body}",
                    MaskPhoneNumber(phoneNumber),
                    body
                );
                return AppError.ApplicationErrorMessage(
                    "Whatsiplus",
                    $"Unexpected response from provider: {body}"
                );
            }

            if (result?.IsSuccess == true)
            {
                logger.LogInformation(
                    "[Whatsiplus] - Message sent successfully to {PhoneNumber}",
                    MaskPhoneNumber(phoneNumber)
                );
                return Result.Success();
            }

            logger.LogError(
                "[Whatsiplus] - API error for {PhoneNumber}: {Message}. Body: {Body}",
                MaskPhoneNumber(phoneNumber),
                result?.Message ?? "Unknown error",
                body
            );
            return AppError.ApplicationErrorMessage(
                "Whatsiplus",
                $"Message send failed: {result?.Message ?? body}"
            );
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "[Whatsiplus] - Error sending message");
            return AppError.ApplicationErrorMessage("Whatsiplus", $"Error: {ex.Message}");
        }
    }

    private static string MaskPhoneNumber(string phoneNumber) =>
        phoneNumber.Length <= 4 ? "****" : phoneNumber[..4] + "***" + phoneNumber[^4..];
}
