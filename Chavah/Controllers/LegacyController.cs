using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace BitShuva.Controllers
{
    [RoutePrefix("songs")]
    public class LegacyController : Controller
    {
        [Obsolete("Moved to Durandal controller. Delete by July 2015.")]
        [HttpGet]
        [Route("activityfeed")]
        public ActionResult ActivityFeed()
        {
            return RedirectPermanent("http://messianicradio.com/durandal/activityfeed");
        }
    }
}