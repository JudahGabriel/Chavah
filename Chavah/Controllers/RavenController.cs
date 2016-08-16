using Raven.Client;
using System.Web;
using System.Web.Mvc;
using Microsoft.AspNet.Identity.Owin;
using System;
using System.Web.Routing;

namespace BitShuva.Controllers
{
    /// <summary>
    /// MVC controller base class that saves the async document session upon save.
    /// </summary>
    public abstract class RavenController : Controller
    {
        public new IAsyncDocumentSession Session { get; set; }

        protected override void OnActionExecuting(ActionExecutingContext filterContext)
        {
            if (!filterContext.IsChildAction)
            {
                //Session = RavenContext.Db.OpenAsyncSession();
                Session = HttpContext.GetOwinContext().Get<IAsyncDocumentSession>();
            }

            base.OnActionExecuting(filterContext);
        }

        protected override void OnActionExecuted(ActionExecutedContext filterContext)
        {
            if (!filterContext.IsChildAction)
            {
                using (Session)
                {
                    if (filterContext.Exception == null && Session != null)
                    {
                        var saveTask = Session.SaveChangesAsync();

                        // Tell the task we don't need to invoke on MVC's SynchronizationContext. 
                        // Otherwise we can end up with deadlocks. See http://code.jonwagner.com/2012/09/04/deadlock-asyncawait-is-not-task-wait/
                        saveTask.ConfigureAwait(continueOnCapturedContext: false);

                        saveTask.Wait(TimeSpan.FromSeconds(10));
                    }
                }
            }
        }
	}
}