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
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace YkbYapikredi.Web.Controllers
{
    // Temporary Kentico 13 ASP.NET Core tool. Copy this file to the REAL web app.
    // GET and preview never delete/move/write files. Only an explicit Apply POST
    // with the SAME snapshot and a valid preview PlanToken performs cleanup.
    // Source refresh: verify a new COMPLETE snapshot, then update its pinned SHA.
    // MaxSnapshotAgeHours is deliberately limited. Do not disable freshness checks
    // merely to accept an old whitelist: newly published reports must be protected.
    // Rows missing from the source are deleted; source-present duplicate groups
    // are preserved. Missing source reports are not imported by this controller.
    [Route("local-tools/daily-market-bulletins-cleanup")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public sealed class DailyMarketBulletinsCleanupController : Controller
    {
        private const string TableClassName = "YkbYapikredi.DailyAllMarketBullettins";
        private const string SourceUrl = "https://www.yapikredi.com.tr/yapi-kredi-hakkinda/piyasa-bulteni/";
        private const string SnapshotSha256 = "a01ba358be73143b0841e3536c088830a5134b3221973de8219dfb42c7ade3f6";
        private const int MaxSnapshotAgeHours = 48;
        private const int PlanLifetimeMinutes = 30;
        private const int MaxUploadBytes = 20 * 1024 * 1024;
        private const int MaxRows = 20000;
        private const string MediaVirtualFolder = "/YkbYapikredi/media/YapikrediMedia/GunlukTumPiyasaBultenleri";
        // Empty: the only existing distinct WebRootPath/ContentRootPath candidate.
        // Otherwise set the full folder path on THIS machine (not a public URL).
        private const string MediaPhysicalFolder = "";
        // Empty: ContentRootPath/App_Data/DailyMarketBulletinsCleanup.
        // Must be private, outside WebRootPath/media, on the SAME volume as media.
        // Set a full path if the application/content root itself is publicly served.
        private const string BackupPhysicalFolder = "";
        private static readonly object CleanupLock = new object();
        private static readonly Regex HashPattern = new Regex(@"\A[0-9a-fA-F]{64}\z", RegexOptions.CultureInvariant);
        private static readonly Regex SafeName = new Regex(@"\A[A-Za-z0-9][A-Za-z0-9._-]{0,49}\z", RegexOptions.CultureInvariant);
        private static readonly JsonSerializerOptions JsonOptions = new JsonSerializerOptions { WriteIndented = true, MaxDepth = 32 };
        private readonly IWebHostEnvironment environment;
        private readonly IAntiforgery antiforgery;
        private readonly IDataProtector protector;
        private readonly ILogger<DailyMarketBulletinsCleanupController> logger;

        public DailyMarketBulletinsCleanupController(IWebHostEnvironment environment, IAntiforgery antiforgery,
            IDataProtectionProvider protection, ILogger<DailyMarketBulletinsCleanupController> logger)
        {
            this.environment = environment; this.antiforgery = antiforgery; this.logger = logger;
            protector = protection.CreateProtector("YkbYapikredi.DailyMarketBulletinsCleanup.Plan.v1");
        }

        [HttpGet]
        public IActionResult Index()
        {
            if (!IsLocalDevelopment()) return NotFound();
            var token = antiforgery.GetAndStoreTokens(HttpContext);
            var action = Url.Action(nameof(Run)) ?? "/local-tools/daily-market-bulletins-cleanup";
            var paths = InspectMediaFolder();
            return Content("<!doctype html><html lang=\"tr\"><head><meta charset=\"utf-8\"><title>Piyasa bültenleri temizliği</title></head><body>" +
                "<h1>Piyasa bültenleri temizliği</h1><p>Tablo: <code>" + Encode(TableClassName) + "</code></p>" +
                "<p>Yalnızca doğrulanmış kaynak listesinde tarih + bülten tipi bulunmayan kayıtlar adaydır. Kaynakta bulunan aynı gün/tipteki ayrı kayıtlar korunur.</p>" +
                MediaPathHtml(paths) + "<p>Yedek klasörü: <code>" + Encode(BackupFolderDisplay()) + "</code></p>" +
                "<p>Kaynak görüntüsü en fazla " + MaxSnapshotAgeHours + " saatlik, plan kodu en fazla " + PlanLifetimeMinutes + " dakikalık olabilir.</p>" +
                "<form method=\"post\" enctype=\"multipart/form-data\" action=\"" + Encode(action) + "\">" +
                "<input type=\"hidden\" name=\"" + Encode(token.FormFieldName) + "\" value=\"" + Encode(token.RequestToken) + "\">" +
                "<p><label>source-snapshot.json: <input type=\"file\" name=\"snapshot\" accept=\".json,application/json\" required></label></p>" +
                "<p><label>Ön kontrol JSON'undaki PlanToken (tamamını kopyalayın):<br><textarea name=\"planToken\" rows=\"5\" cols=\"90\"></textarea></label></p>" +
                "<button name=\"apply\" value=\"false\">Ön kontrol (silmez)</button> " +
                "<button name=\"apply\" value=\"true\">Planı uygula: fazla kayıtları sil</button></form>" +
                "<p>Önce ön kontrolü çalıştırın, JSON'daki aday ItemID'leri/dosyaları inceleyin. Geri dönüp aynı dosyayı seçin, PlanToken'ı yapıştırın ve açıkça uygulayın.</p>" +
                "<p>Dosyalar kalıcı silinmez; public medya klasöründen özel yedeğe taşınır. Kalan tablo kayıtlarının kullandığı dosyalar korunur. Başka sayfa/tablo referansları otomatik keşfedilmez; bu klasör yalnızca bu bültenler için kullanılmalıdır.</p>" +
                "<p>SQL ile dosya sistemi tek atomik işlem değildir. İşlem kesilirse yedek klasöründeki journal.json ve rows-backup.json ile kurtarma durumunu kontrol edin. Uygulamayı/başka importları işlem sırasında durdurmayın.</p>" +
                "</body></html>", "text/html; charset=utf-8");
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        [RequestSizeLimit(MaxUploadBytes + 64 * 1024)]
        [RequestFormLimits(MultipartBodyLengthLimit = MaxUploadBytes + 64 * 1024)]
        public async Task<IActionResult> Run([FromForm] IFormFile snapshot, [FromForm] bool apply = false,
            [FromForm] string planToken = null)
        {
            if (!IsLocalDevelopment()) return NotFound();
            var report = new CleanupReport { YolTeshisi = InspectMediaFolder() };
            if (!ModelState.IsValid || snapshot == null || snapshot.Length == 0 || snapshot.Length > MaxUploadBytes)
            { report.Hatalar.Add("Geçerli source-snapshot.json seçin (en fazla 20 MB)."); return Result(report, 400); }
            byte[] bytes;
            try
            {
                using (var buffer = new MemoryStream())
                using (var stream = snapshot.OpenReadStream())
                {
                    await stream.CopyToAsync(buffer, 81920, HttpContext.RequestAborted);
                    if (buffer.Length > MaxUploadBytes) throw new InvalidDataException("Kaynak dosyası 20 MB'ı aşıyor.");
                    bytes = buffer.ToArray();
                }
            }
            catch (Exception error) when (error is IOException || error is InvalidDataException)
            { report.Hatalar.Add("Kaynak dosyası okunamadı: " + error.Message); return Result(report, 400); }
            try
            {
                lock (CleanupLock)
                {
                    var source = ValidateSnapshot(bytes, report);
                    if (source == null) return Result(report, 422);
                    if (!apply)
                    {
                        var plan = BuildPlan(source, report);
                        if (report.Hatalar.Count == 0)
                        {
                            report.PlanExpiresAtUtc = DateTimeOffset.UtcNow.AddMinutes(PlanLifetimeMinutes);
                            report.PlanToken = protector.Protect(JsonSerializer.Serialize(new PlanSeal
                            { Fingerprint = plan.Fingerprint, SourceSha256 = report.SourceSha256, ExpiresAtUtc = report.PlanExpiresAtUtc.Value }));
                        }
                        return Result(report, report.Hatalar.Count == 0 ? 200 : 422);
                    }
                    PlanSeal seal;
                    try
                    {
                        seal = JsonSerializer.Deserialize<PlanSeal>(protector.Unprotect((planToken ?? "").Trim()));
                        if (seal == null || seal.ExpiresAtUtc < DateTimeOffset.UtcNow || seal.ExpiresAtUtc > DateTimeOffset.UtcNow.AddMinutes(PlanLifetimeMinutes + 1) ||
                            seal.SourceSha256 != report.SourceSha256 || !HashPattern.IsMatch(seal.Fingerprint ?? ""))
                            throw new InvalidDataException("Plan kodu geçersiz veya süresi dolmuş.");
                    }
                    catch (Exception error) when (error is CryptographicException || error is JsonException || error is InvalidDataException || error is ArgumentException)
                    { report.Hatalar.Add("Ön kontrol PlanToken'ı gerekli; geçersiz/eski kod ile silme yapılmaz. Ön kontrolü yenileyin."); return Result(report, 422); }
                    return Apply(source, bytes, seal, report);
                }
            }
            catch (Exception error)
            {
                logger.LogError(error, "Piyasa bültenleri temizliği tamamlanamadı");
                report.Hatalar.Add(error.Message);
                report.Durum = "Tamamlanamadı; yedek/journal durumunu kontrol edin";
                return Result(report, 500);
            }
        }

        private Snapshot ValidateSnapshot(byte[] bytes, CleanupReport report)
        {
            report.SourceSha256 = Hash(bytes);
            if (!string.Equals(report.SourceSha256, SnapshotSha256, StringComparison.OrdinalIgnoreCase))
            { report.Hatalar.Add("Kaynak SHA-256 derlenmiş doğrulanmış snapshot ile eşleşmiyor. Değişmiş/kısmi kaynakla silme yapılmaz."); return null; }
            Snapshot source;
            try { source = JsonSerializer.Deserialize<Snapshot>(bytes, JsonOptions); }
            catch (JsonException error) { report.Hatalar.Add("Kaynak JSON geçersiz: " + error.Message); return null; }
            if (source == null || source.SchemaVersion != 1 || source.SourceUrl != SourceUrl || source.Endpoint != SourceUrl + "default.aspx/LoadMarketReleases" ||
                source.Filters == null || source.Filters.DateFrom.ValueKind != JsonValueKind.Null || source.Filters.DateTo.ValueKind != JsonValueKind.Null || source.Filters.Type != "Any")
                report.Hatalar.Add("Kaynak şeması/URL/endpoint veya filtresiz null/null/Any sözleşmesi geçersiz.");
            if (source == null) return null;
            report.SourceCapturedAtUtc = source.CapturedAtUtc;
            report.SourceAgeHours = Math.Round((DateTimeOffset.UtcNow - source.CapturedAtUtc).TotalHours, 2);
            report.SourceRows = source.TotalRecords;
            if (source.CapturedAtUtc < DateTimeOffset.UtcNow.AddHours(-MaxSnapshotAgeHours) || source.CapturedAtUtc > DateTimeOffset.UtcNow.AddMinutes(5) ||
                source.StartedAtUtc > source.CapturedAtUtc)
                report.Hatalar.Add("Kaynak görüntüsü eski veya zaman bilgisi geçersiz. Çekim: " + source.CapturedAtUtc.ToString("O") +
                    "; izin verilen yaş " + MaxSnapshotAgeHours + " saat. Kaynağı yeniden tam doğrulayın ve controller'daki SnapshotSha256 sabitini yeni doğrulanmış dosyanın özetiyle güncelleyin.");
            if (!source.ListingComplete || source.ListingErrors == null || source.ListingErrors.Count != 0 || source.TotalPages < 1 || source.TotalPages > 2000 ||
                source.EnumeratedPages != source.TotalPages || source.Records == null || source.Records.Count < 1 || source.Records.Count > MaxRows || source.TotalRecords != source.Records.Count ||
                source.PageSummaries == null || source.PageSummaries.Count != source.TotalPages)
                report.Hatalar.Add("Kaynak bütünlüğü/sayfa/kayıt sayısı tamamlanmamış.");
            if (source.Verification == null || !source.Verification.FirstPageMatches || !source.Verification.PageCountMatches || !source.Verification.NoDuplicateRecords ||
                !source.Verification.NoDuplicatePages || !source.Verification.DescendingDates || source.Verification.VerifiedAtUtc > source.CapturedAtUtc ||
                source.Verification.VerifiedAtUtc < source.StartedAtUtc || !HashPattern.IsMatch(source.Verification.OriginalFirstPageFingerprint ?? "") ||
                source.Verification.OriginalFirstPageFingerprint != source.Verification.CurrentFirstPageFingerprint)
                report.Hatalar.Add("Kaynak doğrulama bayrakları veya ilk sayfa fingerprint bilgisi geçersiz.");
            if (report.Hatalar.Count > 0) return null;
            var identities = new HashSet<string>(StringComparer.Ordinal);
            var dates = new List<DateTime>();
            foreach (var row in source.Records)
            {
                if (row == null || !TryDate(row.Date, out var date) || string.IsNullOrWhiteSpace(row.BulletinType) || row.BulletinType.Any(char.IsControl) ||
                    !IsHttpUrl(row.SourceUrl) || row.SourcePage < 1 || row.SourcePage > source.TotalPages)
                { report.Hatalar.Add("Kaynakta geçersiz tarih/tip/URL/sayfa kaydı var."); continue; }
                if (!identities.Add(JsonSerializer.Serialize(new[] { row.Date, row.BulletinType, row.SourceUrl }))) report.Hatalar.Add("Kaynak belge kimliği yineleniyor.");
                dates.Add(date);
            }
            if (report.Hatalar.Count > 0) return null;
            var fingerprints = new HashSet<string>(StringComparer.Ordinal);
            for (var index = 0; index < source.PageSummaries.Count; index++)
            {
                var page = source.PageSummaries[index];
                if (page == null || page.PageIndex != index + 1 || page.ActivePage != index + 1 || page.Count < 1 ||
                    page.Count != source.Records.Count(row => row != null && row.SourcePage == index + 1) || !HashPattern.IsMatch(page.Fingerprint ?? "") || !fingerprints.Add(page.Fingerprint))
                    report.Hatalar.Add("Kaynak sayfa özeti sırası/içeriği geçersiz: " + (index + 1));
            }
            if (source.Verification.OriginalFirstPageFingerprint != source.PageSummaries[0].Fingerprint || dates.Count == 0 ||
                dates.Where((date, index) => index > 0 && date > dates[index - 1]).Any() || source.DateRange == null ||
                source.DateRange.Min != dates.Min().ToString("yyyy-MM-dd", CultureInfo.InvariantCulture) || source.DateRange.Max != dates.Max().ToString("yyyy-MM-dd", CultureInfo.InvariantCulture))
                report.Hatalar.Add("Kaynak ilk sayfa/tarih sırası/tarih kapsamı uyuşmuyor.");
            report.SourceMinDate = source.DateRange == null ? null : source.DateRange.Min;
            report.SourceMaxDate = source.DateRange == null ? null : source.DateRange.Max;
            report.SourceUniqueDateTypes = source.Records.Select(row => Pair(row.Date, row.BulletinType)).Distinct(StringComparer.Ordinal).Count();
            return report.Hatalar.Count == 0 ? source : null;
        }

        private CleanupPlan BuildPlan(Snapshot source, CleanupReport report)
        {
            var plan = new CleanupPlan();
            if (report.YolTeshisi.Hata != null) { report.Hatalar.Add(report.YolTeshisi.Hata); return plan; }
            plan.MediaFolder = report.YolTeshisi.SecilenFizikselKlasor;
            try
            {
                EnsureNoReparse(plan.MediaFolder);
                plan.BackupRoot = ResolveBackupFolder(plan.MediaFolder);
                report.BackupRoot = plan.BackupRoot;
            }
            catch (Exception error) when (error is IOException || error is UnauthorizedAccessException || error is ArgumentException || error is NotSupportedException)
            { report.Hatalar.Add("Medya/yedek yolu güvenli değil: " + error.Message); return plan; }
            var table = DataClassInfoProvider.GetDataClassInfo(TableClassName);
            if (table == null || !table.ClassIsCustomTable) { report.Hatalar.Add("Custom table bulunamadı: " + TableClassName); return plan; }
            var form = new FormInfo(table.ClassFormDefinition);
            foreach (var field in new[] { "Date", "BulletinType", "Pdf" })
                if (form.GetFormField(field) == null) report.Hatalar.Add("Tablo alanı eksik: " + field);
            if (report.Hatalar.Count > 0) return plan;
            plan.Rows = LoadRows(report);
            report.DbRows = plan.Rows.Count;
            if (report.Hatalar.Count > 0) return plan;
            var sourceCounts = source.Records.GroupBy(row => Pair(row.Date, row.BulletinType), StringComparer.Ordinal).ToDictionary(group => group.Key, group => group.Count(), StringComparer.Ordinal);
            var maxDate = DateTime.ParseExact(source.DateRange.Max, "yyyy-MM-dd", CultureInfo.InvariantCulture);
            foreach (var row in plan.Rows)
            {
                if (row.Date.Date > maxDate) { row.Action = "protectedFuture"; report.ProtectedFutureRows.Add(row.Preview()); continue; }
                if (sourceCounts.ContainsKey(Pair(row.Date.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture), row.BulletinType)))
                { row.Action = "keepSourcePresent"; report.SourcePresentRows++; }
                else { row.Action = "deleteAbsentSourcePair"; plan.DeleteRows.Add(row); }
            }
            foreach (var group in plan.Rows.GroupBy(row => Pair(row.Date.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture), row.BulletinType)).Where(group => group.Count() > 1))
                report.DuplicateGroups.Add(new DuplicateGroup { Date = group.First().Date.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture), BulletinType = group.First().BulletinType,
                    DbCount = group.Count(), SourceCount = sourceCounts.TryGetValue(group.Key, out var count) ? count : 0, ItemIds = group.Select(row => row.ItemId).OrderBy(id => id).ToArray() });
            var survivors = plan.Rows.Where(row => row.Action != "deleteAbsentSourcePair").ToArray();
            var references = new Dictionary<string, List<int>>(PathComparer);
            var ambiguousReferences = new List<int>();
            foreach (var row in survivors)
            {
                if (TryMapPdf(row.Pdf, plan.MediaFolder, true, out var path, out _, out var ambiguous))
                {
                    if (path == null) continue;
                    if (!references.TryGetValue(path, out var ids)) { ids = new List<int>(); references.Add(path, ids); }
                    ids.Add(row.ItemId);
                }
                else if (ambiguous) ambiguousReferences.Add(row.ItemId);
            }
            if (ambiguousReferences.Count > 0)
                report.Uyarilar.Add("Kalan satırların bazı Pdf referansları güvenle çözümlenemedi; tüm aday dosyalar korunacak. ItemID: " + string.Join(",", ambiguousReferences));
            var files = new Dictionary<string, CleanupFile>(PathComparer);
            foreach (var row in plan.DeleteRows.OrderBy(row => row.ItemId))
            {
                var preview = row.Preview();
                report.Candidates.Add(preview);
                if (!TryMapPdf(row.Pdf, plan.MediaFolder, false, out var path, out var error, out _))
                { report.Hatalar.Add("ItemID " + row.ItemId + " | " + preview.Date + " | " + row.BulletinType + ": " + error); continue; }
                if (path == null) { preview.FileAction = "noPdf"; continue; }
                preview.PhysicalPath = path;
                if (!files.TryGetValue(path, out var file))
                {
                    file = new CleanupFile { PhysicalPath = path, FileName = Path.GetFileName(path) };
                    files.Add(path, file);
                    try
                    {
                        EnsureNoReparse(path);
                        file.Exists = System.IO.File.Exists(path);
                        if (file.Exists) { using (var stream = OpenRead(path)) { file.ByteLength = stream.Length; file.Sha256 = Hash(stream); } }
                        file.SurvivorItemIds = references.TryGetValue(path, out var ids) ? ids.OrderBy(id => id).ToArray() : Array.Empty<int>();
                        file.Action = !file.Exists ? "alreadyMissing" : file.SurvivorItemIds.Length > 0 ? "keepShared" : ambiguousReferences.Count > 0 ? "keepAmbiguousReference" : "toQuarantine";
                        if (!file.Exists) report.Uyarilar.Add("Dosya zaten yok; yalnız fazla DB satırı silinebilir: " + path);
                    }
                    catch (Exception exception) when (exception is IOException || exception is UnauthorizedAccessException)
                    { report.Hatalar.Add("ItemID " + row.ItemId + " dosyası okunamadı: " + path + " | " + exception.Message); }
                }
                preview.FileAction = file.Action; preview.ByteLength = file.ByteLength; preview.Sha256 = file.Sha256;
            }
            plan.Files = files.Values.OrderBy(file => file.PhysicalPath, PathComparer).ToList();
            report.Files = plan.Files;
            report.ToDeleteRows = plan.DeleteRows.Count;
            report.ToQuarantineFiles = plan.Files.Count(file => file.Action == "toQuarantine");
            report.SharedFilesKept = plan.Files.Count(file => file.Action == "keepShared");
            report.AlreadyMissingFiles = plan.Files.Count(file => file.Action == "alreadyMissing");
            plan.TableFingerprint = HashText(JsonSerializer.Serialize(plan.Rows.OrderBy(row => row.ItemId).Select(row => row.Backup()).ToArray()));
            plan.Fingerprint = HashText(JsonSerializer.Serialize(new { Source = report.SourceSha256, plan.TableFingerprint, plan.MediaFolder, plan.BackupRoot,
                Candidates = report.Candidates, Files = report.Files }));
            report.PlanFingerprint = plan.Fingerprint;
            return plan;
        }

        private IActionResult Apply(Snapshot source, byte[] sourceBytes, PlanSeal seal, CleanupReport report)
        {
            CleanupPlan plan = null;
            RunJournal journal = null;
            var heldFiles = new List<FileStream>();
            var committed = false;
            var commitAttempted = false;
            var transactionDisposed = false;
            Exception failure = null;
            Exception operationFailure = null;
            try
            {
                using (var transaction = new CMSTransactionScope())
                {
                    try
                    {
                    // Hold an exclusive table lock until commit/rollback. The name
                    // comes from Kentico metadata and is restricted to one SQL identifier.
                    var table = DataClassInfoProvider.GetDataClassInfo(TableClassName);
                    if (table == null || !Regex.IsMatch(table.ClassTableName ?? "", @"\A[A-Za-z_][A-Za-z0-9_]*\z"))
                        throw new InvalidDataException("Güvenilir SQL tablo adı bulunamadı.");
                    transaction.Connection.ExecuteScalar(
                        "SELECT COUNT_BIG(*) FROM [" + table.ClassTableName + "] WITH (TABLOCKX, HOLDLOCK)",
                        null, QueryTypeEnum.SQLQuery, false);
                    if (seal.ExpiresAtUtc < DateTimeOffset.UtcNow) throw new InvalidDataException("Tablo kilidi beklenirken planın süresi doldu; ön kontrolü yenileyin.");
                    plan = BuildPlan(source, report);
                    if (report.Hatalar.Count > 0) return Result(report, 422);
                    if (!string.Equals(seal.Fingerprint, plan.Fingerprint, StringComparison.Ordinal))
                    { report.Hatalar.Add("Ön kontrolden sonra tablo/dosya/yol/plan değişti. Hiçbir satır silinmedi; ön kontrolü yenileyin."); return Result(report, 409); }
                    if (plan.DeleteRows.Count == 0) { report.Durum = "Silinecek fazla kayıt yok"; return Result(report, 200); }
                    HttpContext.RequestAborted.ThrowIfCancellationRequested();
                    EnsureNoReparse(plan.BackupRoot);
                    Directory.CreateDirectory(plan.BackupRoot);
                    EnsureNoReparse(plan.BackupRoot);
                    var run = Path.Combine(plan.BackupRoot, DateTime.UtcNow.ToString("yyyyMMddTHHmmss", CultureInfo.InvariantCulture) + "-" + Guid.NewGuid().ToString("N"));
                    Directory.CreateDirectory(run);
                    EnsureNoReparse(run);
                    report.BackupRunFolder = run;
                    var quarantine = Path.Combine(run, "files"); Directory.CreateDirectory(quarantine);
                    journal = new RunJournal { RunFolder = run, SourceSha256 = report.SourceSha256, PlanFingerprint = plan.Fingerprint, Status = "prepared", StartedAtUtc = DateTimeOffset.UtcNow,
                        Rows = plan.DeleteRows.Select(row => row.Backup()).ToList(), Files = plan.Files.Where(file => file.Action == "toQuarantine").Select(file => new MoveRecord
                        { OriginalPath = file.PhysicalPath, BackupPath = Path.Combine(quarantine, file.FileName), ByteLength = file.ByteLength.Value, Sha256 = file.Sha256 }).ToList() };
                    WriteNew(Path.Combine(run, "source-snapshot.json"), sourceBytes);
                    WriteNew(Path.Combine(run, "rows-backup.json"), Encoding.UTF8.GetBytes(JsonSerializer.Serialize(new { TableClassName, Rows = journal.Rows, AllRowsBefore = plan.Rows.Select(row => row.Backup()).ToArray() }, JsonOptions)));
                    WriteNew(Path.Combine(run, "preview-plan.json"), Encoding.UTF8.GetBytes(JsonSerializer.Serialize(report, JsonOptions)));
                    SaveJournal(journal);
                    foreach (var move in journal.Files)
                    {
                        HttpContext.RequestAborted.ThrowIfCancellationRequested();
                        EnsureNoReparse(move.OriginalPath); EnsureNoReparse(move.BackupPath);
                        var stream = new FileStream(move.OriginalPath, FileMode.Open, FileAccess.Read, FileShare.Read | FileShare.Delete);
                        heldFiles.Add(stream);
                        if (stream.Length != move.ByteLength || !string.Equals(Hash(stream), move.Sha256, StringComparison.Ordinal)) throw new IOException("Taşıma öncesi dosya değişti: " + move.OriginalPath);
                        move.State = "moveRequested"; SaveJournal(journal);
                        System.IO.File.Move(move.OriginalPath, move.BackupPath);
                        move.State = "moved"; SaveJournal(journal);
                        using (var check = OpenRead(move.BackupPath))
                            if (check.Length != move.ByteLength || Hash(check) != move.Sha256) throw new IOException("Yedek hash/boyut doğrulaması başarısız: " + move.BackupPath);
                        report.QuarantinedFiles++;
                    }
                    journal.Status = "filesQuarantined"; SaveJournal(journal);
                    foreach (var row in plan.DeleteRows) { HttpContext.RequestAborted.ThrowIfCancellationRequested(); row.Item.Delete(); report.DeletedRows++; }
                    var after = LoadRows(report);
                    var expected = plan.Rows.Where(row => row.Action != "deleteAbsentSourcePair").OrderBy(row => row.ItemId).Select(row => row.Backup()).ToArray();
                    if (report.Hatalar.Count > 0 || HashText(JsonSerializer.Serialize(after.OrderBy(row => row.ItemId).Select(row => row.Backup()).ToArray())) != HashText(JsonSerializer.Serialize(expected)))
                        throw new InvalidDataException("Silme sırasında tablo beklenmeyen şekilde değişti.");
                    journal.Status = "commitRequested"; SaveJournal(journal);
                    commitAttempted = true;
                    transaction.Commit(); committed = true;
                    }
                    catch (Exception error) { operationFailure = error; throw; }
                }
                transactionDisposed = true;
                journal.Status = "committed";
                try { SaveJournal(journal); } catch (Exception error) { report.Uyarilar.Add("DB commit tamamlandı fakat journal son durumu yazılamadı: " + error.Message); }
                report.Durum = "Tamamlandı; fazla satırlar silindi, dosyalar özel yedeğe taşındı";
                return Result(report, 200);
            }
            catch (Exception error)
            {
                failure = error;
                // If Dispose/rollback replaces the operation exception, the DB
                // outcome is uncertain. Do not claim rollback or restore blindly.
                transactionDisposed = operationFailure != null && ReferenceEquals(error, operationFailure);
            }
            finally { foreach (var stream in heldFiles) stream.Dispose(); }
            if (journal != null)
            {
                journal.Error = failure == null ? "Bilinmeyen hata" : failure.Message;
                if (committed || commitAttempted || !transactionDisposed)
                {
                    journal.Status = "commitOutcomeRequiresManualReview";
                    report.Hatalar.Add("Commit sonucu kesin doğrulanamadı veya commit sonrası hata oluştu. Dosyalar otomatik geri taşınmadı; journal ve DB durumunu birlikte kontrol edin.");
                }
                else
                {
                    journal.Status = "rollbackCompensation";
                    foreach (var move in journal.Files.AsEnumerable().Reverse())
                    {
                        try
                        {
                            if (!System.IO.File.Exists(move.BackupPath)) { if (move.State == "moved") throw new IOException("Yedek bulunamadı."); continue; }
                            EnsureNoReparse(move.OriginalPath); EnsureNoReparse(move.BackupPath);
                            if (System.IO.File.Exists(move.OriginalPath)) throw new IOException("Orijinal konum dolu; üzerine yazılmadı.");
                            using (var check = OpenRead(move.BackupPath)) if (check.Length != move.ByteLength || Hash(check) != move.Sha256) throw new IOException("Yedek içeriği değişmiş; otomatik geri taşınmadı.");
                            System.IO.File.Move(move.BackupPath, move.OriginalPath); move.State = "restored";
                        }
                        catch (Exception restoreError) { move.RestoreError = restoreError.Message; report.Hatalar.Add("Dosya geri alınamadı: " + move.OriginalPath + " | " + restoreError.Message); }
                    }
                    journal.Status = journal.Files.Any(move => move.RestoreError != null) ? "rollbackNeedsManualRecovery" : "rollbackFilesRestored";
                    report.DeletedRows = 0; report.QuarantinedFiles = journal.Files.Count(move => move.State == "moved");
                }
                try { SaveJournal(journal); } catch (Exception journalError) { report.Hatalar.Add("Journal güncellenemedi: " + journalError.Message); }
            }
            report.Durum = "Temizlik tamamlanamadı; yedek/journal durumunu inceleyin";
            report.Hatalar.Add((transactionDisposed ? "DB transaction kapsamı kapandı. " : "") + (failure == null ? "Bilinmeyen hata" : failure.Message));
            logger.LogError(failure, "Piyasa bültenleri cleanup başarısız; yedek {BackupRunFolder}", report.BackupRunFolder);
            return Result(report, 500);
        }

        private List<DbRow> LoadRows(CleanupReport report)
        {
            var rows = new List<DbRow>(); var ids = new HashSet<int>();
            foreach (var item in CustomTableItemProvider.GetItems(TableClassName))
            {
                var id = ValidationHelper.GetInteger(item.GetValue("ItemID"), 0);
                var rawDate = item.GetValue("Date");
                if (id < 1 || !ids.Add(id) || !(rawDate is DateTime) || string.IsNullOrWhiteSpace(ValidationHelper.GetString(item.GetValue("BulletinType"), "")))
                { report.Hatalar.Add("Geçersiz DB ItemID/tarih/tip; ItemID=" + id); continue; }
                rows.Add(new DbRow { Item = item, ItemId = id, Date = (DateTime)rawDate,
                    BulletinType = ValidationHelper.GetString(item.GetValue("BulletinType"), ""), Pdf = ValidationHelper.GetString(item.GetValue("Pdf"), "") });
            }
            if (rows.Count > MaxRows) report.Hatalar.Add("Tablo " + MaxRows + " satır sınırını aşıyor.");
            return rows;
        }

        private bool TryMapPdf(string value, string folder, bool referenceOnly, out string physical, out string error, out bool ambiguous)
        {
            physical = null; error = null; ambiguous = false;
            var path = (value ?? "").Trim();
            if (path.Length == 0) return true;
            if (referenceOnly && Uri.TryCreate(path, UriKind.Absolute, out var absolute) && (absolute.Scheme == "http" || absolute.Scheme == "https")) path = absolute.AbsolutePath;
            if (path.StartsWith("~/", StringComparison.Ordinal)) path = PublicMediaUrl(path);
            if (referenceOnly)
            {
                var query = path.IndexOfAny(new[] { '?', '#' }); if (query >= 0) path = path.Substring(0, query);
                try { path = Uri.UnescapeDataString(path); } catch { ambiguous = true; return false; }
            }
            var prefix = PublicMediaUrl(MediaVirtualFolder).TrimEnd('/') + "/";
            if (!path.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
            {
                // An unknown survivor alias (/getmedia, /getfile, an old media
                // prefix, etc.) may still resolve to the same physical file.
                // Preserve candidate files rather than guessing its target.
                ambiguous = referenceOnly;
                error = "Pdf beklenen doğrudan medya klasöründe değil: " + value; return false;
            }
            var name = path.Substring(prefix.Length);
            if (path.IndexOfAny(new[] { '%', '\\', '?', '#', '\0' }) >= 0 || !IsSafeFileName(name))
            { ambiguous = referenceOnly; error = "Pdf yalnız güvenli ASCII dosya adı içermeli; encoded/path/query kaçışları kabul edilmez: " + value; return false; }
            physical = NormalizePhysicalPath(Path.Combine(folder, name));
            if (!string.Equals(NormalizePhysicalPath(Path.GetDirectoryName(physical)), folder, PathComparison))
            { physical = null; ambiguous = referenceOnly; error = "Pdf medya klasörü dışında."; return false; }
            return true;
        }

        private string ResolveBackupFolder(string media)
        {
            var backup = string.IsNullOrWhiteSpace(BackupPhysicalFolder)
                ? Path.Combine(environment.ContentRootPath, "App_Data", "DailyMarketBulletinsCleanup") : BackupPhysicalFolder;
            if (!Path.IsPathFullyQualified(backup)) throw new ArgumentException("BackupPhysicalFolder tam fiziksel yol olmalı.");
            backup = NormalizePhysicalPath(backup);
            if (Within(backup, media) || Within(media, backup) || backup == Path.GetPathRoot(backup)) throw new IOException("Yedek yolu medya klasörüyle iç içe veya disk kökü olamaz.");
            if (!string.IsNullOrWhiteSpace(environment.WebRootPath))
            {
                var web = NormalizePhysicalPath(environment.WebRootPath);
                if (Within(backup, web) || Within(web, backup)) throw new IOException("Yedek WebRootPath dışında özel bir klasör olmalı; BackupPhysicalFolder ayarlayın.");
            }
            if (!string.Equals(Path.GetPathRoot(backup), Path.GetPathRoot(media), PathComparison)) throw new IOException("Yedek medya ile aynı disk/volume üzerinde olmalı; BackupPhysicalFolder ayarlayın.");
            EnsureNoReparse(backup); return backup;
        }
        private string BackupFolderDisplay()
        { return string.IsNullOrWhiteSpace(BackupPhysicalFolder) ? Path.Combine(environment.ContentRootPath ?? "", "App_Data", "DailyMarketBulletinsCleanup") : BackupPhysicalFolder; }
        private static bool Within(string path, string parent)
        { return string.Equals(path, parent, PathComparison) || path.StartsWith(parent.TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar) + Path.DirectorySeparatorChar, PathComparison); }
        private static void EnsureNoReparse(string path)
        {
            for (var current = NormalizePhysicalPath(path); !string.IsNullOrEmpty(current);)
            {
                if ((System.IO.File.Exists(current) || Directory.Exists(current)) && (System.IO.File.GetAttributes(current) & FileAttributes.ReparsePoint) != 0)
                    throw new IOException("Sembolik bağlantı/junction yolu kabul edilmez: " + current);
                var parent = Path.GetDirectoryName(current); if (string.Equals(parent, current, PathComparison)) break; current = parent;
            }
        }
        private static FileStream OpenRead(string path) { return new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read); }
        private static void WriteNew(string path, byte[] bytes)
        { using (var stream = new FileStream(path, FileMode.CreateNew, FileAccess.Write, FileShare.None)) { stream.Write(bytes, 0, bytes.Length); stream.Flush(true); } }
        private static void SaveJournal(RunJournal journal)
        {
            journal.UpdatedAtUtc = DateTimeOffset.UtcNow;
            var path = Path.Combine(journal.RunFolder, "journal.json"); var temp = Path.Combine(journal.RunFolder, "journal-" + Guid.NewGuid().ToString("N") + ".tmp");
            WriteNew(temp, Encoding.UTF8.GetBytes(JsonSerializer.Serialize(journal, JsonOptions)));
            if (System.IO.File.Exists(path)) System.IO.File.Replace(temp, path, null);
            else System.IO.File.Move(temp, path);
        }
        private static string Pair(string date, string type)
        { return date + "\u001f" + Regex.Replace((type ?? "").Trim().Normalize(NormalizationForm.FormC), @"\s+", " ").ToUpper(CultureInfo.GetCultureInfo("tr-TR")); }
        private static bool TryDate(string value, out DateTime date)
        { return DateTime.TryParseExact(value, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out date); }
        private static bool IsHttpUrl(string value)
        { return Uri.TryCreate(value, UriKind.Absolute, out var uri) && (uri.Scheme == "http" || uri.Scheme == "https") && string.IsNullOrEmpty(uri.UserInfo); }
        private static bool IsSafeFileName(string name)
        {
            if (!SafeName.IsMatch(name) || name.Contains("..") || !string.Equals(Path.GetFileName(name), name, StringComparison.Ordinal) ||
                !(name.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase) || name.EndsWith(".docx", StringComparison.OrdinalIgnoreCase))) return false;
            return !Regex.IsMatch(name.Split('.')[0], @"\A(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])\z", RegexOptions.CultureInvariant | RegexOptions.IgnoreCase);
        }
        private static string Hash(byte[] bytes) { using (var sha = SHA256.Create()) return BitConverter.ToString(sha.ComputeHash(bytes)).Replace("-", "").ToLowerInvariant(); }
        private static string Hash(Stream stream) { using (var sha = SHA256.Create()) return BitConverter.ToString(sha.ComputeHash(stream)).Replace("-", "").ToLowerInvariant(); }
        private static string HashText(string value) { return Hash(Encoding.UTF8.GetBytes(value)); }
        private static string Encode(string value) { return WebUtility.HtmlEncode(value ?? ""); }
        private static StringComparison PathComparison { get { return Path.DirectorySeparatorChar == '\\' ? StringComparison.OrdinalIgnoreCase : StringComparison.Ordinal; } }
        private static StringComparer PathComparer { get { return Path.DirectorySeparatorChar == '\\' ? StringComparer.OrdinalIgnoreCase : StringComparer.Ordinal; } }
        private JsonResult Result(CleanupReport report, int status) { return new JsonResult(report, JsonOptions) { StatusCode = status }; }

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

        public sealed class Snapshot
        {
            [JsonPropertyName("schemaVersion")] public int SchemaVersion { get; set; }
            [JsonPropertyName("sourceUrl")] public string SourceUrl { get; set; }
            [JsonPropertyName("endpoint")] public string Endpoint { get; set; }
            [JsonPropertyName("filters")] public SnapshotFilters Filters { get; set; }
            [JsonPropertyName("startedAtUtc")] public DateTimeOffset StartedAtUtc { get; set; }
            [JsonPropertyName("capturedAtUtc")] public DateTimeOffset CapturedAtUtc { get; set; }
            [JsonPropertyName("listingComplete")] public bool ListingComplete { get; set; }
            [JsonPropertyName("totalPages")] public int TotalPages { get; set; }
            [JsonPropertyName("enumeratedPages")] public int EnumeratedPages { get; set; }
            [JsonPropertyName("totalRecords")] public int TotalRecords { get; set; }
            [JsonPropertyName("records")] public List<SourceRecord> Records { get; set; }
            [JsonPropertyName("listingErrors")] public List<JsonElement> ListingErrors { get; set; }
            [JsonPropertyName("pageSummaries")] public List<PageSummary> PageSummaries { get; set; }
            [JsonPropertyName("verification")] public SnapshotVerification Verification { get; set; }
            [JsonPropertyName("dateRange")] public SnapshotDateRange DateRange { get; set; }
        }
        public sealed class SnapshotFilters
        { [JsonPropertyName("dateFrom")] public JsonElement DateFrom { get; set; } [JsonPropertyName("dateTo")] public JsonElement DateTo { get; set; } [JsonPropertyName("type")] public string Type { get; set; } }
        public sealed class SourceRecord
        { [JsonPropertyName("date")] public string Date { get; set; } [JsonPropertyName("bulletinType")] public string BulletinType { get; set; } [JsonPropertyName("sourceUrl")] public string SourceUrl { get; set; } [JsonPropertyName("sourcePage")] public int SourcePage { get; set; } }
        public sealed class PageSummary
        { [JsonPropertyName("pageIndex")] public int PageIndex { get; set; } [JsonPropertyName("activePage")] public int ActivePage { get; set; } [JsonPropertyName("count")] public int Count { get; set; } [JsonPropertyName("fingerprint")] public string Fingerprint { get; set; } }
        public sealed class SnapshotVerification
        {
            [JsonPropertyName("verifiedAtUtc")] public DateTimeOffset VerifiedAtUtc { get; set; }
            [JsonPropertyName("firstPageMatches")] public bool FirstPageMatches { get; set; }
            [JsonPropertyName("pageCountMatches")] public bool PageCountMatches { get; set; }
            [JsonPropertyName("noDuplicateRecords")] public bool NoDuplicateRecords { get; set; }
            [JsonPropertyName("noDuplicatePages")] public bool NoDuplicatePages { get; set; }
            [JsonPropertyName("descendingDates")] public bool DescendingDates { get; set; }
            [JsonPropertyName("originalFirstPageFingerprint")] public string OriginalFirstPageFingerprint { get; set; }
            [JsonPropertyName("currentFirstPageFingerprint")] public string CurrentFirstPageFingerprint { get; set; }
        }
        public sealed class SnapshotDateRange { [JsonPropertyName("min")] public string Min { get; set; } [JsonPropertyName("max")] public string Max { get; set; } }
        private sealed class PlanSeal { public string Fingerprint { get; set; } public string SourceSha256 { get; set; } public DateTimeOffset ExpiresAtUtc { get; set; } }
        private sealed class CleanupPlan
        { public string MediaFolder { get; set; } public string BackupRoot { get; set; } public string Fingerprint { get; set; } public string TableFingerprint { get; set; } public List<DbRow> Rows { get; set; } = new List<DbRow>(); public List<DbRow> DeleteRows { get; set; } = new List<DbRow>(); public List<CleanupFile> Files { get; set; } = new List<CleanupFile>(); }
        private sealed class DbRow
        {
            public CustomTableItem Item { get; set; } public int ItemId { get; set; } public DateTime Date { get; set; } public string BulletinType { get; set; } public string Pdf { get; set; } public string Action { get; set; }
            public RowBackup Backup() { return new RowBackup { ItemID = ItemId, Date = Date.ToString("O", CultureInfo.InvariantCulture), BulletinType = BulletinType, Pdf = Pdf }; }
            public CleanupRow Preview() { return new CleanupRow { ItemID = ItemId, Date = Date.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture), BulletinType = BulletinType, Pdf = Pdf, RowAction = Action }; }
        }
        public sealed class CleanupReport
        {
            public string Durum { get; set; } = "Ön kontrol; hiçbir satır/dosya silinmedi";
            public string TableClassName { get; set; } = DailyMarketBulletinsCleanupController.TableClassName;
            public string SourceSha256 { get; set; } public DateTimeOffset SourceCapturedAtUtc { get; set; } public double SourceAgeHours { get; set; }
            public string SourceMinDate { get; set; } public string SourceMaxDate { get; set; } public int SourceRows { get; set; } public int SourceUniqueDateTypes { get; set; }
            public int DbRows { get; set; } public int SourcePresentRows { get; set; } public int ToDeleteRows { get; set; } public int ToQuarantineFiles { get; set; }
            public int SharedFilesKept { get; set; } public int AlreadyMissingFiles { get; set; } public int DeletedRows { get; set; } public int QuarantinedFiles { get; set; }
            public string BackupRoot { get; set; } public string BackupRunFolder { get; set; } public string PlanFingerprint { get; set; } public string PlanToken { get; set; } public DateTimeOffset? PlanExpiresAtUtc { get; set; }
            public MediaPathDiagnostics YolTeshisi { get; set; }
            public List<CleanupRow> Candidates { get; set; } = new List<CleanupRow>(); public List<CleanupRow> ProtectedFutureRows { get; set; } = new List<CleanupRow>();
            public List<CleanupFile> Files { get; set; } = new List<CleanupFile>(); public List<DuplicateGroup> DuplicateGroups { get; set; } = new List<DuplicateGroup>();
            public List<string> Hatalar { get; set; } = new List<string>(); public List<string> Uyarilar { get; set; } = new List<string>();
        }
        public sealed class CleanupRow
        { public int ItemID { get; set; } public string Date { get; set; } public string BulletinType { get; set; } public string Pdf { get; set; } public string RowAction { get; set; } public string PhysicalPath { get; set; } public string FileAction { get; set; } public long? ByteLength { get; set; } public string Sha256 { get; set; } }
        public sealed class CleanupFile
        { public string PhysicalPath { get; set; } public string FileName { get; set; } public bool Exists { get; set; } public long? ByteLength { get; set; } public string Sha256 { get; set; } public string Action { get; set; } public int[] SurvivorItemIds { get; set; } = Array.Empty<int>(); }
        public sealed class DuplicateGroup { public string Date { get; set; } public string BulletinType { get; set; } public int DbCount { get; set; } public int SourceCount { get; set; } public int[] ItemIds { get; set; } }
        public sealed class RowBackup { public int ItemID { get; set; } public string Date { get; set; } public string BulletinType { get; set; } public string Pdf { get; set; } }
        public sealed class RunJournal
        { public string RunFolder { get; set; } public string Status { get; set; } public string Error { get; set; } public string SourceSha256 { get; set; } public string PlanFingerprint { get; set; } public DateTimeOffset StartedAtUtc { get; set; } public DateTimeOffset UpdatedAtUtc { get; set; } public List<RowBackup> Rows { get; set; } public List<MoveRecord> Files { get; set; } }
        public sealed class MoveRecord { public string OriginalPath { get; set; } public string BackupPath { get; set; } public long ByteLength { get; set; } public string Sha256 { get; set; } public string State { get; set; } = "pending"; public string RestoreError { get; set; } }
        public sealed class MediaPathDiagnostics
        { public string ContentRootPath { get; set; } public string WebRootPath { get; set; } public string PathBase { get; set; } public string PublicUrlKlasoru { get; set; } public string MediaPhysicalFolderAyari { get; set; } public string SecilenFizikselKlasor { get; set; } public string Hata { get; set; } public List<MediaFolderCandidate> Adaylar { get; set; } = new List<MediaFolderCandidate>(); }
        public sealed class MediaFolderCandidate { public string Kaynak { get; set; } public string FizikselYol { get; set; } public bool Exists { get; set; } }
    }
}

