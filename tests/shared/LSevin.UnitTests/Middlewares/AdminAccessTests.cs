using System.Security.Claims;
using LSevin.Api.Middleware.AdminAccess;
using LSevin.Tests.Shared.XunitCategories;
using LSevin.UnitTests.Abstractions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.AspNetCore.Routing.Patterns;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;

namespace LSevin.UnitTests.Middlewares;

/// <summary>
/// Tests for the backend half of the admin panel's access control: <see cref="AdminAccessPolicy"/> and
/// <see cref="AdminAccessMiddleware"/>. They pin the same model the web app enforces
/// (<c>frontend/webapp/src/lib/admin/access</c>).
/// </summary>
public class AdminAccessTests : BaseUnitTest
{
    private static AdminAccessSnapshot Active(params (string Resource, AdminAccessLevel Level)[] grants) =>
        new(AdminAccessKind.Active, grants.ToDictionary(g => g.Resource, g => g.Level));

    // ───────────────────────────── policy ─────────────────────────────

    [Theory]
    [CategoryTrait(TestCategory.Unit)]
    [InlineData("category-module/admin/categories", "categories")]
    [InlineData("category-module/admin/categories/{categoryId:guid}", "categories")]
    [InlineData("/api/v1/category-module/admin/service-definitions/{id}/requirements", "service-definitions")]
    [InlineData("category-module/admin/booking/{id}/review", "bookings")]
    [InlineData("category-module/admin/service-providers", "service-providers")]
    [InlineData("category-module/admin/staff", "staff")]
    [InlineData("category-module/admin/provider-types", "provider-types")]
    [InlineData("customer-module/admin/consulting", "consultation-requests")]
    [InlineData("identity-module/identity/users", "identity-users")]
    public void ResourceFor_MapsKnownAdminRoutes(string route, string expected) =>
        AdminAccessPolicy.ResourceFor(route).Should().Be(expected);

    [Theory]
    [CategoryTrait(TestCategory.Unit)]
    [InlineData("category-module/admin/something-new")]
    [InlineData("category-module/countries")]
    [InlineData("")]
    [InlineData(null)]
    public void ResourceFor_ReturnsNull_ForRoutesItDoesNotKnow(string? route) =>
        AdminAccessPolicy.ResourceFor(route).Should().BeNull();

