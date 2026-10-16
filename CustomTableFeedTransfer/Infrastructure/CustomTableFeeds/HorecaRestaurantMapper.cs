using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using CMS.CustomTables;
using CMS.Helpers;
using YkbYapikredi.Application.CustomTableFeeds;

namespace YkbYapikredi.Infrastructure.CustomTableFeeds;

// Custom table row mapper; IComponentMapper is for CMS page TreeNode components.
public sealed class HorecaRestaurantMapper
{
    public HorecaRestaurantsContent Map(IEnumerable<CustomTableItem> items)
    {
        var branches = items.Select(item => new HorecaBranchModel
        {
            ItemId = ValidationHelper.GetInteger(item.GetValue("ItemID"), 0),
            RestaurantName = Text(item, "RestaurantName"), BranchName = Text(item, "BranchName"),
            City = Text(item, "City"), Address = Text(item, "Address"),
            PhoneNumber = Text(item, "PhoneNumber"), Website = FeedUrls.Safe(Text(item, "Website")),
            Image = FeedUrls.Safe(Text(item, "Media")), Gallery = Gallery(Text(item, "Gallery"))
        }).Where(branch => branch.RestaurantName.Length > 0).OrderBy(branch => branch.ItemId).ToArray();
        return new HorecaRestaurantsContent
        {
            Restaurants = branches.GroupBy(branch => new { Tab = Tab(branch), Name = Normalize(branch.RestaurantName) })
                .Select(group => new HorecaRestaurantModel
                {
                    Name = group.First().RestaurantName, TabKey = group.Key.Tab,
                    Image = group.Select(branch => branch.Image).FirstOrDefault(image => image.Length > 0) ?? string.Empty,
                    Branches = group.ToArray()
                }).ToArray()
        };
    }
    private static string Text(CustomTableItem item, string field) =>
        ValidationHelper.GetString(item.GetValue(field), string.Empty).Trim();

    private static IReadOnlyList<string> Gallery(string value) => value
        .Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries)
        .Select(FeedUrls.Safe).Where(url => url.Length > 0).Distinct(StringComparer.Ordinal).ToArray();

    private static string Normalize(string value)
    {
        var text = value.Replace('İ', 'I').Replace('ı', 'i').Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder();
        foreach (var character in text)
            if (CharUnicodeInfo.GetUnicodeCategory(character) != UnicodeCategory.NonSpacingMark)
                builder.Append(character);
        return Regex.Replace(builder.ToString().ToLowerInvariant().Trim(), @"\s+", " ");
    }
    private static bool Has(string text, string word) => Regex.IsMatch(text,
        @"(?<![\p{L}\p{N}])" + Regex.Escape(word) + @"(?![\p{L}\p{N}])", RegexOptions.CultureInvariant);

    private static string Tab(HorecaBranchModel branch)
    {
        var city = Normalize(branch.City);
        var location = Normalize(branch.BranchName + " " + branch.Address);
        if (city == "izmir")
            return Has(location, "urla") ? "urla" : Has(location, "cesme") ? "cesme" : "izmir";
        if (city == "mugla")
            return Has(location, "bodrum") ? "bodrum" : Has(location, "fethiye") ? "fethiye" : Has(location, "marmaris") ? "marmaris" : "diger";
        if (city == "balikesir") return Has(location, "ayvalik") ? "ayvalik" : "diger";
        if (city == "nevsehir") return "kapadokya";
        if (new[] { "istanbul", "ankara", "antalya", "urla", "cesme", "bodrum", "kapadokya", "ayvalik", "fethiye", "marmaris" }.Contains(city)) return city;
        if (new[] { "kayseri", "aksaray", "nigde" }.Contains(city) && Has(location, "kapadokya")) return "kapadokya";
        if (city.Length == 0)
        {
            foreach (var key in new[] { "urla", "cesme", "bodrum", "fethiye", "marmaris", "ayvalik", "kapadokya", "istanbul", "izmir", "ankara", "antalya" })
                if (Has(location, key)) return key;
            if (Has(location, "nevsehir")) return "kapadokya";
        }
        return "diger";
    }
}
