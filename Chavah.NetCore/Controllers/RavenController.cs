using Raven.Client;
using System;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.Filters;
using BitShuva.Chavah.Models;
using BitShuva.Chavah.Common;
using RavenDB.StructuredLog;

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
                    using (logger.BeginKeyValueScope("user", context?.HttpContext?.User?.Identity?.Name))
                    using (logger.BeginKeyValueScope("action", context?.ActionDescriptor?.DisplayName))
                    using (logger.BeginKeyValueScope("changes", DbSession.Advanced.WhatChanged()))
                    {
                        logger.LogError(saveError, $"Error saving changes for {next.Method?.Name}");
                    }
                }
            }
            else if (executedContext.Exception != null) // An exception occurred while executing the method.
            {
                using (logger.BeginKeyValueScope("user", context?.HttpContext?.User?.Identity?.Name))
                using (logger.BeginKeyValueScope("action", executedContext.ActionDescriptor?.DisplayName))
                {
                    logger.LogError(executedContext.Exception, executedContext.Exception.Message);
                }
            }
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
                using (DbSession.Advanced.DocumentStore.AggressivelyCacheFor(TimeSpan.FromDays(3)))
                {
                    this.currentUser = await DbSession.LoadAsync<AppUser>("AppUsers/" + email);
                }
            }

            return currentUser;
        }

        protected string GetUserId()
        {
            if (this.User.Identity.IsAuthenticated && !string.IsNullOrEmpty(this.User.Identity.Name))
            {
                return AppUser.AppUserPrefix + this.User.Identity.Name;
            }

            return null;
        }
    }
}