using System;
using System.Collections.Generic;

namespace LSevinModels.Models;

public partial class InboxMessageConsumer2
{
    public Guid MessageId { get; set; }

    public string Name { get; set; } = null!;
}
