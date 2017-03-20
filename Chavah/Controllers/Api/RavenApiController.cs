using Raven.Client;
using System;
using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Http;
using System.Web.Http.Controllers;
using BitShuva.Common;
using BitShuva.Models;
using Microsoft.AspNet.Identity.Owin;
using BitShuva.Interfaces;

namespace BitShuva.Controllers
{
    public abstract class RavenApiController : ApiController
    {

        private ApplicationUser currentUser;
        private ILoggerService _logger;
        public IAsyncDocumentSession DbSession { get; private set; }
        public SessionToken SessionToken { get; set; }

        public RavenApiController(ILoggerService logger)
        {
            _logger = logger;
        }

        public RavenApiController()
        {
        }

        protected override void Initialize(HttpControllerContext controllerContext)
        {
            base.Initialize(controllerContext);
            DbSession = controllerContext.Request.GetOwinContext().Get<IAsyncDocumentSession>();
        }

        public async override Task<HttpResponseMessage> ExecuteAsync(
            HttpControllerContext controllerContext,
            CancellationToken cancellationToken)
        {
            using (DbSession)
            {
                HttpResponseMessage result;
                try
                {
                    result = await base.ExecuteAsync(controllerContext, cancellationToken);
                }
                catch (Exception error)
                    when (!(error is TaskCanceledException)) // We don't care if it's just a TaskCancelledException.
                {
                    await TryLogSaveChangesError(error, $"Error executing controller action {controllerContext.Request?.RequestUri}. Current user Id = {SessionToken?.Email}");
                    throw; // Throw, because we don't want to try to save changes below.
                }

                try
                {
                    await DbSession.SaveChangesAsync();
                    DbSession.Advanced.WaitForIndexesAfterSaveChanges(TimeSpan.FromSeconds(5), false);
                }
                catch (Exception error)
                {
                    await TryLogSaveChangesError(error, "Error saving changes for {controllerContext?.ControllerDescriptor?.ControllerName}.{controllerContext?.Request?.GetActionDescriptor()?.ActionName}. Current user Id = {SessionToken?.Email}");
                }

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
            if (user == null || !user.IsAdmin())
            {
                throw NewUnauthorizedException();
            }
        }

        protected HttpResponseException NewUnauthorizedException()
        {
            return new HttpResponseException(HttpStatusCode.Unauthorized);
        }

        private async Task TryLogSaveChangesError(Exception error, string message)
        {
            using (var errorSession = RavenContext.Db.OpenAsyncSession())
            {
                try
                {
                    await _logger.Error(message, error.ToString(), error);
                }
                catch (Exception)
                {
                    // Can't log the error? We're fsked. Eat it.
                }
            }
        }
    }
}
