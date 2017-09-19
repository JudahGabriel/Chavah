using Raven.Client;
using System;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.Filters;
using BitShuva.Chavah.Models;
using BitShuva.Chavah.Common;

namespace BitShuva.Chavah.Controllers
{
    /// <summary>
    /// Controller that saves changes on the RavenDB document session.
    /// </summary>
    public abstract class RavenController : Controller
    {
        protected readonly ILogger logger;
        private  AppUser currentUser;
        public SessionToken SessionToken { get; set; }

        protected RavenController(IAsyncDocumentSession dbSession, ILogger logger)
        {
            DbSession = dbSession ?? throw new ArgumentNullException(nameof(dbSession));
            this.logger = logger ?? throw new ArgumentNullException(nameof(logger));

            // RavenDB best practice: during save, wait for the indexes to update.
            // This way, Post-Redirect-Get scenarios won't be affected by stale indexes.
            // For more info, see https://ravendb.net/docs/article-page/3.5/Csharp/client-api/session/saving-changes
            DbSession.Advanced.WaitForIndexesAfterSaveChanges(timeout: TimeSpan.FromSeconds(30), throwOnTimeout: false);
        }

        /// <summary>
        /// Gets the RavenDB document session created for the current request. 
        /// Changes will be saved automatically when the action finishes executing without error.
        /// </summary>
        public IAsyncDocumentSession DbSession { get; private set; }

        /// <summary>
        /// Executes the action. If no error occurred, any changes made in the RavenDB document session will be saved.
        /// </summary>
        /// <param name="context"></param>
        /// <param name="next"></param>
        /// <returns></returns>
        public override async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            var executedContext = await next.Invoke();
            if (executedContext.Exception == null)
            {
                await DbSession.SaveChangesAsync();
            }
        }

        public async Task<AppUser> GetCurrentUser()
        {
            if (this.currentUser != null)
            {
                return this.currentUser;
            }

            if (this.SessionToken != null && !string.IsNullOrEmpty(this.SessionToken.Email))
            {
                using (DbSession.Advanced.DocumentStore.AggressivelyCacheFor(TimeSpan.FromDays(3)))
                {
                    this.currentUser = await DbSession.LoadAsync<AppUser>("ApplicationUsers/" + this.SessionToken.Email);
                }
            }

            return currentUser;
        }
    }
}