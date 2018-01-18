using BitShuva.Chavah.Common;
using BitShuva.Chavah.Models;
using BitShuva.Chavah.Models.Rss;
using Chavah.Common;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Raven.Client;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BitShuva.Chavah.Controllers
{
    [Route("[controller]/[action]")]
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

        public async Task<IActionResult> GetTodaysTrendingSong()
        {
            var dayAgo = DateTimeOffset.UtcNow.Subtract(TimeSpan.FromDays(1));
            var activitiesToday = await DbSession.Query<Activity>()
                .Where(a => a.DateTime >= dayAgo && a.Type == ActivityType.Like)
                .OrderByDescending(a => a.DateTime)
                .Take(250)
                .ToListAsync();
            var topThumbedUpSong = activitiesToday
                .Where(a => !string.IsNullOrEmpty(a.EntityId))
                .GroupBy(a => a.EntityId)
                .OrderByDescending(a => a.Count())
                .Where(a => a.Count() > 1)
                .FirstOrDefault();
            var rssItems = new List<SyndicationLinkItem>(1);
            if (topThumbedUpSong != null)
            {
                var song = await DbSession.LoadNotNullAsync<Song>(topThumbedUpSong.Key);
                if (song != null)
                {
                    var likeCount = topThumbedUpSong.Count();
                    var syndicationId = song.Id + "-" + likeCount.ToString();
                    var syndicationLink = new SyndicationLinkItem(syndicationId, $"Today's top trending song is {song.Name} by {song.Artist} with +{likeCount} thumb-ups so far today. It's now ranked at {song.GetCommunityRankText()}.", "", song.GetSongShareLink(app.DefaultUrl));
                    rssItems.Add(syndicationLink);
                }
            }

            var feed = new SyndicationFeed("Chavah Trending Songs",
                                           $"Today's trending song on {app.Title}",
                                           new Uri(app.DefaultUrl), "TrendingSong", rssItems)
            {
                Language = "en-US"
            };
            return new RssActionResult(feed);
        }

        /// <summary>
        /// Fetches the activity feed for the last hour, but returns at most N items, starting oldest first.
        /// This creates a smaller subset of activity feed, suitable for tweeting. (Otherwise, we were tweeting hundreds of likes per day; not sustainable.)
        /// </summary>
        /// <param name="take"></param>
        public async Task<IActionResult> GetActivityFeedForHour(int take)
        {
            var hourAgo = DateTimeOffset.UtcNow.Subtract(TimeSpan.FromHours(1));
            var activitiesInLast60Minutes = await DbSession.Query<Activity>()
                .OrderBy(a => a.DateTime) // oldest first, so that the list doesn't change as the hour goes by.
                .Where(a => a.DateTime >= hourAgo)
                .Take(100)
                .ToListAsync();
            var currentHour = DateTimeOffset.UtcNow.Hour;
            var activitiesForThisHour = activitiesInLast60Minutes
                .Where(a => a.DateTime.Hour == currentHour)
                .Take(take)
                .Select(ActivityToRssItem);
            var feed = new SyndicationFeed("Latest activity in the last hour on Chavah",
                                           $"The latest activity over at {app?.Title}",
                                           new Uri(app?.DefaultUrl), "ChavahActivities", activitiesForThisHour)
            {
                Language = "en-US"
            };
            return new RssActionResult(feed);
        }

        public async Task<IActionResult> ActivityFeed(int take = 5)
        {
            var recentActivities = await DbSession.Query<Activity>()
                .OrderByDescending(a => a.DateTime)
                .Take(take)
                .ToListAsync();

            var feedItems = recentActivities.Select(ActivityToRssItem);            
            var feed = new SyndicationFeed("Latest activity on Chavah",
                                           $"The latest activity over at {app?.Title}",
                                           new Uri(app?.DefaultUrl), "ChavahActivities", feedItems)
            {
                Language = "en-US"
            };
            return new RssActionResult(feed);
        }

        private static SyndicationLinkItem ActivityToRssItem(Activity activity)
        {
            return new SyndicationLinkItem(activity.Id, activity.Title, activity.Description, activity.MoreInfoUri);
        }
    }
}
