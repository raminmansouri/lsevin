using System;
using System.Collections.Generic;

namespace LSevinModels.Models;

public partial class CustomerDocumentType
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public virtual ICollection<CustomerDocument> CustomerDocuments { get; set; } = new List<CustomerDocument>();
}
