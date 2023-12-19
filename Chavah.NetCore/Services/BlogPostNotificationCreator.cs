using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.ServiceModel.Syndication;
using System.Threading;
using System.Threading.Tasks;
using System.Xml.Linq;

using BitShuva.Chavah.Common;
using BitShuva.Chavah.Models;

using CodeHollow.FeedReader;

using Microsoft.Extensions.Logging;

using Newtonsoft.Json;

using Raven.Client.Documents;
using Raven.Client.Documents.Session;

namespace BitShuva.Chavah.Services
{
    /// <summary>
    /// A background service that periodically checks the Chavah and Kineti blogs for new content.
    /// New posts are then broadcasted out in a push notification and inserted into AppUser.Notifications.
    /// </summary>
    public class BlogPostNotificationCreator : TimedBackgroundServiceBase
    {
        private readonly IDocumentStore docStore;
        private readonly IPushNotificationSender pushNotifications;
        private readonly HttpClient http;

        public BlogPostNotificationCreator(
            IDocumentStore docStore,
            IPushNotificationSender pushNotifications,
            IHttpClientFactory httpClientFactory,
            ILogger<BlogPostNotificationCreator> logger)
            : base(TimeSpan.FromSeconds(20), TimeSpan.FromMinutes(30), logger)
        {
            this.docStore = docStore;
            this.pushNotifications = pushNotifications;
            this.http = httpClientFactory.CreateClient();
        }

        public override async Task DoWorkAsync(CancellationToken cancelToken)
        {
            try
            {
                using var dbSession = docStore.OpenAsyncSession();
                var syncRecord = await GetOrCreateSyncRecordAsync(dbSession);
                var feedItems = await LoadNewPostsAsync(syncRecord);
                foreach (var post in feedItems)
                {
                    var notification = await TryAddNotificationAsync(post);
                    await UpdateSyncRecordAsync(notification, post, syncRecord, dbSession);
                    QueuePushNotification(post);
                }

                await dbSession.SaveChangesAsync();
            }
            catch (Exception error)
            {
                logger.LogError(error, "Unable to create notifications for blog posts due to an error.");
            }
        }

        private void QueuePushNotification(RssFeedItem post)
        {
            // Send out HTML5 push notifications.
            var source = post.Url.Contains("messianicradio.com", StringComparison.InvariantCultureIgnoreCase) ?
                "Chavah blog" : "Kineti blog";
            var pushNotification = new PushNotification
            {
                Title = post.Title,
                ImageUrl = post.ImageUrl,
                Body = $"The latest from the {source}",
                ClickUrl = post.Url
            };
            pushNotifications.QueueSendNotificationToAll(pushNotification);
        }

        private async Task<Notification> TryAddNotificationAsync(RssFeedItem post)
        {
            var notification = new Notification
            {
                Date = post.PublishedDate.DateTime.ToUniversalTime(),
                ImageUrl = post.ImageUrl,
                IsUnread = true,
                SourceName = post.BlogSourceFriendlyName,
                Title = post.Title,
                Url = post.Url
            };

            // Serialize it
            var jsonNotification = JsonConvert.SerializeObject(notification);
            var patchScript = @"
                var existingNotification = this.Notifications.find(n => n.Url !== url);
                if (!existingNotification) {
                    this.Notifications.unshift(json);
                    if (this.Notifications.length > 10) {
                        this.Notifications.length = 10;
                    }
               }
            ";
            var variables = new Dictionary<string, object>
            {
                { "url", notification.Url },
                { "json", jsonNotification }
            };
            var patchOperation = docStore.PatchAll<AppUser>(patchScript, variables);
            await patchOperation.WaitForCompletionAsync(TimeSpan.FromSeconds(30));

            return notification;
        }

        private async Task UpdateSyncRecordAsync(
            Notification notification,
            RssFeedItem post,
            FeedSyncRecord syncRecord,
            IAsyncDocumentSession dbSession)
        {
            syncRecord.LastSyncedPostDate = new DateTimeOffset(notification.Date);
            syncRecord.AddSyncedNotification(notification);
            syncRecord.AddSyncedPostId(post.Id);
            await dbSession.SaveChangesAsync();
        }

        private async Task<FeedSyncRecord> GetOrCreateSyncRecordAsync(IAsyncDocumentSession session)
        {
            var record = await session.LoadAsync<FeedSyncRecord>(FeedSyncRecord.SingletonId, cancelToken);
            if (record == null)
            {
                record = new FeedSyncRecord();
                await session.StoreAsync(record, record.Id, cancelToken);
            }

            return record;
        }

        private async Task<List<RssFeedItem>> LoadNewPostsAsync(FeedSyncRecord syncRecord)
        {
            var feeds = new[]
            {
                (name: "Chavah blog", url: "https://blog.messianicradio.com/feeds/posts/default?alt=rss"),
                (name: "Kineti blog", url: "https://feeds.feedburner.com/kinetiltziyon")
            };

            var newPosts = new List<RssFeedItem>();
            foreach (var (feedName, feedUrl) in feeds)
            {
                var feedString = await http.GetStringAsync(feedUrl);
                var feed = FeedReader.ReadFromString(feedString);

                newPosts.AddRange(feed.Items
                    .Where(post => post.PublishingDate != null && post.PublishingDate > syncRecord.LastSyncedPostDate && !syncRecord.SyncedPostIds.Contains(post.Id))
                    .Select(post => new RssFeedItem(post.Id, post.Title, post.Link, post.PublishingDate.GetValueOrDefault().ToUniversalTime(), GetPostThumbnailUrl(post), feedName)));
            }
            
            return newPosts
                .OrderBy(p => p.PublishedDate)
                .ToList();
        }

        private string GetPostThumbnailUrl(FeedItem post)
        {
            // Look for the <media:thumbnail> element and grab its URL.
            var url = post.SpecificItem.Element.Nodes()
                .OfType<XElement>()
                .Where(n => n.Name.LocalName.ToString() == "thumbnail")
                .Select(n => n.Attribute("url")?.Value)
                .FirstOrDefault();
            return url ?? "https://messianicradio.com/images/chavah512x512.png";
        }

        public record RssFeedItem(string Id, string Title, string Url, DateTimeOffset PublishedDate, string ImageUrl, string BlogSourceFriendlyName);
    }
}
