using Ardalis.GuardClauses;
using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Generators;
using LSevin.Modules.Category.ServiceProvider.ValueObjects;
using LSevin.Modules.Category.ServiceProviderComment.ValueObjects;

namespace LSevin.Modules.Category.ServiceProviderComment.Entities;

public sealed class ServiceProviderComment : AggregateRoot<ServiceProviderCommentId>
{
    private ServiceProviderComment()
    {
        ServiceProviderId = null!;
        CustomerId = Guid.Empty;
        CustomerName = string.Empty;
        CommentText = string.Empty;
    }

    private ServiceProviderComment(
        ServiceProviderId serviceProviderId,
        Guid customerId,
        string customerName,
        string commentText,
        int? rating
    )
        : this()
    {
        Id = ServiceProviderCommentId.Create(IdGenerator.NewId());
        ServiceProviderId = serviceProviderId;
        CustomerId = customerId;
        CustomerName = customerName;
        CommentText = commentText;
        Rating = rating;
        IsPublic = true; // All comments are public by default
    }

    public ServiceProviderId ServiceProviderId { get; private set; }
    public Guid CustomerId { get; private set; }
    public string CustomerName { get; private set; }
    public string CommentText { get; private set; }
    public int? Rating { get; private set; } // 1-5 scale, optional
    public bool IsPublic { get; private set; }

    public static ServiceProviderComment Create(
        ServiceProviderId serviceProviderId,
        Guid customerId,
        string customerName,
        string commentText,
        int? rating
    )
    {
        Guard.Against.Null(serviceProviderId, nameof(serviceProviderId));
        Guard.Against.Default(customerId, nameof(customerId));
        Guard.Against.NullOrWhiteSpace(customerName, nameof(customerName));
        Guard.Against.NullOrWhiteSpace(commentText, nameof(commentText));
        if (rating.HasValue)
            Guard.Against.OutOfRange(rating.Value, nameof(rating), 1, 5);

        return new ServiceProviderComment(serviceProviderId, customerId, customerName, commentText, rating);
    }

    // Domain methods for future moderation feature
    public void MarkAsHidden()
    {
        if (!IsPublic)
            return;
        IsPublic = false;
    }

    public void MarkAsPublic()
    {
        if (IsPublic)
            return;
        IsPublic = true;
    }
}
