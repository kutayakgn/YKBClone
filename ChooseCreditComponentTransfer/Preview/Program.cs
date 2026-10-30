using ChooseCreditPreview;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.DataProtection.Repositories;
using Microsoft.Extensions.FileProviders;
using System.Xml.Linq;

if (args.Contains("--self-test"))
{
    ChooseCreditSelfTests.Run();
    return;
}

var builder = WebApplication.CreateBuilder(args);
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Services.AddControllersWithViews();
builder.Services.AddDataProtection().UseEphemeralDataProtectionProvider()
    .AddKeyManagementOptions(options => options.XmlRepository = new PreviewKeyRepository());
var app = builder.Build();
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(Path.GetFullPath(
        Path.Combine(app.Environment.ContentRootPath, "..", "Web", "wwwroot")))
});
app.MapControllerRoute("preview", "{controller=Preview}/{action=Index}");
app.MapGet("/destination", (string? answer) => Results.Content(
    "<!doctype html><html lang=\"tr\"><meta charset=\"utf-8\"><title>Yönlendirme doğrulandı</title>" +
    "<h1>Yönlendirme doğrulandı</h1><p id=\"destination\">" +
    System.Net.WebUtility.HtmlEncode(answer ?? "sonuç") + "</p></html>", "text/html; charset=utf-8"));
app.Run();

// MVC's key-management startup service also stays entirely in memory in this disposable preview.
file sealed class PreviewKeyRepository : IXmlRepository
{
    private readonly List<XElement> elements = new();
    public IReadOnlyCollection<XElement> GetAllElements() => elements.ToArray();
    public void StoreElement(XElement element, string friendlyName) => elements.Add(new XElement(element));
}
