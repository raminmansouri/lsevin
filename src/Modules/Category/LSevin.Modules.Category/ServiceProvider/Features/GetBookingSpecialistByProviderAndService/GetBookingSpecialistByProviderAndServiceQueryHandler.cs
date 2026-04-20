using Ardalis.GuardClauses;
using BuildingBlocks.Core.Dtos.Localization;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Services;
using Dapper;
using LSevin.Modules.Category.Resources;
using LSevin.Modules.Category.ServiceProvider.Data.Repository;
using LSevin.Modules.Category.ServiceProvider.Features.GetBookingGetServicesByProviderAndSpecialist;
using System.Text;
using System.Text.Json;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetBookingSpecialistByProviderAndService;

internal sealed class GetBookingSpecialistByProviderAndServiceQueryHandler(
    IDbConnectionFactory dbConnectionFactory,
    ILocaleAccessor localeAccessor
) : IQueryHandler<GetBookingSpecialistByProviderAndServiceQuery, GetBookingSpecialistByProviderAndServiceResponse>
{
    public async Task<Result<GetBookingSpecialistByProviderAndServiceResponse>> Handle(
        GetBookingSpecialistByProviderAndServiceQuery request,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(request, nameof(request));

        await using var connection = await dbConnectionFactory.GetOrCreateConnectionAsync(cancellationToken);
        var parameters = new DynamicParameters();
       
       

        // Build the query with optional filters
        var sql = new StringBuilder();
        var currentLocale = localeAccessor.CurrentLocale;
        var defaultLocale = localeAccessor.DefaultLocale;

        var repository = new BookingServiceSelectionRepository(connection);

        var specialists = await repository.GetSpecialistsAsync(request.providerId,
  request.serviceId,
  request.specialistId, currentLocale, cancellationToken);

        return new GetBookingSpecialistByProviderAndServiceResponse
        {
            Specialist = specialists
        };


        //var response = GetBookingServiceSelectionSampleData.GetBookingSpecialistByProviderAndService().Specialist;
        //return new GetBookingSpecialistByProviderAndServiceResponse
        //{
        //    Specialist = response
        //};
    }
}

