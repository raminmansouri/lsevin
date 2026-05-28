using BuildingBlocks.Core.Models;
using LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderByIdPublic;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderByIdPublic;


public sealed record BookingsResponse
{
    public List<Booking> UpcomingBookings { get; internal set; }
    public List<Booking> PastBookings { get; internal set; }
    public List<Booking> CancelledBookings { get; internal set; }
}

public class Booking
{
    public string Id { get; set; }
    public string Service { get; set; }
    public string Provider { get; set; }
    public string Image { get; set; }
    public string Date { get; set; }
    public string Time { get; set; }
    public string Location { get; set; }
    public string Status { get; set; }
    public string PaymentStatus { get; set; }
    public int Price { get; set; } // Assuming price is an integer
    public bool Verified { get; set; }
    public string CancelReason { get; set; }

    // Constructor for the booking details
    public Booking(string id,
                   string service,
                   string provider,
                   string image,
                   string date,
                   string time,
                   string location,
                   string status,
                   string paymentStatus,
                   int price,
                   bool verified,
                   string cancelReason=null)
    {
        Id = id;
        Service = service;
        Provider = provider;
        Image = image;
        Date = date;
        Time = time;
        Location = location;
        Status = status;
        PaymentStatus = paymentStatus;
        Price = price;
        Verified = verified;
        CancelReason = cancelReason;
    }
}

public class Bookings
{
    public static Booking[] UpcomingBookings()
    {
        return new Booking[] 
        {
            new Booking(
                "BK-2024-001",
                "Hair Transplant Package",
                "Istanbul Medical Center",
                "/unsplash_images/photo-1519494026892-80bbd2d6fd0d__w=400&h=300&fit=crop.jpg",
                "March 18, 2026",
                "09:00 AM",
                "Istanbul, Turkey",
                "confirmed",
                "paid",
                2499,
                true
            ),
            new Booking(
                "BK-2024-002",
                "Dental Veneers",
                "Dubai Smile Clinic",
                "/unsplash_images/photo-1629909613654-28e377c37b09__w=400&h=300&fit=crop.jpg",
                "March 25, 2026",
                "02:00 PM",
                "Dubai, UAE",
                "pending",
                "pending",
                3200,
                true
            ),
            new Booking(
                "BK-2024-003",
                "Wellness Retreat",
                "Bali Wellness Resort",
                "/unsplash_images/photo-1540555700478-4be289fbecef__w=400&h=300&fit=crop.jpg",
                "April 5, 2026",
                "10:00 AM",
                "Ubud, Bali",
                "confirmed",
                "paid",
                899,
                true
            )
        };
    }

    public static Booking[] PastBookings()
{
        return new Booking[]
        {
            new Booking(
                "BK-2024-000",
                "Full Body Checkup",
                "Bangkok Medical Center",
                "/unsplash_images/photo-1579684385127-1ef15d508118__w=400&h=300&fit=crop.jpg",
                "February 15, 2026",
                "11:00 AM",
                "Bangkok, Thailand",
                "completed",
                "paid",
                450,
                true
            )
        };
    }

    public static Booking[] CancelledBookings()
{
        return new Booking[]
        {
            new Booking(
                "BK-2024-099",
                "Laser Eye Surgery",
                "Vienna Eye Clinic",
                "/unsplash_images/photo-1585435557343-3b092031a831__w=400&h=300&fit=crop.jpg",
                "March 10, 2026",
                "03:00 PM",
                "Vienna, Austria",
                "cancelled",
                "refunded",
                1800,
                true,
                "Cancelled by user"
            )
        };
    }
}

public class Book
{
    public string Id { get; set; }
    public string Service { get; set; }
    public string Provider { get; set; }
    public string Image { get; set; }
    public string Date { get; set; }
    public string Time { get; set; }
    public string Location { get; set; }
    public string Status { get; set; }
    public string PaymentStatus { get; set; }
    public int Price { get; set; } // Assuming price is an integer
    public bool Verified { get; set; }

    public Book(string id,
               string service,
               string provider,
               string image,
               string date,
               string time,
               string location,
               string status,
               string paymentStatus,
               int price,
               bool verified)
    {
        Id = id;
        Service = service;
        Provider = provider;
        Image = image;
        Date = date;
        Time = time;
        Location = location;
        Status = status;
        PaymentStatus = paymentStatus;
        Price = price;
        Verified = verified;
    }
}
