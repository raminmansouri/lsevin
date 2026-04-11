using LSevin.Modules.Category.ServiceProvider.Features.GetBookingGetProvidersByServiceAndSpecialist;
using LSevin.Modules.Category.ServiceProvider.Features.GetBookingGetServicesByProviderAndSpecialist;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetBookingSpecialistByProviderAndService;


// ────────────────────────────────────────────────────────────────
// 3️⃣  Doctor
public class GetBookingServiceSelectionDataSpecialist
{
    public string Id { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string Specialty { get; set; } = null!;
    public string Experience { get; set; } = null!;
    public double Rating { get; set; }
    public int Reviews { get; set; }
    public string Patients { get; set; } = null!;
    public string[] Languages { get; set; } = new string[0];
    public string[] Credentials { get; set; } = new string[0];
    public bool Verified { get; set; }
    public int Consultation { get; set; }
    public string Image { get; set; } = null!;
    public string NextAvailable { get; set; } = null!;
}

// ────────────────────────────────────────────────────────────────
// 4️⃣  Response (collection wrapper)
public class GetBookingSpecialistByProviderAndServiceResponse
{
    //public List<GetBookingServiceSelectionDataSpecialist> Services { get; set; } = new();
    //public List<GetBookingSpecialistByProviderAndServiceProvider> Providers { get; set; } = new();
    public List<GetBookingServiceSelectionDataSpecialist> Specialist { get; set; } = new();
}

public class GetBookingSampleResponse
{
    public List<GetBookingGetServicesByProviderAndSpecialistService> Services { get; set; } = new();
    public List<GetBookingServiceSelectionDataProvider> Providers { get; set; } = new();
    public List<GetBookingServiceSelectionDataSpecialist> Specialist { get; set; } = new();
}

// ────────────────────────────────────────────────────────────────
// 5️⃣  Sample data provider – mimics a “backend” endpoint
public static class GetBookingServiceSelectionSampleData
{
    public static GetBookingSampleResponse GetBookingSpecialistByProviderAndService()
    {
        return new GetBookingSampleResponse
        {
            Services = new List<GetBookingGetServicesByProviderAndSpecialistService>
                {
                    new()
                    {
                        Id          = "hair-treatment",
                        Name        = "Keratin Hair Treatment",
                        Description = "Professional smoothing treatment",
                        Duration    = "2.5 hours",
                        Price       = 180,
                        Category    = "Hair Care",
                        Popular     = true,
                        Image       =
                            "/unsplash_images/photo-1560066984-138dadb4c035__w=400&h=300&fit=crop.jpg",
                    },
                    new()
                    {
                        Id          = "spa-facial",
                        Name        = "Luxury Facial Spa",
                        Description = "Deep cleansing and rejuvenation",
                        Duration    = "90 min",
                        Price       = 120,
                        Category    = "Facial",
                        Popular     = true,
                        Image       =
                            "/unsplash_images/photo-1570172619644-dfd03ed5d881__w=400&h=300&fit=crop.jpg",
                    },
                    new()
                    {
                        Id          = "manicure-pedicure",
                        Name        = "Premium Manicure & Pedicure",
                        Description = "Complete nail care package",
                        Duration    = "60 min",
                        Price       = 85,
                        Category    = "Nails",
                        Popular     = true,
                        Image       =
                            "/unsplash_images/photo-1604654894610-df63bc536371__w=400&h=300&fit=crop.jpg",
                    }
                },

            Providers = new List<GetBookingServiceSelectionDataProvider>
                {
                    new()
                    {
                        Id          = "1",
                        Name        = "Istanbul Medical Center",
                        Description = "Istanbul Medical Center",
                        Rating      = 4.9,
                        Verified    = true,
                        Popular     = true,
                        Image       =
                            "/unsplash_images/photo-1519494026892-80bbd2d6fd0d__w=200&h=200&fit=crop.jpg",
                    },
                    new()
                    {
                        Id          = "2",
                        Name        = "Dubai Smile Clinic",
                        Description = "Dubai Smile Clinic",
                        Rating      = 4.9,
                        Popular     = true,
                        Verified    = true,
                        Image       =
                            "/unsplash_images/photo-1629909613654-28e377c37b09__w=200&h=200&fit=crop.jpg",
                    },
                    new()
                    {
                        Id          = "3",
                        Name        = "Bali Wellness Resort",
                        Description = "Bali Wellness Resort",
                        Rating      = 5.0,
                        Popular     = true,
                        Verified    = true,
                        Image       =
                            "/unsplash_images/photo-1540555700478-4be289fbecef__w=200&h=200&fit=crop.jpg",
                    },
                    new()
                    {
                        Id          = "4",
                        Name        = "Cyprus Fertility Center",
                        Description = "Cyprus Fertility Center",
                        Rating      = 4.8,
                        Popular     = true,
                        Verified    = true,
                        Image       =
                            "/unsplash_images/photo-1551190822-a9333d879b1f__w=200&h=200&fit=crop.jpg",
                    }
                },

            Specialist = new List<GetBookingServiceSelectionDataSpecialist>
                {
                    new()
                    {
                        Id           = "1",
                        Name         = "Dr. Mehmet Yavuz",
                        Specialty    = "Hair Transplant Surgeon",
                        Experience   = "18 years",
                        Rating       = 4.9,
                        Reviews      = 1247,
                        Patients     = "12,000+",
                        Languages    = new[] { "English", "Turkish", "Arabic" },
                        Credentials  = new[] { "MD", "ISHRS Member", "Board Certified" },
                        Verified     = true,
                        Consultation = 0,
                        Image        =
                            "/unsplash_images/photo-1612349317150-e413f6a5b16d__w=400&h=400&fit=crop.jpg",
                        NextAvailable= "Mar 15, 2026",
                    },
                    new()
                    {
                        Id           = "2",
                        Name         = "Dr. Can Ozturk",
                        Specialty    = "Hair Restoration Expert",
                        Experience   = "15 years",
                        Rating       = 4.8,
                        Reviews      = 892,
                        Patients     = "10,500+",
                        Languages    = new[] { "English", "Turkish", "German" },
                        Credentials  = new[] { "MD", "FUE Specialist", "ABHRS" },
                        Verified     = true,
                        Consultation = 0,
                        Image        =
                            "/unsplash_images/photo-1622253692010-333f2da6031d__w=400&h=400&fit=crop.jpg",
                        NextAvailable= "Mar 12, 2026",
                    }
                }
        };
    }
}
