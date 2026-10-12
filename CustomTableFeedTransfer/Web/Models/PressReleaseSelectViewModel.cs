using System;
using System.Collections.Generic;
using YkbYapikredi.Application.CustomTableFeeds;

namespace YkbYapikredi.Web.Models;

public sealed class PressReleaseSelectViewModel
{
    public string Name { get; init; } = string.Empty;
    public string Label { get; init; } = string.Empty;
    public string Value { get; init; } = string.Empty;
    public IReadOnlyList<PressReleaseOption> Options { get; init; } = Array.Empty<PressReleaseOption>();
}
