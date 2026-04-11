namespace LSevin.Modules.Category.ServiceProvider.Features.GetBookingGetServicesByProviderAndSpecialist;

// ────────────────────────────────────────────────────────────────
// 1️⃣  Service
public class GetBookingGetServicesByProviderAndSpecialistService
{
    public string Id { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string Description { get; set; } = null!;
    public string Duration { get; set; } = null!;
    public int Price { get; set; }
    public string Category { get; set; } = null!;
    public bool Popular { get; set; }
    public string Image { get; set; } = null!;
}



// ────────────────────────────────────────────────────────────────
// 4️⃣  Response (collection wrapper)
public class GetBookingGetServicesByProviderAndSpecialistResponse
{
    public List<GetBookingGetServicesByProviderAndSpecialistService> Services { get; set; } = new();
    //public List<GetBookingGetServicesByProviderAndSpecialistProvider> Providers { get; set; } = new();
    //public List<GetBookingGetServicesByProviderAndSpecialistDoctor> Doctors { get; set; } = new();
}
