using System.Globalization;
using System.Numerics;
using BuildingBlocks.Core.Domain.Constants;
using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.Dtos.Localization;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Extensions;
using BuildingBlocks.Core.Resources;
using FluentValidation;
using PhoneNumbers;
using PhoneNumber = BuildingBlocks.Core.Domain.ValueObjects.PhoneNumber;

namespace BuildingBlocks.Validation.Extensions;

/// <summary>
/// Contains the extension methods for the <see cref="IRuleBuilder{T,TProperty}"/> interface.
/// </summary>
public static class ValidationRuleBuilderExtensions
{
    /// <summary>
    /// Validates the range.
    /// </summary>
    /// <typeparam name="T">The type of the object to validate.</typeparam>
    /// <typeparam name="TProperty">The type of the property to validate.</typeparam>
    /// <param name="ruleBuilder">The rule builder.</param>
    /// <param name="resourceName">The name of the resource.</param>
    /// <param name="min">The minimum.</param>
    /// <param name="max">The maximum.</param>
    public static IRuleBuilder<T, TProperty> ValidateRange<T, TProperty>(
        this IRuleBuilder<T, TProperty> ruleBuilder,
        string resourceName,
        int min,
        int max
    )
        where TProperty : struct, IComparable, IComparable<TProperty>, IConvertible, IEquatable<TProperty>, IFormattable
    {
        return ruleBuilder
            .NotNull()
            .WithMessage(AppError.RequiredMessage(resourceName))
            .GreaterThanOrEqualTo((TProperty)Convert.ChangeType(min, typeof(TProperty), CultureInfo.InvariantCulture))
            .WithMessage(AppError.GreaterThanOrEqualToMessage(resourceName, min))
            .LessThanOrEqualTo((TProperty)Convert.ChangeType(max, typeof(TProperty), CultureInfo.InvariantCulture))
            .WithMessage(AppError.LessThanOrEqualToMessage(resourceName, max));
    }

    /// <summary>
    /// Validates the id.
    /// </summary>
    /// <typeparam name="T">The type of the object to validate.</typeparam>
    /// <typeparam name="TProperty">The type of the property to validate.</typeparam>
    /// <param name="ruleBuilder">The rule builder.</param>
    /// <param name="resourceName">The name of the resource.</param>
    public static IRuleBuilder<T, TProperty> ValidateNaturalNumber<T, TProperty>(
        this IRuleBuilder<T, TProperty> ruleBuilder,
        string resourceName
    )
        where TProperty : struct,
            IComparable,
            IComparable<TProperty>,
            IConvertible,
            IEquatable<TProperty>,
            IFormattable,
            INumber<TProperty>
    {
        return ruleBuilder
            .Must(value => value > TProperty.Zero)
            .WithMessage(
                AppError.GreaterThanOrEqualToMessage(resourceName, GlobalDomainConstValues.NaturalNumberMinue)
            );
    }

    /// <summary>
    /// Validates the text.
    /// </summary>
    /// <typeparam name="T">The type of the object to validate.</typeparam>
    /// <param name="ruleBuilder">The rule builder.</param>
    /// <param name="resourceName">The name of the resource.</param>
    /// <param name="maxLength">The maximum length.</param>
    /// <param name="minLength">The minimum length.</param>
    /// <param name="nullable">Indicates if the text can be null.</param>
    /// <returns>The rule builder instance.</returns>
    public static IRuleBuilder<T, string?> ValidateText<T>(
        this IRuleBuilder<T, string?> ruleBuilder,
        string resourceName,
        int maxLength = 0,
        int minLength = 0,
        bool nullable = false
    )
    {
        if (!nullable)
        {
            ruleBuilder = ruleBuilder.NotEmpty().WithMessage(AppError.RequiredMessage(resourceName));
        }

        if (maxLength > 0)
        {
            ruleBuilder = ruleBuilder
                .MaximumLength(maxLength)
                .WithMessage(AppError.MaxLengthMessage(resourceName, maxLength));
        }

        if (minLength > 0)
        {
            ruleBuilder = ruleBuilder
                .MinimumLength(minLength)
                .WithMessage(AppError.MinLengthMessage(resourceName, minLength));
        }

        return ruleBuilder;
    }

