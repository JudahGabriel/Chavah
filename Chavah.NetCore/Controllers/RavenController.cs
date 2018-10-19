using System;
using System.Threading.Tasks;
using BitShuva.Chavah.Common;
using BitShuva.Chavah.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Logging;
using Raven.Client.Documents.Session;
using Raven.Client.Exceptions;
using Raven.StructuredLog;

namespace BitShuva.Chavah.Controllers
{
    /// <summary>
    /// Controller that saves changes on the RavenDB document session.
    /// </summary>
    public abstract class RavenController : Controller
    {
        protected readonly ILogger logger;
        private  AppUser currentUser;

        protected RavenController(IAsyncDocumentSession dbSession, ILogger logger)
        {
            DbSession = dbSession ?? throw new ArgumentNullException(nameof(dbSession));
            this.logger = logger ?? throw new ArgumentNullException(nameof(logger));

            // RavenDB best practice: during save, wait for the indexes to update.
            // This way, Post-Redirect-Get scenarios won't be affected by stale indexes.
            // For more info, see https://ravendb.net/docs/article-page/3.5/Csharp/client-api/session/saving-changes
            DbSession.Advanced.WaitForIndexesAfterSaveChanges(timeout: TimeSpan.FromSeconds(3), throwOnTimeout: false);
        }

        /// <summary>
        /// Gets the RavenDB document session created for the current request. 
        /// Changes will be saved automatically when the action finishes executing without error.
        /// </summary>
        public IAsyncDocumentSession DbSession { get; }

        /// <summary>
        /// Executes the action. If no error occurred, any changes made in the RavenDB document session will be saved.
        /// </summary>
        /// <param name="context"></param>
        /// <param name="next"></param>
        /// <returns></returns>
        public override async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            var executedContext = await next.Invoke();
            var httpMethodOrNull = context?.HttpContext?.Request?.Method;
            if (executedContext.Exception == null && httpMethodOrNull != "GET" && DbSession.Advanced.HasChanges)
            {
                try
                {
                    await DbSession.SaveChangesAsync()
                        .ConfigureAwait(false);
                }
                catch (Exception ex)
                {
                    HandleKnownExceptions(ex, context, "Exception while saving changes");
                }
            }
            else if (executedContext.Exception != null) // An exception occurred while executing the method.
            {
                HandleKnownExceptions(executedContext.Exception, context, "Exception while executing action");
            }
        }

        [ApiExplorerSettings(IgnoreApi = true)]
        public async Task<AppUser> GetCurrentUserOrThrow()
        {
            var currentUser = await GetCurrentUser().ConfigureAwait(false);
            if (currentUser == null)
            {
                throw new UnauthorizedAccessException().WithData("userName", User.Identity.Name);
            }

            return currentUser;
        }

        [ApiExplorerSettings(IgnoreApi = true)]
        public async Task<AppUser> GetCurrentUser()
        {
            if (currentUser != null)
            {
                return currentUser;
            }

            var email = User.Identity.Name;
            if (!string.IsNullOrEmpty(email))
            {
                currentUser = await DbSession.LoadAsync<AppUser>("AppUsers/" + email)
                    .ConfigureAwait(false);
            }

            return currentUser;
        }

        protected string GetUserIdOrThrow()
        {
            var userId = GetUserId();
            if (!string.IsNullOrEmpty(userId))
            {
                return userId;
            }

            throw new UnauthorizedAccessException();
        }

        protected string GetUserId()
        {
            if (User.Identity.IsAuthenticated && !string.IsNullOrEmpty(User.Identity.Name))
            {
                return AppUser.AppUserPrefix + User.Identity.Name;
            }

            return null;
        }

        private void HandleKnownExceptions(Exception error, ActionExecutingContext actionContext, string errorContext)
        {
            using (logger.BeginKeyValueScope("user", User?.Identity?.Name))
            using (logger.BeginKeyValueScope("action", actionContext?.ActionDescriptor?.DisplayName))
            using (logger.BeginKeyValueScope("errorContext", errorContext))
            {
                if (error is UnauthorizedAccessException)
                {
                    logger.LogWarning(error.Message);
                }
                else if (error is RavenException ravenEx &&
                    ravenEx.Message.Contains("The server returned an invalid or unrecognized response", StringComparison.InvariantCultureIgnoreCase))
                {
                    logger.LogError(ravenEx.Message);
                }
                else if (error is TaskCanceledException)
                {
                    logger.LogInformation("Task cancelled");
                }
                else if (error is RavenException && 
                    error.Message.StartsWith("An exception occurred while contacting", StringComparison.InvariantCultureIgnoreCase))
                {
                    // This occurs when the database is down.
                    logger.LogError("Unable to reach database");
                }
                else if (error is System.Net.WebException && 
                    string.Equals(error.Message, "An error occurred while sending the request. The buffers supplied to a function was too small", StringComparison.InvariantCultureIgnoreCase))
                {
                    logger.LogError("The buffers supplied to a function was too small");
                }
                else
                {
                    logger.LogError(error, error.Message);
                }
            }
        }
    }
}