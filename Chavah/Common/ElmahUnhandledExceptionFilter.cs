using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace BitShuva.Common
{
    public class ElmahUnhandledExceptionFilter : System.Web.Http.Filters.ExceptionFilterAttribute
    {
        public override void OnException(System.Web.Http.Filters.HttpActionExecutedContext context)
        {
            Elmah.ErrorLog.GetDefault(HttpContext.Current).Log(new Elmah.Error(context.Exception));
        }
    }
}