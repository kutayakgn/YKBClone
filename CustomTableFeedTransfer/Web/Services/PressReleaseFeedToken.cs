using System;
using System.Security.Cryptography;
using Microsoft.AspNetCore.DataProtection;

namespace YkbYapikredi.Web.Services;

// The endpoint receives the CMS-configured page size, not a client override.
public sealed class PressReleaseFeedToken
{
    private readonly IDataProtector protector;
    public PressReleaseFeedToken(IDataProtectionProvider provider)
    {
        protector = provider.CreateProtector("YkbYapikredi.PressReleaseFeed.PageSize");
    }
    public string Create(int pageSize) => protector.Protect(Math.Max(0, pageSize).ToString(System.Globalization.CultureInfo.InvariantCulture));
    public bool TryRead(string token, out int pageSize)
    {
        pageSize = 0;
        if (string.IsNullOrWhiteSpace(token) || token.Length > 4096) return false;
        try
        {
            var value = protector.Unprotect(token);
            return int.TryParse(value, System.Globalization.NumberStyles.None, System.Globalization.CultureInfo.InvariantCulture, out pageSize) && pageSize >= 0;
        }
        catch (CryptographicException) { return false; }
        catch (FormatException) { return false; }
        catch (ArgumentException) { return false; }
    }
}
