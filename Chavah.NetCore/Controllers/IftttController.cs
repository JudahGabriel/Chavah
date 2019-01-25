using BitShuva.Chavah.Common;
using BitShuva.Chavah.Models;
using BitShuva.Chavah.Models.Rss;
using BitShuva.Chavah.Services;
using Chavah.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.SyndicationFeed;
using Newtonsoft.Json;
using Optional;
using Raven.Client.Documents;
using Raven.Client.Documents.Session;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace BitShuva.Chavah.Controllers
{
    /// <summary>
    /// Controller called by If This Then That (https://ifttt.com) to trigger Chavah notifications when external events (e.g. Chavah blog posts) occur.
    /// </summary>
    [Route("[controller]/[action]")]
    public class IftttController : RavenController
    {
        private readonly AppSettings appSettings;
        private readonly IPushNotificationSender pushNotifications;

        public IftttController(
            IOptions<AppSettings> appSettings,
            IPushNotificationSender pushNotifications,
            IAsyncDocumentSession dbSession,
            ILogger<IftttController> logger)
            : base(dbSession, logger)
        {
            this.appSettings = appSettings.Value;
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
            feedItems.ForEach(i => i.AddLink(new SyndicationLink(new Uri(appSettings.Application.DefaultUrl + "/?newUser=" + i.Published.ToUnixTimeSeconds().ToString()))));

            var feed = new SyndicationFeed("Chavah Messianic Radio - New Users",
                                           "The most recent registered users at Chavah Messianic Radio",
                                           new Uri(appSettings.Application.DefaultUrl), "Chavah", feedItems)
            {
                Language = "en-US"
            };
            return new RssActionResult(feed);
        }

        [HttpPost]
        public IActionResult CreateNotification(string secretToken, string title, string imgUrl, string sourceName, string url)
        {
            this.AuthorizeKey(secretToken);

            // Use only HTTPS images.
            if (imgUrl != null && imgUrl.StartsWith("http://", StringComparison.InvariantCultureIgnoreCase))
            {
                imgUrl = imgUrl.Replace("http://", "https://", StringComparison.InvariantCultureIgnoreCase);
            }

            // If the image is the default "no image available" from IFTTT, use Chavah logo.
            if (string.Equals(imgUrl, "https://ifttt.com/images/no_image_card.png", StringComparison.InvariantCultureIgnoreCase))
            {
                imgUrl = Notification.ChavahSystemNotificationImage;
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
            this.NotifyAllUsers(notification);

            // Send out HTML5 push notifications.
            var pushNotification = new PushNotification
            {
                Title = title,
                ImageUrl = imgUrl,
                Body = $"The latest from the {sourceName}",
                ClickUrl = url
            };
            this.pushNotifications.QueueSendNotificationToAll(pushNotification);

            return Json(notification);
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
            this.DbSession.Advanced.DocumentStore.PatchAll<AppUser>(patchScript);
        }

        private void AuthorizeKey(string key)
        {
            if (this.appSettings.Ifttt.Key != key)
            {
                throw new UnauthorizedAccessException();
            }
        }
    }
}