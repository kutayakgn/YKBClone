namespace YkbYapikredi.Application.Layout;

/// <summary>
/// Bu klonda LayoutData'nın modal referans çözümlemesini derlenebilir tutan minimum sözleşme.
/// Asıl projede daha kapsamlı bir ModalDto varsa bu dosya taşınmamalıdır.
/// </summary>
public class ModalDto
{
    public Guid Id { get; init; }
    public int NodeId { get; init; }
    public string Path { get; init; } = string.Empty;
}
