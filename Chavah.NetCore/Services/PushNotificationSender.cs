﻿using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Dynamic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

using BitShuva.Chavah.Common;
using BitShuva.Chavah.Models;
using BitShuva.Chavah.Settings;

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
        private readonly AppSettings _appOptions;
        private readonly ILogger<PushNotificationSender> _logger;
        private readonly BackgroundQueue _backgroundQueue;
        private readonly IDocumentStore _db;
        private readonly EmailSettings _emailOptions;

        public PushNotificationSender(
            BackgroundQueue backgroundQueue,
            IOptionsMonitor<AppSettings> appOptions,
            IOptionsMonitor<EmailSettings> emailOptions,
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
                _db,
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
                    db,
                    logger,
                    cancelToken);
            });
        }

        private static async Task SendNotificationToRecipients(
            IEnumerable<PushSubscription> recipients,
            PushNotification notification,
            string senderEmail,
            string publicKey,
            string privateKey,
            IDocumentStore db,
            ILogger logger,
            CancellationToken cancelToken)
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
                    // Clone the notification so that we can send a unique notification with user-specific unread count.
                    var notificationClone = notification.Clone();
                    using (var session = db.OpenAsyncSession())
                    {
                        var user = await session.LoadOptionalAsync<AppUser>(subscription.AppUserId);
                        var existingUnreadCount = user?.Notifications.Count(n => n.IsUnread) ?? 0;
                        notificationClone.UnreadCount = existingUnreadCount + 1; // +1 because this is a new notification
                    }

                    await TrySendPushNotification(notificationClone, subscription, vapidDetails, client, jsonSettings, logger);
                }
            }

            // TrySendPushNotification updates the error/success statuses on the PushNotification.
            // Update those in bulk here.
            BulkSavePushSubscriptions(recipients, db);
        }

        private static async Task TrySendPushNotification(PushNotification notification, PushSubscription recipient, WebPush.VapidDetails details, WebPush.WebPushClient client, JsonSerializerSettings serializerSettings, ILogger logger)
        {
            // This is run in a background thread. We should not access or update mutable state.
            try
            {
                var payload = JsonConvert.SerializeObject(notification, serializerSettings);
                var subscription = new WebPush.PushSubscription(recipient.Endpoint, recipient.Keys["p256dh"], recipient.Keys["auth"]);
                await client.SendNotificationAsync(subscription, payload, details);
                recipient.SuccessfulNotificationCount++;
                recipient.NotificationErrorMessage = null;
            }
            catch (Exception error)
            {
                var isSubscriptionNoLongerValid = error is WebPush.WebPushException webPushError &&
                    webPushError.StatusCode == System.Net.HttpStatusCode.Gone &&
                    error.Message.Contains("Subscription no longer valid", StringComparison.OrdinalIgnoreCase);

                using (logger.BeginKeyValueScope("recipient", recipient))
                using (logger.BeginKeyValueScope("publicKey", details.PublicKey))
                using (logger.BeginKeyValueScope("publicKey", details.PrivateKey))
                {
                    if (isSubscriptionNoLongerValid)
                    {
                        logger.LogWarning(error, "Unable to send push notification because recipient subscription is no longer valid. Marking as unsubscribed.");
                    }
                    else
                    {
                        logger.LogError(error, "Error sending push notification");
                    }
                }

                recipient.NotificationErrorMessage = error.Message;
                recipient.FailedNotificationCount++;
                if (isSubscriptionNoLongerValid)
                {
                    recipient.Unsubscribed = true;
                }
            }
        }

        // TODO: Rather than maxing out at 20k, maybe we want to page this and do it in batches?
        // We anticipate well under 1000 with our current app usage. But if subscriptions grows too large, we may need to break this up.
        private async static Task<List<PushSubscription>> StreamSubscriptions(IDocumentStore db, int max = 20000)
        {
            using var dbSession = db.OpenAsyncSession();
            var totalSubscriptionCount = await dbSession.Query<PushSubscription>().CountAsync();
            var listSize = Math.Min(max, totalSubscriptionCount);
            var list = new List<PushSubscription>(listSize);
            var enumerator = await dbSession.Advanced.StreamAsync<PushSubscription>("PushSubscriptions/");
            try
            {
                while (await enumerator.MoveNextAsync())
                {
                    if (!enumerator.Current.Document.Unsubscribed)
                    {
                        list.Add(enumerator.Current.Document);
                    }
                }
            }
            finally
            {
                await enumerator.DisposeAsync();
            }

            return list;
        }

        private static void BulkSavePushSubscriptions(IEnumerable<PushSubscription> subscriptions, IDocumentStore db)
        {
            using var bulkInsert = db.BulkInsert();
            foreach (var subscription in subscriptions)
            {
                bulkInsert.Store(subscription, subscription.Id!);
            }
        }
    }
}
