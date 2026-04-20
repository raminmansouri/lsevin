using System;
using System.Collections.Generic;

namespace LSevinModels.Models;

public partial class ConsultingSelectedDocumentReference
{
    public Guid CustomerDocumentId { get; set; }

    public Guid ConsultingId { get; set; }

    public virtual Consulting Consulting { get; set; } = null!;
}
