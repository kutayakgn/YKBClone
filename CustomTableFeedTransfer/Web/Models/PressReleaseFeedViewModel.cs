using System;
using System.Collections.Generic;
using YkbYapikredi.Application.CustomTableFeeds;

namespace YkbYapikredi.Web.Models;

public sealed class PressReleaseFeedViewModel
{
    public string DomId { get; init; } = "press-feed-" + Guid.NewGuid().ToString("N");
    public string Token { get; init; } = string.Empty;
    public string Period { get; init; } = string.Empty;
    public IReadOnlyList<int> Years { get; init; } = Array.Empty<int>();
    public PressReleaseResult Result { get; init; } = new PressReleaseResult();
}
