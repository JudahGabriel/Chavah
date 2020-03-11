using System;
using System.Linq;
using System.Threading.Tasks;

using BitShuva.Chavah.Common;
using BitShuva.Chavah.Models;
using BitShuva.Chavah.Models.Rss;
using BitShuva.Chavah.Settings;
using BitShuva.Chavah.Services;

using Chavah.Common;

using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.SyndicationFeed;

using Newtonsoft.Json;

using Raven.Client.Documents;
using Raven.Client.Documents.Session;

namespace BitShuva.Chavah.Controllers
{
    /// <summary>
    /// Controller called by If This Then That (https://ifttt.com)
    /// to trigger Chavah notifications when external events (e.g. Chavah blog posts) occur.
    /// </summary>
    [Route("[controller]/[action]")]
    public class IftttController : RavenController
    {
        private readonly AppSettings appOptions;
        private readonly IPushNotificationSender pushNotifications;

        public IftttController(
            IOptionsMonitor<AppSettings> appOptions,
            IPushNotificationSender pushNotifications,
            IAsyncDocumentSession dbSession,
            ILogger<IftttController> logger)
            : base(dbSession, logger)
        {
            this.appOptions = appOptions.CurrentValue;
            this.pushNotifications = pushNotifications;
        }

        [HttpGet]
        public async Task<ActionResult> GetRegisteredUsers(string key)
        {
            AuthorizeKey(key);

            var lastRegisteredUsers = await DbSession
                .Query<AppUser>()
                .Statistics(out var stats)
                .OrderByDescending(a => a.RegistrationDate)
                .Take(100)
                .ToListAsync();

            var feedItems = lastRegisteredUsers.Select((user, index) => new SyndicationItem
            {
                Id = user.Email,
                LastUpdated = user.RegistrationDate,
                Title = user.Email,
                Description = $"{user.Email} registered as user #{stats.TotalResults - index}",
                Published = user.RegistrationDate,
            })
            .ToList();

            feedItems.ForEach(i => i.AddLink(new SyndicationLink(new Uri($"{appOptions.DefaultUrl}/?newUser={i.Published.ToUnixTimeSeconds().ToString()}"))));

            var feed = new SyndicationFeed(
                $"{appOptions.Title} - New Users",
                "The most recent registered users at Chavah Messianic Radio",
                new Uri(appOptions.DefaultUrl),
                appOptions.Name,
                feedItems,
                appOptions.Language);

            return new RssActionResult(feed);
        }

        [HttpPost]
        public IActionResult CreateNotification(string secretToken, string title, string? imgUrl, string sourceName, string url)
        {
            AuthorizeKey(secretToken);

            // Use only HTTPS images.
            if (imgUrl?.StartsWith("http://", StringComparison.InvariantCultureIgnoreCase) == true)
            {
                imgUrl = imgUrl.Replace("http://", "https://", StringComparison.InvariantCultureIgnoreCase);
            }

            // If the image is the default "no image available" from IFTTT, use Chavah logo.
            if (string.Equals(imgUrl, "https://ifttt.com/images/no_image_card.png", StringComparison.InvariantCultureIgnoreCase))
            {
                imgUrl = appOptions.PushNotificationsImageUrl;
            }

            logger.LogInformation("IFTTT CreateNotification called with {token}, {title}, {imgUrl}, {srcName}, {url}", secretToken, title, imgUrl, sourceName, url);

            // Create a notification in the users' alerts menu
            var notification = new Notification
            {
                Date = DateTime.UtcNow,
                ImageUrl = imgUrl,
                IsUnread = true,
                SourceName = sourceName,
                Title = title,
                Url = url
            };

            NotifyAllUsers(notification);

            // Send out HTML5 push notifications.
            var pushNotification = new PushNotification
            {
                Title = title,
                ImageUrl = imgUrl,
                Body = $"The latest from the {sourceName}",
                ClickUrl = url
            };
            pushNotifications.QueueSendNotificationToAll(pushNotification);

            return Json(notification);
        }

