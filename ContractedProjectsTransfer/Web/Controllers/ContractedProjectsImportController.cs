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
    // Copy this standalone file into the REAL Kentico 13 ASP.NET Core web project.
    // Generated ContractedProjectsItem is left unchanged. No MediaFileInfo records,
    // file uploads to media, HTTP downloads, or file mutations are performed here.
    // API: https://docs.kentico.com/13api/content-management/custom-table-data
    [Route("local-tools/contracted-projects-import")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public sealed class ContractedProjectsImportController : Controller
    {
        private const string TableClassName = "YkbYapikredi.ContractedProjects";
        private const string SourceUrl = "https://www.yapikredi.com.tr/kredi/anlasmali-projelerimiz/";
        private const int MaxUploadBytes = 20 * 1024 * 1024;
        private const int MaxRecords = 20000;

        // CONFIGURE BOTH VALUES for the directory where YOU manually copy images.
        // Confirmed target: YapikrediMedia/AnlasmaliProjeler. Keep the public URL
        // and physical path aligned with the host where the files are copied.
        private const string MediaVirtualFolder = "/YkbYapikredi/media/YapikrediMedia/AnlasmaliProjeler";
        // Empty: use the only existing distinct candidate under WebRootPath or
        // ContentRootPath. GET shows all paths and refuses ambiguous/missing roots.
        // For separate CMS/IIS/shared storage, set the FULL path on THIS host, e.g.
        // @"D:\KenticoCMS\YkbYapikredi\media\YapikrediMedia\AnlasmaliProjeler".
        // A public URL is not a disk path. An explicit path takes precedence.
        private const string MediaPhysicalFolder = "";

        private static readonly string[] FieldNames = { "ProjectName", "FirmName", "Image", "District", "City", "WebsiteUrl", "Branch", "Phone" };
        // Image is deliberately excluded: rerunning after a failed image was
        // imported blank must not create a second project. A changed image is
        // reported for manual review; this importer never updates existing rows.
        private static readonly string[] IdentityFields = { "ProjectName", "FirmName", "City", "District", "Branch", "Phone", "WebsiteUrl" };
        private static readonly string[] ImageExtensions = { ".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif", ".bmp" };
        private static readonly Regex SafeName = new Regex(@"\A[A-Za-z0-9][A-Za-z0-9._-]{0,49}\z", RegexOptions.CultureInvariant);
        private static readonly Regex HashPattern = new Regex(@"\A[0-9a-fA-F]{64}\z", RegexOptions.CultureInvariant);
        // Serializes imports within THIS process. Run this temporary tool on one
        // application instance at a time; the custom table has no new unique index.
        private static readonly object ImportLock = new object();
        private readonly IWebHostEnvironment environment;
        private readonly IAntiforgery antiforgery;
        private readonly ILogger<ContractedProjectsImportController> logger;

        public ContractedProjectsImportController(IWebHostEnvironment environment, IAntiforgery antiforgery,
            ILogger<ContractedProjectsImportController> logger)
        { this.environment = environment; this.antiforgery = antiforgery; this.logger = logger; }

        [HttpGet]
        public IActionResult Index()
        {
            if (!IsLocalDevelopment()) return NotFound();
            var token = antiforgery.GetAndStoreTokens(HttpContext);
            var action = Url.Action(nameof(Import)) ?? "/local-tools/contracted-projects-import";
            return Content("<!doctype html><html lang=\"tr\"><head><meta charset=\"utf-8\"><title>Anlaşmalı projeler aktarımı</title></head><body>" +
                "<h1>Anlaşmalı projeler aktarımı</h1><p>Tablo: <code>" + Encode(TableClassName) + "</code></p>" +
                "<p>Görsel URL klasörü (hedefinize göre ayarlayın): <code>" + Encode(MediaVirtualFolder) + "</code></p>" +
                MediaPathHtml(InspectMediaFolder()) +
                "<p>İndirilen images klasörünün içindeki görselleri fiziksel medya klasörüne doğrudan kopyalayın. Dosya adlarını değiştirmeyin.</p>" +
                "<form method=\"post\" enctype=\"multipart/form-data\" action=\"" + Encode(action) + "\">" +
                "<input type=\"hidden\" name=\"" + Encode(token.FormFieldName) + "\" value=\"" + Encode(token.RequestToken) + "\">" +
                "<p><label>projects.json (en fazla 20 MB): <input type=\"file\" name=\"json\" accept=\".json,application/json\" required></label></p>" +
                "<p><label><input type=\"checkbox\" name=\"skipFailedImages\" value=\"true\"> İndirilemeyen görselleri boş bırak; proje kayıtlarını yine aktar.</label></p>" +
                "<p><button name=\"apply\" value=\"false\">Ön kontrol (veritabanına yazmaz)</button> " +
                "<button name=\"apply\" value=\"true\">Veritabanına aktar</button></p></form>" +
                "<p>Kaynakta görseli olmayan projeler boş Image ile aktarılabilir. Başarılı indirilmiş fakat diskte eksik/değişmiş görsel her durumda aktarımı durdurur.</p>" +
                "<p>Aynı proje/firma/il/ilçe/şube/telefon/web sitesi yeniden eklenmez. Mevcut kaydın farklı görseli uyarıyla gösterilir; otomatik güncellenmez.</p>" +
                "<p>Bu geçici araç yalnızca Development ortamında localhost üzerinden açılır.</p></body></html>", "text/html; charset=utf-8");
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [RequestSizeLimit(MaxUploadBytes + 64 * 1024)]
        [RequestFormLimits(MultipartBodyLengthLimit = MaxUploadBytes + 64 * 1024)]
        public async Task<IActionResult> Import([FromForm] IFormFile json, [FromForm] bool apply = false,
            [FromForm] bool skipFailedImages = false)
        {
            if (!IsLocalDevelopment()) return NotFound();
            if (!ModelState.IsValid || json == null || json.Length == 0 || json.Length > MaxUploadBytes)
                return BadRequest(new { hata = "Geçerli bir projects.json seçin (en fazla 20 MB).", yolTeshisi = InspectMediaFolder() });
            Manifest manifest;
            try
            {
                using (var stream = json.OpenReadStream())
                    manifest = await JsonSerializer.DeserializeAsync<Manifest>(stream,
                        new JsonSerializerOptions { PropertyNameCaseInsensitive = false, MaxDepth = 32 }, HttpContext.RequestAborted);
            }
            catch (JsonException error)
            { return BadRequest(new { hata = "JSON okunamadı; schemaVersion=1 proje manifesti bekleniyor.", detay = error.Message, yolTeshisi = InspectMediaFolder() }); }
            try
            {
                // No await inside this lock or transaction: Kentico's transaction
                // context stays on one executing thread.
                lock (ImportLock)
                {
                    var report = BuildPlan(manifest, skipFailedImages, out var plan);
                    if (report.Hatalar.Count > 0)
                    { report.Durum = "Ön kontrol başarısız; hiçbir kayıt eklenmedi"; return UnprocessableEntity(report); }
                    if (!apply) return Ok(report);
                    using (var transaction = new CMSTransactionScope())
                    {
                        var existing = LoadExisting();
                        var inserted = 0;
                        foreach (var row in plan)
                        {
                            HttpContext.RequestAborted.ThrowIfCancellationRequested();
                            if (SkipExisting(report, existing, row)) continue;
                            var item = CustomTableItem.New(TableClassName);
                            foreach (var field in FieldNames) item.SetValue(field, row.Values[field]);
                            item.Insert();
                            existing.Add(row.Key, new HashSet<string>(StringComparer.Ordinal) { ImageKey(row.Values["Image"]) });
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
            { return StatusCode(499, new { hata = "İstek iptal edildi; commit edilmemiş eklemeler geri alınır.", yolTeshisi = InspectMediaFolder() }); }
            catch (Exception error)
            {
                logger.LogError(error, "Anlaşmalı projeler aktarımı başarısız: {TableClassName}", TableClassName);
                return StatusCode(500, new { hata = "Aktarım tamamlanamadı; commit edilmemiş eklemeler geri alınır. Sunucu logunu kontrol edin.", detay = error.Message, yolTeshisi = InspectMediaFolder() });
            }
        }

        private ImportReport BuildPlan(Manifest manifest, bool skipFailedImages, out List<PlannedRow> plan)
        {
            plan = new List<PlannedRow>();
            var report = new ImportReport { Tablo = TableClassName, MedyaUrlKlasoru = MediaVirtualFolder,
                HataliGorselleriBosBirak = skipFailedImages, YolTeshisi = InspectMediaFolder() };
            if (manifest == null) { report.Hatalar.Add("Manifest boş."); return report; }
            report.Toplam = manifest.Records == null ? 0 : manifest.Records.Count;
            if (manifest.SchemaVersion != 1) report.Hatalar.Add("schemaVersion 1 olmalı.");
            if (manifest.SourceUrl != SourceUrl) report.Hatalar.Add("sourceUrl beklenen anlaşmalı projeler sayfası olmalı: " + SourceUrl);
            if (manifest.TableClassName != TableClassName) report.Hatalar.Add("tableClassName " + TableClassName + " olmalı.");
            if (manifest.Filters == null || manifest.Filters.CityId.ValueKind != JsonValueKind.Null || manifest.Filters.DistrictId.ValueKind != JsonValueKind.Null ||
                manifest.Filters.ProjectName != "" || manifest.Filters.CompanyName != "")
                report.Hatalar.Add("Tam arşiv için filters cityId=null, districtId=null, projectName=\"\", companyName=\"\" olmalı.");
            if (!manifest.ListingComplete) report.Hatalar.Add("Listeleme tamamlanmamış (listingComplete=false). Scripti aynı klasörle yeniden çalıştırın.");
            if (manifest.ListingErrors == null || manifest.ListingErrors.Count != 0) report.Hatalar.Add("listingErrors boş dizi olmalı.");
            if (manifest.Records == null || manifest.Records.Count == 0 || manifest.Records.Count > MaxRecords) report.Hatalar.Add("records 1–20000 kayıt içermeli.");
            if (manifest.Records == null || manifest.TotalRecords != manifest.Records.Count) report.Hatalar.Add("totalRecords records uzunluğuyla eşleşmeli.");
            if (manifest.Warnings == null) report.Hatalar.Add("warnings dizi olmalı (uyarı yoksa []).");
            else report.Uyarilar.AddRange(manifest.Warnings.Where(value => !string.IsNullOrWhiteSpace(value)).Select(value => "Kaynak: " + value));
            if (report.Hatalar.Count > 0) return report;

            var table = DataClassInfoProvider.GetDataClassInfo(TableClassName);
            if (table == null || !table.ClassIsCustomTable) { report.Hatalar.Add("Custom table bulunamadı: " + TableClassName); return report; }
            var form = new FormInfo(table.ClassFormDefinition);
            foreach (var field in FieldNames)
                if (form.GetFormField(field) == null) report.Hatalar.Add("Custom table alanı eksik: " + field);
            if (report.Hatalar.Count > 0) return report;
            var requiresFiles = manifest.Records.Any(row => row != null && row.ImageStatus == "downloaded");
            if (report.YolTeshisi.Hata != null)
            {
                if (requiresFiles) report.Hatalar.Add(report.YolTeshisi.Hata);
                else report.Uyarilar.Add("Bu manifestte doğrulanacak başarılı görsel yok; medya yol kontrolü: " + report.YolTeshisi.Hata);
            }
            var existing = LoadExisting();
            var input = new Dictionary<string, PlannedRow>(StringComparer.Ordinal);
            var metadata = new Dictionary<string, ManifestRecord>(StringComparer.OrdinalIgnoreCase);
            var verified = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            for (var index = 0; index < manifest.Records.Count; index++)
            {
                HttpContext.RequestAborted.ThrowIfCancellationRequested();
                var source = manifest.Records[index];
                var label = "Kayıt " + (index + 1).ToString(CultureInfo.InvariantCulture) + ": ";
                if (source == null) { report.Hatalar.Add(label + "null kayıt."); continue; }
                var before = report.Hatalar.Count;
                var values = new Dictionary<string, string>(StringComparer.Ordinal)
                {
                    ["ProjectName"] = Clean(source.ProjectName), ["FirmName"] = Clean(source.FirmName), ["Image"] = "",
                    ["District"] = Clean(source.District), ["City"] = Clean(source.City), ["WebsiteUrl"] = Clean(source.WebsiteUrl),
                    ["Branch"] = Clean(source.Branch), ["Phone"] = Clean(source.Phone)
                };
                if (values["ProjectName"].Length == 0) report.Hatalar.Add(label + "projectName boş olamaz.");
                if (values["FirmName"].Length == 0) report.Uyarilar.Add(label + "firma adı kaynakta boş; FirmName boş korunacak.");
                if (values["WebsiteUrl"].Length > 0 && !IsHttpUrl(values["WebsiteUrl"])) report.Hatalar.Add(label + "websiteUrl HTTP(S) URL veya boş olmalı.");
                if (source.SourcePage < 1) report.Hatalar.Add(label + "sourcePage en az 1 olmalı.");
                foreach (var pair in values)
                    if (pair.Value.Any(character => char.IsControl(character) && character != '\r' && character != '\n' && character != '\t'))
                        report.Hatalar.Add(label + pair.Key + " geçersiz kontrol karakteri içeriyor.");
                var name = source.ImageFileName ?? "";
                var sourceImage = Clean(source.ImageSourceUrl);
                if (source.ImageStatus == "downloaded")
                {
                    report.IndirilmisGorsel++;
                    if (!IsHttpUrl(sourceImage)) report.Hatalar.Add(label + "downloaded görselin imageSourceUrl değeri HTTP(S) olmalı.");
                    if (!IsSafeFileName(name)) report.Hatalar.Add(label + "imageFileName en fazla 50 ASCII karakterli yalnızca görsel dosyası adı olmalı.");
                    if (!HashPattern.IsMatch(source.ImageSha256 ?? "")) report.Hatalar.Add(label + "imageSha256 64 hexadecimal karakter olmalı.");
                    if (!source.ImageByteLength.HasValue || source.ImageByteLength.Value <= 0) report.Hatalar.Add(label + "imageByteLength pozitif olmalı.");
                    if (!string.IsNullOrEmpty(source.ImageError)) report.Hatalar.Add(label + "downloaded görselin imageError değeri boş/null olmalı.");
                    values["Image"] = MediaVirtualFolder.TrimEnd('/') + "/" + Uri.EscapeDataString(name);
                }
                else if (source.ImageStatus == "missing")
                {
                    report.KaynaktaGorselYok++;
                    if (sourceImage.Length > 0 || name.Length > 0 || source.ImageSha256 != null || source.ImageByteLength != null)
                        report.Hatalar.Add(label + "missing görselin kaynak URL/dosya/hash/boyut alanları boş/null olmalı.");
                    report.Uyarilar.Add(label + "kaynakta görsel yok; proje boş Image ile korunacak.");
                }
                else if (source.ImageStatus == "failed")
                {
                    report.GorselHatasi++;
                    if (!IsHttpUrl(sourceImage)) report.Hatalar.Add(label + "failed görselin imageSourceUrl değeri HTTP(S) olmalı.");
                    if (name.Length > 0 && !IsSafeFileName(name)) report.Hatalar.Add(label + "failed görselin dosya adı geçersiz.");
                    if (source.ImageSha256 != null || source.ImageByteLength != null) report.Hatalar.Add(label + "failed görselin hash/boyut alanları null olmalı.");
                    report.GorselHatalari.Add(new ImageFailure { Sira = index + 1, Proje = values["ProjectName"], KaynakUrl = sourceImage, DosyaAdi = name, Hata = source.ImageError });
                    if (!skipFailedImages) report.Hatalar.Add(label + "görsel indirilemedi: " + (source.ImageError ?? "detay yok"));
                    else { report.HataNedeniyleBosGorsel++; report.Uyarilar.Add(label + "indirilemeyen görsel açık isteğinizle boş bırakılacak; proje aktarılacak."); }
                }
                else report.Hatalar.Add(label + "imageStatus downloaded, missing veya failed olmalı; pending aktarılmaz.");
                foreach (var field in FieldNames) CheckLength(report, label, form.GetFormField(field), values[field]);
                if (report.Hatalar.Count != before) continue;

                if (source.ImageStatus == "downloaded")
                {
                    if (metadata.TryGetValue(name, out var previousFile) &&
                        (!string.Equals(previousFile.ImageFileName, name, StringComparison.Ordinal) ||
                        !string.Equals(previousFile.ImageSha256, source.ImageSha256, StringComparison.OrdinalIgnoreCase) || previousFile.ImageByteLength != source.ImageByteLength))
                    { report.Hatalar.Add(label + "aynı görsel adı için çelişen büyük/küçük harf, SHA-256 veya boyut: " + name); continue; }
                    metadata[name] = source;
                    if (report.YolTeshisi.Hata != null) continue;
                    if (!verified.Contains(name))
                    {
                        var folder = report.YolTeshisi.SecilenFizikselKlasor;
                        var path = Path.GetFullPath(Path.Combine(folder, name));
                        if (!string.Equals(NormalizePhysicalPath(Path.GetDirectoryName(path)), folder, PathComparison))
                        { report.Hatalar.Add(label + "görsel medya klasörü dışında."); continue; }
                        if (!VerifyImage(path, PublicMediaUrl(values["Image"]), source, out var error)) { report.Hatalar.Add(label + error); continue; }
                        verified.Add(name);
                    }
                }
                var row = new PlannedRow { Values = values, Key = Identity(values) };
                if (input.TryGetValue(row.Key, out var duplicate))
                {
                    if (!string.Equals(ImageKey(duplicate.Values["Image"]), ImageKey(values["Image"]), StringComparison.Ordinal))
                        report.Hatalar.Add(label + "aynı proje kimliği için JSON'da çelişen Image değerleri var: " + values["ProjectName"]);
                    else report.JsonMukerrerAtlanan++;
                    continue;
                }
                input.Add(row.Key, row);
                if (!SkipExisting(report, existing, row)) plan.Add(row);
            }
            report.DogrulananGorsel = verified.Count;
            report.Eklenecek = plan.Count;
            report.Ornekler = plan.Take(10).Select(row => row.Values).ToList();
            return report;
        }

        private Dictionary<string, HashSet<string>> LoadExisting()
        {
            var existing = new Dictionary<string, HashSet<string>>(StringComparer.Ordinal);
            foreach (var item in CustomTableItemProvider.GetItems(TableClassName).Columns(FieldNames))
            {
                var values = FieldNames.ToDictionary(field => field, field => Clean(ValidationHelper.GetString(item.GetValue(field), "")), StringComparer.Ordinal);
                var key = Identity(values);
                if (!existing.TryGetValue(key, out var images)) { images = new HashSet<string>(StringComparer.Ordinal); existing.Add(key, images); }
                images.Add(ImageKey(values["Image"]));
            }
            return existing;
        }
        private static bool SkipExisting(ImportReport report, Dictionary<string, HashSet<string>> existing, PlannedRow row)
        {
            if (!existing.TryGetValue(row.Key, out var images)) return false;
            report.MevcutAtlanan++;
            if (!images.Contains(ImageKey(row.Values["Image"])))
            {
                report.MevcutFarkliGorsel++;
                report.Uyarilar.Add("Mevcut proje aynı kimlikle bulundu; farklı Image otomatik güncellenmedi: " + row.Values["ProjectName"] + " | " + row.Values["Branch"]);
            }
            return true;
        }
        private static string Identity(Dictionary<string, string> values)
        { return JsonSerializer.Serialize(IdentityFields.Select(field => Clean(values[field])).ToArray()); }
        private static string ImageKey(string value)
        { var text = Clean(value).Replace('\\', '/'); return text.StartsWith("~/", StringComparison.Ordinal) ? text.Substring(1) : text; }
        private static bool VerifyImage(string path, string publicUrl, ManifestRecord row, out string error)
        {
            error = null;
            var location = path + " | URL: " + publicUrl;
            try
            {
                if (!System.IO.File.Exists(path))
                {
                    error = "Görsel bulunamadı: " + location;
                    var nested = Path.Combine(Path.GetDirectoryName(path), "images", row.ImageFileName);
                    if (System.IO.File.Exists(nested)) error += " Görsel images alt klasöründe bulundu: " + nested + ". Görselleri yapılandırılan klasöre doğrudan kopyalayın.";
                    return false;
                }
                if ((System.IO.File.GetAttributes(path) & FileAttributes.ReparsePoint) != 0) { error = "Görsel sembolik bağlantı olamaz: " + location; return false; }
                using (var stream = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read))
                {
                    if (stream.Length != row.ImageByteLength.Value) { error = "Görsel boyutu JSON ile eşleşmiyor: " + location; return false; }
                    using (var sha = SHA256.Create())
                        if (!string.Equals(BitConverter.ToString(sha.ComputeHash(stream)).Replace("-", ""), row.ImageSha256, StringComparison.OrdinalIgnoreCase))
                        { error = "Görsel SHA-256 eşleşmiyor: " + location; return false; }
                }
                return true;
            }
            catch (Exception exception) when (exception is IOException || exception is UnauthorizedAccessException)
            { error = "Görsel okunamadı: " + location + " (" + exception.Message + ")"; return false; }
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
            if (!SafeName.IsMatch(name) || name.Contains("..") || !string.Equals(Path.GetFileName(name), name, StringComparison.Ordinal) ||
                !ImageExtensions.Contains(Path.GetExtension(name), StringComparer.OrdinalIgnoreCase)) return false;
            return !Regex.IsMatch(name.Split('.')[0], @"\A(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])\z", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);
        }
        private static void CheckLength(ImportReport report, string label, FormFieldInfo field, string value)
        { if (field.Size > 0 && value.Length > field.Size) report.Hatalar.Add(label + field.Name + " alanı " + field.Size + " karakteri aşıyor (" + value.Length + ")."); }
        private static bool IsHttpUrl(string value)
        { return Uri.TryCreate(value, UriKind.Absolute, out var uri) && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps) && string.IsNullOrEmpty(uri.UserInfo); }
        private static string Clean(string value) { return (value ?? "").Trim().Normalize(NormalizationForm.FormC); }
        private static string Encode(string value) { return WebUtility.HtmlEncode(value ?? ""); }
        private static StringComparison PathComparison { get { return Path.DirectorySeparatorChar == '\\' ? StringComparison.OrdinalIgnoreCase : StringComparison.Ordinal; } }

        public sealed class Manifest
        {
            [JsonPropertyName("schemaVersion")] public int SchemaVersion { get; set; }
            [JsonPropertyName("sourceUrl")] public string SourceUrl { get; set; }
            [JsonPropertyName("tableClassName")] public string TableClassName { get; set; }
            [JsonPropertyName("filters")] public ManifestFilters Filters { get; set; }
            [JsonPropertyName("listingComplete")] public bool ListingComplete { get; set; }
            [JsonPropertyName("totalRecords")] public int TotalRecords { get; set; }
            [JsonPropertyName("records")] public List<ManifestRecord> Records { get; set; }
            [JsonPropertyName("listingErrors")] public List<JsonElement> ListingErrors { get; set; }
            [JsonPropertyName("warnings")] public List<string> Warnings { get; set; }
        }
        public sealed class ManifestFilters
        {
            [JsonPropertyName("cityId")] public JsonElement CityId { get; set; }
            [JsonPropertyName("districtId")] public JsonElement DistrictId { get; set; }
            [JsonPropertyName("projectName")] public string ProjectName { get; set; }
            [JsonPropertyName("companyName")] public string CompanyName { get; set; }
        }
        public sealed class ManifestRecord
        {
            [JsonPropertyName("projectName")] public string ProjectName { get; set; }
            [JsonPropertyName("firmName")] public string FirmName { get; set; }
            [JsonPropertyName("city")] public string City { get; set; }
            [JsonPropertyName("district")] public string District { get; set; }
            [JsonPropertyName("websiteUrl")] public string WebsiteUrl { get; set; }
            [JsonPropertyName("branch")] public string Branch { get; set; }
            [JsonPropertyName("phone")] public string Phone { get; set; }
            [JsonPropertyName("imageSourceUrl")] public string ImageSourceUrl { get; set; }
            [JsonPropertyName("imageFileName")] public string ImageFileName { get; set; }
            [JsonPropertyName("imageStatus")] public string ImageStatus { get; set; }
            [JsonPropertyName("imageSha256")] public string ImageSha256 { get; set; }
            [JsonPropertyName("imageByteLength")] public long? ImageByteLength { get; set; }
            [JsonPropertyName("imageError")] public string ImageError { get; set; }
            [JsonPropertyName("sourcePage")] public int SourcePage { get; set; }
            // Audit-only source text: no Address/BranchPhoneText fields exist in
            // the provided generated custom-table class, so no extra fields are set.
            [JsonPropertyName("addressText")] public string AddressText { get; set; }
            [JsonPropertyName("branchPhoneText")] public string BranchPhoneText { get; set; }
        }
        private sealed class PlannedRow
        { public Dictionary<string, string> Values { get; set; } public string Key { get; set; } }
        public sealed class ImportReport
        {
            public string Durum { get; set; } = "Ön kontrol başarılı; veritabanına yazılmadı";
            public string Tablo { get; set; }
            public string MedyaUrlKlasoru { get; set; }
            public MediaPathDiagnostics YolTeshisi { get; set; }
            public bool HataliGorselleriBosBirak { get; set; }
            public int Toplam { get; set; }
            public int IndirilmisGorsel { get; set; }
            public int DogrulananGorsel { get; set; }
            public int KaynaktaGorselYok { get; set; }
            public int GorselHatasi { get; set; }
            public int HataNedeniyleBosGorsel { get; set; }
            public int JsonMukerrerAtlanan { get; set; }
            public int MevcutAtlanan { get; set; }
            public int MevcutFarkliGorsel { get; set; }
            public int Eklenecek { get; set; }
            public int Eklenen { get; set; }
            public List<string> Hatalar { get; set; } = new List<string>();
            public List<string> Uyarilar { get; set; } = new List<string>();
            public List<ImageFailure> GorselHatalari { get; set; } = new List<ImageFailure>();
            public List<Dictionary<string, string>> Ornekler { get; set; } = new List<Dictionary<string, string>>();
        }
        public sealed class ImageFailure
        { public int Sira { get; set; } public string Proje { get; set; } public string KaynakUrl { get; set; } public string DosyaAdi { get; set; } public string Hata { get; set; } }
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
        { public string Kaynak { get; set; } public string FizikselYol { get; set; } public bool Exists { get; set; } }
    }
}

