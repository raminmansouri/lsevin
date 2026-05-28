namespace LSevin.Modules.Category.ServiceProvider.Features.GetBookingAvailableDates;

/* ────────────────────────────────────────────────── */
/* 1. Date entry ------------------------------------- */
public class GetBookingAvailableDatesDate
{
    public string Date { get; set; }   // “YYYY-MM-DD”
    public string Day { get; set; }   // “Mon”, “Tue”, …
    public bool Available { get; set; }
}

/* ────────────────────────────────────────────────── */
/* 2. Time‑slot entry -------------------------------- */
public class GetBookingAvailableDatesTimeSlot
{
    public string Time { get; set; }   // e.g. “09:00 AM”
    public bool Available { get; set; }
}

/* ────────────────────────────────────────────────── */
/* 3. Response container ------------------------------ */
public class GetBookingAvailableDatesResponse
{
    public List<GetBookingAvailableDatesDate> Dates { get; set; } = new();
    public List<GetBookingAvailableDatesTimeSlot> TimeSlots { get; set; } = new();
}

/* ────────────────────────────────────────────────── */
/* 4. Sample data provider (acts like a “backend”) ---- */
public static class GetBookingAvailableDatesProvider
{
    public static GetBookingAvailableDatesResponse GetBookingAvailableDates()
    {
        return new GetBookingAvailableDatesResponse
        {
            Dates = new List<GetBookingAvailableDatesDate>
                {
                    new() { Date = "2026-03-15", Day = "Mon", Available = true  },
                    new() { Date = "2026-03-16", Day = "Tue", Available = true  },
                    new() { Date = "2026-03-17", Day = "Wed", Available = false },
                    new() { Date = "2026-03-18", Day = "Thu", Available = true  },
                    new() { Date = "2026-03-19", Day = "Fri", Available = true  },
                    new() { Date = "2026-03-20", Day = "Sat", Available = false },
                    new() { Date = "2026-03-21", Day = "Sun", Available = false },
                },

            TimeSlots = new List<GetBookingAvailableDatesTimeSlot>
                {
                    new() { Time = "09:00 AM", Available = true  },
                    new() { Time = "10:00 AM", Available = true  },
                    new() { Time = "11:00 AM", Available = false },
                    new() { Time = "02:00 PM", Available = true  },
                    new() { Time = "03:00 PM", Available = true  },
                }
        };
    }
}