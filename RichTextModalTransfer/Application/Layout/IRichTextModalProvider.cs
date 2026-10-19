using System;

namespace YkbYapikredi.Application.Layout;

public interface IRichTextModalProvider
{
    ModalDto? Get(Guid id, string culture);
}
