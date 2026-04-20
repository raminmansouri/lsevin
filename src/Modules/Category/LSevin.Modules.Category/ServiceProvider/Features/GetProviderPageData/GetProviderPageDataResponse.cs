using BuildingBlocks.Core.Models;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetProviderPageData;


using System.Collections.Generic;
using System.Net.NetworkInformation;

/// <summary>
/// The top‑level response that would be sent to the client.
/// </summary>
public class ProviderDataResponse
{
    public Provider Provider { get; set; }
    public List<Service> Services { get; set; }
    public List<Specialist> Specialists { get; set; }
    public List<Review> RecentReviews { get; set; }
    public List<Recommendation> LocalRecommendations { get; set; }
    public List<Recommendation> InternationalRecommendations { get; set; }
}

/// <summary>
/// Main provider entity.
/// </summary>
public class Provider
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public string Tagline { get; set; }
    public string Location { get; set; }
    public double Rating { get; set; }
    public int Reviews { get; set; }
    public bool Verified { get; set; }
    public bool Accredited { get; set; }
    public string ResponseTime { get; set; }
    public List<string> Images { get; set; }
    public List<Certification> Certifications { get; set; }
    public List<string> Languages { get; set; }
    public int Established { get; set; }
    public string TotalPatients { get; set; }
    public string SuccessRate { get; set; }
}

/// <summary>
/// A single certification.
/// </summary>
public class Certification
{
    public string Name { get; set; }
    public bool Verified { get; set; }
}

/// <summary>
/// One of the offered services.
/// </summary>
public class Service
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public int Price { get; set; }
    public string Currency { get; set; }
    public string Duration { get; set; }
    public string Recovery { get; set; }
    public double Rating { get; set; }
    public int Reviews { get; set; }
    public bool Popular { get; set; }    // first service is popular – others default to false
    public string Image { get; set; }
}

/// <summary>
/// A specialist working at the provider.
/// </summary>
public class Specialist
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public string Specialty { get; set; }
    public string Experience { get; set; }   // e.g. “10 years”
    public string Patients { get; set; }     // e.g. “2000+”
    public double Rating { get; set; }
    public string Image { get; set; }
    public bool Verified { get; set; }
}

/// <summary>
/// A single review / testimonial.
/// </summary>
public class Review
{
    public Guid Id { get; set; }
    public string Name { get; set; }            // reviewer's name
    public string Country { get; set; }
    public string Date { get; set; }            // stored as a string (e.g. “2024-08-05”)
    public int Rating { get; set; }
    public string Treatment { get; set; }
    public string ReviewText { get; set; }      // the actual review body
    public bool Verified { get; set; }
    public int Helpful { get; set; }
    public List<string> Images { get; set; }    // optional – can be null
}

/// <summary>
/// A recommendation that points to another provider.
/// </summary>
public class Recommendation
{
    public Guid Id { get; set; }
    public string Image { get; set; }
    public string Title { get; set; }
    public double Rating { get; set; }
    public int ReviewCount { get; set; }
    public string City { get; set; }
    public string Country { get; set; }
    public bool Verified { get; set; }
    public string Link { get; set; }
}

/// <summary>
/// Small helper that builds a fully populated ProviderDataResponse.
/// </summary>
public static class ProviderDataFactory
{



