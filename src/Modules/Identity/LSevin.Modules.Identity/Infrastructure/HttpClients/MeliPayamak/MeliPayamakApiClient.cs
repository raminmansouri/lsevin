using System.Net.Http.Json;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Identity.Infrastructure.HttpClients.MeliPayamak.Dtos;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace LSevin.Modules.Identity.Infrastructure.HttpClients.MeliPayamak;

internal sealed class MeliPayamakApiClient(
    HttpClient httpClient,
    IOptions<MeliPayamakClientOptions> options,
    ILogger<MeliPayamakApiClient> logger
) : IMeliPayamakApiClient
{
    private readonly MeliPayamakClientOptions _options = options.Value;

    public async Task<Result<long>> SendSmsAsync(
        string toPhoneNumber,
        string message,
        CancellationToken cancellationToken = default
    )
    {
        logger.LogInformation("[MeliPayamak] - Sending SMS to {PhoneNumber}", MaskPhoneNumber(toPhoneNumber));

        try
        {
            // Prepare form-urlencoded content for SendByBaseNumber2 API
            var formData = new Dictionary<string, string>
            {
                { "username", _options.Username },
                { "password", _options.Password },
                { "text", message },
                { "to", toPhoneNumber },
                { "bodyId", _options.BodyId.ToString() },
            };

            using var content = new FormUrlEncodedContent(formData);

            // Send POST request to BaseServiceNumber endpoint
            // This endpoint is for pattern-based SMS sending (SendByBaseNumber2)
            // Documentation: https://www.melipayamak.com/blog/posts/sms-with-pattern-mode/
            var response = await httpClient.PostAsync("SendSMS/BaseServiceNumber", content, cancellationToken);

            // Check HTTP status
            if (!response.IsSuccessStatusCode)
            {
                logger.LogError("[MeliPayamak] - HTTP error: {StatusCode}", response.StatusCode);

                return AppError.ApplicationErrorMessage("MeliPayamak", $"HTTP error: {response.StatusCode}");
            }

            // Parse response
            var result = await response.Content.ReadFromJsonAsync<SendSmsResponseClientDto>(
                cancellationToken: cancellationToken
            );

            if (result == null)
            {
                logger.LogError("[MeliPayamak] - Null response from API");
                return AppError.ApplicationErrorMessage("MeliPayamak", "Received null response from API");
            }

            // Check API status code
            if (!result.IsSuccess)
            {
                logger.LogError(
                    "[MeliPayamak] - API error: Code={StatusCode}, Message={Message}, Value={Value}",
                    result.StatusCode,
                    result.StatusMessage,
                    result.Value
                );

                return AppError.ApplicationErrorMessage(
                    "MeliPayamak",
                    $"API error {result.StatusCode}: {result.StatusMessage ?? result.Value}"
                );
            }

            if (!result.MessageId.HasValue)
            {
                logger.LogError("[MeliPayamak] - Invalid message ID in response: {Value}", result.Value);
                return AppError.ApplicationErrorMessage("MeliPayamak", $"Invalid message ID: {result.Value}");
            }

            logger.LogInformation(
                "[MeliPayamak] - SMS sent successfully to {PhoneNumber}, MessageId={MessageId}",
                MaskPhoneNumber(toPhoneNumber),
                result.MessageId.Value
            );

            return result.MessageId.Value;
        }
        catch (HttpRequestException ex)
        {
            logger.LogError(
                ex,
                "[MeliPayamak] - Network error sending SMS to {PhoneNumber}",
                MaskPhoneNumber(toPhoneNumber)
            );

            return AppError.ApplicationErrorMessage("MeliPayamak", $"Network error: {ex.Message}");
        }
        catch (Exception ex)
        {
            logger.LogError(
                ex,
                "[MeliPayamak] - Unexpected error sending SMS to {PhoneNumber}",
                MaskPhoneNumber(toPhoneNumber)
            );

            return AppError.ApplicationErrorMessage("MeliPayamak", $"SMS send failed: {ex.Message}");
        }
    }

    /// <summary>
    /// Masks phone number for logging (shows only last 4 digits).
    /// Example: "09123456789" -> "0912***6789".
    /// </summary>
    private static string MaskPhoneNumber(string phoneNumber)
    {
        if (phoneNumber.Length <= 4)
            return "****";

        return phoneNumber[..4] + "***" + phoneNumber[^4..];
    }
}
