#nullable disable
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using CMS.CustomTables;
using CMS.DataEngine;
using CMS.FormEngine;
using CMS.MediaLibrary;
using CMS.SiteProvider;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace YkbYapikredi.Web.Controllers
{
    // Copy to the REAL Kentico 13 ASP.NET Core project's Web/Controllers folder.
    // GET /local-tools/horeca-import opens the upload form; GET never writes data.
    [Route("local-tools/horeca-import")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public sealed class HorecaImportController : Controller
    {
        // Class code name, not SQL table name. Change these three constants if needed.
        private const string TableClassName = "YkbYapikredi.HorecaRestaurants";
        private const string LibraryCodeName = "YapikrediMedia";
        private const string Folder = "Horeca";
        private static readonly object ImportLock = new object();
        private readonly IWebHostEnvironment environment;
        private readonly IAntiforgery antiforgery;
        private readonly ILogger<HorecaImportController> logger;

        private static readonly string[] Cities = (
            "Adana|Adıyaman|Afyonkarahisar|Ağrı|Amasya|Ankara|Antalya|Artvin|Aydın|Balıkesir|" +
            "Bilecik|Bingöl|Bitlis|Bolu|Burdur|Bursa|Çanakkale|Çankırı|Çorum|Denizli|Diyarbakır|Edirne|" +
            "Elazığ|Erzincan|Erzurum|Eskişehir|Gaziantep|Giresun|Gümüşhane|Hakkari|Hatay|Isparta|Mersin|" +
            "İstanbul|İzmir|Kars|Kastamonu|Kayseri|Kırklareli|Kırşehir|Kocaeli|Konya|Kütahya|Malatya|" +
            "Manisa|Kahramanmaraş|Mardin|Muğla|Muş|Nevşehir|Niğde|Ordu|Rize|Sakarya|Samsun|Siirt|Sinop|" +
            "Sivas|Tekirdağ|Tokat|Trabzon|Tunceli|Şanlıurfa|Uşak|Van|Yozgat|Zonguldak|Aksaray|Bayburt|" +
            "Karaman|Kırıkkale|Batman|Şırnak|Bartın|Ardahan|Iğdır|Yalova|Karabük|Kilis|Osmaniye|Düzce").Split('|');

        public HorecaImportController(IWebHostEnvironment environment, IAntiforgery antiforgery,
            ILogger<HorecaImportController> logger)
        {
            this.environment = environment;
            this.antiforgery = antiforgery;
            this.logger = logger;
        }

        [HttpGet]
        public IActionResult Index()
        {
            if (!IsLocalDevelopment()) return NotFound();
            var tokens = antiforgery.GetAndStoreTokens(HttpContext);
            var action = Url.Action(nameof(Import)) ?? "/local-tools/horeca-import";
            var html = "<!doctype html><html lang=\"tr\"><meta charset=\"utf-8\">" +
                "<title>Horeca aktarımı</title><body><h1>Horeca restoran aktarımı</h1>" +
                "<p>Tablo: " + Encode(TableClassName) + " · Medya: " + Encode(LibraryCodeName + "/" + Folder) + "</p>" +
                "<form method=\"post\" enctype=\"multipart/form-data\" action=\"" + Encode(action) + "\">" +
                "<input type=\"hidden\" name=\"" + Encode(tokens.FormFieldName) + "\" value=\"" + Encode(tokens.RequestToken) + "\">" +
                "<p><label>Site code name: <input name=\"siteName\" required value=\"" + Encode(SiteContext.CurrentSiteName) + "\"></label></p>" +
                "<p><input type=\"file\" name=\"json\" accept=\".json,application/json\" required></p>" +
                "<button name=\"apply\" value=\"false\">Ön kontrol (kayıt eklemez)</button> " +
                "<button name=\"apply\" value=\"true\">Aktar</button></form>" +
                "<p>Ön kontrol sonrası geri dönüp aynı dosyayla Aktar'a basın. Her aktarım yeni kayıtlar ekler.</p>" +
                "</body></html>";
            return Content(html, "text/html; charset=utf-8");
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [RequestSizeLimit(10 * 1024 * 1024)]
        public async Task<IActionResult> Import([FromForm] IFormFile json, [FromForm] string siteName,
            [FromForm] bool apply = false)
        {
            if (!IsLocalDevelopment()) return NotFound();
            if (!ModelState.IsValid || json == null || json.Length == 0 || json.Length > 10 * 1024 * 1024)
                return BadRequest(new { hata = "Geçerli bir restoranlar.json dosyası seçin (en fazla 10 MB)." });
            List<RestaurantRow> rows;
            try
            {
                using (var reader = new StreamReader(json.OpenReadStream(), Encoding.UTF8, true))
                {
                    rows = JsonSerializer.Deserialize<List<RestaurantRow>>(await reader.ReadToEndAsync(),
                        new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                }
            }
            catch (JsonException error)
            {
                return BadRequest(new { hata = "JSON okunamadı. Kök değer bir dizi olmalı.", detay = error.Message });
            }
            if (rows == null || rows.Count == 0 || rows.Count > 10000)
                return BadRequest(new { hata = "JSON 1–10000 arası kayıt içermeli." });

            try
            {
                // Kentico transaction context stays on this thread: no await inside this lock/scope.
                lock (ImportLock)
                {
                    var report = BuildPlan(rows, Clean(siteName), out var plan);
                    if (report.Hatalar.Count > 0)
                        return UnprocessableEntity(report);
                    if (!apply) return Ok(report);

                    using (var transaction = new CMSTransactionScope())
                    {
                        foreach (var row in plan)
                        {
                            var item = CustomTableItem.New(TableClassName);
                            item.SetValue("RestaurantName", row.Source.RestaurantName);
                            item.SetValue("Address", Db(row.Source.Address));
                            item.SetValue("City", Db(row.Source.City));
                            item.SetValue("PhoneNumber", Db(row.Source.PhoneNumber));
                            item.SetValue("Website", Db(row.Source.Website));
                            item.SetValue("BranchName", Db(row.Source.BranchName));
                            // Standard CMS "Media selection" stores a link, not a raw GUID.
                            item.SetValue("Media", Db(row.MediaUrl));
                            item.Insert();
                        }
                        transaction.Commit();
                    }
                    report.Eklenen = plan.Count;
                    report.Durum = "Tamamlandı";
                    return Ok(report);
                }
            }
            catch (Exception error)
            {
                logger.LogError(error, "Horeca aktarımı başarısız: {TableClassName}", TableClassName);
                return StatusCode(500, new { hata = "Aktarım tamamlanamadı; açık işlemdeki eklemeler geri alınır. Sunucu logunu kontrol edin.", detay = error.Message });
            }
        }

        private ImportReport BuildPlan(List<RestaurantRow> rows, string siteName, out List<PlannedRow> plan)
        {
            plan = new List<PlannedRow>();
            var report = new ImportReport { Toplam = rows.Count, Tablo = TableClassName, Site = siteName };
            var site = SiteInfoProvider.GetSiteInfo(siteName);
            if (site == null) { report.Hatalar.Add("Site code name bulunamadı: " + siteName); return report; }
            var table = DataClassInfoProvider.GetDataClassInfo(TableClassName);
            if (table == null || !table.ClassIsCustomTable)
            { report.Hatalar.Add("Custom table bulunamadı: " + TableClassName); return report; }
            var form = new FormInfo(table.ClassFormDefinition);
            foreach (var field in new[] { "RestaurantName", "Address", "City", "PhoneNumber", "Website", "BranchName", "Media" })
                if (form.GetFormField(field) == null) report.Hatalar.Add("Custom table alanı eksik: " + field);
            if (report.Hatalar.Count > 0) return report;

            var library = MediaLibraryInfoProvider.GetMediaLibraryInfo(LibraryCodeName, site.SiteID);
            if (library == null)
            { report.Hatalar.Add("Bu sitede medya kütüphanesi bulunamadı (code name): " + LibraryCodeName); return report; }
            // FilePath is relative to the library: Horeca/logo.webp, NOT YapikrediMedia/Horeca/logo.webp.
            var media = MediaFileInfoProvider.GetMediaFiles().WhereEquals("FileLibraryID", library.LibraryID)
                .ToArray().Where(file => string.Equals(ParentPath(file.FilePath), Folder, StringComparison.OrdinalIgnoreCase))
                .GroupBy(file => LeafPath(file.FilePath), StringComparer.OrdinalIgnoreCase)
                .ToDictionary(group => group.Key, group => group.ToArray(), StringComparer.OrdinalIgnoreCase);
            var cityComparer = StringComparer.Create(CultureInfo.GetCultureInfo("tr-TR"), true);

            for (var i = 0; i < rows.Count; i++)
            {
                var row = rows[i];
                var label = "Satır " + (i + 1) + ": ";
                if (row == null) { report.Hatalar.Add(label + "null kayıt."); continue; }
                row.ImageFileName = Clean(row.ImageFileName);
                row.RestaurantName = Clean(row.RestaurantName);
                row.Address = Clean(row.Address);
                row.City = Clean(row.City);
                row.PhoneNumber = Clean(row.PhoneNumber);
                row.Website = Clean(row.Website);
                row.BranchName = Clean(row.BranchName);
                var before = report.Hatalar.Count;
                if (row.RestaurantName.Length == 0) report.Hatalar.Add(label + "restoranAdi boş.");
                CheckLength(report, label, "restoranAdi", row.RestaurantName, 250);
                CheckLength(report, label, "gorselAdi", row.ImageFileName, 50);
                CheckLength(report, label, "telefonNumarasi", row.PhoneNumber, 250);
                CheckLength(report, label, "websitesi", row.Website, 1000);
                CheckLength(report, label, "subeAdi", row.BranchName, 250);
                if (row.City.Length > 0)
                {
                    var city = Cities.FirstOrDefault(value => cityComparer.Equals(value, row.City));
                    if (city == null) report.Hatalar.Add(label + "Geçersiz il: " + row.City);
                    else row.City = city;
                }
                else report.Uyarilar.Add(label + "İl boş bırakılacak.");
                if (row.Address.Length == 0) report.Uyarilar.Add(label + "Açık adres yok.");

                string mediaUrl = null;
                if (row.ImageFileName.Length == 0) report.Uyarilar.Add(label + "Görsel yok; Media boş kalacak.");
                else if (row.ImageFileName.IndexOfAny(new[] { '/', '\\' }) >= 0)
                    report.Hatalar.Add(label + "gorselAdi yalnızca dosya adı olmalı.");
                else if (!media.TryGetValue(row.ImageFileName, out var matches))
                    report.Hatalar.Add(label + "Medya bulunamadı: " + LibraryCodeName + "/" + Folder + "/" + row.ImageFileName);
                else if (matches.Length != 1)
                    report.Hatalar.Add(label + "Birden fazla medya eşleşmesi: " + row.ImageFileName);
                else
                {
                    var file = matches[0];
                    mediaUrl = MediaFileURLProvider.GetMediaFileUrl(file.FileGUID, LeafPath(file.FilePath));
                    if (string.IsNullOrWhiteSpace(mediaUrl)) report.Hatalar.Add(label + "Medya URL'si üretilemedi.");
                    CheckLength(report, label, "Media", mediaUrl ?? "", 1000);
                }
                if (report.Hatalar.Count != before) continue;
                plan.Add(new PlannedRow { Source = row, MediaUrl = mediaUrl });
            }
            report.Eklenecek = plan.Count;
            report.Ornekler = plan.Take(10).Select(row => new ImportSample
            {
                RestaurantName = row.Source.RestaurantName, BranchName = row.Source.BranchName,
                City = row.Source.City, ImageFileName = row.Source.ImageFileName, Media = row.MediaUrl
            }).ToList();
            return report;
        }

        private bool IsLocalDevelopment()
        {
            var ip = HttpContext.Connection.RemoteIpAddress;
            if (ip != null && ip.IsIPv4MappedToIPv6) ip = ip.MapToIPv4();
            return environment.IsDevelopment() && ip != null && IPAddress.IsLoopback(ip);
        }
        private static void CheckLength(ImportReport report, string label, string field, string value, int limit)
        { if (value.Length > limit) report.Hatalar.Add(label + field + " " + limit + " karakteri aşıyor."); }
        private static string Clean(string value) { return (value ?? "").Trim().Normalize(NormalizationForm.FormC); }
        private static string Encode(string value) { return WebUtility.HtmlEncode(value ?? ""); }
        private static object Db(string value) { return string.IsNullOrEmpty(value) ? (object)DBNull.Value : value; }
        private static string NormalizePath(string path) { return (path ?? "").Replace('\\', '/').Trim('/'); }
        private static string LeafPath(string path) { var value = NormalizePath(path); return value.Substring(value.LastIndexOf('/') + 1); }
        private static string ParentPath(string path)
        { var value = NormalizePath(path); var slash = value.LastIndexOf('/'); return slash < 0 ? "" : value.Substring(0, slash); }
        public sealed class RestaurantRow
        {
            [JsonPropertyName("gorselAdi")] public string ImageFileName { get; set; }
            [JsonPropertyName("restoranAdi")] public string RestaurantName { get; set; }
            [JsonPropertyName("acikAdres")] public string Address { get; set; }
            [JsonPropertyName("il")] public string City { get; set; }
            [JsonPropertyName("telefonNumarasi")] public string PhoneNumber { get; set; }
            [JsonPropertyName("websitesi")] public string Website { get; set; }
            [JsonPropertyName("subeAdi")] public string BranchName { get; set; }
        }
        private sealed class PlannedRow
        {
            public RestaurantRow Source { get; set; }
            public string MediaUrl { get; set; }
        }
        public sealed class ImportReport
        {
            public string Durum { get; set; } = "Ön kontrol";
            public string Tablo { get; set; }
            public string Site { get; set; }
            public int Toplam { get; set; }
            public int Eklenecek { get; set; }
            public int Eklenen { get; set; }
            public List<string> Hatalar { get; set; } = new List<string>();
            public List<string> Uyarilar { get; set; } = new List<string>();
            public List<ImportSample> Ornekler { get; set; } = new List<ImportSample>();
        }
        public sealed class ImportSample
        {
            public string RestaurantName { get; set; }
            public string BranchName { get; set; }
            public string City { get; set; }
            public string ImageFileName { get; set; }
            public string Media { get; set; }
        }
    }
}
