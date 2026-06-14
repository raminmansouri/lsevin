using BuildingBlocks.Core.Domain.Exceptions;
using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Validation.Common;
using BuildingBlocks.Web.Middlewares;
using Grpc.Core;
using LSevin.Tests.Shared.XunitCategories;
using LSevin.UnitTests.Abstractions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;

namespace LSevin.UnitTests.Middlewares;

/// <summary>
/// Tests for the <see cref="ExceptionHandler"/> class.
/// </summary>
public class ManualDataEntryTests : BaseUnitTest
{


    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public async Task InsertData()
    {
        var importer = new GeoNamesLocationImporter(
    connectionString: "Host=45.138.135.34:4523;Database=lsevin;Username=postgres;Password=T@l@7est;",
    //connectionString: "Host=45.90.98.111;Port=5432;Database=lsevin;Username=lsevin;Password=CHANGE_ME_DB_PASSWORD;Include Error Detail=true;",
    countryTypeId: 1,
    cityTypeId: 2
);

        await importer.ImportAsync(
            countryInfoPath: @"d:\data\countryInfo.txt",
            cities15000Path: @"d:\data\cities15000.txt",
            ct: CancellationToken.None
        );
    }

}
