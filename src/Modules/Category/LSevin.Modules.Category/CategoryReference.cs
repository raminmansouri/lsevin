using System.Reflection;

namespace LSevin.Modules.Category;

public static class CategoryReference
{
    public static string ModuleName => "Category";

    public static readonly Assembly Assembly = typeof(CategoryReference).Assembly;
}