        /// <summary>
        /// A lyric tweet is an activity that contains lyrics to a song with a link to it.
        /// These are created periodically by IFTTT.
        /// </summary>
        /// <returns></returns>
        [HttpPost]
        public async Task<Activity> CreateLyricTweetActivity(string secretToken)
        {
            AuthorizeKey(secretToken);

            var lyricTweet = await DbSession.Query<Activity>()
                .Where(a => a.Type == ActivityType.LyricTweet)
                .OrderByDescending(a => a.DateTime)
                .FirstOrNoneAsync();

            // If we have a lyric tweet from the last hour, don't create a new one.
            if (lyricTweet != null && lyricTweet.DateTime > (DateTime.UtcNow.Subtract(TimeSpan.FromHours(1))))
            {
                return lyricTweet;
            }

            // Otherwise, create a new lyric tweet activity.
            var songWithLyrics = await DbSession.Query<Song>()
                .Customize(x => x.RandomOrdering())
                .FirstAsync(s => !string.IsNullOrEmpty(s.Lyrics));
            var lyricsSection = GetRandomLyricSection(songWithLyrics);
            const int maxLyricsLength = 200; // 260 characters for a tweet, but we want to save room for the link to the song (roughly 40 chars).
            var tweetActivityLyrics = GetLyricsFromSection(lyricsSection, maxLyricsLength);
            var tweetActivity = new Activity
            {
                DateTime = DateTimeOffset.UtcNow,
                EntityId = songWithLyrics.Id,
                Description = tweetActivityLyrics,
                MoreInfoUri = new Uri($"{appOptions.DefaultUrl}/?song={songWithLyrics.Id}"),
                Title = songWithLyrics.Name,
                Type = ActivityType.LyricTweet
            };
            await DbSession.StoreAsync(tweetActivity);
            DbSession.SetRavenExpiration(tweetActivity, DateTime.UtcNow.AddDays(30));
            await DbSession.SaveChangesAsync();
            return tweetActivity;
        }

        private string GetLyricsFromSection(string lyricsSection, int maxLength)
        {
            // If the whole lyrics section fits, use it.
            if (lyricsSection.Length <= maxLength)
            {
                return lyricsSection;
            }

            // Lyrics section is too long
            // If the lyrics section is too long, take as many lines from it as we can.
            var sectionLines = lyricsSection.Split(new[] { "\r\n" }, StringSplitOptions.RemoveEmptyEntries);
            var builder = new System.Text.StringBuilder(200);
            foreach (var line in sectionLines)
            {
                var newLength = builder.Length + line.Length;
                if (newLength < maxLength)
                {
                    builder.AppendLine(line);
                }
                else
                {
                    if (builder.Length == 0)
                    {
                        // The first line is too long. Substring it.
                        builder.AppendLine(line.Substring(0, 197).Trim() + "...");
                    }

                    break;
                }
            }

            return builder.ToString();
        }

        /// <summary>
        /// A lyrics section is a chorus or verse of a song, separated from the rest of the lyrics by a double new line.
        /// </summary>
        /// <param name="song"></param>
        /// <returns></returns>
        private string GetRandomLyricSection(Song song)
        {
            var lyricsSection = song.Lyrics
                .Split(new[] { "\r\n\r\n" }, StringSplitOptions.RemoveEmptyEntries) // Grab the lyric section groups (e.g. chorus, verses, etc.) as separated by double new line
                .Where(l => !l.Contains("Translation", StringComparison.OrdinalIgnoreCase) && !l.Contains("Transliteration", StringComparison.OrdinalIgnoreCase)) // Skip lines that say "translation" or "transliteration"
                .RandomElement();
            if (lyricsSection == null)
            {
                return string.IsNullOrEmpty(song.Lyrics) ? string.Empty : song.Lyrics;
            }

            return lyricsSection;
        }

        private void NotifyAllUsers(Notification notification)
        {
            var jsonNotification = JsonConvert.SerializeObject(notification);
            var patchScript = @"
                this.Notifications.unshift(" + jsonNotification + @");
                if (this.Notifications.length > 10) {
                    this.Notifications.length = 10;
                }
            ";
            DbSession.Advanced.DocumentStore.PatchAll<AppUser>(patchScript);
        }

        private void AuthorizeKey(string key)
        {
            if (appOptions.IftttKey != key)
            {
                throw new UnauthorizedAccessException();
            }
        }
    }
}
