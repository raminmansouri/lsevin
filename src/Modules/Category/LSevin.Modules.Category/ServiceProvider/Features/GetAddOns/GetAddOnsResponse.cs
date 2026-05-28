namespace LSevin.Modules.Category.ServiceProvider.Features.GetAddOns;
/* ──────────────────────────────────────────────────────────────────────────────────────────────── */
/* 1. Add‑on model – one entry in the “addons” list                                         */
/* ──────────────────────────────────────────────────────────────────────────────────────────────── */
public class Addon
{
    /// <summary>Unique key used by the system.</summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>Name shown to the user.</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Short explanation of what the add‑on gives.</summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>Monetary cost – use <c>decimal</c> for financial values.</summary>
    public decimal Price { get; set; }

    /// <summary>
    /// Identifier for the icon that should be displayed.  
    /// In a UI project this could be a CSS class, a file path, or an enum value.
    /// </summary>
    public string Icon { get; set; } = string.Empty;

    /// <summary>True if this add‑on is marked as “popular” in the UI.</summary>
    public bool? Popular { get; set; }

    /// <summary>Free‑form bullet points that the UI may render as a list.</summary>
    public List<string> Details { get; set; } = new();
}

/* ──────────────────────────────────────────────────────────────────────────────────────────────── */
/* 2. Response container – the object returned by the “backend” for the list of add‑ons        */
/* ──────────────────────────────────────────────────────────────────────────────────────────────── */
public class AddonListResponse
{
    public List<Addon> Addons { get; set; } = new();
}

/* ──────────────────────────────────────────────────────────────────────────────────────────────── */
/* 3. Sample data provider (acts like a “backend”) – hard‑coded data that mimics the original JS  */
/*    array.  In a real project you would replace this with a database query or an API call.    */
/* ──────────────────────────────────────────────────────────────────────────────────────────────── */
public static class AddonProvider
{
    public static AddonListResponse GetAddons()
    {
        return new AddonListResponse
        {
            Addons = new List<Addon>
            {
                new()
                {
                    Id          = "hotel",
                    Name        = "4-Star Hotel Package",
                    Description = "3 nights accommodation near clinic",
                    Price       = 180,
                    Icon        = "HotelIcon", // e.g. a CSS class or an enum value
                    Popular     = true,
                    Details     = new List<string>
                    {
                        "Breakfast included",
                        "Free WiFi",
                        "10 min from clinic"
                    }
                },
                new()
                {
                    Id          = "transfer",
                    Name        = "VIP Airport Transfer",
                    Description = "Round‑trip luxury car service",
                    Price       = 80,
                    Icon        = "CarIcon",
                    Popular     = true,
                    Details     = new List<string>
                    {
                        "Meet & greet",
                        "Premium vehicle",
                        "Professional driver"
                    }
                },
                new()
                {
                    Id          = "translator",
                    Name        = "Personal Translator",
                    Description = "Dedicated translator for your stay",
                    Price       = 120,
                    Icon        = "GlobeIcon",
                    // Popular is omitted – it will be null
                    Details     = new List<string>
                    {
                        "Available 24/7",
                        "Medical terminology expert",
                        "Multiple languages"
                    }
                },
                new()
                {
                    Id          = "vip",
                    Name        = "VIP Patient Support",
                    Description = "Priority support & concierge service",
                    Price       = 150,
                    Icon        = "HeadphonesIcon",
                    Details     = new List<string>
                    {
                        "24/7 hotline",
                        "Dedicated coordinator",
                        "Priority scheduling"
                    }
                },
                new()
                {
                    Id          = "insurance",
                    Name        = "Medical Travel Insurance",
                    Description = "Comprehensive coverage for your trip",
                    Price       = 95,
                    Icon        = "ShieldIcon",
                    Details     = new List<string>
                    {
                        "Trip cancellation",
                        "Medical complications",
                        "Lost baggage"
                    }
                }
            }
        };
    }
}