    [Theory]
    [CategoryTrait(TestCategory.Unit)]
    [InlineData("GET", AdminAccessLevel.View)]
    [InlineData("HEAD", AdminAccessLevel.View)]
    [InlineData("get", AdminAccessLevel.View)]
    [InlineData("POST", AdminAccessLevel.Manage)]
    [InlineData("PUT", AdminAccessLevel.Manage)]
    [InlineData("PATCH", AdminAccessLevel.Manage)]
    [InlineData("DELETE", AdminAccessLevel.Manage)]
    public void LevelFor_ReadsAreViewEverythingElseIsManage(string method, AdminAccessLevel expected) =>
        AdminAccessPolicy.LevelFor(method).Should().Be(expected);

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void IsAllowed_UnmanagedAdminIsUnlimited_DisabledAdminHasNothing()
    {
        AdminAccessPolicy.IsAllowed(AdminAccessSnapshot.Unmanaged, "anything/at/all", "DELETE").Should().BeTrue();
        AdminAccessPolicy.IsAllowed(AdminAccessSnapshot.Disabled, "category-module/admin/categories", "GET").Should().BeFalse();
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void IsAllowed_ManagedAdmin_ViewAllowsReadsOnly_ManageAllowsBoth()
    {
        var access = Active(("categories", AdminAccessLevel.View), ("service-providers", AdminAccessLevel.Manage));

        AdminAccessPolicy.IsAllowed(access, "category-module/admin/categories", "GET").Should().BeTrue();
        AdminAccessPolicy.IsAllowed(access, "category-module/admin/categories", "POST").Should().BeFalse();
        AdminAccessPolicy.IsAllowed(access, "category-module/admin/categories/{id}", "DELETE").Should().BeFalse();
        AdminAccessPolicy.IsAllowed(access, "category-module/admin/service-providers", "GET").Should().BeTrue();
        AdminAccessPolicy.IsAllowed(access, "category-module/admin/service-providers/{id}", "PUT").Should().BeTrue();
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void IsAllowed_ManagedAdmin_IsRefusedAreasTheyDoNotHold()
    {
        var access = Active(("staff", AdminAccessLevel.Manage));

        AdminAccessPolicy.IsAllowed(access, "category-module/admin/booking", "GET").Should().BeFalse();
        AdminAccessPolicy.IsAllowed(access, "category-module/admin/service-providers", "GET").Should().BeFalse();
        AdminAccessPolicy.IsAllowed(access, "customer-module/admin/consulting", "GET").Should().BeFalse();
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void IsAllowed_ManagedAdmin_NeverReachesIdentityOrPrivilegedAreas_EvenWithAStaleRow()
    {
        var access = Active(("identity-users", AdminAccessLevel.Manage), ("access-control", AdminAccessLevel.Manage));

        AdminAccessPolicy.IsAllowed(access, "identity-module/identity/users", "GET").Should().BeFalse();
        AdminAccessPolicy.IsAllowed(access, "identity-module/identity/users/{id}/state", "PUT").Should().BeFalse();
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void IsAllowed_ManagedAdmin_CanReadReferenceCatalogues_ButNotChangeThem()
    {
        var access = Active(("bookings", AdminAccessLevel.View));

        AdminAccessPolicy.IsAllowed(access, "category-module/admin/categories", "GET").Should().BeTrue();
        AdminAccessPolicy.IsAllowed(access, "category-module/admin/provider-types", "GET").Should().BeTrue();
        AdminAccessPolicy.IsAllowed(access, "category-module/admin/service-definitions", "GET").Should().BeTrue();
        AdminAccessPolicy.IsAllowed(access, "category-module/admin/categories", "POST").Should().BeFalse();
        // …but only for someone who holds something at all.
        AdminAccessPolicy.IsAllowed(Active(), "category-module/admin/categories", "GET").Should().BeFalse();
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void IsAllowed_ManagedAdmin_UnmappedAdminEndpoints_AreRefusedByDefault()
    {
        var access = Active(("bookings", AdminAccessLevel.Manage));

        AdminAccessPolicy.IsAllowed(access, "category-module/admin/something-new", "GET").Should().BeFalse();
        AdminAccessPolicy.IsAllowed(access, "some-other-module/reports", "GET").Should().BeFalse();
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void IsAllowed_ManagedAdmin_FilesNeedManageSomewhere_GeographyNeedsAnyGrantAndReadOnly()
    {
        AdminAccessPolicy.IsAllowed(Active(("bookings", AdminAccessLevel.Manage)), "category-module/upload-any-file", "POST").Should().BeTrue();
        AdminAccessPolicy.IsAllowed(Active(("bookings", AdminAccessLevel.View)), "category-module/upload-any-file", "POST").Should().BeFalse();

        var viewer = Active(("bookings", AdminAccessLevel.View));
        AdminAccessPolicy.IsAllowed(viewer, "category-module/countries", "GET").Should().BeTrue();
        AdminAccessPolicy.IsAllowed(viewer, "category-module/countries", "POST").Should().BeFalse();
        AdminAccessPolicy.IsAllowed(Active(), "category-module/countries", "GET").Should().BeFalse();
    }

    // ─────────────────────────── middleware ───────────────────────────

    private sealed class FakeStore(Func<Guid, AdminAccessSnapshot> answer, bool fail = false) : IAdminAccessStore
    {
        public int Calls { get; private set; }

        public Task<AdminAccessSnapshot> GetAsync(Guid userId, CancellationToken cancellationToken)
        {
            Calls++;
            return fail ? throw new InvalidOperationException("database down") : Task.FromResult(answer(userId));
        }
    }

    private static (DefaultHttpContext Context, Func<bool> NextCalled) Request(
        string method,
        string route,
        string[] roles,
        bool adminPolicy = true,
        Guid? userId = null
    )
    {
        var context = new DefaultHttpContext { Response = { Body = new MemoryStream() } };
        context.Request.Method = method;
        context.Request.Path = "/api/v1/" + route;

        var claims = new List<Claim> { new(ClaimTypes.NameIdentifier, (userId ?? Guid.NewGuid()).ToString()) };
        claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r)));
        context.User = new ClaimsPrincipal(new ClaimsIdentity(claims, "test", ClaimTypes.Name, ClaimTypes.Role));

        var metadata = new List<object>();
        if (adminPolicy)
        {
            metadata.Add(new AuthorizeAttribute("admin"));
        }

        context.SetEndpoint(
            new RouteEndpoint(
                _ => Task.CompletedTask,
                RoutePatternFactory.Parse(route),
                0,
                new EndpointMetadataCollection(metadata),
                "test"
            )
        );
        return (context, () => false);
    }

    private static async Task<(int Status, bool NextCalled, int StoreCalls)> Run(
        IAdminAccessStore store,
        DefaultHttpContext context,
        bool? enabled = null
    )
    {
        var called = false;
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(enabled is null ? [] : new Dictionary<string, string?> { ["AdminAccess:Enabled"] = enabled.Value.ToString() })
            .Build();
        var middleware = new AdminAccessMiddleware(
            _ =>
            {
                called = true;
                return Task.CompletedTask;
            },
            store,
            configuration,
            NullLogger<AdminAccessMiddleware>.Instance
        );
        await middleware.InvokeAsync(context);
        return (context.Response.StatusCode, called, (store as FakeStore)?.Calls ?? 0);
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public async Task Middleware_UnmanagedAdmin_PassesExactlyAsBefore()
    {
        var store = new FakeStore(_ => AdminAccessSnapshot.Unmanaged);
        var (context, _) = Request("DELETE", "category-module/admin/categories/{id}", ["admin"]);

        var result = await Run(store, context);

        result.NextCalled.Should().BeTrue();
        result.Status.Should().Be(StatusCodes.Status200OK);
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public async Task Middleware_LimitedAdmin_IsRefusedWith403_AndTheEndpointNeverRuns()
    {
        var store = new FakeStore(_ => Active(("staff", AdminAccessLevel.Manage)));
        var (context, _) = Request("GET", "category-module/admin/booking", ["admin"]);

        var result = await Run(store, context);

        result.NextCalled.Should().BeFalse();
        result.Status.Should().Be(StatusCodes.Status403Forbidden);
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public async Task Middleware_LimitedAdmin_IsAllowedWhatTheyHold()
    {
        var store = new FakeStore(_ => Active(("bookings", AdminAccessLevel.View)));
        var (context, _) = Request("GET", "category-module/admin/booking", ["admin"]);

        var result = await Run(store, context);

        result.NextCalled.Should().BeTrue();
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public async Task Middleware_RevokedAdmin_IsRefused_EvenWithAValidAdminToken()
    {
        var store = new FakeStore(_ => AdminAccessSnapshot.Disabled);
        var (context, _) = Request("GET", "category-module/admin/categories", ["admin"]);

        var result = await Run(store, context);

        result.NextCalled.Should().BeFalse();
        result.Status.Should().Be(StatusCodes.Status403Forbidden);
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public async Task Middleware_SuperAdmin_IsNeverNarrowed_AndTheStoreIsNotAsked()
    {
        var store = new FakeStore(_ => AdminAccessSnapshot.Disabled);
        var (context, _) = Request("DELETE", "identity-module/identity/users/{id}", ["superadmin", "admin"]);

        var result = await Run(store, context);

        result.NextCalled.Should().BeTrue();
        result.StoreCalls.Should().Be(0);
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public async Task Middleware_IgnoresEndpointsThatAreNotAdminGated_AndCallersThatAreNotAdmins()
    {
        var store = new FakeStore(_ => AdminAccessSnapshot.Disabled);

        var (open, _) = Request("GET", "category-module/categories", ["admin"], adminPolicy: false);
        (await Run(store, open)).NextCalled.Should().BeTrue();

        var (customer, _) = Request("GET", "category-module/admin/categories", ["user"]);
        (await Run(store, customer)).NextCalled.Should().BeTrue();

        var anonymous = new DefaultHttpContext { Response = { Body = new MemoryStream() } };
        (await Run(store, anonymous)).NextCalled.Should().BeTrue();

        store.Calls.Should().Be(0);
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public async Task Middleware_WhenTheAccessTablesCannotBeRead_AnswersTheyAre503_NeverAllow()
    {
        var store = new FakeStore(_ => AdminAccessSnapshot.Unmanaged, fail: true);
        var (context, _) = Request("GET", "category-module/admin/categories", ["admin"]);

        var result = await Run(store, context);

        result.NextCalled.Should().BeFalse();
        result.Status.Should().Be(StatusCodes.Status503ServiceUnavailable);
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public async Task Middleware_CanBeSwitchedOffByConfiguration()
    {
        var store = new FakeStore(_ => AdminAccessSnapshot.Disabled);
        var (context, _) = Request("GET", "category-module/admin/categories", ["admin"]);

        var result = await Run(store, context, enabled: false);

        result.NextCalled.Should().BeTrue();
        result.StoreCalls.Should().Be(0);
    }
}
