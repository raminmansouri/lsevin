using BuildingBlocks.Web.Constants;
using BuildingBlocks.Web.Extensions;
using LSevin.Tests.Shared.XunitCategories;
using LSevin.UnitTests.Abstractions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;

namespace LSevin.UnitTests.Middlewares;

/// <summary>
/// Regression tests for the API readiness memory check. Production incident 2026-11-17/18: site A's
/// <c>/readiness</c> returned 503 for hours because the check measured private bytes (1.0-1.16 GB, mostly
/// reserved GC address space) against a 900 MiB limit while the resident set was only ~450-550 MB.
/// </summary>
public class HealthCheckRegistrationTests : BaseUnitTest
{
    private static IReadOnlyCollection<HealthCheckRegistration> Registrations()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddBaseHealthCheck(
            "Host=localhost;Database=x;Username=x;Password=x",
            "localhost:6379",
            "esdb://localhost:2113?tls=false"
        );

        using var provider = services.BuildServiceProvider();
        return provider.GetRequiredService<IOptions<HealthCheckServiceOptions>>().Value.Registrations.ToList();
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void Memory_check_measures_the_working_set_not_private_bytes()
    {
        var registrations = Registrations();

        registrations.Should().Contain(r => r.Name == "workingset");
        registrations.Should().NotContain(r => r.Name == "privatememory");
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void Memory_check_is_a_readiness_check_only_so_memory_pressure_never_restarts_the_pod()
    {
        var memory = Registrations().Single(r => r.Name == "workingset");

        memory.Tags.Should().Contain(WebConstants.HealthChecks.HealthCheckReadyTag);
        memory.Tags.Should().NotContain(WebConstants.HealthChecks.HealthCheckLiveTag);
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public async Task Memory_check_is_healthy_for_a_normal_process()
    {
        // The test process itself is far below 900 MiB of resident memory.
        var memory = Registrations().Single(r => r.Name == "workingset");
        using var scope = new ServiceCollection().BuildServiceProvider();
        var check = memory.Factory(scope);

        var result = await check.CheckHealthAsync(new HealthCheckContext { Registration = memory });

        result.Status.Should().Be(HealthStatus.Healthy);
    }
}
