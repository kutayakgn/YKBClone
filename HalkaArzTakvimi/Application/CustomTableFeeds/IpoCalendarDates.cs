using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text.RegularExpressions;

namespace YkbYapikredi.Application.CustomTableFeeds;

public static class IpoCalendarDates
{
    private static readonly string[] Months =
    {
        "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
        "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
    };

    // Günler kronolojik girilir. Küçük gün numarasına dönüş sonraki ayı belirtir.
    // Days="29 30 1", Month=6, Year=2026 -> 29-30 Haziran - 1 Temmuz 2026.
    public static bool TryNormalize(string days, int month, int year,
        out string normalizedDays, out string displayText, out DateTime startDate, out string error)
    {
        normalizedDays = string.Empty;
        displayText = string.Empty;
        startDate = default;
        error = string.Empty;
        if (year < 1900 || year > 9999 || month < 1 || month > 12)
        { error = "Year veya Month geçersiz."; return false; }
        var input = (days ?? string.Empty).Trim();
        if (!Regex.IsMatch(input, @"^\d{1,2}(?:[\s,\-]+\d{1,2})*$"))
        { error = "Days yalnızca kronolojik gün numaraları içermeli."; return false; }
        var values = Regex.Matches(input, @"\d+").Cast<Match>()
            .Select(match => int.Parse(match.Value, CultureInfo.InvariantCulture)).ToArray();
        var segments = new List<DateSegment>();
        var currentMonth = month;
        var currentYear = year;
        var previousDay = 0;
        foreach (var day in values)
        {
            if (day == previousDay)
            { error = "Days içinde aynı gün arka arkaya tekrar edemez."; return false; }
            if (day < previousDay)
            {
                currentMonth++;
                if (currentMonth == 13) { currentMonth = 1; currentYear++; }
                if (currentYear > 9999)
                { error = "Tarih desteklenen yıl aralığını aşıyor."; return false; }
            }
            if (day < 1 || day > DateTime.DaysInMonth(currentYear, currentMonth))
            { error = "Days seçilen ay için geçersiz bir gün içeriyor."; return false; }
            if (segments.Count == 0 || segments[segments.Count - 1].Month != currentMonth ||
                segments[segments.Count - 1].Year != currentYear)
                segments.Add(new DateSegment { Month = currentMonth, Year = currentYear });
            segments[segments.Count - 1].Days.Add(day);
            previousDay = day;
        }
        startDate = new DateTime(year, month, values[0]);
        normalizedDays = string.Join(" ", values);
        var crossesYear = segments.Any(segment => segment.Year != year);
        displayText = string.Join(" - ", segments.Select(segment =>
            string.Join("-", segment.Days) + " " + Months[segment.Month - 1] +
            (crossesYear ? " " + segment.Year.ToString(CultureInfo.InvariantCulture) : string.Empty)));
        if (!crossesYear) displayText += " " + year.ToString(CultureInfo.InvariantCulture);
        return true;
    }

    private sealed class DateSegment
    {
        public int Month { get; init; }
        public int Year { get; init; }
        public List<int> Days { get; } = new List<int>();
    }
}
