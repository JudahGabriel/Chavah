using BitShuva.Chavah.Models;
using BitShuva.Chavah.Models.Rss;
using Chavah.Common;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.SyndicationFeed;
using Raven.Client;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BitShuva.Chavah.Controllers
{
    public class ActivitiesController : RavenController
    {
        public ActivitiesController(IAsyncDocumentSession dbSession, ILogger<ActivitiesController> logger)
            : base(dbSession, logger)
        {
        }

        public async Task<IActionResult> ActivityFeed(int take = 5)
        {
            var recentActivities = await DbSession.Query<Activity>()
                .OrderByDescending(a => a.DateTime)
                .Take(take)
                .ToListAsync();
            
            var feedItems = from activity in recentActivities
                            select new SyndicationItem
                            {
                                Id = activity.Id,
                                Title = activity.Title,
                                Description = activity.Description,
                                Published = activity.DateTime
                            };
            
            var feed = new SyndicationFeed("Chavah Messianic Radio",
                                           "The latest activity over at Chavah Messianic Radio",
                                           new Uri("https://messianicradio.com"), "ChavahActivities", feedItems)
            {
                Language = "en-US"
            };
            return new RssActionResult(feed);
        }
    }
}
