﻿using BitShuva.Chavah.Models;
using BitShuva.Chavah.Services;
using DalSoft.Hosting.BackgroundQueue;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Raven.Client.Documents;
using Raven.Client.Documents.Session;
using Raven.StructuredLog;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BitShuva.Chavah.Controllers
{
    [Route("api/[controller]/[action]")]
    public class PushNotificationsController : RavenController
    {
        private readonly IPushNotificationSender pushSender;

        public PushNotificationsController(
            IAsyncDocumentSession dbSession, 
            ILogger<PushNotificationsController> logger,
            IPushNotificationSender pushSender)
            : base(dbSession, logger)
        {
            this.pushSender = pushSender;
        }

        /// <summary>
        /// Saves a new push notification in the database.
        /// </summary>
        /// <param name="subscription"></param>
        /// <returns></returns>
        [HttpPost]
        public async Task<PushSubscription> Store([FromBody]PushSubscription subscription)
        {
            subscription.CreateDate = DateTimeOffset.UtcNow;
            subscription.AppUserId = this.GetUserId();
            await this.DbSession.StoreAsync(subscription, PushSubscription.GetRavenIdFromEndpoint(subscription.Endpoint));
            using (logger.BeginKeyValueScope("subscription", subscription))
            {
                logger.LogInformation("New push notification subscriber");
            }

            // Tell the user he's subscribed.
            var notification = new PushNotification
            {
                Title = "You're subscribed 😎",
                Body = "You'll be notified of new Chavah music, features, news and more.",
                ClickUrl = "https://blog.messianicradio.com/2019/01/new-feature-alert-me-of-new-music-on.html"
            };
            this.pushSender.QueueSendNotification(notification, new List<PushSubscription>(1) { subscription });

            return subscription;
        }

        /// <summary>
        /// Deletes a push subscription that has the unique endpoint specified in <see cref="PushSubscription.Endpoint"/>.
        /// </summary>
        /// <param name="subscription">The subscription to delete. This subscription's unique, machine-generated endpoint will be used to find the subscription to delete.</param>
        /// <returns></returns>
        [HttpPost]
        public async Task<PushSubscription> Delete([FromBody]PushSubscription subscription)
        {
            // The supplied PushSubscription is from the browser's PushSubscription type.
            // Thus, it has no ID. We generate an ID from the subscription's unique endpoint. Use that to delete it.
            var subscriptionId = PushSubscription.GetRavenIdFromEndpoint(subscription.Endpoint);
            var existingSub = await DbSession.LoadAsync<PushSubscription>(subscriptionId);
            if (existingSub != null)
            {
                DbSession.Delete(existingSub);
                using (logger.BeginKeyValueScope("subscription", subscription))
                {
                    logger.LogInformation("Deleted push subscription");
                }

                return existingSub;
            }
            
            logger.LogWarning("Attempted to deleted push subscription {id}, but no such subscription was found", subscriptionId);
            return null;
        }
    }
}