    /*   public static ProviderDataResponse Build()
       {
           return new ProviderDataResponse
           {
               // ---------- Provider ----------
               Provider = new Provider
               {
                   Id = "12345",
                   Name = "Example Medical Center",
                   Tagline = "Advanced Care for All",
                   Location = "123 Main St, City, Country",
                   Rating = 4.9,
                   Reviews = 1200,
                   Verified = true,
                   Accredited = true,
                   ResponseTime = "24h",
                   Images = new List<string>
                   {
                       "/unsplash_images/photo-1519494026892-80bbd-00001.jpg",
                       "/unsplash_images/photo-1519494026892-80bbd-00002.jpg",
                       "/unsplash_images/photo-1519494026892-80bbd-00003.jpg",
                       "/unsplash_images/photo-1519494026892-80bbd-00004.jpg",
                       "/unsplash_images/photo-1519494026892-80bbd-00005.jpg"
                   },
                   Certifications = new List<Certification>
                   {
                       new Certification{ Name = "American College of Surgeons", Verified = true},
                       new Certification{ Name = "American Medical Association", Verified = true},
                       new Certification{ Name = "American Heart Association", Verified = true}
                   },
                   Languages = new List<string> { "English", "Spanish", "French" },
                   Established = 2010,
                   TotalPatients = "1,000,000+",
                   SuccessRate = "98%"
               },

               // ---------- Services ----------
               Services = new List<Service>
               {
                   new Service
                   {
                       Id = 1,
                       Name = "Hair Transplant Service",
                       Price = 10000,
                       Currency = "USD",
                       Duration = "6-8 hours",
                       Recovery = "7-10 days",
                       Rating = 4.9,
                       Reviews = 1200,
                       Popular = true,
                       Image = "/unsplash_images/photo-1519494026892-80bbd-00006.jpg"
                   },
                   new Service
                   {
                       Id = 2,
                       Name = "Facial Reconstruction",
                       Price = 20000,
                       Currency = "USD",
                       Duration = "8-12 hours",
                       Recovery = "10-14 days",
                       Rating = 4.8,
                       Reviews = 900,
                       Popular = false,
                       Image = "/unsplash_images/photo-1519494026892-80bbd-00007.jpg"
                   },
                   new Service
                   {
                       Id = 3,
                       Name = "Body Contouring",
                       Price = 15000,
                       Currency = "USD",
                       Duration = "4-6 hours",
                       Recovery = "5-7 days",
                       Rating = 4.7,
                       Reviews = 600,
                       Popular = false,
                       Image = "/unsplash_images/photo-1519494026892-80bbd-00008.jpg"
                   }
               },

               // ---------- Specialists ----------
               Specialists = new List<Specialist>
               {
                   new Specialist
                   {
                       Id = 1,
                       Name = "Dr. John Doe",
                       Specialty = "Hair Transplant Specialist",
                       Experience = "10 years",
                       Patients = "2000+",
                       Rating = 4.8,
                       Image = "/unsplash_images/photo-1519494026892-80bbd-00009.jpg",
                       Verified = true
                   },
                   new Specialist
                   {
                       Id = 2,
                       Name = "Dr. Jane Smith",
                       Specialty = "Facial Reconstruction Specialist",
                       Experience = "12 years",
                       Patients = "3000+",
                       Rating = 4.9,
                       Image = "/unsplash_images/photo-1519494026892-80bbd-00010.jpg",
                       Verified = true
                   }
               },

               // ---------- Recent Reviews ----------
               RecentReviews = new List<Review>
               {
                   new Review
                   {
                       Id = 1,
                       Name = "Alice",
                       Country = "USA",
                       Date = "2024-08-05",
                       Rating = 5,
                       Treatment = "Hair Transplant",
                       ReviewText = "Excellent service and friendly staff.",
                       Verified = true,
                       Helpful = 25,
                       Images = new List<string>
                       {
                           "/unsplash_images/photo-1519494026892-80bbd-00011.jpg",
                           "/unsplash_images/photo-1519494026892-80bbd-00012.jpg"
                       }
                   },
                   new Review
                   {
                       Id = 2,
                       Name = "Bob",
                       Country = "Canada",
                       Date = "2024-08-04",
                       Rating = 4,
                       Treatment = "Facial Reconstruction",
                       ReviewText = "Good experience, but waiting times were long.",
                       Verified = true,
                       Helpful = 15,
                       Images = null     // optional – can be omitted or left as null
                   }
               },

               // ---------- Local Recommendations ----------
               LocalRecommendations = new List<Recommendation>
               {
                   new Recommendation
                   {
                       Id = "rec1",
                       Image = "/unsplash_images/photo-1519494026892-80bbd-00013.jpg",
                       Title = "Local Recommendation 1",
                       Rating = 4.6,
                       ReviewCount = 120,
                       City = "Istanbul",
                       Country = "Turkey",
                       Verified = true,
                       Link = "/provider/rec1"
                   }
               },

               // ---------- International Recommendations ----------
               InternationalRecommendations = new List<Recommendation>
               {
                   new Recommendation
                   {
                       Id = "rec2",
                       Image = "/unsplash_images/photo-1519494026892-80bbd-00014.jpg",
                       Title = "International Recommendation 1",
                       Rating = 4.7,
                       ReviewCount = 300,
                       City = "New York",
                       Country = "USA",
                       Verified = true,
                       Link = "/provider/rec2"
                   }
               }
           };
       }

   */
    public static string DapperSQL = @"
-- Provider
SELECT 
    sp.id,
    common.get_translation_t(sp.name_translations, @CurrentLocale, @DefaultLocale) AS Name,
    common.get_translation_t(sp.description_translations, @CurrentLocale, @DefaultLocale) AS Tagline,
    TRIM(
        CONCAT_WS(', ',
            NULLIF(common.get_translation_t(city_loc.value_translations, @CurrentLocale, @DefaultLocale), ''),
            NULLIF(common.get_translation_t(country_loc.value_translations, @CurrentLocale, @DefaultLocale), '')
        )
    ) AS Location,
    sp.rating,
    sp.review_count AS Reviews,
    sp.is_active AS Verified,
    sp.accredited,
    sp.response_time AS ResponseTime,
    sp.established_year AS Established,
    sp.total_patients AS TotalPatients,
    sp.success_rate AS SuccessRate
FROM category.service_providers sp
LEFT JOIN category.locations country_loc
    ON country_loc.code = sp.country
   AND country_loc.location_type_id = 1
LEFT JOIN category.locations city_loc
    ON city_loc.code = sp.city
   AND city_loc.location_type_id = 2
WHERE sp.id = @ProviderId;

-- Provider Images
SELECT url
FROM category.provider_gallery_items
WHERE service_provider_id = @ProviderId
ORDER BY display_order;

-- Certifications
SELECT name, is_verified AS Verified
FROM category.provider_certifications
WHERE service_provider_id = @ProviderId;

-- Languages
SELECT language
FROM category.provider_languages
WHERE service_provider_id = @ProviderId
ORDER BY language;

-- Services
SELECT 
    id,
    common.get_translation_t(display_name_translations, @CurrentLocale, @DefaultLocale) AS Name,
    value AS Price,
    currency AS Currency,
    duration_minutes::text AS Duration,
    recovery,
    rating,
    review_count AS Reviews,
    is_popular AS Popular,
    image_url AS Image
FROM category.provider_services
WHERE service_provider_id = @ProviderId
  AND is_active = true;

-- Specialists
SELECT 
    s.id,
    common.get_translation_t(s.name_translations, @CurrentLocale, @DefaultLocale) AS Name,
    common.get_translation_t(s.title_translations, @CurrentLocale, @DefaultLocale) AS Specialty,
    s.experience,
    s.patients,
    s.rating,
    s.profile_image_url AS Image,
    ps.is_active AS Verified
FROM category.provider_staffs ps
JOIN category.staff s ON s.id = ps.staff_id
WHERE ps.service_provider_id = @ProviderId
  AND ps.is_active = true;

-- Reviews
SELECT 
    id,
    customer_name AS Name,
    country,
    create_date::date::text AS Date,
    rating,
    treatment,
    comment_text AS ReviewText,
    is_verified AS Verified,
    helpful_count AS Helpful
FROM category.service_provider_comments
WHERE service_provider_id = @ProviderId
  AND is_public = true
ORDER BY create_date DESC
LIMIT 10;

-- Review Images
SELECT ri.review_id, ri.image_url
FROM category.review_images ri
WHERE ri.review_id IN (
    SELECT c.id
    FROM category.service_provider_comments c
    WHERE c.service_provider_id = @ProviderId
      AND c.is_public = true
    ORDER BY c.create_date DESC
    LIMIT 10
);

-- Local Recommendations
SELECT 
    sp.id,
    common.get_translation_t(sp.name_translations, @CurrentLocale, @DefaultLocale) AS Title,
    sp.rating,
    sp.review_count AS ReviewCount,
    common.get_translation_t(city_loc.value_translations, @CurrentLocale, @DefaultLocale) AS city,
    common.get_translation_t(country_loc.value_translations, @CurrentLocale, @DefaultLocale) AS country,
    sp.is_active AS Verified
FROM category.provider_recommendations r
JOIN category.service_providers sp 
    ON sp.id = r.target_provider_id
LEFT JOIN category.locations country_loc
    ON country_loc.code = sp.country
   AND country_loc.location_type_id = 1
LEFT JOIN category.locations city_loc
    ON city_loc.code = sp.city
   AND city_loc.location_type_id = 2
WHERE r.source_provider_id = @ProviderId
  AND r.type = 'local';

-- International Recommendations
SELECT 
    sp.id,
    common.get_translation_t(sp.name_translations, @CurrentLocale, @DefaultLocale) AS Title,
    sp.rating,
    sp.review_count AS ReviewCount,
    common.get_translation_t(city_loc.value_translations, @CurrentLocale, @DefaultLocale) AS city,
    common.get_translation_t(country_loc.value_translations, @CurrentLocale, @DefaultLocale) AS country,
    sp.is_active AS Verified
FROM category.provider_recommendations r
JOIN category.service_providers sp 
    ON sp.id = r.target_provider_id
LEFT JOIN category.locations country_loc
    ON country_loc.code = sp.country
   AND country_loc.location_type_id = 1
LEFT JOIN category.locations city_loc
    ON city_loc.code = sp.city
   AND city_loc.location_type_id = 2
WHERE r.source_provider_id = @ProviderId
  AND r.type = 'international';";
}
