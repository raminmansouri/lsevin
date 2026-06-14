using System;
using System.Collections.Generic;
using NodaTime;

namespace LSevinModels.Models;

public partial class Consulting
{
    public Guid Id { get; set; }

    public Guid CustomerId { get; set; }

    public string Description { get; set; } = null!;

    public DateTime CreateDate { get; set; }

    public DateTime? LastModifiedDate { get; set; }

    public Guid CategoryId { get; set; }

    public string CategoryName { get; set; } = null!;

    public virtual ICollection<ConsultingSelectedDocumentReference> ConsultingSelectedDocumentReferences { get; set; } = new List<ConsultingSelectedDocumentReference>();

    public virtual Customer Customer { get; set; } = null!;
}
