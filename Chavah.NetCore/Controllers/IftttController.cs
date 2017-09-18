using BitShuva.Chavah.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Raven.Client;
using Raven.Client.Linq;
using BitShuva.Chavah.Common;
using Raven.Abstractions.Data;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using System.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace BitShuva.Chavah.Controllers
{
    /// <summary>
    /// Controller called by If This Then That (https://ifttt.com) to trigger Chavah notifications when external events (e.g. Chavah blog posts) occur.
    /// </summary>
    [Route("[controller]/[action]")]
    public class IftttController : RavenController
    {
        private readonly IOptions<AppSettings> appSettings;
        private readonly IOptions<IftttSettings> iftttSettings;

        public IftttController(
            IAsyncDocumentSession dbSession, 
            ILogger<IftttController> logger,
            IOptions<AppSettings> appSettings,
            IOptions<IftttSettings> iftttSettings)
            : base(dbSession, logger)
        {
            this.appSettings = appSettings;
            this.iftttSettings = iftttSettings;
        }
        
        // TODO: Port this method to AspNetCore. Need to support RSS.
        //[HttpGet]
        //public async Task<ActionResult> RegisteredUsers()
        //{
        //    var lastRegisteredUsers = await DbSession
        //        .Query<AppUser>()
        //        .Where(u => u.Email != null)
        //        .OrderByDescending(a => a.RegistrationDate)
        //        .Take(100)
        //        .ToListAsync();

        //    var feedItems = from user in lastRegisteredUsers
        //                    select new SyndicationItem(
        //                        id: user.Email,
        //                        lastUpdatedTime: user.RegistrationDate,
        //                        title: user.Email,
        //                        content: $"A new user registered on Chavah on {user.RegistrationDate} with email address {user.Email}",
        //                        itemAlternateLink: new Uri($"{radioUrl}/?user={Uri.EscapeUriString(user.Email)}")
        //                    );

        //    var feed = new SyndicationFeed("Chavah Messianic Radio",
        //                                   "The most recent registered users at Chavah Messianic Radio",
        //                                   new Uri(radioUrl), feedItems)
        //    {
        //        Language = "en-US"
        //    };
        //    return new RssActionResult { Feed = feed };
        //}
        

        [HttpPost]
        public async Task<IActionResult> CreateNotification(string secretToken, string title, string imgUrl, string sourceName, string url)
        {
            var isValidSecretToken = this.iftttSettings.Value.Key == secretToken;
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
            var query = new IndexQuery { Query = $"Tag:ApplicationUsers" };
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