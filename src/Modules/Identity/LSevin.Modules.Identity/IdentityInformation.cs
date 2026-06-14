using System.Reflection;
using BuildingBlocks.Core.Web.Module;
using LSevin.Modules.Identity.Infrastructure.Data.Context;

namespace LSevin.Modules.Identity;

internal sealed class IdentityInformation : IModuleInformation
{
    public string Name => IdentityReference.ModuleName;

    public string Schema => IdentityContext.DefaultSchema;

    public Assembly Assembly => IdentityReference.Assembly;
}
