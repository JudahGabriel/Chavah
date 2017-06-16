using BitShuva.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.ServiceModel.Syndication;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;
using Raven.Client;
using Raven.Client.Linq;
using Chavah.Common;
using Raven.Abstractions.Data;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using BitShuva.Interfaces;
using System.Configuration;

namespace BitShuva.Controllers
{
    /// <summary>
    /// Controller called by If This Then That (https://ifttt.com) to trigger Chavah notifications when external events (e.g. Chavah blog posts) occur.
    /// </summary>
    public class IftttController : RavenController
    {
        private ILoggerService _logger;

        private const string radioUrl = "https://messianicradio.com";

        public IftttController(ILoggerService _logger)
        {
            this._logger = _logger;
        }

        [Route("account/registeredusers")]
        [HttpGet]
        public async Task<ActionResult> RegisteredUsers()
        {
            var lastRegisteredUsers = await DbSession
                .Query<ApplicationUser>()
                .Where(u => u.Email != null)
                .OrderByDescending(a => a.RegistrationDate)
                .Take(100)
                .ToListAsync();

            var feedItems = from user in lastRegisteredUsers
                            select new SyndicationItem(
                                id: user.Email,
                                lastUpdatedTime: user.RegistrationDate,
                                title: user.Email,
                                content: $"A new user registered on Chavah on {user.RegistrationDate} with email address {user.Email}",
                                itemAlternateLink: new Uri($"{radioUrl}/?user={Uri.EscapeUriString(user.Email)}")
                            );

            var feed = new SyndicationFeed("Chavah Messianic Radio",
                                           "The most recent registered users at Chavah Messianic Radio",
                                           new Uri(radioUrl), feedItems)
            {
                Language = "en-US"
            };
            return new RssActionResult { Feed = feed };
        }
        
        [HttpPost]
        public async Task<ActionResult> CreateNotification(string secretToken, string title, string imgUrl, string sourceName, string url)
        {
            var isValidSecretToken = ConfigurationManager.AppSettings["IftttKey"] == secretToken;
            if (!isValidSecretToken)
            {
                throw NewUnauthorizedException();
            }

            await _logger.Info("IFTTT CreateNotification called", new { SecretToken = secretToken, Title = title, ImgUrl = imgUrl, SourceName = sourceName, Url = url });
            
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
                RavenContext.Db.DatabaseCommands.UpdateByIndex("Raven/DocumentsByEntityName", query, patch, options);
                //await patchOperation.WaitForCompletionAsync();
            }
            catch (Exception error)
            {
                await _logger.Error($"Error patching users to include notification.", error.ToString());
                throw;
            }

            return Json(notification);
        }
    }
}