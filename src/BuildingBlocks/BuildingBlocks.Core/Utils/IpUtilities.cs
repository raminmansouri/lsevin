using System.Net;
using System.Net.Sockets;

namespace BuildingBlocks.Core.Utils;

/// <summary>
/// Represents the IP utilities.
/// </summary>
public static class IpUtilities
{
    /// <summary>
    /// Gets the IP address.
    /// </summary>
    /// <returns>The IP address.</returns>
    public static string GetIpAddress()
    {
        var host = Dns.GetHostEntry(Dns.GetHostName());
        foreach (var ip in host.AddressList)
        {
            if (ip.AddressFamily == AddressFamily.InterNetwork)
                return ip.ToString();
        }

        return string.Empty;
    }
}
