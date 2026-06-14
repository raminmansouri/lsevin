using System;
using System.Collections.Generic;

namespace LSevinModels.Models;

public partial class ServiceProcess
{
    public Guid Id { get; set; }

    public Guid ServiceId { get; set; }

    public int Step { get; set; }

    public string? Title { get; set; }

    public string? Description { get; set; }

    public string? Duration { get; set; }
}
