using BitShuva.Chavah.Models;
using BitShuva.Chavah.Models.Rss;
using Chavah.Common;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.SyndicationFeed;
using Newtonsoft.Json;
using Raven.Abstractions.Data;
using Raven.Client;
using Raven.Client.Linq;
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
        
        public IftttController(
            IOptions<AppSettings> appSettings,
            IAsyncDocumentSession dbSession, 
            ILogger<IftttController> logger)
            : base(dbSession, logger)
        {
            this.appSettings = appSettings.Value;
        }
                
        [HttpGet]
        public async Task<ActionResult> RegisteredUsers()
        {
            var radioUrl = appSettings.Jwt.key;

            var lastRegisteredUsers = await DbSession
                .Query<AppUser>()
                .Where(u => u.Email != null)
                .OrderByDescending(a => a.RegistrationDate)
                .Take(100)
                .ToListAsync();

            var feedItems = from user in lastRegisteredUsers
                            select new SyndicationItem
                            {
                                Id = user.Email,
                                LastUpdated = user.RegistrationDate,
                                Title = user.Email,
                                Description = $"A new user registered on Chavah on {user.RegistrationDate} with email address {user.Email}",

                            };
                            //    Id: user.Email,
                            //    //lastUpdatedTime: user.RegistrationDate,
                            //    title: user.Email,
                            //    content: $"A new user registered on Chavah on {user.RegistrationDate} with email address {user.Email}",
                            //    itemAlternateLink: new Uri($"{radioUrl}/?user={Uri.EscapeUriString(user.Email)}")
                            //);

            var feed = new SyndicationFeed("Chavah Messianic Radio",
                                           "The most recent registered users at Chavah Messianic Radio",
                                           new Uri(radioUrl),"Chavah", feedItems)
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

            // Patch users to include this notification.
            var patch = new ScriptedPatchRequest
            {
                Script = @"
                        if (!this.Notifications) {
                            this.Notifications = [];
                        }

                        this.Notifications.unshift(" + jsonNotification + @");
                        if (this.Notifications.length > 10) {
                            this.Notifications.length = 10;
                        }"
            };
            var query = new IndexQuery { Query = $"Tag:AppUsers" };
            var options = new BulkOperationOptions
            {
                AllowStale = true
            };

            try
            {
                DbSession.Advanced.DocumentStore.DatabaseCommands.UpdateByIndex("Raven/DocumentsByEntityName", query, patch, options);
                //await patchOperation.WaitForCompletionAsync();
            }
            catch (Exception error)
            {
                logger.LogError(error, $"Error patching users to include notification.");
                throw;
            }

            return Json(notification);
        }
    }
}