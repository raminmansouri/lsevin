using Ardalis.GuardClauses;
using BuildingBlocks.Core.Domain.Conversions;
using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Security.Jwt.Services;
using LSevin.Modules.Customer.Consulting.Data.Repository;
using LSevin.Modules.Customer.Customer.Services;
using LSevin.Modules.Customer.Customer.ValueObjects;
using ConsultingDomain = LSevin.Modules.Customer.Consulting.Entities.Consulting;

namespace LSevin.Modules.Customer.Consulting.Features.RequestConsulting;

internal sealed class RequestConsultingCommandHandler(
    IConsultingRepository repository,
    IUserAccessor userAccessor,
    ICustomerDocumentCheckerService customerDocumentCheckerService
) : CommandHandler<RequestConsultingCommand, Guid>
{
    public override async Task<Result<Guid>> Handle(
        RequestConsultingCommand command,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(command, nameof(command));

        var consulting = ConsultingDomain.Create(
            customerId: userAccessor.GetUserIdentity,
            description: command.Description,
            categoryId: command.CategoryId,
            categoryName: command.CategoryName,
            documents: command.DocumentIds.ConvertToIds(CustomerDocumentId.Create),
            customerDocumentCheckerService: customerDocumentCheckerService
        );

        await repository.CreateAsync(consulting, cancellationToken);
        return consulting.Id.Value;
    }
}
