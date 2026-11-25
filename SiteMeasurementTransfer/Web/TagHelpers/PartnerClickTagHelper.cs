using Microsoft.AspNetCore.Razor.TagHelpers;

namespace YkbYapikredi.Web.TagHelpers
{
    [HtmlTargetElement("a", Attributes = "ykb-partner-click")]
    public sealed class PartnerClickTagHelper : TagHelper
    {
        [HtmlAttributeName("ykb-partner-click")]
        public string? PartnerClick { get; set; }

        public override void Process(TagHelperContext context, TagHelperOutput output)
        {
            output.Attributes.RemoveAll("ykb-partner-click");
            if (!string.IsNullOrWhiteSpace(PartnerClick))
            {
                output.Attributes.SetAttribute("data-partner-click", PartnerClick.Trim());
            }
        }
    }
}
