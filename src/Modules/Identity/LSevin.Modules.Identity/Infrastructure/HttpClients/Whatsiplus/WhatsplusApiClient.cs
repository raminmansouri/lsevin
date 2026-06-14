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

            // POST to /sendMsg/{apiKey}
            var response = await httpClient.PostAsync($"sendMsg/{_options.ApiKey}", content, cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                logger.LogError("[Whatsiplus] - HTTP error: {StatusCode}", response.StatusCode);
                return AppError.ApplicationErrorMessage("Whatsiplus", $"HTTP error: {response.StatusCode}");
            }

            var result = await response.Content.ReadFromJsonAsync<SendWhatsAppMessageResponseClientDto>(
                cancellationToken: cancellationToken
            );

            if (result?.IsSuccess == true)
            {
                logger.LogInformation(
                    "[Whatsiplus] - Message sent successfully to {PhoneNumber}",
                    MaskPhoneNumber(phoneNumber)
                );
                return Result.Success();
            }

            logger.LogError("[Whatsiplus] - API error: {Message}", result?.Message ?? "Unknown error");
            return AppError.ApplicationErrorMessage("Whatsiplus", $"Message send failed: {result?.Message}");
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
