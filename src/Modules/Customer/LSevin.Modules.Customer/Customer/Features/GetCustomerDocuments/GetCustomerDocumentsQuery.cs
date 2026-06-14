using BuildingBlocks.Core.Messaging.Queries;

namespace LSevin.Modules.Customer.Customer.Features.GetCustomerDocuments;

public sealed record GetCustomerDocumentsQuery : Query<IReadOnlyCollection<GetCustomerDocumentsResponse>>;
