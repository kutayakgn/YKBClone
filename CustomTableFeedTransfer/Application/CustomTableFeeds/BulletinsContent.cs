using System;
using System.Collections.Generic;

namespace YkbYapikredi.Application.CustomTableFeeds;

public sealed class BulletinsContent : ICustomTableFeedContent
{
    public string Kind => "bulletins";
    public string ViewName { get; init; } = string.Empty;
    public IReadOnlyList<BulletinRow> Rows { get; init; } = Array.Empty<BulletinRow>();
}

public sealed class BulletinRow
{
    public DateTime Date { get; init; }
    public string BulletinType { get; init; } = string.Empty;
    public string Pdf { get; init; } = string.Empty;
}
