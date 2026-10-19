using System;
using CMS.DocumentEngine;
using YkbYapikredi.Application.Components;
using CmsButtonComponent = CMS.DocumentEngine.Types.YkbYapikredi.ButtonComponent;

namespace YkbYapikredi.Infrastructure.Components.Mappers
{
    public sealed class ButtonComponentMapper : IComponentMapper
    {
        public string ClassName => CmsButtonComponent.CLASS_NAME;

        public IComponentModel Map(TreeNode node)
        {
            return new ButtonComponentModel
            {
                Order = node.NodeOrder,
                Label = ComponentFields.String(node, nameof(CmsButtonComponent.Label)),
                ButtonClass = ParseButtonClass(ComponentFields.String(node, nameof(CmsButtonComponent.ButtonClass))),
                ButtonSize = ParseButtonSize(ComponentFields.String(node, "ButtonSize")),
                // Generated sınıftaki Icon1 özelliğinin CMS alanı "Icon".
                Icon = ComponentFields.String(node, "Icon"),
                Url = SafeUrl(ComponentFields.String(node, nameof(CmsButtonComponent.Url))),
                MobilUrl = SafeUrl(ComponentFields.String(node, nameof(CmsButtonComponent.MobilUrl))),
                IsDisabled = ComponentFields.Bool(node, nameof(CmsButtonComponent.IsDisabled)),
                DesktopTarget = ParseTarget(ComponentFields.String(node, nameof(CmsButtonComponent.DesktopTarget))),
                MobilTarget = ParseTarget(ComponentFields.String(node, nameof(CmsButtonComponent.MobilTarget))),
                OpenModalOnPageLoad = ComponentFields.Bool(node, nameof(CmsButtonComponent.OpenModalOnPageLoad)),
                ModalReference = ComponentFields.String(node, nameof(CmsButtonComponent.ModalReference))
            };
        }

        private static string ParseButtonClass(string value) =>
            value.Trim().ToLowerInvariant() switch
            {
                "secondary" => "secondary",
                "danger" => "danger",
                "success" => "success",
                "warning" => "warning",
                "info" => "info",
                "outline" => "outline",
                "ghost" => "ghost",
                "action-link" => "action-link",
                "animated-cta" => "animated-cta",
                _ => "primary"
            };

        private static string ParseButtonSize(string value) =>
            value.Trim().ToLowerInvariant() switch
            {
                "sm" => "sm",
                "xs" => "xs",
                _ => "md"
            };

        private static ButtonLinkTarget ParseTarget(string value) =>
            value.Trim().ToLowerInvariant() switch
            {
                "_blank" => ButtonLinkTarget._blank,
                "_modal" => ButtonLinkTarget._modal,
                "_popupwindow" => ButtonLinkTarget._popupwindow,
                _ => ButtonLinkTarget._self
            };

        private static string SafeUrl(string value)
        {
            value = value.Trim();
            if (value.StartsWith("/", StringComparison.Ordinal) ||
                value.StartsWith("#", StringComparison.Ordinal) ||
                value.StartsWith("~/", StringComparison.Ordinal))
            {
                return value;
            }
            if (Uri.TryCreate(value, UriKind.Absolute, out var uri) &&
                (uri.Scheme == Uri.UriSchemeHttp ||
                 uri.Scheme == Uri.UriSchemeHttps ||
                 uri.Scheme == Uri.UriSchemeMailto))
            {
                return value;
            }
            return string.Empty;
        }
    }
}
