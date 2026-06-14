using System.Reflection;

namespace LSevin.Modules.Identity;

public static class IdentityReference
{
    public static string ModuleName => "Identity";

    public static readonly Assembly Assembly = typeof(IdentityReference).Assembly;
}
