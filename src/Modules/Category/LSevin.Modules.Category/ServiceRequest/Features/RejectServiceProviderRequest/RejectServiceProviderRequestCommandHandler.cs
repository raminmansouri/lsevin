using Ardalis.GuardClauses;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.ResultPattern;
using LSevin.Modules.Category.Resources;
using LSevin.Modules.Category.ServiceRequest.Data.Repository;
using LSevin.Modules.Category.ServiceRequest.Specifications;
using LSevin.Modules.Category.ServiceRequest.ValueObjects;

namespace LSevin.Modules.Category.ServiceRequest.Features.RejectServiceProviderRequest;

internal sealed class RejectServiceProviderRequestCommandHandler(IServiceProviderRequestRepository repository)
    : CommandHandler<RejectServiceProviderRequestCommand, bool>
{
    public override async Task<Result<bool>> Handle(
        RejectServiceProviderRequestCommand command,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(command, nameof(command));

        var spec = new ServiceProviderRequestByIdSpec(ServiceProviderRequestId.Create(command.RequestId));
        var request = await repository.FirstOrDefaultAsync(spec, cancellationToken);
        if (request is null)
            return AppError.NotFoundErrorMessage(CategoryResource.Service_Provider);

        request.MarkAsRejected();
        repository.Update(request);
        await repository.UnitOfWork.SaveEntitiesAsync(cancellationToken);
        return true;
    }
}
