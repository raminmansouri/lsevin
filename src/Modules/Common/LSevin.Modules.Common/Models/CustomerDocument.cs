using System;
using System.Collections.Generic;
using NodaTime;

namespace LSevinModels.Models;

public partial class CustomerDocument
{
    public Guid Id { get; set; }

    public int DocumentTypeId { get; set; }

    public string DocumentUrl { get; set; } = null!;

    public Guid CustomerId { get; set; }

    public DateTime CreateDate { get; set; }

    public DateTime? LastModifiedDate { get; set; }

    public virtual Customer Customer { get; set; } = null!;

    public virtual CustomerDocumentType DocumentType { get; set; } = null!;
}
