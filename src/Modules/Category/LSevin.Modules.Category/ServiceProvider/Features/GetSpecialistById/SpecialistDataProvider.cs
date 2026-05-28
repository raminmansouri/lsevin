namespace LSevin.Modules.Category.ServiceProvider.Features.GetSpecializedById;

using System.Collections.Generic;

public static class SpecialistDataProvider
{
    /// <summary>
    /// Returns a fully populated <see cref="GetSpecialistByIdResponse"/> for the given id.
    /// In a real app this would query a database or call an external API.
    /// </summary>
    public static GetSpecialistByIdResponse GetSpecialistById(string id)
    {
        // For demo purposes we ignore the id and always return the same data.
        return new GetSpecialistByIdResponse
        {
            Specialist = new GetBySpecialistIdSpecialist
            {
                Id = id ?? "1",
                Name = "Dr. Mehmet Yavuz",
                Title = "MD, FISHRS",
                Specialty = "Hair Transplant & Restoration Surgeon",
                Image = "/unsplash_images/photo-1612349317150-e413f6a5b16d__w=800&h=800&fit=crop.jpg",
                Rating = 4.9,
                Reviews = 847,
                Experience = 18,
                Patients = "12,000+",
                SuccessRate = "98.5%",
                Verified = true,
                Languages = new List<string> { "English", "Turkish", "Arabic" },
                Clinic = "Istanbul Medical Center",
                ClinicId = "1",
                Location = "Istanbul, Turkey",
                ResponseTime = "< 1 hour",
                ConsultationFee = 0
            },

            Education = new List<GetBySpecialistIdEducation>
                {
                    new() { Degree = "Doctor of Medicine (MD)", Institution = "Istanbul University Medical School", Year = "2002" },
                    new() { Degree = "Hair Transplant Surgery Fellowship", Institution = "American Academy of Cosmetic Surgery", Year = "2006" },
                    new() { Degree = "Advanced FUE Training", Institution = "International Society of Hair Restoration Surgery", Year = "2008" }
                },

            Certifications = new List<GetBySpecialistIdCertification>
                {
                    new() { Name = "Fellow of ISHRS", Issuer = "International Society of Hair Restoration Surgery", Verified = true },
                    new() { Name = "Board Certified Surgeon", Issuer = "Turkish Medical Board", Verified = true },
                    new() { Name = "FUE Master Certificate", Issuer = "European Hair Institute", Verified = true },
                    new() { Name = "Advanced Sapphire FUE", Issuer = "World Hair Academy", Verified = true }
                },

            Specializations = new List<string>
                {
                    "FUE Hair Transplant",
                    "Sapphire FUE Technique",
                    "DHI (Direct Hair Implantation)",
                    "Beard & Eyebrow Transplant",
                    "Revision Hair Transplant",
                    "PRP Therapy for Hair Loss"
                },

            Achievements = new List<GetBySpecialistIdAchievement>
                {
                    new() { Icon = "Award", Title = "Best Hair Surgeon 2023", Organization = "Turkish Medical Excellence" },
                    new() { Icon = "Users", Title = "12,000+ Patients", Organization = "From 65+ Countries" },
                    new() { Icon = "Star", Title = "Top 1% Worldwide", Organization = "Hair Transplant Surgeons" },
                    new() { Icon = "TrendingUp", Title = "98.5% Success Rate", Organization = "Verified Patient Outcomes" }
                },

            RecentReviews = new List<GetBySpecialistIdReview>
                {
                    new()
                    {
                        Id = 1,
                        Name = "Michael Thompson",
                        Country = "USA",
                        Date = "2 weeks ago",
                        Rating = 5,
                        Treatment = "Hair Transplant",
                        Review = "Dr. Yavuz is an absolute master of his craft. The results are beyond my expectations - natural hairline, dense coverage, minimal scarring. His attention to detail and artistic approach are exceptional. The entire team was professional and caring throughout the journey.",
                        Verified = true,
                        Helpful = 124,
                        Images = new List<string>
                        {
                            "/unsplash_images/photo-1622296089863-eb7fc530daa8__w=400&h=300&fit=crop.jpg",
                            "https://images.unsplash.com/photo-1629909615957-be38eea5915d?w=400&h=300&fit=crop"
                        }
                    },
                    new()
                    {
                        Id = 2,
                        Name = "Jane Smith",
                        Country = "UK",
                        Date = "3 months ago",
                        Rating = 4,
                        Treatment = "PRP Therapy",
                        Review = "Good results, but could have communicated the timeline better.",
                        Verified = false,
                        Helpful = 33,
                        Images = null
                    }
                },

            BeforeAfter = new List<GetBySpecialistIdBeforeAfter>
                {
                    new()
                    {
                        Before = "/unsplash_images/photo-1612349317150-before.jpg",
                        After = "/unsplash_images/photo-1612349317150-after.jpg",
                        Procedure = "FUE Hair Transplant",
                        Months = "6 months"
                    },
                    new()
                    {
                        Before = "/unsplash_images/photo-1612349317150-before2.jpg",
                        After = "/unsplash_images/photo-1612349317150-after2.jpg",
                        Procedure = "Sapphire FUE",
                        Months = "6 months"
                    }
                }
        };
    }
}