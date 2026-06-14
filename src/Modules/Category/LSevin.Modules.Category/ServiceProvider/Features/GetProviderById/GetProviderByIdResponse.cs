using BuildingBlocks.Core.Dtos.Localization;
using BuildingBlocks.Core.Models;
using LSevin.Modules.Category.ServiceProvider.Dtos;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetProviderById;



// ------------------------------------------------------------
//  File: ProviderModels.cs
// ------------------------------------------------------------

    // ----------  Basic building blocks ----------
    public class Certification
    {
        public string Name { get; set; }
        public bool Verified { get; set; }
    }

    public class Provider
    {
        public string Id { get; set; }
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

    public class Service
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public double Price { get; set; }
        public string Currency { get; set; }
        public string Duration { get; set; }
        public string Recovery { get; set; }
        public double Rating { get; set; }
        public int Reviews { get; set; }
        public bool? Popular { get; set; }    // nullable – only first Service uses it
        public string Image { get; set; }
    }

    public class Specialist
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Specialty { get; set; }
        public string Experience { get; set; }
        public string Patients { get; set; }
        public double Rating { get; set; }
        public string Image { get; set; }
        public bool Verified { get; set; }
    }

    public class Review
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Country { get; set; }
        public string Date { get; set; }
        public int Rating { get; set; }
        public string Service { get; set; }
        public string ReviewText { get; set; }   // renamed to avoid clash with class name
        public bool Verified { get; set; }
        public int Helpful { get; set; }
        public List<string> Images { get; set; }
    }

    public class Recommendation
    {
        public string Id { get; set; }
        public string Image { get; set; }
        public string Title { get; set; }
        public double Rating { get; set; }
        public int ReviewCount { get; set; }
        public string City { get; set; }
        public string Country { get; set; }
        public bool Verified { get; set; }
        public string Link { get; set; }
    }

    // ----------  Full provider payload ----------
    public class ProviderResponse
    {
        public Provider Provider { get; set; }
        public List<Service> Services { get; set; }
        public List<Specialist> Specialists { get; set; }
        public List<Review> RecentReviews { get; set; }
        public List<Recommendation> LocalRecommendations { get; set; }
        public List<Recommendation> InternationalRecommendations { get; set; }
    }

    // ------------------------------------------------------------
    //  Sample data provider
    // ------------------------------------------------------------
    public static class ProviderDataProvider
    {
        public static ProviderResponse GetSampleProviderResponse()
        {
            return new ProviderResponse
            {
                Provider = new Provider
                {
                    Id = "1",
                    Name = "Istanbul Medical Center",
                    Tagline = "World‑Class Hair Transplant & Aesthetic Surgery",
                    Location = "Sisli, Istanbul, Turkey",
                    Rating = 4.9,
                    Reviews = 2847,
                    Verified = true,
                    Accredited = true,
                    ResponseTime = "< 2 hours",
                    Images = new List<string>
                    {
                        "/unsplash_images/photo-1519494026892-80bbd2d6fd0d__w=1200&h=800&fit=crop.jpg",
                        "/unsplash_images/photo-1631217868264-e5b90bb7e133__w=1200&h=800&fit=crop.jpg",
                        "/unsplash_images/photo-1586773860418-d37222d8fce3__w=1200&h=800&fit=crop.jpg",
                        "/unsplash_images/photo-1512678080530-7760d81faba6__w=1200&h=800&fit=crop.jpg"
                    },
                    Certifications = new List<Certification>
                    {
                        new Certification{ Name="JCI Accredited", Verified=true },
                        new Certification{ Name="ISO 9001:2015", Verified=true },
                        new Certification{ Name="ISHRS Member", Verified=true },
                        new Certification{ Name="Turkey Ministry of Health", Verified=true }
                    },
                    Languages = new List<string> { "English", "Arabic", "Turkish", "Russian" },
                    Established = 2008,
                    TotalPatients = "50,000+",
                    SuccessRate = "98.5%"
                },

                Services = new List<Service>
                {
                    new Service
                    {
                        Id = 1,
                        Name = "Premium Hair Transplant - FUE",
                        Price = 2499,
                        Currency = "USD",
                        Duration = "6‑8 hours",
                        Recovery = "7‑10 days",
                        Rating = 4.9,
                        Reviews = 112,
                        Popular = true,
                        Image = "/unsplash_images/photo-1519494026892-80bbd2d6fd0d__w=600&h=400&fit=crop.jpg"
                    },
                    new Service
                    {
                        Id = 2,
                        Name = "Laser Hair Restoration",
                        Price = 1299,
                        Currency = "USD",
                        Duration = "3‑5 hours",
                        Recovery = "1‑2 days",
                        Rating = 4.6,
                        Reviews = 89,
                        Image = "/unsplash_images/photo-1523413664-6d5b8e9f3c6a__w=600&h=400&fit=crop.jpg"
                    },
                    new Service
                    {
                        Id = 3,
                        Name = "Botox & Fillers",
                        Price = 799,
                        Currency = "USD",
                        Duration = "30‑45 minutes",
                        Recovery = "Immediate",
                        Rating = 4.4,
                        Reviews = 45,
                        Image = "/unsplash_images/photo-1523413664-6d5b8e9f3c6a__w=600&h=400&fit=crop.jpg"
                    }
                },

                Specialists = new List<Specialist>
                {
                    new Specialist
                    {
                        Id = 1,
                        Name = "Dr. Mehmet Öz",
                        Specialty = "Hair Transplant Specialist",
                        Experience = "10 years",
                        Patients = "1,200",
                        Rating = 4.8,
                        Image = "/unsplash_images/Specialist1.jpg",
                        Verified = true
                    },
                    new Specialist
                    {
                        Id = 2,
                        Name = "Dr. Fatma Kaya",
                        Specialty = "Plastic Surgeon",
                        Experience = "8 years",
                        Patients = "980",
                        Rating = 4.7,
                        Image = "/unsplash_images/Specialist2.jpg",
                        Verified = true
                    },
                    new Specialist
                    {
                        Id = 3,
                        Name = "Dr. Ahmet Yılmaz",
                        Specialty = "Dermatology",
                        Experience = "6 years",
                        Patients = "620",
                        Rating = 4.5,
                        Image = "/unsplash_images/Specialist3.jpg",
                        Verified = true
                    }
                },

                RecentReviews = new List<Review>
                {
                    new Review
                    {
                        Id = 1,
                        Name = "James K.",
                        Country = "USA",
                        Date = "2024‑03‑21",
                        Rating = 5,
                        Service = "Premium Hair Transplant - FUE",
                        ReviewText = "The Provider was incredibly professional and the results are amazing. I would highly recommend it to anyone looking for quality care.",
                        Verified = true,
                        Helpful = 13,
                        Images = new List<string>
                        {
                            "/unsplash_images/review1_img1.jpg",
                            "/unsplash_images/review1_img2.jpg"
                        }
                    },
                    new Review
                    {
                        Id = 2,
                        Name = "Li Wei",
                        Country = "China",
                        Date = "2024‑02‑14",
                        Rating = 4,
                        Service = "Laser Hair Restoration",
                        ReviewText = "Good experience, but the waiting time could be shorter.",
                        Verified = true,
                        Helpful = 7,
                        Images = null
                    },
                    new Review
                    {
                        Id = 3,
                        Name = "Anna Müller",
                        Country = "Germany",
                        Date = "2024‑01‑08",
                        Rating = 5,
                        Service = "Botox & Fillers",
                        ReviewText = "Wonderful staff and excellent results. Will definitely come back for a touch‑up.",
                        Verified = true,
                        Helpful = 5,
                        Images = null
                    }
                },

                LocalRecommendations = new List<Recommendation>
                {
                    new Recommendation
                    {
                        Id = "rec_local_001",
                        Image = "/unsplash_images/local_rec1.jpg",
                        Title = "Nişantaşı Health Provider",
                        Rating = 4.6,
                        ReviewCount = 512,
                        City = "Nişantaşı",
                        Country = "Turkey",
                        Verified = true,
                        Link = "/Providers/nisanta%C5%9Fi-health"
                    },
                    new Recommendation
                    {
                        Id = "rec_local_002",
                        Image = "/unsplash_images/local_rec2.jpg",
                        Title = "Ankara Cosmetic Center",
                        Rating = 4.3,
                        ReviewCount = 278,
                        City = "Ankara",
                        Country = "Turkey",
                        Verified = true,
                        Link = "/Providers/ankara-cosmetic"
                    }
                },

                InternationalRecommendations = new List<Recommendation>
                {
                    new Recommendation
                    {
                        Id = "rec_intl_001",
                        Image = "/unsplash_images/int_rec1.jpg",
                        Title = "Paris Beauty & Laser",
                        Rating = 4.8,
                        ReviewCount = 842,
                        City = "Paris",
                        Country = "France",
                        Verified = true,
                        Link = "/Providers/paris-beauty"
                    },
                    new Recommendation
                    {
                        Id = "rec_intl_002",
                        Image = "/unsplash_images/int_rec2.jpg",
                        Title = "Dubai Skin Studio",
                        Rating = 4.5,
                        ReviewCount = 467,
                        City = "Dubai",
                        Country = "UAE",
                        Verified = true,
                        Link = "/Providers/dubai-skin"
                    }
                }
            };
        }
    }
