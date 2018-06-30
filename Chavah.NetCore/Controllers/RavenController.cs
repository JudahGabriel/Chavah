using Raven.Client;
using System;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.Filters;
using BitShuva.Chavah.Models;
using BitShuva.Chavah.Common;
using Raven.StructuredLog;
using Raven.Client.Documents.Session;
using Raven.Client.Exceptions;

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
            var httpMethodOrNull = context?.HttpContext?.Request?.Method;
            if (executedContext.Exception == null && httpMethodOrNull != "GET" && DbSession.Advanced.HasChanges)
            {
                try
                {
                    await DbSession.SaveChangesAsync();
                }
                catch (Exception saveError)
                {
                    using (logger.BeginKeyValueScope("user", User?.Identity?.Name))
                    using (logger.BeginKeyValueScope("action", context?.ActionDescriptor?.DisplayName))
                    {
                        logger.LogError(saveError, $"Error saving changes for {next.Method?.Name}");
                    }
                }
            }
            else if (executedContext.Exception != null) // An exception occurred while executing the method.
            {
                using (logger.BeginKeyValueScope("user", User?.Identity?.Name))
                using (logger.BeginKeyValueScope("action", executedContext.ActionDescriptor?.DisplayName))
                {
                    if (executedContext.Exception is UnauthorizedAccessException)
                    {
                        logger.LogWarning(executedContext.Exception, executedContext.Exception.Message);
                    }
                    else if (executedContext.Exception is RavenException ravenEx && ravenEx.Message.Contains("The server returned an invalid or unrecognized response", StringComparison.InvariantCultureIgnoreCase))
                    {
                        logger.LogError(ravenEx.Message);
                    }
                    else
                    {
                        logger.LogError(executedContext.Exception, executedContext.Exception.Message);
                    }
                }
            }
        }

        public async Task<AppUser> GetCurrentUserOrThrow()
        {
            var currentUser = await this.GetCurrentUser();
            if (currentUser == null)
            {
                throw new UnauthorizedAccessException().WithData("userName", this.User.Identity.Name);
            }

            return currentUser;
        }

        public async Task<AppUser> GetCurrentUser()
        {
            if (this.currentUser != null)
            {
                return this.currentUser;
            }

            var email = this.User.Identity.Name;
            if (!string.IsNullOrEmpty(email))
            {
                this.currentUser = await DbSession.LoadAsync<AppUser>("AppUsers/" + email);
            }

            return currentUser;
        }

        protected string GetUserIdOrThrow()
        {
            var userId = this.GetUserId();
            if (!string.IsNullOrEmpty(userId))
            {
                return userId;
            }

            throw new UnauthorizedAccessException();
        }

        protected string GetUserId()
        {
            if (this.User.Identity.IsAuthenticated && !string.IsNullOrEmpty(this.User.Identity.Name))
            {
                return AppUser.AppUserPrefix + this.User.Identity.Name;
            }

            return null;
        }

        protected string GetUserIdOrThrow()
        {
            var userId = this.GetUserId();
            if (!string.IsNullOrEmpty(userId))
            {
                return userId;
            }

            throw new UnauthorizedAccessException("Couldn't find user").WithData("userId", userId);
        }
    }
}