using System.Reflection;
using BuildingBlocks.Core.Web.Module;
using LSevin.Modules.Category.Infrastructure.Data.Context;

namespace LSevin.Modules.Category;

internal sealed class CategoryInformation : IModuleInformation
{
    public string Name => CategoryReference.ModuleName;

    public string Schema => CategoryContext.DefaultSchema;

    public Assembly Assembly => CategoryReference.Assembly;
}
