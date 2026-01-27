using System.Net.Mail;
using System.Runtime.InteropServices;
using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Resources;
using LSevin.Modules.Category.SharedKernel.Enumerations;

namespace LSevin.Modules.Category.ServiceProvider.Rule;

public sealed class ProviderAttributeMustHaveValidValueForAttributeTypeRule(string value, AttributeType attributeType)
    : IBusinessRule
{
    public bool IsBroken()
    {
        return attributeType.Name switch
        {
            "Text" => false, // Text can be any string
            "Number" => !decimal.TryParse(value, out _),
            "DateTime" => !DateTime.TryParse(value, out _),
            "Boolean" => !bool.TryParse(value, out _),
            "Select" => false, // Validation against allowed options should be handled separately
            "Email" => !IsValidEmail(value),
            "Url" => !IsValidUrl(value),
            "Phone" => !IsValidPhone(value),
            "MultiSelect" => false, // Validation against allowed options should be handled separately
            _ => false,
        };
    }

    public string Message => SharedResource.Invalid_Data_Error_Message;

    private static bool IsValidEmail(string email)
    {
        if (string.IsNullOrEmpty(email))
            return false;

        try
        {
            var addr = new MailAddress(email);
            return string.Equals(addr.Address, email, StringComparison.Ordinal);
        }
        catch (FormatException)
        {
            return false;
        }
        catch (ExternalException)
        {
            return false;
        }
    }

    private static bool IsValidUrl(string url)
    {
        return Uri.TryCreate(url, UriKind.Absolute, out _);
    }

    private static bool IsValidPhone(string phone)
    {
        // Simple validation - more complex rules can be implemented as needed
        return !string.IsNullOrWhiteSpace(phone)
            && phone.Length >= 7
            && phone.All(c => char.IsDigit(c) || c == '+' || c == '-' || c == '(' || c == ')' || c == ' ');
    }
}