    /// <summary>
    /// Validates the email.
    /// </summary>
    /// <typeparam name="T">The type of the object to validate.</typeparam>
    /// <param name="ruleBuilder">The rule builder.</param>
    /// <param name="nullable">Indicates if the email can be null.</param>
    public static IRuleBuilder<T, string?> ValidateEmail<T>(
        this IRuleBuilder<T, string?> ruleBuilder,
        bool nullable = false
    )
    {
        return ruleBuilder
            .ValidateText(
                resourceName: SharedResource.Email,
                minLength: GlobalDomainConstValues.EmailMinLength,
                maxLength: GlobalDomainConstValues.EmailMaxLength,
                nullable: nullable
            )
            .EmailAddress()
            .WithMessage(AppError.ValidationMessage(SharedResource.Email));
    }

    /// <summary>
    /// Validates the first name.
    /// </summary>
    /// <typeparam name="T">The type of the object to validate.</typeparam>
    /// <param name="ruleBuilder">The rule builder.</param>
    /// <param name="nullable">Indicates if the first name can be null.</param>
    public static IRuleBuilder<T, string?> ValidateFirstName<T>(
        this IRuleBuilder<T, string?> ruleBuilder,
        bool nullable = false
    )
    {
        return ruleBuilder.ValidateText(
            resourceName: SharedResource.First_Name,
            maxLength: GlobalDomainConstValues.FirstNameMaxLength,
            nullable: nullable
        );
    }

    /// <summary>
    /// Validates the last name.
    /// </summary>
    /// <typeparam name="T">The type of the object to validate.</typeparam>
    /// <param name="ruleBuilder">The rule builder.</param>
    /// <param name="nullable">Indicates if the last name can be null.</param>
    public static IRuleBuilder<T, string?> ValidateLastName<T>(
        this IRuleBuilder<T, string?> ruleBuilder,
        bool nullable = false
    )
    {
        return ruleBuilder.ValidateText(
            resourceName: SharedResource.Last_Name,
            maxLength: GlobalDomainConstValues.LastNameMaxLength,
            nullable: nullable
        );
    }

    /// <summary>
    /// Validates the phone number.
    /// </summary>
    /// <typeparam name="T">The type of the object to validate.</typeparam>
    /// <param name="ruleBuilder">The rule builder.</param>
    /// <param name="phoneNumberUtil">The phone number util.</param>
    public static IRuleBuilder<T, PhoneNumber?> ValidatePhoneNumber<T>(
        this IRuleBuilder<T, PhoneNumber?> ruleBuilder,
        PhoneNumberUtil phoneNumberUtil
    )
    {
        return ruleBuilder
            .Must(phone =>
                phoneNumberUtil.IsValidPhoneNumber(phone?.Value ?? string.Empty, phone?.CountryCode ?? string.Empty)
            )
            .WithMessage(SharedResource.Validation_Error_Message.FormatWithStr(SharedResource.Phone_Number));
    }

    /// <summary>
    /// Validates the guid value.
    /// </summary>
    /// <typeparam name="T">The type of the object to validate.</typeparam>
    /// <param name="ruleBuilder">The rule builder.</param>
    /// <param name="resourceName">The name of the resource.</param>
    public static IRuleBuilder<T, Guid> ValidateGuid<T>(this IRuleBuilder<T, Guid> ruleBuilder, string resourceName)
    {
        return ruleBuilder.NotEmpty().WithMessage(AppError.RequiredMessage(resourceName)).NotNull();
    }

    /// <summary>
    /// Validates the date value.
    /// </summary>
    /// <typeparam name="T">The type of the object to validate.</typeparam>
    /// <param name="ruleBuilder">The rule builder.</param>
    /// <param name="resourceName">The name of the resource.</param>
    public static IRuleBuilder<T, DateTime> ValidateDate<T>(
        this IRuleBuilder<T, DateTime> ruleBuilder,
        string resourceName
    )
    {
        return ruleBuilder.NotEmpty().WithMessage(AppError.RequiredMessage(resourceName)).NotNull();
    }

