using System;
using System.Collections.Generic;

namespace LSevinModels.Models;

public partial class ServiceFaq
{
    public Guid Id { get; set; }

    public Guid ServiceId { get; set; }

    public string? Question { get; set; }

    public string? Answer { get; set; }
}
