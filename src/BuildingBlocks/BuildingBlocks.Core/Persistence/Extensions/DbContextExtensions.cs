using BuildingBlocks.Core.Persistence.Converters;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace BuildingBlocks.Core.Persistence.Extensions;

/// <summary>
/// Provides extension methods to configure SQL options for a DbContext.
/// </summary>
public static class DbContextExtensions
{
    /// <summary>
    /// Configures SQL options for a DbContext.
    /// </summary>
    /// <param name="options">The DbContext options builder.</param>
    /// <returns>The updated DbContext options builder.</returns>
    public static DbContextOptionsBuilder ConfigureDbOptions(this DbContextOptionsBuilder options)
    {
        options.ConfigureWarnings(w => w.Ignore(RelationalEventId.PendingModelChangesWarning));
        options.ReplaceService<IValueConverterSelector, StronglyTypedIdValueConverterSelector>();
        options.UseSnakeCaseNamingConvention();
        return options;
    }
}
