using BitShuva.Models;
using BitShuva.Common;
using Raven.Client;
using Raven.Client.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web;
using System.Web.Http;

namespace BitShuva.Controllers
{
    public abstract class UserContextController : RavenApiController
    {
        protected async Task<User> GetLoggedInUserOrNull()
        {
            var emailAddress = User.Identity.Name;
            if (!string.IsNullOrEmpty(emailAddress))
            {
                return await this.Session
                    .Query<User>()
                    .FirstOrDefaultAsync(u => u.EmailAddress == User.Identity.Name);
            }

            return null;
        }

        protected async Task EnsureIsAdminUser()
        {
            var user = await this.GetLoggedInUserOrNull();
            if (user == null || !user.IsAdmin)
            {
                throw new UnauthorizedAccessException("You must be an admin to perform this action.");
            }
        }
    }
}
