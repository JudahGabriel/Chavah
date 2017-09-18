using Raven.Client;
using System;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.Filters;

namespace BitShuva.Chavah.Controllers
{
    /// <summary>
    /// Controller that saves changes on the RavenDB document session.
    /// </summary>
    public abstract class RavenController : Controller
    {
        protected readonly ILogger logger;

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
    }
}