using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;
using YKBClone.Models;
using YkbYapikredi.Application.Layout;

namespace YKBClone.Controllers
{
    public class HomeController : Controller
    {
        public IActionResult Index()
        {
            ViewData["LayoutData"] = LayoutData.Create(YkbClone.MockLayoutContent.Create());
            ViewData["IsHomePage"] = true;
            return View();
        }

        public IActionResult Privacy()
        {
            ViewData["LayoutData"] = LayoutData.Create(YkbClone.MockLayoutContent.Create());
            ViewData["IsHomePage"] = false;
            return View();
        }

        [HttpGet("/header-test")]
        public IActionResult HeaderTest()
        {
            ViewData["LayoutData"] = LayoutData.Create(YkbClone.MockLayoutContent.Create());
            ViewData["IsHomePage"] = false;
            return View();
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            ViewData["LayoutData"] = LayoutData.Create(YkbClone.MockLayoutContent.Create());
            ViewData["IsHomePage"] = false;
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}
