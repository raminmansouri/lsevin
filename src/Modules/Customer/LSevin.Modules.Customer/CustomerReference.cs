using System.Reflection;

namespace LSevin.Modules.Customer;

public static class CustomerReference
{
    public static string ModuleName => "Customer";

    public static readonly Assembly Assembly = typeof(CustomerReference).Assembly;
}
