using BuildingBlocks.Core.Models;
using LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderByIdPublic;
using System.Numerics;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderByIdPublic;


public sealed record GetBookingByIdResponse
{
    public Booking Booking { get; internal set; }
}

public class BookingRecord
{
    public string id{get;set;}
    public string service{get;set;}
    public string provider{get;set;}
    public string? providerImage{get;set;}
    public string date{get;set;}
    public string time{get;set;}
    public string? duration{get;set;}
    public string location{get;set;}
    public string? fullAddress{get;set;}
    public string status{get;set;}
    public string paymentStatus{get;set;}
    public int price{get;set;}
    public int? deposit{get;set;}
    public int? remaining{get;set;}
    public bool verified{get;set;}
    public string? bookingDate{get;set;}
    public string? confirmationCode{get;set;}
    public List<INCLUDEDSERVICESTYPE> included{get;set;}
    public Contact contact{get;set;}
    public Agent doctor { get; set; }
}

public class INCLUDEDSERVICESTYPE
{
    public string name{get;set;}
    public string title{get;set;}
    public string experience { get; set; }
}

public class Contact
{
    public string phone{get;set;}
    public string email{get;set;}
    public string address { get; set; }
}

public class Agent
{
    public string name;
    public string title;
    public string experience;
    public string? image;
}

// Example usage:
public class GetBookingByIdDummyData
{
    public static void GetData()
    {
        var booking = new BookingRecord()
        {
            id = "BK-2024-001",
            service = "Premium Hair Transplant Package",
            provider = "Istanbul Medical Center",
            providerImage = "/unsplash_images/photo-1519494026892-80bbd2d6fd0d__w=600&h=400&fit=crop.jpg",
            date = "March 18, 2026",
            time = "09:00 AM",
            duration = "4-6 hours",
            location = "Şişli, Istanbul, Turkey",
            fullAddress = "Halaskargazi Cad. No:38/6, 34371 Şişli/Istanbul",
            status = "confirmed",
            paymentStatus = "paid",
            price = 2499,
            deposit = 500,
            remaining = 1999,
            verified = true,
            bookingDate = "February 28, 2026",
            confirmationCode = "LSEVIN-HT-2024-001",
            included = new List<INCLUDEDSERVICESTYPE> { 
                new INCLUDEDSERVICESTYPE { name = "FUE Hair Transplant (4000 grafts)", title = "Procedure", experience = "Expert" }, 
},
            contact = new Contact{ phone = "+90 212 555 0123", email = "info@istanbulmedical.com", address = "Halaskargazi Cad. No:38/6, 34371 Şişli/Istanbul" },
            doctor = new Agent { name = "Dr. Mehmet Yilmaz", title = "Hair Transplant Specialist", experience = "15+ years" }
        };
    }
}
