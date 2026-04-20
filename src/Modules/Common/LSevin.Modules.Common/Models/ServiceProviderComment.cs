using System;
using System.Collections.Generic;
using NodaTime;

namespace LSevinModels.Models;

public partial class ServiceProviderComment
{
    public Guid Id { get; set; }

    public Guid ServiceProviderId { get; set; }

    public Guid CustomerId { get; set; }

    public string CustomerName { get; set; } = null!;

    public string CommentText { get; set; } = null!;

    public int? Rating { get; set; }

    public bool IsPublic { get; set; }

    public DateTime CreateDate { get; set; }

    public DateTime? LastModifiedDate { get; set; }

    public string? Country { get; set; }

    public string? Treatment { get; set; }

    public bool? IsVerified { get; set; }

    public int? HelpfulCount { get; set; }

    public virtual ICollection<ReviewImage> ReviewImages { get; set; } = new List<ReviewImage>();

    public virtual ServiceProvider ServiceProvider { get; set; } = null!;
}
