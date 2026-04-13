namespace LSevin.Modules.Category.ServiceProvider.Features.GetBookingSteps;

public sealed record BookingStep
{
    public string Label{get;set;}
    public int Num{get;set;}
    public string[] Components { get; set; }
}
public sealed record GetBookingStepsResponse 
{
    public BookingStep[] Steps { get; set; }
}

public class GetBookingStepsProvider
{

}