using System;
using System.Collections.Generic;

namespace BitShuva.Chavah.Models
{
    /// <summary>
    /// An HTML5 service worker push subscription.
    /// </summary>
    /// https://www.tpeczek.com/2017/12/push-notifications-and-aspnet-core-part.html
    public class PushSubscription
    {
        /// <summary>
        /// The ID of the push subscription.
        /// </summary>
        public string? Id { get; set; }

        /// <summary>
        /// The ID of the user who created the subscription. May be null.
        /// </summary>
        public string? AppUserId { get; set; }

        /// <summary>
        /// The creation time of the subscription.
        /// </summary>
        public DateTimeOffset CreateDate { get; set; }

        /// <summary>
        /// The endpoint URL for the subscription. This property comes from the browser's PushSubscription type.
        /// </summary>
        public string Endpoint { get; set; } = string.Empty;

        /// <summary>
        /// The dictionary containing the p256dh and auth properties. This property comes from the browser's PushSubscription type.
        /// </summary>
        public IDictionary<string, string> Keys { get; set; } = new Dictionary<string, string>();

        /// <summary>
        /// Gets the last error that occurred while sending a notification to this subscription.
        /// </summary>
        public string? NotificationErrorMessage { get; set; }
        
        /// <summary>
        /// Gets the number of notifications successfully sent to this subscription.
        /// </summary>
        public int SuccessfulNotificationCount { get; set; }

        /// <summary>
        /// Gets the number of notifications that failed to send to this subscription.
        /// </summary>
        public int FailedNotificationCount { get; set; }

        /// <summary>
        /// Gets whether the push notification has been unsubscribed.
        /// </summary>
        public bool Unsubscribed { get; set; }

        /// <summary>
        /// Gets the Raven ID given an HTML5 PushSubscription endpoint.
        /// </summary>
        /// <param name="endpoint">The unique, machine-generated endpoint.</param>
        /// <returns></returns>
        public static string GetRavenIdFromEndpoint(string endpoint)
        {
            if (string.IsNullOrEmpty(endpoint))
            {
                throw new ArgumentNullException(endpoint);
            }

            return "PushSubscriptions/" + endpoint;
        }
    }
}
