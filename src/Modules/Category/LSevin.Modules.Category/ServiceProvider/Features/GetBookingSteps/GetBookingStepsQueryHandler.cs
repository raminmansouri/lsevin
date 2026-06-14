using System.Text;
using Ardalis.GuardClauses;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Core.Messaging.Queries.Paging;
using BuildingBlocks.Core.Persistence.Connection;
using BuildingBlocks.Core.Persistence.Extensions;
using BuildingBlocks.Core.ResultPattern;
using BuildingBlocks.Web.Services;
using Dapper;
using LSevin.Modules.Category.Currency.Services;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetBookingSteps;

internal sealed class GetBookingStepsQueryHandler(
    IDbConnectionFactory dbConnectionFactory,
    ICurrencyService currencyService,
    ILocaleAccessor localeAccessor
) : IQueryHandler<GetBookingStepsQuery, GetBookingStepsResponse>
{
  

    public async Task<Result<GetBookingStepsResponse>> Handle(
        GetBookingStepsQuery request,
        CancellationToken cancellationToken
    )
    {
        Guard.Against.Null(request, nameof(request));

        await using var connection = await dbConnectionFactory.GetOrCreateConnectionAsync(cancellationToken);
        var parameters = new DynamicParameters();


        return new GetBookingStepsResponse
        {
            Steps = new[]
            {
                new BookingStep
                {
                    Num=1,
                    Label="Doctor & Date",
                    Components=new[]
                    {
                        "ChooseYourService",
                        "SelectDate",
                        "SelectTime",
                    }
                },
                 new BookingStep
                {
                    Num=2,
                    Label="Add-ons",
                    Components=new[]
                    {
                        "AddOns",
                    }
                },
                 new BookingStep
                {
                    Num=3,
                    Label="Medical Files",
                    Components=new[]
                    {
                        "UploadFiles",
                    }
                }
                 ,
                 new BookingStep
                {
                    Num=4,
                    Label="Review & Pay",
                    Components=new[]
                    {
                        "ReviewPay",
                    }
                }
            } 
        };
    }

}
