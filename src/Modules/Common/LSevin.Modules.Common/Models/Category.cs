using System;
using System.Collections.Generic;
using NodaTime;

namespace LSevinModels.Models;

public partial class Category
{
    public Guid Id { get; set; }

    public string NameTranslations { get; set; } = null!;

    public string DescriptionTranslations { get; set; } = null!;

    public Guid? ParentId { get; set; }

    public int DisplayOrder { get; set; }

    public bool IsActive { get; set; }

    public string? IconUrl { get; set; }

    public DateTime CreateDate { get; set; }

    public DateTime? LastModifiedDate { get; set; }

    public int? GroupId { get; set; }

    public string? ImageUrl { get; set; }

    public string? Gradient { get; set; }

    public string? Icon { get; set; }

    public virtual CategoryGroup? Group { get; set; }

    public virtual ICollection<Category> InverseParent { get; set; } = new List<Category>();

    public virtual Category? Parent { get; set; }

    public virtual ICollection<ServiceDefinition> ServiceDefinitions { get; set; } = new List<ServiceDefinition>();
}