    /// <summary>
    /// Validates the percentage value.
    /// </summary>
    /// <typeparam name="T">The type of the object to validate.</typeparam>
    /// <param name="ruleBuilder">The rule builder.</param>
    /// <param name="resourceName">The name of the resource.</param>
    public static IRuleBuilder<T, byte> ValidatePercentage<T>(
        this IRuleBuilder<T, byte> ruleBuilder,
        string resourceName
    )
    {
        return ruleBuilder.ValidateRange(resourceName, 0, 100);
    }

    /// <summary>
    /// Validates the id.
    /// </summary>
    /// <typeparam name="T">The type of the object.</typeparam>
    /// <typeparam name="TEnum">The type of the enumeration.</typeparam>
    /// <param name="ruleBuilder">The rule builder.</param>
    /// <param name="resourceName">The name of the resource.</param>
    /// <returns>The rule builder instance.</returns>
    public static IRuleBuilder<T, int> MustBeValidEnumeration<T, TEnum>(
        this IRuleBuilder<T, int> ruleBuilder,
        string resourceName
    )
        where TEnum : Enumeration
    {
        return ruleBuilder
            .ValidateNaturalNumber(resourceName)
            .Must(id => Enumeration.GetAll<TEnum>().Any(e => e.Id == id))
            .WithMessage(AppError.ValidationMessage(resourceName));
    }

    /// <summary>
    /// Validates the localized content DTO.
    /// </summary>
    /// <typeparam name="T">The type of the object to validate.</typeparam>
    /// <param name="ruleBuilder">The rule builder.</param>
    /// <param name="resourceName">The name of the resource.</param>
    /// <param name="maxLength">The maximum length per translation.</param>
    /// <param name="minLength">The minimum length per translation.</param>
    /// <param name="supportEmptyTranslations">Indicates if empty translations are allowed.</param>
    /// <param name="supportedLocales">The list of supported locale codes. If null, allows any locale.</param>
    /// <returns>The rule builder instance.</returns>
    public static IRuleBuilder<T, LocalizedContentDto> ValidateLocalizedContent<T>(
        this IRuleBuilder<T, LocalizedContentDto> ruleBuilder,
        string resourceName,
        int maxLength = 0,
        int minLength = 0,
        bool supportEmptyTranslations = false,
        string[]? supportedLocales = null
    )
    {
        ruleBuilder = ruleBuilder
            .NotNull()
            .WithMessage(AppError.RequiredMessage(resourceName))
            .Must(dto => supportEmptyTranslations || dto.Translations is { Count: > 0 })
            .WithMessage(AppError.RequiredMessage(resourceName + " translations"));

        // Only validate translation values if there are any translations
        ruleBuilder = ruleBuilder
            .Must(dto =>
                supportEmptyTranslations
                || dto.Translations.Count == 0
                || dto.Translations.Values.All(value => !string.IsNullOrWhiteSpace(value))
            )
            .WithMessage($"{resourceName} translations cannot contain empty values");

        // if (maxLength > 0)
        // {
        //     ruleBuilder = ruleBuilder
        //         .Must(dto =>
        //             dto.Translations.Count == 0 || dto.Translations.Values.All(value => value.Length <= maxLength)
        //         )
        //         .WithMessage(AppError.MaxLengthMessage(resourceName, maxLength));
        // }
        //
        // if (minLength > 0)
        // {
        //     ruleBuilder = ruleBuilder
        //         .Must(dto =>
        //             dto.Translations.Count == 0 || dto.Translations.Values.All(value => value.Length >= minLength)
        //         )
        //         .WithMessage(AppError.MinLengthMessage(resourceName, minLength));
        // }

        if (supportedLocales is { Length: > 0 })
        {
            ruleBuilder = ruleBuilder
                .Must(dto =>
                    dto.Translations.Count == 0
                    || dto.Translations.Keys.All(locale => supportedLocales.Contains(locale, StringComparer.Ordinal))
                )
                .WithMessage(
                    $"{resourceName} contains unsupported locale codes. Supported locales: {string.Join(", ", supportedLocales)}"
                );
        }

        return ruleBuilder;
    }
}
