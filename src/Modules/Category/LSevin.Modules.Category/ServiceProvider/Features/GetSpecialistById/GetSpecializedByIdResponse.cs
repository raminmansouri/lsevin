using BuildingBlocks.Core.Dtos.Localization;
using BuildingBlocks.Core.Models;
using LSevin.Modules.Category.ServiceProvider.Dtos;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetSpecializedById;

using System;
using System.Collections.Generic;

    /* ──────────────────────────────────────────────────────────────────────
       1️⃣  POCOs that mirror the TS interfaces
       ────────────────────────────────────────────────────────────────────── */

    public class GetBySpecialistIdSpecialist
    {
        public string Id { get; set; } = "1";
        public string Name { get; set; } = "Dr. Mehmet Yavuz";
        public string Title { get; set; } = "MD, FISHRS";
        public string Specialty { get; set; } = "Hair Transplant & Restoration Surgeon";
        public string Image { get; set; } = "/unsplash_images/photo-1612349317150-e413f6a5b16d__w=800&h=800&fit=crop.jpg";
        public double Rating { get; set; } = 4.9;
        public int Reviews { get; set; } = 847;
        public int Experience { get; set; } = 18;
        public string Patients { get; set; } = "12,000+";
        public string SuccessRate { get; set; } = "98.5%";
        public bool Verified { get; set; } = true;
        public List<string> Languages { get; set; } = new() { "English", "Turkish", "Arabic" };
        public string Clinic { get; set; } = "Istanbul Medical Center";
        public string ClinicId { get; set; } = "1";
        public string Location { get; set; } = "Istanbul, Turkey";
        public string ResponseTime { get; set; } = "< 1 hour";
        public int ConsultationFee { get; set; } = 0;
    }

    public class GetBySpecialistIdEducation
    {
        public string Degree { get; set; }
        public string Institution { get; set; }
        public string Year { get; set; }
    }

    public class GetBySpecialistIdCertification
    {
        public string Name { get; set; }
        public string Issuer { get; set; }
        public bool Verified { get; set; }
    }

    public class GetBySpecialistIdAchievement
    {
        public string Icon { get; set; }        // placeholder – in the TS version this was a JSX element
        public string Title { get; set; }
        public string Organization { get; set; }
    }

    public class GetBySpecialistIdReview
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Country { get; set; }
        public string Date { get; set; }          // e.g. "2 weeks ago"
        public int Rating { get; set; }
        public string Treatment { get; set; }
        public string Review { get; set; }
        public bool Verified { get; set; }
        public int Helpful { get; set; }
        public List<string>? Images { get; set; }
    }

    public class GetBySpecialistIdBeforeAfter
    {
        public string Before { get; set; }
        public string After { get; set; }
        public string Procedure { get; set; }
        public string Months { get; set; }
    }

    /* ──────────────────────────────────────────────────────────────────────
       2️⃣  Root response type
       ────────────────────────────────────────────────────────────────────── */

    public class GetSpecialistByIdResponse
    {
        public GetBySpecialistIdSpecialist Specialist { get; set; } = new();
        public List<GetBySpecialistIdEducation> Education { get; set; } = new();
        public List<GetBySpecialistIdCertification> Certifications { get; set; } = new();
        public List<string> Specializations { get; set; } = new();
        public List<GetBySpecialistIdAchievement> Achievements { get; set; } = new();
        public List<GetBySpecialistIdReview> RecentReviews { get; set; } = new();
        public List<GetBySpecialistIdBeforeAfter> BeforeAfter { get; set; } = new();
    }
