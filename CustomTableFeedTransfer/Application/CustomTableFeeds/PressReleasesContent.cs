using System;
using System.Collections.Generic;

namespace YkbYapikredi.Application.CustomTableFeeds;

public sealed class PressReleasesContent : ICustomTableFeedContent
{
    public string Kind => "press-releases";
    public string ViewName => "~/Views/Shared/CustomTableFeeds/_PressReleases.cshtml";
    public bool UsesClientFiltering => false;
    public int PageSize { get; init; }
    public string Period { get; init; } = string.Empty;
    public IReadOnlyList<int> Years { get; init; } = Array.Empty<int>();
    public PressReleaseResult Result { get; init; } = new PressReleaseResult();
}
