using BitShuva.Chavah.Common;
using BitShuva.Chavah.Models;
using BitShuva.Chavah.Models.Rss;
using BitShuva.Chavah.Settings;
using Chavah.Common;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Raven.Client.Documents;
using Raven.Client.Documents.Session;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BitShuva.Chavah.Controllers
{
    [Route("[controller]/[action]")]
    public class ActivitiesController : RavenController
    {
        private readonly AppSettings _appOptions;

        public ActivitiesController(
            IAsyncDocumentSession dbSession,
            ILogger<ActivitiesController> logger,
            IOptionsMonitor<AppSettings> appOptions) : base(dbSession, logger)
        {
            _appOptions = appOptions.CurrentValue;
        }

        [HttpGet]
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
                var song = await DbSession.LoadRequiredAsync<Song>(topThumbedUpSong.Key);
                if (song != null)
                {
                    var likeCount = topThumbedUpSong.Count();
                    var syndicationId = $"{song.Id}-{likeCount.ToString()}";
                    var syndicationLink = new SyndicationLinkItem(
                        syndicationId,
                        $"Today's top trending song is {song.Name} by {song.Artist} with +{likeCount} thumb-ups so far today. It's now ranked at {song.GetCommunityRankText()}.",
                        "",
                        song.GetSongShareLink(_appOptions.DefaultUrl));
                    rssItems.Add(syndicationLink);
                }
            }

            var feed = new SyndicationFeed(
                $"{_appOptions.Name} Trending Songs",
                $"Today's trending song on {_appOptions.Title}",
                new Uri(_appOptions.DefaultUrl),
                "TrendingSong",
                rssItems,
                language: _appOptions.Language);

            return new RssActionResult(feed);
        }

        /// <summary>
        /// Fetches the activity feed for the last hour, but returns at most N items, starting oldest first.
        /// This creates a smaller subset of activity feed, suitable for tweeting.
        /// (Otherwise, we were tweeting hundreds of likes per day; not sustainable.)
        /// </summary>
        /// <param name="take"></param>
        [HttpGet]
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

            var feed = new SyndicationFeed(
                $"Latest activity in the last hour on {_appOptions.Name}",
                $"The latest activity over at {_appOptions?.Title}",
                new Uri(_appOptions?.DefaultUrl),
                "ChavahActivities",
                activitiesForThisHour,
                _appOptions.Language);
            return new RssActionResult(feed);
        }

        [HttpGet]
        public async Task<IActionResult> ActivityFeed(int take = 5)
        {
            var recentActivities = await DbSession.Query<Activity>()
                .OrderByDescending(a => a.DateTime)
                .Take(take)
                .ToListAsync();

            var feedItems = recentActivities.Select(ActivityToRssItem);

            var feed = new SyndicationFeed(
                $"Latest activity on {_appOptions.Name}",
                $"The latest activity over at {_appOptions?.Title}",
                new Uri(_appOptions?.DefaultUrl),
                "ChavahActivities",
                feedItems,
                _appOptions.Language);

            return new RssActionResult(feed);
        }

        [HttpGet]
        private static SyndicationLinkItem ActivityToRssItem(Activity activity)
        {
            return new SyndicationLinkItem(activity.Id, activity.Title, activity.Description, activity.MoreInfoUri);
        }
    }
}
