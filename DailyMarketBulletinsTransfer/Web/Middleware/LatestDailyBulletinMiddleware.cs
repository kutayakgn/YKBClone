#nullable enable
using System;
using System.Linq;
using System.Threading.Tasks;
using CMS.CustomTables;
using CMS.DataEngine;
using CMS.Helpers;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace YkbYapikredi.Web.Middleware
{
    /// <summary>Redirects the daily bulletin shortcut to the latest table document.</summary>
    public sealed class LatestDailyBulletinMiddleware
    {
        private const string ShortcutPath = "/yapi-kredi-blue-class/gunluk-bulten";
        private const string TableClassName = "YkbYapikredi.DailyAllMarketBullettins";
        // Only used by System.Uri to escape local paths; never fetched or returned.
        private static readonly Uri ParsingBaseUri = new Uri("https://relative.invalid/");
        private readonly RequestDelegate next;
        private readonly ILogger<LatestDailyBulletinMiddleware> logger;

        public LatestDailyBulletinMiddleware(RequestDelegate next,
            ILogger<LatestDailyBulletinMiddleware> logger)
        {
            this.next = next;
            this.logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var requestPath = context.Request.Path.Value ?? string.Empty;
            if (!string.Equals(requestPath.TrimEnd('/'), ShortcutPath, StringComparison.OrdinalIgnoreCase))
            {
                await next(context);
                return;
            }

            // A permanent/cached redirect could keep opening yesterday's PDF.
            context.Response.Headers["Cache-Control"] = "no-store, no-cache, max-age=0, must-revalidate";
            context.Response.Headers["Pragma"] = "no-cache";
            context.Response.Headers["Expires"] = "0";

            if (!HttpMethods.IsGet(context.Request.Method) && !HttpMethods.IsHead(context.Request.Method))
            {
                context.Response.Headers["Allow"] = "GET, HEAD";
                await Respond(context, StatusCodes.Status405MethodNotAllowed, "Bu adres GET veya HEAD isteği kabul eder.");
                return;
            }

            CustomTableItem? item;
            try
            {
                context.RequestAborted.ThrowIfCancellationRequested();
                // The query runs for each request. Do not add a long-lived result cache.
                // Pdf is the field name; there is deliberately no BulletinType filter.
                item = CustomTableItemProvider.GetItems(TableClassName)
                    .Columns("ItemID", "Date", "Pdf")
                    .WhereNotNull("Date")
                    .WhereNotEmpty("Pdf")
                    .OrderByDescending("Date", "ItemID")
                    .TopN(1)
                    .FirstOrDefault();
            }
            catch (OperationCanceledException) when (context.RequestAborted.IsCancellationRequested)
            {
                throw;
            }
            catch (Exception error)
            {
                logger.LogError(error, "En yeni bülten okunamadı. Tablo: {TableClassName}", TableClassName);
                context.Response.Headers["Retry-After"] = "30";
                await Respond(context, StatusCodes.Status503ServiceUnavailable, "Bülten bilgisine şu anda erişilemiyor.");
                return;
            }

            if (item == null || ValidationHelper.GetDateTime(item.GetValue("Date"), DateTime.MinValue) == DateTime.MinValue)
            {
                await Respond(context, StatusCodes.Status404NotFound, "Yayınlanmış bülten bulunamadı.");
                return;
            }

            var pdf = ValidationHelper.GetString(item.GetValue("Pdf"), string.Empty);
            var localUrl = GetLocalUrl(pdf, context.Request);
            if (localUrl == null)
            {
                logger.LogWarning("En yeni bültenin Pdf alanı geçerli bir yerel bağlantıya dönüştürülemedi. ItemID: {ItemID}",
                    item.GetValue("ItemID"));
                await Respond(context, StatusCodes.Status404NotFound, "En yeni bültenin belge adresi geçersiz.");
                return;
            }

            // A root-relative Location keeps the browser's current scheme/domain/port.
            context.Response.Redirect(localUrl, permanent: false);
        }

        private static string? GetLocalUrl(string? value, HttpRequest request)
        {
            var raw = (value ?? string.Empty).Trim();
            if (raw.Length == 0 || raw.Any(char.IsControl) || raw.Contains('\\')) return null;
            string local;
            if (raw.StartsWith("~/", StringComparison.Ordinal))
            {
                local = request.PathBase.ToUriComponent().TrimEnd('/') + raw.Substring(1);
            }
            else if (raw.StartsWith("//", StringComparison.Ordinal))
            {
                if (!Uri.TryCreate("https:" + raw, UriKind.Absolute, out var networkUri) || string.IsNullOrEmpty(networkUri.Host)) return null;
                local = networkUri.PathAndQuery + networkUri.Fragment;
            }
            else if (raw.StartsWith("/", StringComparison.Ordinal))
            {
                local = raw;
            }
            else if (Uri.TryCreate(raw, UriKind.Absolute, out var absolute))
            {
                if ((absolute.Scheme != Uri.UriSchemeHttp && absolute.Scheme != Uri.UriSchemeHttps) || string.IsNullOrEmpty(absolute.Host)) return null;
                // Ignore any production/CDN authority stored in the field.
                local = absolute.PathAndQuery + absolute.Fragment;
            }
            else
            {
                local = request.PathBase.ToUriComponent().TrimEnd('/') + "/" + raw;
            }

            // Never emit a network-path redirect or a disguised CR/LF/backslash URL.
            string decoded;
            try { decoded = Uri.UnescapeDataString(local); }
            catch (UriFormatException) { return null; }
            if (!decoded.StartsWith("/", StringComparison.Ordinal) || decoded.StartsWith("//", StringComparison.Ordinal) ||
                decoded.Contains('\\') || decoded.Any(char.IsControl)) return null;
            if (!Uri.TryCreate(ParsingBaseUri, local, out var parsed) || parsed.Host != ParsingBaseUri.Host) return null;

            // Validate the normalized path as well (including dot-segment removal).
            var path = Uri.UnescapeDataString(parsed.AbsolutePath);
            if (path.StartsWith("//", StringComparison.Ordinal) || path.Contains('\\') || path.Any(char.IsControl)) return null;
            var pathBase = request.PathBase.Value ?? string.Empty;
            var current = pathBase.TrimEnd('/') + (request.Path.Value ?? string.Empty);
            if (string.Equals(path.TrimEnd('/'), current.TrimEnd('/'), StringComparison.OrdinalIgnoreCase) ||
                string.Equals(path.TrimEnd('/'), ShortcutPath, StringComparison.OrdinalIgnoreCase)) return null;

            return parsed.PathAndQuery + parsed.Fragment;
        }

        private static Task Respond(HttpContext context, int status, string message)
        {
            context.Response.StatusCode = status;
            context.Response.ContentType = "text/plain; charset=utf-8";
            return HttpMethods.IsHead(context.Request.Method)
                ? Task.CompletedTask
                : context.Response.WriteAsync(message, context.RequestAborted);
        }
    }

    public static class LatestDailyBulletinMiddlewareExtensions
    {
        public static IApplicationBuilder UseLatestDailyBulletin(this IApplicationBuilder app)
        {
            if (app == null) throw new ArgumentNullException(nameof(app));
            return app.UseMiddleware<LatestDailyBulletinMiddleware>();
        }
    }
}
