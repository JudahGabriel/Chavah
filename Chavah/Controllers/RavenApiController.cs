using Raven.Client;
using Raven.Client.Document;
using Raven.Client.Indexes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Http;
using System.Web.Http.Controllers;
using BitShuva.Common;
using BitShuva.Models;

namespace BitShuva.Controllers
{
    public abstract class RavenApiController : ApiController
    {
        public IAsyncDocumentSession DbSession { get; private set; }
        public SessionToken SessionToken { get; set; }

        private ApplicationUser currentUser;

        public async override Task<HttpResponseMessage> ExecuteAsync(
            HttpControllerContext controllerContext,
            CancellationToken cancellationToken)
        {
            using (DbSession = RavenContext.Db.OpenAsyncSession())
            {
                var result = await base.ExecuteAsync(controllerContext, cancellationToken);
                await DbSession.SaveChangesAsync();

                return result;
            }
        }

        public async Task<ApplicationUser> GetCurrentUser()
        {
            if (this.currentUser != null)
            {
                return this.currentUser;
            }

            if (this.SessionToken != null && !string.IsNullOrEmpty(this.SessionToken.Email))
            {
                using (DbSession.Advanced.DocumentStore.AggressivelyCacheFor(TimeSpan.FromDays(3)))
                {
                    this.currentUser = await DbSession.LoadAsync<ApplicationUser>("ApplicationUsers/" + this.SessionToken.Email);
                }
            }

            return currentUser;
        }

        // TODO: replace this method with the [Authorize] attribute. Need to implement JWT auth provider. http://bitoftech.net/2015/02/16/implement-oauth-json-web-tokens-authentication-in-asp-net-web-api-and-identity-2/
        public async Task RequireAdminUser()
        {
            var user = await this.GetCurrentUser();
            if (user == null || !user.IsAdmin)
            {
                throw NewUnauthorizedException();
            }
        }

        protected HttpResponseException NewUnauthorizedException()
        {
            return new HttpResponseException(HttpStatusCode.Unauthorized);
        }
    }
}
