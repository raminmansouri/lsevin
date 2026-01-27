using System.Reflection;
using Microsoft.Extensions.Options;
using Sieve.Models;
using Sieve.Services;

namespace BuildingBlocks.Core.Messaging.Queries.Paging;

/// <summary>
/// Represents the application sieve processor.
/// </summary>
public sealed class ApplicationSieveProcessor : SieveProcessor
{
    /// <summary>
    /// Initializes a new instance of the <see cref="ApplicationSieveProcessor"/> class.
    /// </summary>
    /// <param name="options">The options.</param>
    public ApplicationSieveProcessor(IOptions<SieveOptions> options)
        : base(options) { }

    /// <summary>
    /// Initializes a new instance of the <see cref="ApplicationSieveProcessor"/> class.
    /// </summary>
    /// <param name="options">The options.</param>
    /// <param name="customSortMethods">The custom sort methods.</param>
    public ApplicationSieveProcessor(IOptions<SieveOptions> options, ISieveCustomSortMethods customSortMethods)
        : base(options, customSortMethods) { }

    /// <summary>
    /// Initializes a new instance of the <see cref="ApplicationSieveProcessor"/> class.
    /// </summary>
    /// <param name="options">The options.</param>
    /// <param name="customFilterMethods">The custom filter methods.</param>
    public ApplicationSieveProcessor(IOptions<SieveOptions> options, ISieveCustomFilterMethods customFilterMethods)
        : base(options, customFilterMethods) { }

    /// <summary>
    /// Initializes a new instance of the <see cref="ApplicationSieveProcessor"/> class.
    /// </summary>
    /// <param name="options">The options.</param>
    /// <param name="customSortMethods">The custom sort methods.</param>
    /// <param name="customFilterMethods">The custom filter methods.</param>
    public ApplicationSieveProcessor(
        IOptions<SieveOptions> options,
        ISieveCustomSortMethods customSortMethods,
        ISieveCustomFilterMethods customFilterMethods
    )
        : base(options, customSortMethods, customFilterMethods) { }

    /// <inheritdoc />
    protected override SievePropertyMapper MapProperties(SievePropertyMapper mapper)
    {
        return mapper.ApplyConfigurationsFromAssembly(Assembly.GetCallingAssembly());
    }
}
