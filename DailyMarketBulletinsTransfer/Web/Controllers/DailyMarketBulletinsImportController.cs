#nullable disable
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Net;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using CMS.CustomTables;
using CMS.DataEngine;
using CMS.FormEngine;
using CMS.Helpers;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace YkbYapikredi.Web.Controllers
{
    // Copy this standalone file into the REAL Kentico 13 ASP.NET Core Web project.
    // The generated DailyAllMarketBullettinsItem class does not need to be changed.
    // API: https://docs.kentico.com/13api/content-management/custom-table-data
    // GET /local-tools/daily-market-bulletins-import shows the form; GET never writes.
    [Route("local-tools/daily-market-bulletins-import")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public sealed class DailyMarketBulletinsImportController : Controller
    {
        private const string TableClassName = "YkbYapikredi.DailyAllMarketBullettins";
        private const int MaxUploadBytes = 20 * 1024 * 1024;
        private const int MaxRecords = 20000;

        // CONFIGURE THESE TWO VALUES TOGETHER BEFORE IMPORTING.
        // Empty: try WebRootPath + the media URL's application-relative part, and
        // ContentRootPath + the same part. Only ONE existing directory is accepted.
        // GET displays the actual roots, candidate directories, and resolution error.
        // Example: C:\inetpub\Kentico\YkbYapikredi\media\YapikrediMedia\GunlukTumPiyasaBultenleri
        // For a separate CMS/IIS application or shared storage, put its FULL physical
        // path here, e.g. @"D:\KenticoCMS\YkbYapikredi\media\YapikrediMedia\GunlukTumPiyasaBultenleri".
        // This path is read on the machine hosting THIS controller; a public URL
        // does not reveal the disk location or make remote files locally readable.
        private const string MediaPhysicalFolder = "";
        // Public URL that actually serves the SAME directory's files.
        // Matches the supplied public URL: /YkbYapikredi/media/YapikrediMedia/GunlukTumPiyasaBultenleri/...
        // Site prefix YkbYapikredi, library YapikrediMedia, folder GunlukTumPiyasaBultenleri.
        // Set the actual physical path above if automatic candidates do not match;
        // a library's code name alone does not establish its physical location.
        // If the library has a different public path, change this value as well.
        // A leading "/" preserves the exact supplied public path, including when
        // this app has a PathBase. "~/" can also be configured for app-relative URLs.
        // For automatic disk candidates, a root-relative URL must be inside this
        // app's PathBase. For another CMS application, set MediaPhysicalFolder.
        // Pdf stores this direct URL; no CMS_MediaFile entry or media upload is used.
        // The host must already serve PDF/DOCX from this directory (IIS/static files).
        private const string MediaVirtualFolder = "/YkbYapikredi/media/YapikrediMedia/GunlukTumPiyasaBultenleri";

        private static readonly DateTime RangeStart = new DateTime(1964, 1, 1);
        private static readonly DateTime RangeEnd = new DateTime(2028, 12, 31);
        private static readonly Regex SafeName = new Regex(@"\A[A-Za-z0-9][A-Za-z0-9._-]{0,49}\z", RegexOptions.CultureInvariant);
        private static readonly Regex Sha256Pattern = new Regex(@"\A[0-9a-fA-F]{64}\z", RegexOptions.CultureInvariant);
        // A single local importing process is intentional. Do not run imports on
        // several application instances at once: this lock is process-local.
        private static readonly object ImportLock = new object();
        private readonly IWebHostEnvironment environment;
        private readonly IAntiforgery antiforgery;
        private readonly ILogger<DailyMarketBulletinsImportController> logger;

        public DailyMarketBulletinsImportController(IWebHostEnvironment environment,
            IAntiforgery antiforgery, ILogger<DailyMarketBulletinsImportController> logger)
        {
            this.environment = environment;
            this.antiforgery = antiforgery;
            this.logger = logger;
        }

        [HttpGet]
        public IActionResult Index()
        {
            if (!IsLocalDevelopment()) return NotFound();
            var token = antiforgery.GetAndStoreTokens(HttpContext);
            var action = Url.Action(nameof(Import)) ?? "/local-tools/daily-market-bulletins-import";
            var paths = InspectMediaFolder();
            var html = "<!doctype html><html lang=\"tr\"><head><meta charset=\"utf-8\">" +
                "<title>Piyasa bültenleri aktarımı</title></head><body>" +
                "<h1>Günlük piyasa bültenleri aktarımı</h1>" +
                "<p>Tablo: <code>" + Encode(TableClassName) + "</code></p>" +
                "<p>Medya URL klasörü: <code>" + Encode(MediaVirtualFolder) + "</code></p>" +
                MediaPathHtml(paths) +
                "<p>İndirilen PDF/DOCX dosyalarını yapılandırdığınız fiziksel medya klasörüne " +
                "önceden kopyalayın. JSON içindeki dosya adlarını değiştirmeyin.</p>" +
                "<form method=\"post\" enctype=\"multipart/form-data\" action=\"" + Encode(action) + "\">" +
                "<input type=\"hidden\" name=\"" + Encode(token.FormFieldName) + "\" value=\"" + Encode(token.RequestToken) + "\">" +
                "<p><label>Manifest JSON (en fazla 20 MB): <input type=\"file\" name=\"json\" accept=\".json,application/json\" required></label></p>" +
                "<p><label><input type=\"checkbox\" name=\"skipFailed\" value=\"true\">" +
                "İndirilemeyen kayıtları açıkça atla (bu kayıtlar raporda gösterilir).</label></p>" +
                "<p><button type=\"submit\" name=\"apply\" value=\"false\">Ön kontrol (veritabanına yazmaz)</button> " +
                "<button type=\"submit\" name=\"apply\" value=\"true\">Veritabanına aktar</button></p></form>" +
                "<p>Ön kontrolden sonra geri dönüp aynı JSON ile aktarın. Dosya boyutu ve SHA-256 " +
                "doğrulanır. Tarih + BulletinType + Pdf eşleşen mevcut kayıtlar yeniden eklenmez.</p>" +
                "<p>Bu geçici araç yalnızca Development ortamında, localhost bağlantısıyla açılır.</p>" +
                "</body></html>";
            return Content(html, "text/html; charset=utf-8");
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [RequestSizeLimit(MaxUploadBytes + 64 * 1024)]
        [RequestFormLimits(MultipartBodyLengthLimit = MaxUploadBytes + 64 * 1024)]
        public async Task<IActionResult> Import([FromForm] IFormFile json,
            [FromForm] bool apply = false, [FromForm] bool skipFailed = false)
        {
            if (!IsLocalDevelopment()) return NotFound();
            if (!ModelState.IsValid || json == null || json.Length == 0 || json.Length > MaxUploadBytes)
                return BadRequest(new { hata = "Geçerli bir manifest JSON seçin (en fazla 20 MB).", yolTeshisi = InspectMediaFolder() });

            Manifest manifest;
            try
            {
                using (var stream = json.OpenReadStream())
                {
                    manifest = await JsonSerializer.DeserializeAsync<Manifest>(stream,
                        new JsonSerializerOptions { PropertyNameCaseInsensitive = false, MaxDepth = 32 },
                        HttpContext.RequestAborted);
                }
            }
            catch (JsonException error)
            {
                return BadRequest(new { hata = "JSON okunamadı. schemaVersion=1 manifest nesnesi bekleniyor.", detay = error.Message, yolTeshisi = InspectMediaFolder() });
            }

            try
            {
                // No await within this lock or CMSTransactionScope: Kentico's
                // transaction context stays on the same executing thread.
                lock (ImportLock)
                {
                    var report = BuildPlan(manifest, skipFailed, out var plan);
                    if (report.Hatalar.Count > 0)
                    {
                        report.Durum = "Ön kontrol başarısız; hiçbir kayıt eklenmedi";
                        return UnprocessableEntity(report);
                    }
                    if (!apply) return Ok(report);

                    using (var transaction = new CMSTransactionScope())
                    {
                        // Re-read inside the write transaction as well. The local
                        // lock serializes all submissions to this controller.
                        var existing = LoadExistingKeys();
                        var inserted = 0;
                        foreach (var row in plan)
                        {
                            HttpContext.RequestAborted.ThrowIfCancellationRequested();
                            if (!existing.Add(row.Key))
                            {
                                report.MevcutAtlanan++;
                                continue;
                            }
                            var item = CustomTableItem.New(TableClassName);
                            item.SetValue("Date", row.Date);
                            item.SetValue("BulletinType", row.BulletinType);
                            // A standard string Media selection field can store a
                            // direct relative URL. No media DB registration needed.
                            item.SetValue("Pdf", row.MediaUrl);
                            item.Insert();
                            inserted++;
                        }
                        transaction.Commit();
                        report.Eklenen = inserted;
                    }
                    report.Durum = "Tamamlandı";
                    return Ok(report);
                }
            }
            catch (OperationCanceledException) when (HttpContext.RequestAborted.IsCancellationRequested)
            {
                return StatusCode(499, new { hata = "İstek iptal edildi. Commit edilmemiş veritabanı eklemeleri geri alınır.", yolTeshisi = InspectMediaFolder() });
            }
            catch (Exception error)
            {
                logger.LogError(error, "Piyasa bültenleri aktarımı başarısız: {TableClassName}", TableClassName);
                return StatusCode(500, new { hata = "Aktarım tamamlanamadı. Commit edilmemiş eklemeler geri alınır; sunucu logunu kontrol edin.", detay = error.Message, yolTeshisi = InspectMediaFolder() });
            }
        }

        private ImportReport BuildPlan(Manifest manifest, bool skipFailed, out List<PlannedRow> plan)
        {
            plan = new List<PlannedRow>();
            var paths = InspectMediaFolder();
            var report = new ImportReport
            {
                Tablo = TableClassName, MedyaUrlKlasoru = MediaVirtualFolder, HataliIndirmeleriAtla = skipFailed,
                YolTeshisi = paths, FizikselMedyaKlasoru = paths.SecilenFizikselKlasor
            };
            if (paths.Hata != null) report.Hatalar.Add(paths.Hata);
            if (manifest == null) { report.Hatalar.Add("Manifest boş."); return report; }
            report.Toplam = manifest.Records == null ? 0 : manifest.Records.Count;
            if (manifest.SchemaVersion != 1) report.Hatalar.Add("schemaVersion 1 olmalı.");
            if (!IsHttpUrl(manifest.SourceUrl)) report.Hatalar.Add("sourceUrl geçerli bir HTTP(S) URL olmalı.");
            if (manifest.StartDate != "1964-01-01" || manifest.EndDate != "2028-12-31")
                report.Hatalar.Add("Manifest tarih aralığı 1964-01-01 / 2028-12-31 olmalı.");
            if (!manifest.ListingComplete) report.Hatalar.Add("Listeleme tamamlanmamış (listingComplete=false). İndirme scriptini yeniden çalıştırın.");
            if (manifest.ListingErrors == null || manifest.ListingErrors.Count != 0)
                report.Hatalar.Add("listingErrors boş bir dizi olmalı. Listeleme hataları varken aktarım yapılamaz.");
            if (manifest.Records == null || manifest.Records.Count == 0 || manifest.Records.Count > MaxRecords)
                report.Hatalar.Add("records 1–20000 kayıt içermeli.");
            if (manifest.Records == null || manifest.TotalRecords != manifest.Records.Count)
                report.Hatalar.Add("totalRecords, records dizisinin uzunluğuyla aynı olmalı.");
            if (report.Hatalar.Count > 0) return report;

            var table = DataClassInfoProvider.GetDataClassInfo(TableClassName);
            if (table == null || !table.ClassIsCustomTable)
            { report.Hatalar.Add("Custom table bulunamadı: " + TableClassName); return report; }
            var form = new FormInfo(table.ClassFormDefinition);
            foreach (var name in new[] { "Date", "BulletinType", "Pdf" })
                if (form.GetFormField(name) == null)
                    report.Hatalar.Add("Custom table alanı eksik: " + name + ". Gönderdiğiniz generated sınıftaki alan adları kullanılmalıdır.");
            if (report.Hatalar.Count > 0) return report;

            var folder = paths.SecilenFizikselKlasor;

            var existingKeys = LoadExistingKeys();
            var inputKeys = new Dictionary<string, PlannedRow>(StringComparer.Ordinal);
            var fileMetadata = new Dictionary<string, ManifestRecord>(StringComparer.OrdinalIgnoreCase);
            var verifiedFiles = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            for (var index = 0; index < manifest.Records.Count; index++)
            {
                HttpContext.RequestAborted.ThrowIfCancellationRequested();
                var row = manifest.Records[index];
                var label = "Kayıt " + (index + 1).ToString(CultureInfo.InvariantCulture) + ": ";
                if (row == null) { report.Hatalar.Add(label + "null kayıt."); continue; }
                var before = report.Hatalar.Count;
                if (!DateTime.TryParseExact(row.Date, "yyyy-MM-dd", CultureInfo.InvariantCulture,
                    DateTimeStyles.None, out var date) || date < RangeStart || date > RangeEnd)
                    report.Hatalar.Add(label + "date geçersiz veya 1964–2028 aralığı dışında.");
                var bulletinType = Clean(row.BulletinType);
                if (bulletinType.Length == 0 || bulletinType.Any(char.IsControl))
                    report.Hatalar.Add(label + "bulletinType boş olamaz ve kontrol karakteri içeremez.");
                CheckFieldLength(report, label, form.GetFormField("BulletinType"), bulletinType);
                if (!IsHttpUrl(row.SourceUrl)) report.Hatalar.Add(label + "sourceUrl geçersiz.");
                if (row.SourcePage < 1) report.Hatalar.Add(label + "sourcePage en az 1 olmalı.");

                if (row.Status == "failed")
                {
                    report.IndirmeHatasi++;
                    report.Indirilemeyenler.Add(new FailedSample
                    {
                        Sira = index + 1, Tarih = row.Date, BultenTipi = row.BulletinType,
                        KaynakUrl = row.SourceUrl, DosyaAdi = row.FileName, Hata = row.Error
                    });
                    if (!skipFailed) report.Hatalar.Add(label + "indirme başarısız: " + (row.Error ?? "detay yok"));
                    else report.AtlananIndirmeHatasi++;
                    continue;
                }
                if (row.Status != "downloaded")
                { report.Hatalar.Add(label + "status downloaded veya failed olmalı."); continue; }
                report.Indirilmis++;

                var fileName = row.FileName ?? "";
                if (!IsSafeFileName(fileName)) report.Hatalar.Add(label + "fileName en fazla 50 ASCII karakterli, yalnızca dosya adı ve .pdf/.docx uzantılı olmalı.");
                if (!Sha256Pattern.IsMatch(row.Sha256 ?? "")) report.Hatalar.Add(label + "downloaded kaydının sha256 değeri 64 hexadecimal karakter olmalı.");
                if (!row.ByteLength.HasValue || row.ByteLength.Value <= 0)
                    report.Hatalar.Add(label + "downloaded kaydının byteLength değeri pozitif olmalı.");
                if (!string.IsNullOrEmpty(row.Error)) report.Hatalar.Add(label + "downloaded kaydının error alanı boş/null olmalı.");
                var mediaUrl = MediaVirtualFolder.TrimEnd('/') + "/" + Uri.EscapeDataString(fileName);
                CheckFieldLength(report, label, form.GetFormField("Pdf"), mediaUrl);
                if (report.Hatalar.Count != before) continue;

                if (fileMetadata.TryGetValue(fileName, out var previousFile))
                {
                    if (!string.Equals(previousFile.FileName, fileName, StringComparison.Ordinal))
                    { report.Hatalar.Add(label + "dosya adları yalnızca büyük/küçük harfle ayrılamaz: " + fileName); continue; }
                    if (!string.Equals(previousFile.Sha256, row.Sha256, StringComparison.OrdinalIgnoreCase) || previousFile.ByteLength != row.ByteLength)
                    { report.Hatalar.Add(label + "aynı dosya adı için çelişen SHA-256/boyut: " + fileName); continue; }
                }
                fileMetadata[fileName] = row;
                if (!verifiedFiles.Contains(fileName))
                {
                    var path = Path.GetFullPath(Path.Combine(folder, fileName));
                    // Filename-only validation above already excludes path traversal;
                    // check the resolved parent directory as an additional guard.
                    if (!string.Equals(NormalizePhysicalPath(Path.GetDirectoryName(path)), folder, PathComparison))
                    { report.Hatalar.Add(label + "dosya medya klasörü dışında."); continue; }
                    if (!VerifyFile(path, PublicMediaUrl(mediaUrl), row, out var fileError))
                    { report.Hatalar.Add(label + fileError); continue; }
                    verifiedFiles.Add(fileName);
                }

                var planned = new PlannedRow
                {
                    Date = date.Date, BulletinType = bulletinType, MediaUrl = mediaUrl,
                    FileName = fileName, Sha256 = row.Sha256, ByteLength = row.ByteLength.Value,
                    Key = Identity(date, bulletinType, mediaUrl)
                };
                if (inputKeys.TryGetValue(planned.Key, out var previous))
                {
                    if (!string.Equals(previous.Sha256, planned.Sha256, StringComparison.OrdinalIgnoreCase) || previous.ByteLength != planned.ByteLength)
                        report.Hatalar.Add(label + "JSON içinde çelişen mükerrer kayıt: " + fileName);
                    else report.JsonMukerrerAtlanan++;
                    continue;
                }
                inputKeys.Add(planned.Key, planned);
                if (existingKeys.Contains(planned.Key)) { report.MevcutAtlanan++; continue; }
                plan.Add(planned);
            }
            report.DogrulananDosya = verifiedFiles.Count;
            report.Eklenecek = plan.Count;
            report.Ornekler = plan.Take(10).Select(row => new ImportSample
            { Tarih = row.Date.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture), BultenTipi = row.BulletinType, DosyaAdi = row.FileName, Pdf = row.MediaUrl }).ToList();
            if (report.AtlananIndirmeHatasi > 0)
                report.Uyarilar.Add(report.AtlananIndirmeHatasi + " başarısız indirme açık isteğinizle atlanacak; bu kayıtlar veritabanına eklenmez.");
            if (report.JsonMukerrerAtlanan > 0)
                report.Uyarilar.Add(report.JsonMukerrerAtlanan + " aynı JSON kaydı tekilleştirildi.");
            return report;
        }

        private HashSet<string> LoadExistingKeys()
        {
            var keys = new HashSet<string>(StringComparer.Ordinal);
            foreach (var item in CustomTableItemProvider.GetItems(TableClassName).Columns("Date", "BulletinType", "Pdf"))
            {
                var date = ValidationHelper.GetDateTime(item.GetValue("Date"), DateTime.MinValue);
                keys.Add(Identity(date, Clean(ValidationHelper.GetString(item.GetValue("BulletinType"), "")),
                    ValidationHelper.GetString(item.GetValue("Pdf"), "")));
            }
            return keys;
        }

        private static bool VerifyFile(string path, string publicUrl, ManifestRecord row, out string error)
        {
            error = null;
            var location = path + " | URL: " + publicUrl;
            try
            {
                if (!System.IO.File.Exists(path))
                {
                    error = "Dosya bulunamadı: " + location;
                    var nested = Path.Combine(Path.GetDirectoryName(path), "reports", row.FileName);
                    if (System.IO.File.Exists(nested))
                        error += " Dosya reports alt klasöründe bulundu: " + nested +
                            ". PDF/DOCX dosyalarını yapılandırılan medya klasörüne doğrudan kopyalayın; URL ve dosya konumu eşleşmeli.";
                    return false;
                }
                if ((System.IO.File.GetAttributes(path) & FileAttributes.ReparsePoint) != 0)
                { error = "Dosya sembolik bağlantı/junction olamaz: " + location; return false; }
                // FileShare.Read denies writes while its length/hash is checked.
                // Do not edit or replace media files while running this import.
                using (var stream = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read))
                {
                    if (stream.Length != row.ByteLength.Value)
                    { error = "Dosya boyutu JSON ile eşleşmiyor: " + location; return false; }
                    using (var sha = SHA256.Create())
                    {
                        var actual = BitConverter.ToString(sha.ComputeHash(stream)).Replace("-", "").ToLowerInvariant();
                        if (!string.Equals(actual, row.Sha256, StringComparison.OrdinalIgnoreCase))
                        { error = "SHA-256 eşleşmiyor: " + location; return false; }
                    }
                }
                return true;
            }
            catch (Exception exception) when (exception is IOException || exception is UnauthorizedAccessException)
            { error = "Dosya okunamadı: " + location + " (" + exception.Message + ")"; return false; }
        }

        private MediaPathDiagnostics InspectMediaFolder()
        {
            var paths = new MediaPathDiagnostics
            {
                ContentRootPath = environment.ContentRootPath, WebRootPath = environment.WebRootPath,
                PathBase = HttpContext.Request.PathBase.Value ?? "", MediaPhysicalFolderAyari = MediaPhysicalFolder,
                PublicUrlKlasoru = PublicMediaUrl(MediaVirtualFolder)
            };
            try
            {
                var appRelative = MediaVirtualFolder.StartsWith("~/", StringComparison.Ordinal);
                if ((!appRelative && (!MediaVirtualFolder.StartsWith("/", StringComparison.Ordinal) || MediaVirtualFolder.StartsWith("//", StringComparison.Ordinal))) ||
                    MediaVirtualFolder.Contains("..") || MediaVirtualFolder.Any(char.IsControl) ||
                    MediaVirtualFolder.IndexOfAny(new[] { '\\', '?', '#', ':' }) >= 0)
                    throw new ArgumentException("MediaVirtualFolder / veya ~/ ile başlayan, sorgusuz bir URL klasörü olmalı.");
                if (!string.IsNullOrWhiteSpace(MediaPhysicalFolder))
                {
                    if (!Path.IsPathFullyQualified(MediaPhysicalFolder))
                        throw new ArgumentException("MediaPhysicalFolder tam fiziksel disk/UNC yolu olmalı.");
                    AddFolderCandidate(paths, "MediaPhysicalFolder (açık ayar)", MediaPhysicalFolder);
                    var configured = paths.Adaylar[0];
                    if (configured.Exists) paths.SecilenFizikselKlasor = configured.FizikselYol;
                    else paths.Hata = "MediaPhysicalFolder ile belirtilen klasör bulunamadı veya erişilemiyor: " + configured.FizikselYol;
                    return paths;
                }

                var relative = appRelative ? MediaVirtualFolder.Substring(2) : MediaVirtualFolder.Substring(1);
                var pathBase = paths.PathBase.TrimEnd('/');
                if (!appRelative && pathBase.Length > 0)
                {
                    if (string.Equals(MediaVirtualFolder, pathBase, StringComparison.OrdinalIgnoreCase)) relative = "";
                    else if (MediaVirtualFolder.StartsWith(pathBase + "/", StringComparison.OrdinalIgnoreCase))
                        relative = MediaVirtualFolder.Substring(pathBase.Length + 1);
                    else
                    {
                        paths.Hata = "Medya URL'si bu uygulamanın PathBase yolunun dışında: " + paths.PublicUrlKlasoru +
                            " (PathBase: " + paths.PathBase + "). Ayrı CMS/IIS uygulamasındaki dosyalara erişmek için " +
                            "MediaPhysicalFolder sabitine controller'ın çalıştığı sunucudan erişilen tam fiziksel klasör yolunu yazın.";
                        return paths;
                    }
                }
                relative = relative.Replace('/', Path.DirectorySeparatorChar);
                if (!string.IsNullOrWhiteSpace(environment.WebRootPath))
                {
                    if (!Path.IsPathFullyQualified(environment.WebRootPath)) throw new ArgumentException("WebRootPath tam fiziksel yol değil.");
                    AddFolderCandidate(paths, "WebRootPath + URL yolu", Path.Combine(environment.WebRootPath, relative));
                }
                if (!string.IsNullOrWhiteSpace(environment.ContentRootPath))
                {
                    if (!Path.IsPathFullyQualified(environment.ContentRootPath)) throw new ArgumentException("ContentRootPath tam fiziksel yol değil.");
                    AddFolderCandidate(paths, "ContentRootPath + URL yolu", Path.Combine(environment.ContentRootPath, relative));
                }
                var existing = paths.Adaylar.Where(candidate => candidate.Exists).ToArray();
                if (existing.Length == 1) paths.SecilenFizikselKlasor = existing[0].FizikselYol;
                else if (existing.Length > 1)
                    paths.Hata = "Birden fazla fiziksel medya klasörü adayı mevcut. Doğru klasörün tam yolunu MediaPhysicalFolder sabitine yazın; adaylar YolTeshisi.Adaylar içinde gösterilir.";
                else
                    paths.Hata = "Fiziksel medya klasörü adayların hiçbirinde bulunamadı veya erişilemiyor. YolTeshisi.Adaylar içindeki tam yolları kontrol edin. " +
                        "Dosyalar ayrı CMS/IIS uygulamasındaysa MediaPhysicalFolder sabitine controller'ın çalıştığı sunucudan erişilen tam disk/UNC klasör yolunu yazın; public URL disk yolu değildir.";
            }
            catch (Exception error) when (error is ArgumentException || error is NotSupportedException || error is PathTooLongException)
            { paths.Hata = "Medya klasörü yapılandırması geçersiz: " + error.Message; }
            return paths;
        }

        private static void AddFolderCandidate(MediaPathDiagnostics paths, string source, string path)
        {
            var normalized = NormalizePhysicalPath(path);
            var duplicate = paths.Adaylar.FirstOrDefault(candidate => string.Equals(candidate.FizikselYol, normalized, PathComparison));
            if (duplicate != null) { duplicate.Kaynak += " + " + source; return; }
            paths.Adaylar.Add(new MediaFolderCandidate { Kaynak = source, FizikselYol = normalized, Exists = Directory.Exists(normalized) });
        }

        private static string NormalizePhysicalPath(string path)
        {
            var fullPath = Path.GetFullPath(path);
            var root = Path.GetPathRoot(fullPath) ?? "";
            return fullPath.Length > root.Length ? fullPath.TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar) : fullPath;
        }

        private string PublicMediaUrl(string path)
        {
            return path.StartsWith("~/", StringComparison.Ordinal)
                ? (HttpContext.Request.PathBase.Value ?? "").TrimEnd('/') + path.Substring(1) : path;
        }

        private static string MediaPathHtml(MediaPathDiagnostics paths)
        {
            var html = new StringBuilder("<details open><summary>Fiziksel klasör kontrolü</summary><dl>");
            foreach (var pair in new[]
            {
                new[] { "ContentRootPath", paths.ContentRootPath }, new[] { "WebRootPath", paths.WebRootPath },
                new[] { "PathBase", paths.PathBase }, new[] { "Public URL klasörü", paths.PublicUrlKlasoru },
                new[] { "MediaPhysicalFolder ayarı", string.IsNullOrWhiteSpace(paths.MediaPhysicalFolderAyari) ? "boş (otomatik aday kontrolü)" : paths.MediaPhysicalFolderAyari }
            }) html.Append("<dt>").Append(Encode(pair[0])).Append("</dt><dd><code>").Append(Encode(string.IsNullOrEmpty(pair[1]) ? "(boş)" : pair[1])).Append("</code></dd>");
            html.Append("</dl><table border=\"1\" cellpadding=\"5\"><thead><tr><th>Kaynak</th><th>Tam fiziksel klasör</th><th>Mevcut</th></tr></thead><tbody>");
            foreach (var candidate in paths.Adaylar)
                html.Append("<tr><td>").Append(Encode(candidate.Kaynak)).Append("</td><td><code>").Append(Encode(candidate.FizikselYol))
                    .Append("</code></td><td>").Append(candidate.Exists ? "evet" : "hayır").Append("</td></tr>");
            html.Append("</tbody></table><p>");
            if (paths.Hata != null) html.Append("<strong>Yol hatası:</strong> ").Append(Encode(paths.Hata));
            else html.Append("Kullanılacak fiziksel klasör: <code>").Append(Encode(paths.SecilenFizikselKlasor)).Append("</code>");
            return html.Append("</p></details>").ToString();
        }

        private bool IsLocalDevelopment()
        {
            // Deliberately temporary local admin tool. Run the Kentico application
            // locally with ASPNETCORE_ENVIRONMENT=Development for this import.
            // A reverse proxy can make remote clients appear loopback; do not expose
            // a Development instance or this route through a public reverse proxy.
            var ip = HttpContext.Connection.RemoteIpAddress;
            if (ip != null && ip.IsIPv4MappedToIPv6) ip = ip.MapToIPv4();
            return environment.IsDevelopment() && ip != null && IPAddress.IsLoopback(ip);
        }

        private static bool IsSafeFileName(string name)
        {
            if (!SafeName.IsMatch(name) || name.Contains("..") || name.EndsWith(".", StringComparison.Ordinal) ||
                !string.Equals(Path.GetFileName(name), name, StringComparison.Ordinal)) return false;
            var extension = Path.GetExtension(name);
            if (!string.Equals(extension, ".pdf", StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(extension, ".docx", StringComparison.OrdinalIgnoreCase)) return false;
            var stem = name.Split('.')[0];
            return !Regex.IsMatch(stem, @"\A(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])\z", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);
        }

        private static void CheckFieldLength(ImportReport report, string label, FormFieldInfo field, string value)
        {
            // Size is read from Kentico's real table definition. 0/-1 means no
            // bounded SQL string size; do not silently truncate titles or URLs.
            if (field.Size > 0 && value.Length > field.Size)
                report.Hatalar.Add(label + field.Name + " alanı " + field.Size + " karakteri aşıyor (" + value.Length + ").");
        }
        private static string Identity(DateTime date, string bulletinType, string mediaUrl)
        {
            var normalizedUrl = Clean(mediaUrl).Replace('\\', '/');
            // Canonicalize equivalent direct application URL spellings. Absolute
            // URLs and getmedia GUID URLs are intentionally not guessed/matched.
            if (normalizedUrl.StartsWith("~/", StringComparison.Ordinal)) normalizedUrl = normalizedUrl.Substring(1);
            return date.Date.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture) + "\u001f" + Clean(bulletinType) + "\u001f" + normalizedUrl;
        }
        private static bool IsHttpUrl(string value)
        { return Uri.TryCreate(value, UriKind.Absolute, out var uri) && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps); }
        private static string Clean(string value) { return (value ?? "").Trim().Normalize(NormalizationForm.FormC); }
        private static string Encode(string value) { return WebUtility.HtmlEncode(value ?? ""); }
        private static StringComparison PathComparison { get { return Path.DirectorySeparatorChar == '\\' ? StringComparison.OrdinalIgnoreCase : StringComparison.Ordinal; } }

        public sealed class Manifest
        {
            [JsonPropertyName("schemaVersion")] public int SchemaVersion { get; set; }
            [JsonPropertyName("sourceUrl")] public string SourceUrl { get; set; }
            [JsonPropertyName("startDate")] public string StartDate { get; set; }
            [JsonPropertyName("endDate")] public string EndDate { get; set; }
            [JsonPropertyName("listingComplete")] public bool ListingComplete { get; set; }
            [JsonPropertyName("totalRecords")] public int TotalRecords { get; set; }
            [JsonPropertyName("records")] public List<ManifestRecord> Records { get; set; }
            [JsonPropertyName("listingErrors")] public List<JsonElement> ListingErrors { get; set; }
        }
        public sealed class ManifestRecord
        {
            [JsonPropertyName("date")] public string Date { get; set; }
            [JsonPropertyName("bulletinType")] public string BulletinType { get; set; }
            [JsonPropertyName("sourceUrl")] public string SourceUrl { get; set; }
            [JsonPropertyName("fileName")] public string FileName { get; set; }
            [JsonPropertyName("status")] public string Status { get; set; }
            [JsonPropertyName("sha256")] public string Sha256 { get; set; }
            [JsonPropertyName("byteLength")] public long? ByteLength { get; set; }
            [JsonPropertyName("error")] public string Error { get; set; }
            [JsonPropertyName("sourcePage")] public int SourcePage { get; set; }
        }
        private sealed class PlannedRow
        {
            public DateTime Date { get; set; }
            public string BulletinType { get; set; }
            public string MediaUrl { get; set; }
            public string FileName { get; set; }
            public string Sha256 { get; set; }
            public long ByteLength { get; set; }
            public string Key { get; set; }
        }
        public sealed class ImportReport
        {
            public string Durum { get; set; } = "Ön kontrol başarılı; veritabanına yazılmadı";
            public string Tablo { get; set; }
            public string MedyaUrlKlasoru { get; set; }
            public string FizikselMedyaKlasoru { get; set; }
            public MediaPathDiagnostics YolTeshisi { get; set; }
            public bool HataliIndirmeleriAtla { get; set; }
            public int Toplam { get; set; }
            public int Indirilmis { get; set; }
            public int IndirmeHatasi { get; set; }
            public int AtlananIndirmeHatasi { get; set; }
            public int DogrulananDosya { get; set; }
            public int JsonMukerrerAtlanan { get; set; }
            public int MevcutAtlanan { get; set; }
            public int Eklenecek { get; set; }
            public int Eklenen { get; set; }
            public List<string> Hatalar { get; set; } = new List<string>();
            public List<string> Uyarilar { get; set; } = new List<string>();
            public List<FailedSample> Indirilemeyenler { get; set; } = new List<FailedSample>();
            public List<ImportSample> Ornekler { get; set; } = new List<ImportSample>();
        }
        public sealed class MediaPathDiagnostics
        {
            public string ContentRootPath { get; set; }
            public string WebRootPath { get; set; }
            public string PathBase { get; set; }
            public string PublicUrlKlasoru { get; set; }
            public string MediaPhysicalFolderAyari { get; set; }
            public string SecilenFizikselKlasor { get; set; }
            public string Hata { get; set; }
            public List<MediaFolderCandidate> Adaylar { get; set; } = new List<MediaFolderCandidate>();
        }
        public sealed class MediaFolderCandidate
        {
            public string Kaynak { get; set; }
            public string FizikselYol { get; set; }
            public bool Exists { get; set; }
        }
        public sealed class FailedSample
        {
            public int Sira { get; set; }
            public string Tarih { get; set; }
            public string BultenTipi { get; set; }
            public string DosyaAdi { get; set; }
            public string KaynakUrl { get; set; }
            public string Hata { get; set; }
        }
        public sealed class ImportSample
        {
            public string Tarih { get; set; }
            public string BultenTipi { get; set; }
            public string DosyaAdi { get; set; }
            public string Pdf { get; set; }
        }
    }
}
