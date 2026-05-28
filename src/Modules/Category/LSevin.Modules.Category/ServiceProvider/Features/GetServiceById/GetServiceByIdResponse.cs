using BuildingBlocks.Core.Dtos.Localization;
using BuildingBlocks.Core.Models;
using LSevin.Modules.Category.ServiceProvider.Dtos;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceById;

using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;


// --------------------
// 1️⃣  GetServiceByIdResponse
// --------------------
public record GetServiceByIdResponse
{
    [JsonPropertyName("service")]
    public GetServiceByIdService Service { get; init; } = null!;

    [JsonPropertyName("included")]
    public List<string> Included { get; init; } = new();

    [JsonPropertyName("process")]
    public List<GetServiceByIdProcessStep> Process { get; init; } = new();

    [JsonPropertyName("faqs")]
    public List<GetServiceByIdFaq> Faqs { get; init; } = new();

    [JsonPropertyName("topReviews")]
    public List<GetServiceByIdTopReview> TopReviews { get; init; } = new();

    [JsonPropertyName("localRecommendations")]
    public List<GetServiceByIdRecommendation> LocalRecommendations { get; init; } = new();

    [JsonPropertyName("internationalRecommendations")]
    public List<GetServiceByIdRecommendation> InternationalRecommendations { get; init; } = new();
}

// --------------------
// 2️⃣  Service + related objects
// --------------------
public record GetServiceByIdService
{
    [JsonPropertyName("id")]
    public string Id { get; init; } = null!;

    [JsonPropertyName("name")]
    public string Name { get; init; } = null!;

    [JsonPropertyName("subtitle")]
    public string Subtitle { get; init; } = null!;

    [JsonPropertyName("clinic")]
    public string Clinic { get; init; } = null!;

    [JsonPropertyName("clinicId")]
    public string ClinicId { get; init; } = null!;

    [JsonPropertyName("location")]
    public string Location { get; init; } = null!;

    [JsonPropertyName("price")]
    public decimal Price { get; init; }

    [JsonPropertyName("originalPrice")]
    public decimal OriginalPrice { get; init; }

    [JsonPropertyName("currency")]
    public string Currency { get; init; } = null!;

    [JsonPropertyName("otherCurrencies")]
    public List<GetServiceByIdOtherCurrency> OtherCurrencies { get; init; } = new();

    [JsonPropertyName("rating")]
    public double Rating { get; init; }

    [JsonPropertyName("reviews")]
    public int Reviews { get; init; }

    [JsonPropertyName("images")]
    public List<string> Images { get; init; } = new();

    [JsonPropertyName("duration")]
    public string Duration { get; init; } = null!;

    [JsonPropertyName("recovery")]
    public string Recovery { get; init; } = null!;

    [JsonPropertyName("anesthesia")]
    public string Anesthesia { get; init; } = null!;

    [JsonPropertyName("stayRequired")]
    public string StayRequired { get; init; } = null!;

    [JsonPropertyName("verified")]
    public bool Verified { get; init; }

    [JsonPropertyName("popular")]
    public bool Popular { get; init; }

    [JsonPropertyName("successRate")]
    public string SuccessRate { get; init; } = null!;

    [JsonPropertyName("satisfaction")]
    public string Satisfaction { get; init; } = null!;
}

public record GetServiceByIdOtherCurrency
{
    [JsonPropertyName("code")]
    public string Code { get; init; } = null!;

    [JsonPropertyName("amount")]
    public decimal Amount { get; init; }
}

// --------------------
// 3️⃣  Process step
// --------------------
public record GetServiceByIdProcessStep
{
    [JsonPropertyName("step")]
    public int Step { get; init; }

    [JsonPropertyName("title")]
    public string Title { get; init; } = null!;

    [JsonPropertyName("description")]
    public string Description { get; init; } = null!;

    [JsonPropertyName("duration")]
    public string Duration { get; init; } = null!;
}

// --------------------
// 4️⃣  FAQ
// --------------------
public record GetServiceByIdFaq
{
    [JsonPropertyName("q")]
    public string Question { get; init; } = null!;

    [JsonPropertyName("a")]
    public string Answer { get; init; } = null!;
}

// --------------------
// 5️⃣  Top review
// --------------------
public record GetServiceByIdTopReview
{
    [JsonPropertyName("id")]
    public int Id { get; init; }

    [JsonPropertyName("name")]
    public string Name { get; init; } = null!;

    [JsonPropertyName("country")]
    public string Country { get; init; } = null!;

    [JsonPropertyName("date")]
    public string Date { get; init; } = null!;

    [JsonPropertyName("rating")]
    public int Rating { get; init; }

    [JsonPropertyName("review")]
    public string Review { get; init; } = null!;

    [JsonPropertyName("verified")]
    public bool Verified { get; init; }

    [JsonPropertyName("helpful")]
    public int Helpful { get; init; }

    [JsonPropertyName("images")]
    public List<string>? Images { get; init; }
}

// --------------------
// 6️⃣  Recommendation
// --------------------
public record GetServiceByIdRecommendation
{
    [JsonPropertyName("id")]
    public string Id { get; init; } = null!;

    [JsonPropertyName("image")]
    public string Image { get; init; } = null!;

    [JsonPropertyName("title")]
    public string Title { get; init; } = null!;

    [JsonPropertyName("provider")]
    public string Provider { get; init; } = null!;

    [JsonPropertyName("rating")]
    public double Rating { get; init; }

    [JsonPropertyName("reviewCount")]
    public int ReviewCount { get; init; }

    [JsonPropertyName("city")]
    public string City { get; init; } = null!;

    [JsonPropertyName("country")]
    public string Country { get; init; } = null!;

    [JsonPropertyName("price")]
    public decimal Price { get; init; }

    [JsonPropertyName("currency")]
    public string Currency { get; init; } = null!;

    [JsonPropertyName("verified")]
    public bool Verified { get; init; }

    [JsonPropertyName("link")]
    public string Link { get; init; } = null!;
}
