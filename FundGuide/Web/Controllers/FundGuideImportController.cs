#nullable disable
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using CMS.CustomTables;
using CMS.DataEngine;
using CMS.FormEngine;
using CMS.Helpers;
using CMS.MediaLibrary;
using CMS.SiteProvider;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using YkbYapikredi.Infrastructure.CustomTableFeeds;

namespace YkbYapikredi.Web.Controllers;

[Route("local-tools/fund-guide-import")]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
public sealed class FundGuideImportController : Controller
{
    private static readonly object ImportLock = new object();
    private readonly IWebHostEnvironment environment;
    private readonly IAntiforgery antiforgery;
    private readonly ILogger<FundGuideImportController> logger;
    public FundGuideImportController(IWebHostEnvironment environment, IAntiforgery antiforgery,
        ILogger<FundGuideImportController> logger)
    { this.environment = environment; this.antiforgery = antiforgery; this.logger = logger; }

    [HttpGet]
    public IActionResult Index()
    {
        if (!IsLocalDevelopment()) return NotFound();
        var token = antiforgery.GetAndStoreTokens(HttpContext);
        return Content("<!doctype html><html lang=\"tr\"><meta charset=\"utf-8\"><title>Fon rehberi aktarımı</title>" +
            "<body><h1>Fon rehberi aktarımı</h1><p>Belgeleri önce YapikrediMedia/FundGuide medya klasörüne yükleyin.</p>" +
            "<form method=\"post\" enctype=\"multipart/form-data\" action=\"" + E(Url.Action(nameof(Import))) + "\">" +
            "<input type=\"hidden\" name=\"" + E(token.FormFieldName) + "\" value=\"" + E(token.RequestToken) + "\">" +
            "<p><label>Site code name: <input name=\"siteName\" required value=\"" + E(SiteContext.CurrentSiteName) + "\"></label></p>" +
            "<p><label>Veri grubu: <select name=\"dataset\"><option value=\"monthly\">2026 ve sonrası</option>" +
            "<option value=\"legacy\">2026 öncesi</option></select></label></p>" +
            "<p><input type=\"file\" name=\"json\" accept=\".json,application/json\" required></p>" +
            "<button name=\"apply\" value=\"false\">Ön kontrol</button> " +
            "<button name=\"apply\" value=\"true\">Aktar / Güncelle</button></form>" +
            "<p>İki JSON'u ilgili grubu seçerek ayrı ayrı aktarın. Ön kontrol veri yazmaz. Aynı JSON tekrar yüklenirse kayıtlar güncellenir.</p></body></html>",
            "text/html; charset=utf-8");
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<IActionResult> Import([FromForm] IFormFile json, [FromForm] string siteName,
        [FromForm] string dataset, [FromForm] bool apply = false)
    {
        if (!IsLocalDevelopment()) return NotFound();
        if (!ModelState.IsValid || json == null || json.Length == 0 || json.Length > 10 * 1024 * 1024 ||
            (dataset != "monthly" && dataset != "legacy"))
            return BadRequest(new { error = "Geçerli veri grubu ve en fazla 10 MB JSON dosyası seçin." });
        List<ImportRow> rows;
        try
        {
            using (var reader = new StreamReader(json.OpenReadStream(), Encoding.UTF8, true))
                rows = JsonSerializer.Deserialize<List<ImportRow>>(await reader.ReadToEndAsync(),
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        }
        catch (JsonException error)
        { return BadRequest(new { error = "JSON kökü kayıt dizisi olmalı.", detail = error.Message }); }
        if (rows == null || rows.Count == 0 || rows.Count > 10000)
            return BadRequest(new { error = "JSON 1–10000 kayıt içermeli." });
        try
        {
            lock (ImportLock)
            {
                var monthly = dataset == "monthly";
                var tableName = monthly ? FundGuideSchema.MonthlyTable : FundGuideSchema.LegacyTable;
                var report = BuildPlan(rows, Clean(siteName), tableName, monthly, out var plan);
                if (report.Errors.Count > 0) return UnprocessableEntity(report);
                if (!apply) return Ok(report);
                using (var transaction = new CMSTransactionScope())
                {
                    // Yeni satırlar JSON sırasıyla eklenir. Güncellemede ItemID korunur.
                    foreach (var row in plan)
                    {
                        var item = row.Existing ?? CustomTableItem.New(tableName);
                        item.SetValue("Year", row.Source.Year);
                        item.SetValue("FileName", row.Source.FileName);
                        item.SetValue("FileUrl", row.MediaUrl);
                        if (monthly)
                        {
                            item.SetValue("Month", row.Source.Month);
                            item.SetValue("Title", row.Source.Title);
                        }
                        else
                        {
                            item.SetValue("FundCode", row.Source.FundCode);
                            item.SetValue("FundName", row.Source.FundName);
                        }
                        if (row.Existing == null) item.Insert(); else item.Update();
                    }
                    transaction.Commit();
                }
                report.Applied = true;
                return Ok(report);
            }
        }
        catch (Exception error)
        {
            logger.LogError(error, "Fon rehberi aktarımı başarısız.");
            return StatusCode(500, new { error = "Aktarım başarısız; transaction geri alınır. Sunucu logunu kontrol edin.", detail = error.Message });
        }
    }

    private ImportReport BuildPlan(List<ImportRow> rows, string siteName, string tableName, bool monthly,
        out List<PlannedRow> plan)
    {
        plan = new List<PlannedRow>();
        var report = new ImportReport { Table = tableName, Total = rows.Count };
        var site = SiteInfoProvider.GetSiteInfo(siteName);
        if (site == null) { report.Errors.Add("Site code name bulunamadı: " + siteName); return report; }
        var table = DataClassInfoProvider.GetDataClassInfo(tableName);
        if (table == null || !table.ClassIsCustomTable)
        { report.Errors.Add("Custom table bulunamadı: " + tableName); return report; }
        var form = new FormInfo(table.ClassFormDefinition);
        var fields = new[] { "Year", "FileName", "FileUrl" }
            .Concat(monthly ? new[] { "Month", "Title" } : new[] { "FundCode", "FundName" });
        foreach (var field in fields)
            if (form.GetFormField(field) == null) report.Errors.Add("Eksik alan: " + field);
        if (report.Errors.Count > 0) return report;
        var library = MediaLibraryInfoProvider.GetMediaLibraryInfo(FundGuideSchema.LibraryCodeName, site.SiteID);
        if (library == null) { report.Errors.Add("Medya kütüphanesi bulunamadı: " + FundGuideSchema.LibraryCodeName); return report; }
        var media = MediaFileInfoProvider.GetMediaFiles().WhereEquals("FileLibraryID", library.LibraryID).ToArray()
            .Where(file => string.Equals(Parent(file.FilePath), FundGuideSchema.MediaFolder, StringComparison.OrdinalIgnoreCase))
            .GroupBy(file => Leaf(file.FilePath), StringComparer.OrdinalIgnoreCase)
            .ToDictionary(group => group.Key, group => group.ToArray(), StringComparer.OrdinalIgnoreCase);
        var existing = CustomTableItemProvider.GetItems(tableName).ToArray()
            .GroupBy(item => Key(ValidationHelper.GetInteger(item.GetValue("Year"), 0), Text(item, "FileName")), StringComparer.OrdinalIgnoreCase)
            .ToDictionary(group => group.Key, group => group.ToArray(), StringComparer.OrdinalIgnoreCase);
        var keys = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        for (var index = 0; index < rows.Count; index++)
        {
            var row = rows[index];
            var prefix = "Satır " + (index + 1) + ": ";
            if (row == null) { report.Errors.Add(prefix + "null kayıt."); continue; }
            row.FileName = Clean(row.FileName); row.Title = Clean(row.Title);
            row.FundCode = Clean(row.FundCode); row.FundName = Clean(row.FundName);
            var before = report.Errors.Count;
            if (row.Year < 1900 || row.Year > 9999 || (monthly ? row.Year < 2026 : row.Year >= 2026))
                report.Errors.Add(prefix + "Year seçilen veri grubuna uygun değil.");
            if (monthly && (row.Month < 1 || row.Month > 12 || row.Title.Length == 0 || row.Title.Length > 1000))
                report.Errors.Add(prefix + "Month 1–12 ve Title 1–1000 karakter olmalı.");
            if (!monthly && (row.FundCode.Length == 0 || row.FundCode.Length > 100 || row.FundName.Length == 0 || row.FundName.Length > 2000))
                report.Errors.Add(prefix + "FundCode 1–100 ve FundName 1–2000 karakter olmalı.");
            if (row.FileName.Length > 50 || !Regex.IsMatch(row.FileName, @"^[a-zA-Z0-9][a-zA-Z0-9._-]*\.(pdf|docx?|xlsx?|pptx?)$", RegexOptions.IgnoreCase))
                report.Errors.Add(prefix + "FileName uzantı dahil en fazla 50 ASCII karakter ve desteklenen belge uzantısında olmalı.");
            var key = Key(row.Year, row.FileName);
            if (!keys.Add(key)) report.Errors.Add(prefix + "JSON'da tekrarlanan kayıt.");
            existing.TryGetValue(key, out var matches);
            if (matches != null && matches.Length != 1) report.Errors.Add(prefix + "Tabloda aynı anahtarlı birden fazla kayıt var.");
            string mediaUrl = null;
            if (!media.TryGetValue(row.FileName, out var files) || files.Length != 1)
                report.Errors.Add(prefix + "Tekil medya bulunamadı: FundGuide/" + row.FileName);
            else
            {
                mediaUrl = MediaFileURLProvider.GetMediaFileUrl(files[0].FileGUID, Leaf(files[0].FilePath));
                // Ortama ait domaini tabloya kaydetme; GUID içeren kalıcı link staging ile korunur.
                if (Uri.TryCreate(mediaUrl, UriKind.Absolute, out var uri) && (uri.Scheme == "http" || uri.Scheme == "https"))
                    mediaUrl = uri.PathAndQuery + uri.Fragment;
                if (string.IsNullOrWhiteSpace(mediaUrl) || mediaUrl.Length > 2000 ||
                    !(mediaUrl.StartsWith("~/", StringComparison.Ordinal) ||
                    (mediaUrl.StartsWith("/", StringComparison.Ordinal) && !mediaUrl.StartsWith("//", StringComparison.Ordinal))))
                    report.Errors.Add(prefix + "Geçerli site içi kalıcı medya URL'si üretilemedi.");
            }
            if (report.Errors.Count == before)
                plan.Add(new PlannedRow { Source = row, Existing = matches == null ? null : matches[0], MediaUrl = mediaUrl });
        }
        report.ToInsert = plan.Count(row => row.Existing == null);
        report.ToUpdate = plan.Count - report.ToInsert;
        report.Samples = plan.Take(5).Select(row => new ImportSample
        { Year = row.Source.Year, FileName = row.Source.FileName, FileUrl = row.MediaUrl }).ToList();
        return report;
    }
    private bool IsLocalDevelopment()
    {
        var ip = HttpContext.Connection.RemoteIpAddress;
        if (ip != null && ip.IsIPv4MappedToIPv6) ip = ip.MapToIPv4();
        return environment.IsDevelopment() && ip != null && IPAddress.IsLoopback(ip);
    }
    private static string Key(int year, string fileName) => year + "|" + Clean(fileName).ToLowerInvariant();
    private static string Text(CustomTableItem item, string field) => ValidationHelper.GetString(item.GetValue(field), string.Empty);
    private static string Clean(string value) => (value ?? string.Empty).Trim().Normalize(NormalizationForm.FormC);
    private static string E(string value) => WebUtility.HtmlEncode(value ?? string.Empty);
    private static string NormalizePath(string value) => (value ?? string.Empty).Replace('\\', '/').Trim('/');
    private static string Leaf(string path) { var value = NormalizePath(path); return value.Substring(value.LastIndexOf('/') + 1); }
    private static string Parent(string path) { var value = NormalizePath(path); var slash = value.LastIndexOf('/'); return slash < 0 ? "" : value.Substring(0, slash); }
    public sealed class ImportRow
    {
        public int Year { get; set; }
        public int Month { get; set; }
        public string Title { get; set; }
        public string FundCode { get; set; }
        public string FundName { get; set; }
        public string FileName { get; set; }
    }
    private sealed class PlannedRow
    {
        public ImportRow Source { get; set; }
        public CustomTableItem Existing { get; set; }
        public string MediaUrl { get; set; }
    }
    public sealed class ImportReport
    {
        public string Table { get; set; }
        public int Total { get; set; }
        public int ToInsert { get; set; }
        public int ToUpdate { get; set; }
        public bool Applied { get; set; }
        public List<string> Errors { get; set; } = new List<string>();
        public List<ImportSample> Samples { get; set; } = new List<ImportSample>();
    }
    public sealed class ImportSample
    {
        public int Year { get; set; }
        public string FileName { get; set; }
        public string FileUrl { get; set; }
    }
}
