using Raven.Client;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web.Http.Filters;

namespace BitShuva.Common
{
    public class RavenDbUnitOfWorkAttribute : ActionFilterAttribute
    {
        public Func<IDocumentSession> SessionFactory { get; set; }

        public override void OnActionExecuted(HttpActionExecutedContext actionExecutedContext)
        {
            var session = SessionFactory.Invoke();

            if (session != null && actionExecutedContext.Exception == null)
            {
                session.SaveChanges();
            }

            base.OnActionExecuted(actionExecutedContext);
        }
    }
}
