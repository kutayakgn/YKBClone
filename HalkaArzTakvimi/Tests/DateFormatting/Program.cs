using System.Text.Json;
using System.Text.RegularExpressions;
using YkbYapikredi.Application.CustomTableFeeds;

var count = 0;
void Valid(string days, int month, int year, string expected)
{
    if (!IpoCalendarDates.TryNormalize(days, month, year, out var normalized,
            out var display, out var date, out var error))
        throw new Exception(error);
    if (display != expected || normalized.Contains(',') || date.Month != month || date.Year != year)
        throw new Exception($"Beklenen: {expected}; üretilen: {display}");
    count++;
}
void Invalid(string days, int month, int year)
{
    if (IpoCalendarDates.TryNormalize(days, month, year, out _, out _, out _, out _))
        throw new Exception($"Geçersiz tarih kabul edildi: {days}/{month}/{year}");
    count++;
}

using var data = JsonDocument.Parse(File.ReadAllText(Path.Combine(AppContext.BaseDirectory, "source-date-cases.json")));
foreach (var row in data.RootElement.EnumerateArray())
{
    var expected = Regex.Replace(row.GetProperty("dateText").GetString()!, @",\s*(?=\d{1,2}\s+[\p{L}])", " - ");
    Valid(row.GetProperty("days").GetString()!, row.GetProperty("month").GetInt32(),
        row.GetProperty("year").GetInt32(), expected);
}
Valid("9 10 11", 9, 2026, "9-10-11 Eylül 2026");
Valid("29 30 1", 6, 2026, "29-30 Haziran - 1 Temmuz 2026");
Valid("28 29 1", 2, 2024, "28-29 Şubat - 1 Mart 2024");
Valid("30 31 1", 12, 2026, "30-31 Aralık 2026 - 1 Ocak 2027");
Invalid("31", 2, 2026);
Invalid("29", 2, 2025);
Invalid("9 9", 9, 2026);
Invalid("0 1", 9, 2026);
Invalid("", 9, 2026);
Invalid("1", 13, 2026);
Invalid("31 1", 12, 9999);
Console.WriteLine($"{count} C# tarih senaryosu geçti.");

var urlCount = 0;
void UrlCase(string source, string expected, string? currentHost = null)
{
    if (!IpoCalendarUrls.TryNormalize(source, out var result, out var error, currentHost) || result != expected)
        throw new Exception($"URL: {source}; beklenen {expected}; üretilen {result}; {error}");
    // Tekrar çalıştırma aynı sonucu vermeli.
    if (!IpoCalendarUrls.TryNormalize(result, out var again, out _, currentHost) || again != result)
        throw new Exception("URL dönüşümü idempotent değil.");
    urlCount++;
}
using var urlData = JsonDocument.Parse(File.ReadAllText(Path.Combine(AppContext.BaseDirectory, "url-normalization-cases.json")));
foreach (var row in urlData.RootElement.EnumerateArray())
    UrlCase(row.GetProperty("before").GetString()!, row.GetProperty("after").GetString()!);
UrlCase("https://www.yapikredi.com.tr/asd?q=1#detay", "/asd?q=1#detay");
UrlCase("https://yapikredi.com.tr/", "/");
UrlCase("//www.yapikredi.com.tr/asd", "/asd");
UrlCase("~/asd", "/asd");
UrlCase("/asd", "/asd");
UrlCase("https://localhost:44302/asd", "/asd", "localhost");
foreach (var source in new[] { "https://example.com/asd", "javascript:alert(1)", "https://user:pass@www.yapikredi.com.tr/asd", "https://www.yapikredi.com.tr//example.com", "" })
{
    if (IpoCalendarUrls.TryNormalize(source, out _, out _)) throw new Exception("URL atlanmalıydı: " + source);
    urlCount++;
}
Console.WriteLine($"{urlCount} C# URL senaryosu geçti.");
