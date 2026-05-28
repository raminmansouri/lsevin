namespace LSevin.Modules.Category.ServiceProvider.Features.GetBookingAvailableTimes;

/* ────────────────────────────────────────────────── */
/* 1. Date entry ------------------------------------- */
public class GetBookingAvailableTimesDate
{
    public string Date { get; set; }   // “YYYY-MM-DD”
    public string Day { get; set; }   // “Mon”, “Tue”, …
    public bool Available { get; set; }
}

/* ────────────────────────────────────────────────── */
/* 2. Time‑slot entry -------------------------------- */
public class GetBookingAvailableTimesTimeSlot
{
    public string Time { get; set; }   // e.g. “09:00 AM”
    public bool Available { get; set; }
}

/* ────────────────────────────────────────────────── */
/* 3. Response container ------------------------------ */
public class GetBookingAvailableTimesResponse
{
    public List<GetBookingAvailableTimesDate> Dates { get; set; } = new();
    public List<GetBookingAvailableTimesTimeSlot> TimeSlots { get; set; } = new();
}

/* ────────────────────────────────────────────────── */
/* 4. Sample data provider (acts like a “backend”) ---- */
public static class GetBookingAvailableTimesProvider
{
    public static GetBookingAvailableTimesResponse GetBookingAvailableTimes()
    {
        return new GetBookingAvailableTimesResponse
        {
            Dates = new List<GetBookingAvailableTimesDate>
                {
                    new() { Date = "2026-03-15", Day = "Mon", Available = true  },
                    new() { Date = "2026-03-16", Day = "Tue", Available = true  },
                    new() { Date = "2026-03-17", Day = "Wed", Available = false },
                    new() { Date = "2026-03-18", Day = "Thu", Available = true  },
                    new() { Date = "2026-03-19", Day = "Fri", Available = true  },
                    new() { Date = "2026-03-20", Day = "Sat", Available = false },
                    new() { Date = "2026-03-21", Day = "Sun", Available = false },
                },

            TimeSlots = new List<GetBookingAvailableTimesTimeSlot>
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