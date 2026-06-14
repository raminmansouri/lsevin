using Microsoft.AspNetCore.Builder;

namespace LSevin.Tests.Shared.Extensions;

/// <summary>
/// Extensions for <see cref="IApplicationBuilder"/>.
/// </summary>
public static class ApplicationBuilderExtensions
{
    /// <summary>
    /// The current test application builder.
    /// </summary>
    private static readonly AsyncLocal<Action<IApplicationBuilder>?> _current = new();

    /// <summary>
    /// Adds the current test application builder to the application in the "right" place.
    /// </summary>
    /// <param name="app">The application builder.</param>
    /// <returns>The modified <see cref="IApplicationBuilder"/>.</returns>
    public static IApplicationBuilder AddTestApplicationBuilder(this IApplicationBuilder app)
    {
        if (_current.Value is { } configure)
        {
            configure(app);
        }

        return app;
    }

    /// <summary>
    /// Unit tests can use this to flow state to the main program and change application builder.
    /// </summary>
    /// <param name="action"></param>
    public static void ConfigureTestApplicationBuilder(this Action<IApplicationBuilder> action)
    {
        _current.Value = action;
    }
}
