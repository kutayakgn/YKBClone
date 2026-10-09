using System;
using System.Collections.Generic;

namespace YkbYapikredi.Application.CustomTableFeeds;

public sealed class ContractedProjectsContent : ICustomTableFeedContent
{
    public string Kind => "projects";
    public string ViewName => "~/Views/Shared/CustomTableFeeds/_ContractedProjects.cshtml";
    public IReadOnlyList<ContractedProjectRow> Rows { get; init; } = Array.Empty<ContractedProjectRow>();
}

public sealed class ContractedProjectRow
{
    public string ProjectName { get; init; } = string.Empty;
    public string FirmName { get; init; } = string.Empty;
    public string Image { get; init; } = string.Empty;
    public string District { get; init; } = string.Empty;
    public string City { get; init; } = string.Empty;
    public string WebsiteUrl { get; init; } = string.Empty;
    public string Branch { get; init; } = string.Empty;
    public string Phone { get; init; } = string.Empty;
}
