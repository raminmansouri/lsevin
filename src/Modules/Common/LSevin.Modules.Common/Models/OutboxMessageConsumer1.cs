using System;
using System.Collections.Generic;

namespace LSevinModels.Models;

public partial class OutboxMessageConsumer1
{
    public Guid MessageId { get; set; }

    public string Name { get; set; } = null!;
}
