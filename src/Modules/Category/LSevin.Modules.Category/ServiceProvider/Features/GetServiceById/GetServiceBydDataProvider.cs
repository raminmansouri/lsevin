namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceById;

using System.Collections.Generic;

// --------------------
// 7️⃣  Sample data provider
// --------------------
/// <summary>
/// Returns a fully‑filled <see cref="GetServiceByIdResponse"/> that matches the
/// JSON you posted.  Perfect for unit‑tests, integration‑tests or
/// UI‑mock‑ups.
/// </summary>
public static class GetServiceByIdDataProvider
{
    public static GetServiceByIdResponse GetSampleData()
    {
        return new GetServiceByIdResponse
        {
            Service = new GetServiceByIdService
            {
                Id = "treatment-1",
                Name = "Premium Hormone Replacement Therapy",
                Subtitle = "Optimize your health with personalized HRT",
                Clinic = "New Horizon Clinic",
                ClinicId = "cl-1001",
                Location = "London, UK",
                Price = 2999m,
                OriginalPrice = 4499m,
                Currency = "GBP",
                OtherCurrencies = new()
                    {
                        new GetServiceByIdOtherCurrency { Code = "USD", Amount = 3999m },
                        new GetServiceByIdOtherCurrency { Code = "EUR", Amount = 3499m },
                    },
                Rating = 4.6,
                Reviews = 102,
                Images = new()
                    {
                        "https://cdn.clinics.com/img/treatment-1-01.webp",
                        "https://cdn.clinics.com/img/treatment-1-02.webp",
                        "https://cdn.clinics.com/img/treatment-1-03.webp",
                        "https://cdn.clinics.com/img/treatment-1-04.webp",
                        "https://cdn.clinics.com/img/treatment-1-05.webp",
                    },
                Duration = "12 months",
                Recovery = "4–6 weeks (moderate)",
                Anesthesia = "No",
                StayRequired = "0–2 nights",
                Verified = true,
                Popular = true,
                SuccessRate = "97 %",
                Satisfaction = "94 %"
            },

            Included = new()
                {
                    "Comprehensive hormone panel (total & free) – before & after",
                    "Baseline & follow‑up physical & endocrine assessments",
                    "Individualized therapy plan with a certified HRT specialist",
                    "One‑on‑one support via the clinic’s mobile app",
                    "Access to a private online community of patients"
                },

            Process = new()
                {
                    new GetServiceByIdProcessStep
                    {
                        Step = 1,
                        Title = "Initial Consultation",
                        Description = "A certified HRT specialist reviews your medical history, current medications and baseline hormone panel. We explain the science behind HRT and the expected outcomes.",
                        Duration = "45–60 min"
                    },
                    new GetServiceByIdProcessStep
                    {
                        Step = 2,
                        Title = "Custom Treatment Plan",
                        Description = "Based on your results we design a personalized hormone dose and route (oral, transdermal, or injectable) to meet your goals.",
                        Duration = "30 min"
                    },
                    new GetServiceByIdProcessStep
                    {
                        Step = 3,
                        Title = "Ongoing Monitoring",
                        Description = "You’ll return for monthly blood draws and follow‑up visits to fine‑tune your dose and assess side‑effects.",
                        Duration = "30 min"
                    },
                    new GetServiceByIdProcessStep
                    {
                        Step = 4,
                        Title = "Completion & Transition",
                        Description = "After the 12‑month course we evaluate your final hormone levels and create a maintenance or tapering plan.",
                        Duration = "30 min"
                    }
                },

            Faqs = new()
                {
                    new GetServiceByIdFaq
                    {
                        Question = "Do I need a prescription?",
                        Answer = "Yes – a licensed physician must prescribe HRT. Our clinic’s specialists will provide the prescription after the initial consultation."
                    },
                    new GetServiceByIdFaq
                    {
                        Question = "Is this covered by insurance?",
                        Answer = "Coverage varies by insurer and policy. We recommend contacting your provider to confirm."
                    },
                    new GetServiceByIdFaq
                    {
                        Question = "What if I experience side‑effects?",
                        Answer = "Our specialists monitor side‑effects closely. If you notice any issues we’ll adjust the dose or switch to a different formulation."
                    }
                },

            TopReviews = new()
                {
                    new GetServiceByIdTopReview
                    {
                        Id = 1,
                        Name = "Sarah K.",
                        Country = "USA",
                        Date = "3 days ago",
                        Rating = 5,
                        Review = "After a long search for a reliable HRT program, this clinic finally gave me a clear, evidence‑based plan that made a noticeable difference in my energy and sleep.",
                        Verified = true,
                        Helpful = 24,
                        Images = new()
                        {
                            "https://cdn.clinics.com/img/review-1-01.webp",
                            "https://cdn.clinics.com/img/review-1-02.webp"
                        }
                    },
                    new GetServiceByIdTopReview
                    {
                        Id = 2,
                        Name = "Jonas H.",
                        Country = "Germany",
                        Date = "2 weeks ago",
                        Rating = 5,
                        Review = "The staff were professional, the follow‑ups were very thorough and I felt safe throughout the treatment. Highly recommend.",
                        Verified = true,
                        Helpful = 17
                    }
                },

            LocalRecommendations = new()
                {
                    new GetServiceByIdRecommendation
                    {
                        Id = "rec-l-001",
                        Image = "https://cdn.clinics.com/img/recommend-001.webp",
                        Title = "Top 10 HRT Clinics in London",
                        Provider = "Clinic Finder",
                        Rating = 4.8,
                        ReviewCount = 89,
                        City = "London",
                        Country = "UK",
                        Price = 2999,
                        Currency = "GBP",
                        Verified = true,
                        Link = "/clinics/london/top-hrt"
                    },
                    new GetServiceByIdRecommendation
                    {
                        Id = "rec-l-002",
                        Image = "https://cdn.clinics.com/img/recommend-002.webp",
                        Title = "Best Hormone Replacement Services in the UK",
                        Provider = "Health Hub",
                        Rating = 4.6,
                        ReviewCount = 73,
                        City = "London",
                        Country = "UK",
                        Price = 3499,
                        Currency = "GBP",
                        Verified = true,
                        Link = "/services/uk/best-hrt"
                    }
                },

            // Example: Additional non‑local recommendations could be added
            // here (e.g., international, regional, or specialty‑specific
            // listings).  The structure above shows exactly how you can
            // extend the model for any number of categories.
        };
    }
}