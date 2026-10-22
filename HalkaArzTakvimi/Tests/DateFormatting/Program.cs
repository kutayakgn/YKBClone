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
