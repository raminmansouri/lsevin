using System.Reflection;
using BuildingBlocks.Core.Web.Module;
using LSevin.Modules.Customer.Infrastructure.Data.Context;

namespace LSevin.Modules.Customer;

internal sealed class CustomerInformation : IModuleInformation
{
    public string Name => CustomerReference.ModuleName;

    public string Schema => CustomerContext.DefaultSchema;

    public Assembly Assembly => CustomerReference.Assembly;
}
