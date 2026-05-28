using System;
using System.Collections.Generic;
using NodaTime;

namespace LSevinModels.Models;

public partial class StaffService
{
    public Guid Id { get; set; }

    public Guid ServiceDefinitionId { get; set; }

    public bool IsActive { get; set; }

    public string NotesTranslations { get; set; } = null!;

    public Guid StaffId { get; set; }

    public DateTime CreateDate { get; set; }

    public DateTime? LastModifiedDate { get; set; }

    public virtual ServiceDefinition ServiceDefinition { get; set; } = null!;

    public virtual Staff Staff { get; set; } = null!;
}
