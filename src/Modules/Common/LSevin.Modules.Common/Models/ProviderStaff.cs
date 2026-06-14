using System;
using System.Collections.Generic;
using NodaTime;

namespace LSevinModels.Models;

public partial class ProviderStaff
{
    public Guid Id { get; set; }

    public Guid StaffId { get; set; }

    public string NotesTranslations { get; set; } = null!;

    public bool IsActive { get; set; }

    public Guid ServiceProviderId { get; set; }

    public DateTime CreateDate { get; set; }

    public DateTime? LastModifiedDate { get; set; }

    public virtual ServiceProvider ServiceProvider { get; set; } = null!;

    public virtual Staff Staff { get; set; } = null!;
}
