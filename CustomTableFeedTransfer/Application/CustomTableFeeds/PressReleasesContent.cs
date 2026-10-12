namespace YkbYapikredi.Application.CustomTableFeeds;

// Marker: data is queried by the MVC ViewComponent, never loaded into this object.
public sealed class PressReleasesContent : ICustomTableFeedContent
{
    public string Kind => "press-releases";
    public string ViewName => "~/Views/Shared/CustomTableFeeds/_PressReleases.cshtml";
}
