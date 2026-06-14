namespace LSevin.Modules.Category.ServiceProvider.Features.GetBookingGetProvidersByServiceAndSpecialist;


// ────────────────────────────────────────────────────────────────
// 2️⃣  Provider
public class GetBookingServiceSelectionDataProvider
{
    public string Id { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string Description { get; set; } = null!;
    public double Rating { get; set; }
    public bool Verified { get; set; }
    public bool Popular { get; set; }
    public string Image { get; set; } = null!;
}


// ────────────────────────────────────────────────────────────────
// 4️⃣  Response (collection wrapper)
public class GetBookingGetProvidersByServiceAndSpecialistResponse
{
    //public List<GetBookingServiceSelectionDataService> Services { get; set; } = new();
    public List<GetBookingServiceSelectionDataProvider> Providers { get; set; } = new();
    //public List<GetBookingServiceSelectionDataSpecialist> Specialists { get; set; } = new();
}

// ────────────────────────────────────────────────────────────────
// 5️⃣  Sample data provider – mimics a “backend” endpoint
