// Preview-only substitute. The target Kentico application already owns this contract.
namespace YkbYapikredi.Application.Components;

public interface IComponentModel
{
    string ViewName { get; }
    int Order { get; }
}
