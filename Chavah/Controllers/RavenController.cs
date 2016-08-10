using Raven.Client;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace BitShuva.Controllers
{
    public abstract class RavenController : Controller
    {
        public new IAsyncDocumentSession Session { get; set; }

        protected override void OnActionExecuting(ActionExecutingContext filterContext)
        {
            Session = RavenDataStore.Store.OpenAsyncSession();
        }

        protected override void OnActionExecuted(ActionExecutedContext filterContext)
        {
            if (filterContext.IsChildAction)
                return;

            using (this.Session)
            {
                if (filterContext.Exception != null)
                    return;

                if (this.Session != null)
                {
                    Session.SaveChangesAsync().ContinueWith(_ => base.OnActionExecuted(filterContext));
                }
            }
        }
	}
}