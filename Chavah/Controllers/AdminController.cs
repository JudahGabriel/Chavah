using BitShuva.Models;
using Raven.Imports.Newtonsoft.Json;
using Raven.Client;
using Raven.Client.Linq;
using System;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;
using System.Web.Security;

namespace BitShuva.Controllers
{
    [RequireHttps]
    public class AdminController : RavenController
    {
        public JsonResult IsAdmin()
        {
            return Json(new
            {
                IsAdmin = User.Identity.IsAuthenticated,
                Email = User.Identity.Name
            }, JsonRequestBehavior.AllowGet);
        }

        public async Task<ActionResult> Index()
        {
            // If there are no users, go to the login page.
            var isAuthenticated = User.Identity.IsAuthenticated;
            var hasAdminUser = await this.HasAdminUser();
            if (!hasAdminUser || !isAuthenticated)
            {
                return RedirectToAction("Login", "Admin");
            }

            ViewBag.UserName = User.Identity.Name;
            return View();
        }

        public ActionResult CreateUser()
        {
            return View();
        }

        public async Task<ActionResult> Login()
        {
            var isAuthenticated = User.Identity.IsAuthenticated;
            var hasAdminUser = await this.HasAdminUser();
            if (!hasAdminUser)
            {
                ViewBag.NeedsToCreateUser = true;
                return View();
            }
            else if (!isAuthenticated)
            {
                ViewBag.NeedsToCreateUser = false;
                return View();
            }
            else
            {
                return RedirectToAction("Index", "Admin");
            }
        }

        [HttpPost]
        public ActionResult Logout()
        {
            FormsAuthentication.SignOut();
            return RedirectToAction("Login", "Admin");
        }

        [HttpPost]
        public async Task<ActionResult> PersonaLogin(string assertion)
        {
            if (assertion == null)
            {
                // The 'assertion' key of the API wasn't POSTED. Redirect.
                return RedirectToAction("Index", "Admin");
            }
            
            // Build the data we're going to POST.
            var data = new NameValueCollection();
            data["assertion"] = assertion;
            data["audience"] = String.Format("{0}://{1}", Request.Url.Scheme, Request.Url.Authority);

            // POST the data to the Persona provider (in this case Mozilla)
            var response = default(byte[]);
            using (var web = new WebClient())
            {
                response = await web.UploadValuesTaskAsync("https://verifier.login.persona.org/verify", "POST", data);
            }
            
            // Convert the response to JSON.
            var buffer = Encoding.Convert(Encoding.GetEncoding("iso-8859-1"), Encoding.UTF8, response);
            var tempstring = Encoding.UTF8.GetString(buffer, 0, response.Length);
            dynamic result = JsonConvert.DeserializeObject(tempstring);
            if (result.status.Value == "okay")
            {
                string email = result.email;
                var isUserAdmin = await this.Session.Query<User>().AnyAsync(u => u.EmailAddress == email && u.IsAdmin);
                if (isUserAdmin)
                {
                    FormsAuthentication.SetAuthCookie(email, true);
                    return RedirectToAction("Index", "Durandal");
                }
            }

            throw new HttpException((int)HttpStatusCode.Unauthorized, "You are not authorized to access admin.");
        }

        private async Task<bool> HasAdminUser()
        {
            return await this.Session
                .Query<User>()
                .Where(u => u.IsAdmin)
                .Customize(c => c.WaitForNonStaleResultsAsOfNow())
                .AnyAsync();
        }
    }
}