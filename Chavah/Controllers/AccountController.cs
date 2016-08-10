using BitShuva.Models;
using Chavah.Common;
using Raven.Client;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.ServiceModel.Syndication;
using System.Text;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;
using System.Web.Security;

namespace BitShuva.Controllers
{
    public class AccountController : RavenController
    {
        [HttpPost]
        [AllowAnonymous]
        public async Task<string> SignIn(string assertion)
        {
            if (assertion == null)
            {
                throw new ArgumentNullException("assertion");
            }

            // Build the data we're going to POST.
            var data = new System.Collections.Specialized.NameValueCollection();
            var requestUri = Request.Url;
            data["assertion"] = assertion;
            data["audience"] = String.Format("{0}://{1}", requestUri.Scheme, requestUri.Authority);

            // POST the data to the Persona provider.
            var response = default(byte[]);
            using (var web = new WebClient())
            {
                response = await web.UploadValuesTaskAsync("https://verifier.login.persona.org/verify", "POST", data);
            }

            // Convert the response to JSON.
            var buffer = Encoding.Convert(Encoding.GetEncoding("iso-8859-1"), Encoding.UTF8, response);
            var tempstring = Encoding.UTF8.GetString(buffer, 0, response.Length);
            dynamic result = Newtonsoft.Json.JsonConvert.DeserializeObject(tempstring);
            if (result.status.Value == "okay")
            {
                string email = result.email;
                await this.EnsureUserInDbWithEmail(email);

                FormsAuthentication.SetAuthCookie(email, true);
                return email;
            }

            throw new Exception("Couldn't sign in user. " + result.status.Value);
        }

        [HttpPost]
        [Authorize]
        public void SignOut()
        {
            FormsAuthentication.SignOut();
        }

        private async Task EnsureUserInDbWithEmail(string email)
        {
            // Find an existing user with that email address.
            var existingUserWithEmail = await this.Session.Query<User>()
                .FirstOrDefaultAsync(u => u.EmailAddress == email);
            if (existingUserWithEmail != null)
            {
                existingUserWithEmail.LastSeen = DateTime.UtcNow;
                return;
            }

            // No user exists with that email.
            // Is this a user from the old system, before we had persistent logins?
            var isUserFromOldSystem = false;
            var userCookie = HttpContext.Request.Cookies["userIdValue"];
            if (userCookie != null)
            {
                var user = await this.Session.LoadAsync<User>(userCookie.Value);
                if (user != null && string.IsNullOrEmpty(user.EmailAddress))
                {
                    isUserFromOldSystem = true;
                    user.EmailAddress = email;
                    user.LastSeen = DateTime.UtcNow;
                    user.RegistrationDate = DateTime.UtcNow;
                }
            }

            // No existing user with that email address, and not a user from the old system.
            // Create a new user.
            if (existingUserWithEmail == null && !isUserFromOldSystem)
            {
                await this.Session.StoreAsync(new User
                {
                    EmailAddress = email,
                    IsAdmin = false,
                    LastSeen = DateTime.UtcNow,
                    RegistrationDate = DateTime.UtcNow
                });
            }
        }

        [HttpGet]
        public async Task<ActionResult> RegisteredUsers()
        {
            var lastRegisteredUsers = await this.Session
                .Query<User>()
                .Where(u => u.EmailAddress != null)
                .OrderByDescending(a => a.RegistrationDate)
                .Take(100)
                .ToListAsync();
            var feedItems = from user in lastRegisteredUsers
                            select new SyndicationItem(
                                id: user.Id,
                                lastUpdatedTime: user.RegistrationDate,
                                title: user.EmailAddress,
                                content: "A new user registered on Chavah on " + user.RegistrationDate.ToString() + " with email address " + user.EmailAddress,
                                itemAlternateLink: new Uri("http://messianicradio.com/?user=" + Uri.EscapeUriString(user.Id))
                            );

            var feed = new SyndicationFeed("Chavah Messianic Radio", "The most recent registered users at Chavah Messianic Radio", new Uri("http://messianicradio.com"), feedItems) { Language = "en-US" };
            return new RssActionResult { Feed = feed };
        }
    }
}