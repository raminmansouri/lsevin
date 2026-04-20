using System;
using System.Collections.Generic;

namespace LSevinModels.Models;

public partial class CategoryGroup
{
    public int Id { get; set; }

    public string Title { get; set; } = null!;

    public virtual ICollection<Category> Categories { get; set; } = new List<Category>();
}
