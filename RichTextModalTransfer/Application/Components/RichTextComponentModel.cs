namespace YkbYapikredi.Application.Components;

public sealed class RichTextComponentModel : IComponentModel
{
    public const string View = "~/Views/Shared/Components/_RichTextComponent.cshtml";
    public int Order { get; init; }
    public string Content { get; init; } = string.Empty;
    public string ViewName => View;
    // Local HTML inspection only; no CMS/DB access and no modal-reference provider.
    public bool ContainsModalLinks => RichTextModalLinks.Contains(Content);
}
