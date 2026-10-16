using System;
using System.Collections.Generic;

namespace YkbYapikredi.Application.CustomTableFeeds;

public sealed class HorecaRestaurantsContent : ICustomTableFeedContent
{
    public string Kind => "restaurants";
    public string ViewName => "~/Views/Shared/CustomTableFeeds/_HorecaRestaurants.cshtml";
    public IReadOnlyList<HorecaRestaurantModel> Restaurants { get; init; } = Array.Empty<HorecaRestaurantModel>();
    public static IReadOnlyList<HorecaCityTab> Tabs { get; } = Array.AsReadOnly(new[]
    {
        new HorecaCityTab("istanbul", "İstanbul"), new HorecaCityTab("izmir", "İzmir"),
        new HorecaCityTab("ankara", "Ankara"), new HorecaCityTab("urla", "Urla"),
        new HorecaCityTab("cesme", "Çeşme"), new HorecaCityTab("bodrum", "Bodrum"),
        new HorecaCityTab("antalya", "Antalya"), new HorecaCityTab("kapadokya", "Kapadokya"),
        new HorecaCityTab("ayvalik", "Ayvalık"), new HorecaCityTab("fethiye", "Fethiye"),
        new HorecaCityTab("marmaris", "Marmaris"), new HorecaCityTab("diger", "Diğer")
    });
}

public sealed class HorecaCityTab
{
    public HorecaCityTab(string key, string label) { Key = key; Label = label; }
    public string Key { get; }
    public string Label { get; }
}

public sealed class HorecaRestaurantModel
{
    public string Name { get; init; } = string.Empty;
    public string TabKey { get; init; } = string.Empty;
    public string Image { get; init; } = string.Empty;
    public IReadOnlyList<HorecaBranchModel> Branches { get; init; } = Array.Empty<HorecaBranchModel>();
    public bool HasBranches => Branches.Count > 1;
}

public sealed class HorecaBranchModel
{
    public int ItemId { get; init; }
    public string RestaurantName { get; init; } = string.Empty;
    public string BranchName { get; init; } = string.Empty;
    public string City { get; init; } = string.Empty;
    public string Address { get; init; } = string.Empty;
    public string PhoneNumber { get; init; } = string.Empty;
    public string Website { get; init; } = string.Empty;
    public string Image { get; init; } = string.Empty;
    public IReadOnlyList<string> Gallery { get; init; } = Array.Empty<string>();
}
