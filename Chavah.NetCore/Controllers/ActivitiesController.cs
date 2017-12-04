using BitShuva.Chavah.Common;
using BitShuva.Chavah.Models;
using BitShuva.Chavah.Models.Rss;
using Chavah.Common;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Raven.Client;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace BitShuva.Chavah.Controllers
{
    public class ActivitiesController : RavenController
    {
        private readonly Application app;

        public ActivitiesController(IAsyncDocumentSession dbSession, 
                                    ILogger<ActivitiesController> logger,
                                    IOptions<AppSettings> options)
            : base(dbSession, logger)
        {
            app = options?.Value?.Application;
        }

        public async Task<IActionResult> ActivityFeed(int take = 5)
        {
            var recentActivities = await DbSession.Query<Activity>()
                .OrderByDescending(a => a.DateTime)
                .Take(take)
                .ToListAsync();

            var feedItems = recentActivities
                .Select(activity => new SyndicationLinkItem(activity.Id, activity.Title, activity.Description, activity.MoreInfoUri));
            
            var feed = new SyndicationFeed(app?.Title,
                                           $"The latest activity over at {app?.Title}",
                                           new Uri(app?.DefaultUrl), "ChavahActivities", feedItems)
            {
                Language = "en-US"
            };
            return new RssActionResult(feed);
        }
    }
}
