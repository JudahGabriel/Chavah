using BitShuva.Chavah.Models;
using BitShuva.Chavah.Models.Rss;
using BitShuva.Chavah.Services;
using Chavah.Common;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.SyndicationFeed;
using Newtonsoft.Json;
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
    [Route("ifttt/[action]")]
    public class IftttController : RavenController
    {
        private readonly AppSettings appSettings;

        public IftttController(
            IOptions<AppSettings> appSettings,
            IAsyncDocumentSession dbSession,
            ILogger<IftttController> logger)
            : base(dbSession, logger)
        {
            this.appSettings = appSettings.Value;
        }

        [HttpGet]
        public async Task<ActionResult> GetRegisteredUsers()
        {
            var lastRegisteredUsers = await DbSession
                .Query<AppUser>()
                .OrderByDescending(a => a.RegistrationDate)
                .Take(100)
                .ToListAsync();

            var feedItems = lastRegisteredUsers.Select(user => new SyndicationItem
            {
                Id = user.Email,
                LastUpdated = user.RegistrationDate,
                Title = user.Email,
                Description = $"A new user registered on Chavah on {user.RegistrationDate} with email address {user.Email}",
                Published = user.RegistrationDate,
            })
            .ToList();
            feedItems.ForEach(i => i.AddLink(new SyndicationLink(new Uri(appSettings.Application.DefaultUrl + "/?newUser=" + i.Published.ToUnixTimeSeconds().ToString()))));

            var feed = new SyndicationFeed("Chavah Messianic Radio",
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
            var isValidSecretToken = appSettings.Ifttt.Key == secretToken;
            if (!isValidSecretToken)
            {
                throw new UnauthorizedAccessException();
            }

            logger.LogInformation("IFTTT CreateNotification called with {token}, {title}, {imgUrl}, {srcName}, {url}", secretToken, title, imgUrl, sourceName, url);

            var notification = new Notification
            {
                Date = DateTime.UtcNow,
                ImageUrl = imgUrl,
                IsUnread = true,
                SourceName = sourceName,
                Title = title,
                Url = url
            };
            var jsonNotification = JsonConvert.SerializeObject(notification);

            var patchScript = @"
                this.Notifications.unshift(" + jsonNotification + @");
                if (this.Notifications.length > 10) {
                    this.Notifications.length = 10;
                }
";
            var patch = new CollectionPatchService(
                this.DbSession.Advanced.DocumentStore,
                typeof(AppUser),
                patchScript);
            patch.ExecuteFireAndForget();
            return Json(notification);
        }
    }
}