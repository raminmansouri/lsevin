using System.Reflection;

namespace LSevin.Modules.Common;

public sealed class CommonRoot
{
    public static readonly Assembly Assembly = typeof(CommonRoot).Assembly;
}
