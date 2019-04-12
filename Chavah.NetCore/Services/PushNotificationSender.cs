using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

using BitShuva.Chavah.Models;
using BitShuva.Chavah.Options;

using DalSoft.Hosting.BackgroundQueue;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;

using Raven.Client.Documents;
using Raven.StructuredLog;

namespace BitShuva.Chavah.Services
{
    /// <summary>
    /// Sends push notifications down to the browser.
    /// </summary>
    public class PushNotificationSender : IPushNotificationSender
    {
        private readonly ApplicationOptions _appOptions;
        private readonly ILogger<PushNotificationSender> _logger;
        private readonly BackgroundQueue _backgroundQueue;
        private readonly IDocumentStore _db;
        private readonly EmailOptions _emailOptions;

        public PushNotificationSender(
            BackgroundQueue backgroundQueue,
            IOptionsMonitor<ApplicationOptions> appOptions,
            IOptionsMonitor<EmailOptions> emailOptions,
            IDocumentStore db,
            ILogger<PushNotificationSender> logger)
        {
            _backgroundQueue = backgroundQueue ?? throw new ArgumentNullException(nameof(backgroundQueue));
            _db = db ?? throw new ArgumentNullException(nameof(db));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));

            _appOptions = appOptions.CurrentValue;
            _emailOptions = emailOptions.CurrentValue;
        }

        /// <summary>
        /// Enqueues a push notification to be sent to the specified recipients in the background.
        /// </summary>
        /// <param name="notification">The message to send.</param>
        /// <param name="recipients">The recipients of the message.</param>
        /// <returns></returns>
        public void QueueSendNotification(PushNotification notification, List<PushSubscription> recipients)
        {
            var logger = _logger;
            _backgroundQueue.Enqueue(cancelToken => SendNotificationToRecipients(
                recipients.AsReadOnly(),
                notification,
                _emailOptions.SenderEmail,
                _appOptions.PushNotificationsPublicKey,
                _appOptions.PushNotificationsPrivateKey,
                logger,
                cancelToken));
        }

        /// <summary>
        /// Enqueues a push notification to be sent to all subscribers.
        /// </summary>
        /// <param name="notification">The notification.</param>
        /// <returns></returns>
        public void QueueSendNotificationToAll(PushNotification notification)
        {
            var db = _db;
            var logger = _logger;
            _backgroundQueue.Enqueue(async cancelToken =>
            {
                // Stream in all the recipients.
                var recipients = await StreamSubscriptions(db);

                // Send it.
                await SendNotificationToRecipients(
                    recipients.AsReadOnly(),
                    notification,
                    _emailOptions.SenderEmail,
                    _appOptions.PushNotificationsPublicKey,
                    _appOptions.PushNotificationsPrivateKey,
                    logger,
                    cancelToken);
            });
        }

        private static async Task SendNotificationToRecipients(IEnumerable<PushSubscription> recipients, PushNotification notification, string senderEmail, string publicKey, string privateKey, ILogger logger, CancellationToken cancelToken)
        {
            // This is run in a background thread. We should not access or update any mutable state.
            var vapidDetails = new WebPush.VapidDetails($"mailto:{senderEmail}", publicKey, privateKey);
            var client = new WebPush.WebPushClient();
            var jsonSettings = new JsonSerializerSettings
            {
                ContractResolver = new CamelCasePropertyNamesContractResolver()
            };
            foreach (var subscription in recipients)
            {
                if (!cancelToken.IsCancellationRequested)
                {
                    await TrySendPushNotification(notification, subscription, vapidDetails, client, jsonSettings, logger);
                }
            }
        }

        private static async Task TrySendPushNotification(PushNotification notification, PushSubscription recipient, WebPush.VapidDetails details, WebPush.WebPushClient client, JsonSerializerSettings serializerSettings, ILogger logger)
        {
            // This is run in a background thread. We should not access or update mutable state.
            try
            {
                var payload = JsonConvert.SerializeObject(notification, serializerSettings);
                var subscription = new WebPush.PushSubscription(recipient.Endpoint, recipient.Keys["p256dh"], recipient.Keys["auth"]);
                await client.SendNotificationAsync(subscription, payload, details);
            }
            catch (Exception error)
            {
                using (logger.BeginKeyValueScope("recipient", recipient))
                using (logger.BeginKeyValueScope("publicKey", details.PublicKey))
                using (logger.BeginKeyValueScope("publicKey", details.PrivateKey))
                {
                    logger.LogError(error, "Error sending push notification");
                }
            }
        }

        // TODO: Rather than maxing out at 20k, maybe we want to page this and do it in batches?
        // We anticipate well under 1000 with our current app usage. But if subscriptions grows too large, we may need to break this up.
        private async static Task<List<PushSubscription>> StreamSubscriptions(IDocumentStore db, int max = 20000)
        {
            using (var dbSession = db.OpenAsyncSession())
            {
                var totalSubscriptionCount = await dbSession.Query<PushSubscription>().CountAsync();
                var listSize = Math.Min(max, totalSubscriptionCount);
                var list = new List<PushSubscription>(listSize);
                using (var enumerator = await dbSession.Advanced.StreamAsync<PushSubscription>("PushSubscriptions/"))
                {
                    while (await enumerator.MoveNextAsync())
                    {
                        list.Add(enumerator.Current.Document);
                    }
                }

                return list;
            }
        }
    }
}
